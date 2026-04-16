from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Worker, Payout, TriggerEvent
from datetime import datetime, timedelta
import random

router = APIRouter()

# Zone → approximate lat/lng center
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

class FraudCheckRequest(BaseModel):
    worker_id:       int
    trigger_type:    str
    claimed_zone:    str
    gps_lat:         float
    gps_lng:         float
    gps_accuracy_m:  float   # GPS accuracy in metres
    claim_amount:    float

class FraudCheckResponse(BaseModel):
    confidence_score:  int        # 0–100
    decision:          str        # auto_approved / soft_hold / micro_verify / human_review
    fraud_flags:       list[str]
    message:           str

def score_gps(claimed_zone, gps_lat, gps_lng, gps_accuracy_m, trigger_type):
    """Returns (penalty, flags)"""
    flags = []
    penalty = 0

    zone_center = ZONE_COORDS.get(claimed_zone)
    if zone_center:
        # Haversine approximation (flat earth fine for 2km radius)
        dlat = abs(gps_lat - zone_center[0]) * 111000
        dlng = abs(gps_lng - zone_center[1]) * 111000 * 0.85
        dist_m = (dlat**2 + dlng**2) ** 0.5

        if dist_m > 5000:
            flags.append("GPS location >5km from registered zone")
            penalty += 40
        elif dist_m > 2000:
            flags.append("GPS location outside 2km zone boundary")
            penalty += 20

    # Suspiciously perfect GPS during active weather
    if trigger_type in ("rain", "aqi") and gps_accuracy_m < 5:
        flags.append("Unusually precise GPS during active weather event")
        penalty += 15

    # Very poor accuracy could mean spoofing app
    if gps_accuracy_m > 500:
        flags.append("GPS accuracy degraded beyond threshold (>500m)")
        penalty += 10

    return penalty, flags

def score_claim_velocity(worker_id, db):
    """Penalise workers with suspiciously perfect claim records"""
    flags = []
    penalty = 0
    recent = db.query(Payout).filter(
        Payout.worker_id == worker_id,
        Payout.paid_at >= datetime.utcnow() - timedelta(days=30)
    ).all()
    if len(recent) >= 8:
        flags.append("High claim velocity — 8+ payouts in 30 days")
        penalty += 25
    elif len(recent) >= 5:
        flags.append("Elevated claim frequency — 5+ payouts in 30 days")
        penalty += 10
    return penalty, flags

def score_weather_consistency(trigger_type, claimed_zone):
    """
    In production: cross-check OpenWeatherMap for this zone at this time.
    Prototype: simulate with realistic pass/fail based on trigger type.
    Returns (penalty, flags)
    """
    flags = []
    penalty = 0
    # Simulate: platform_outage and bandh can't be weather-verified
    if trigger_type == "rain":
        # Simulate weather API check — 90% pass rate during simulation
        weather_confirms = random.random() > 0.10
        if not weather_confirms:
            flags.append("Weather API: no rainfall recorded for zone in last 2 hours")
            penalty += 35
    return penalty, flags

@router.post("/fraud/check", response_model=FraudCheckResponse)
def fraud_check(req: FraudCheckRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    total_penalty = 0
    all_flags = []

    # Trust buffer for long-tenure workers (8+ clean weeks)
    trust_buffer = 0
    if worker and worker.loyalty_streak >= 8:
        trust_buffer = 15

    # Run all checks
    p1, f1 = score_gps(req.claimed_zone, req.gps_lat, req.gps_lng, req.gps_accuracy_m, req.trigger_type)
    p2, f2 = score_claim_velocity(req.worker_id, db)
    p3, f3 = score_weather_consistency(req.trigger_type, req.claimed_zone)

    total_penalty = p1 + p2 + p3
    all_flags     = f1 + f2 + f3

    confidence = max(0, min(100, 100 - total_penalty + trust_buffer))

    if confidence >= 75:
        decision = "auto_approved"
        message  = "All signals clear. Payout processing within 10 minutes."
    elif confidence >= 50:
        decision = "soft_hold"
        message  = "Your payout is processing. Re-checking signals over the next 90 minutes."
    elif confidence >= 25:
        decision = "micro_verify"
        message  = "Please confirm you are currently working in your registered zone."
    else:
        decision = "human_review"
        message  = "Your payout is under a brief security review. Completes within 4 hours."

    return FraudCheckResponse(
        confidence_score=confidence,
        decision=decision,
        fraud_flags=all_flags,
        message=message
    )

@router.get("/fraud/stats")
def fraud_stats(db: Session = Depends(get_db)):
    """Admin endpoint — fraud flag summary"""
    payouts = db.query(Payout).all()
    held    = [p for p in payouts if p.status == "held"]
    cleared = [p for p in payouts if p.status == "processed"]
    return {
        "total_payouts":    len(payouts),
        "held_for_review":  len(held),
        "auto_cleared":     len(cleared),
        "hold_rate_pct":    round(len(held)/max(1,len(payouts))*100, 1),
        "avg_fraud_score":  round(sum(p.fraud_score for p in payouts)/max(1,len(payouts)), 2),
        "high_risk_workers": [p.worker_id for p in held]
    }