from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Worker, TriggerEvent, Payout
from datetime import datetime
import httpx, random

router = APIRouter()

import os
from dotenv import load_dotenv
load_dotenv()
OPENWEATHER_API_KEY = os.getenv("OPENWEATHER_API_KEY", "")
BASE_URL = "https://api.openweathermap.org/data/2.5/weather"

# Zone → lat/lng for OpenWeatherMap queries
ZONE_COORDS = {
    "bengaluru-koramangala": (12.9352, 77.6245),
    "bengaluru-indiranagar":  (12.9784, 77.6408),
    "delhi-connaught":        (28.6315, 77.2167),
    "delhi-rohini":           (28.7041, 77.1025),
    "chennai-adyar":          (13.0012, 80.2565),
    "chennai-anna-nagar":     (13.0850, 80.2101),
    "mumbai-andheri":         (19.1136, 72.8697),
    "mumbai-bandra":          (19.0596, 72.8295),
}

BASE_COEFFS    = {"rain":0.55,"aqi":0.45,"bandh":0.85,"power":0.55,"platform_outage":1.00}
ROLE_MULTIPLIERS = {
    "rider":     {"rain":1.00,"aqi":1.00,"bandh":1.00,"power":1.00,"platform_outage":1.00},
    "picker":    {"rain":0.40,"aqi":0.40,"bandh":0.40,"power":0.40,"platform_outage":1.00},
    "packer":    {"rain":0.40,"aqi":0.40,"bandh":0.40,"power":0.40,"platform_outage":1.00},
    "inventory": {"rain":0.35,"aqi":0.35,"bandh":0.40,"power":0.90,"platform_outage":1.00},
}
TIER_COVERAGE  = {"basic":0.50,"standard":0.70,"premium":1.00}
SEVERITY_COEFF = {"partial":0.50,"full":1.00}

DROP_MAP = {
    "rain":            {"partial":0.42,"full":0.68},
    "aqi":             {"partial":0.44,"full":0.72},
    "bandh":           {"partial":0.55,"full":0.88},
    "power":           {"partial":0.48,"full":0.62},
    "platform_outage": {"partial":0.90,"full":0.99},
}

class WeatherCheckResponse(BaseModel):
    zone:             str
    lat:              float
    lng:              float
    temp_c:           float
    rainfall_mm:      float
    wind_kph:         float
    description:      str
    trigger_fired:    bool
    trigger_type:     str | None
    severity:         str | None
    source:           str

class SimulateRainstormRequest(BaseModel):
    zone:     str
    severity: str = "full"

class AutoTriggerResponse(BaseModel):
    zone:            str
    trigger_type:    str
    severity:        str
    weather_data:    dict
    order_drop_pct:  float
    workers_found:   int
    total_disbursed: float
    payouts:         list

@router.get("/weather/check/{zone}", response_model=WeatherCheckResponse)
async def check_weather(zone: str):
    coords = ZONE_COORDS.get(zone)
    if not coords:
        raise HTTPException(status_code=404, detail=f"Zone '{zone}' not found")

    lat, lng = coords

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            resp = await client.get(BASE_URL, params={
                "lat": lat, "lon": lng,
                "appid": OPENWEATHER_API_KEY,
                "units": "metric"
            })
            resp.raise_for_status()
            data = resp.json()

        rainfall_mm = data.get("rain", {}).get("1h", 0.0)
        temp_c      = data["main"]["temp"]
        wind_kph    = data["wind"]["speed"] * 3.6
        description = data["weather"][0]["description"]

        # Auto-detect trigger
        trigger_type = None
        severity     = None
        trigger_fired = False

        if rainfall_mm > 50:
            trigger_type, severity, trigger_fired = "rain", "full", True
        elif rainfall_mm > 15:
            trigger_type, severity, trigger_fired = "rain", "partial", True

        source = "OpenWeatherMap live"

    except Exception:
        # Fallback to realistic simulated data if API key not set
        rainfall_mm   = round(random.uniform(0, 30), 1)
        temp_c        = round(random.uniform(28, 38), 1)
        wind_kph      = round(random.uniform(5, 25), 1)
        description   = "simulated data — add OpenWeatherMap API key for live feed"
        trigger_fired = rainfall_mm > 15
        trigger_type  = "rain" if trigger_fired else None
        severity      = "full" if rainfall_mm > 50 else ("partial" if trigger_fired else None)
        source        = "simulated fallback"

    return WeatherCheckResponse(
        zone=zone, lat=lat, lng=lng,
        temp_c=temp_c, rainfall_mm=rainfall_mm,
        wind_kph=wind_kph, description=description,
        trigger_fired=trigger_fired, trigger_type=trigger_type,
        severity=severity, source=source
    )

@router.post("/weather/simulate-rainstorm", response_model=AutoTriggerResponse)
def simulate_rainstorm(req: SimulateRainstormRequest, db: Session = Depends(get_db)):
    """
    Demo endpoint — simulates a rainstorm hitting a zone and auto-fires payouts.
    This is what you use in the 5-minute demo video.
    """
    zone         = req.zone
    trigger_type = "rain"
    severity     = req.severity

    # Simulated weather data for the demo
    weather_data = {
        "rainfall_mm":  65.0 if severity == "full" else 22.0,
        "wind_kph":     45.0,
        "temp_c":       24.0,
        "description":  "heavy intensity rain",
        "source":       "simulated rainstorm trigger"
    }

    # Second signal — order drop
    order_drop = DROP_MAP[trigger_type][severity]
    order_drop = round(min(0.99, order_drop + random.uniform(-0.03, 0.03)), 2)

    if order_drop < 0.40:
        raise HTTPException(status_code=400, detail="Order drop below 40% — payout blocked")

    # Log trigger event
    event = TriggerEvent(
        zone=zone, trigger_type=trigger_type,
        severity=severity, order_drop_pct=order_drop
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Find all active workers in zone
    workers = db.query(Worker).filter(
        Worker.zone == zone,
        Worker.is_active == True
    ).all()

    payouts = []
    total   = 0.0

    for w in workers:
        base_coeff = BASE_COEFFS[trigger_type]
        role_mult  = ROLE_MULTIPLIERS.get(w.role, ROLE_MULTIPLIERS["rider"])[trigger_type]
        sev_mult   = SEVERITY_COEFF[severity]
        coverage   = TIER_COVERAGE.get(w.tier, 0.70)
        amount     = round(w.daily_baseline * base_coeff * role_mult * sev_mult * coverage, 2)

        payout = Payout(
            worker_id=w.id, trigger_id=event.id,
            amount=amount, status="processed", fraud_score=0.05
        )
        db.add(payout)
        total += amount
        payouts.append({
            "worker_id": w.id,
            "role":      w.role,
            "platform":  w.platform,
            "amount":    amount,
            "status":    "processed",
            "upi_ref":   "UPI" + str(w.id) + "STORM"
        })

    db.commit()

    return AutoTriggerResponse(
        zone=zone, trigger_type=trigger_type, severity=severity,
        weather_data=weather_data, order_drop_pct=order_drop,
        workers_found=len(workers), total_disbursed=round(total, 2),
        payouts=payouts
    )