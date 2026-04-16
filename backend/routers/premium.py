from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Worker

router = APIRouter()

# --- Trigger probability table (from Prophet model output — mocked for prototype) ---
# In production: fetched live from Model 2. Here: realistic seasonal estimates.
TRIGGER_PROBS = {
    "bengaluru": {"rain": 0.28, "aqi": 0.04, "bandh": 0.01, "power": 0.05, "platform_outage": 0.01},
    "delhi":     {"rain": 0.15, "aqi": 0.30, "bandh": 0.02, "power": 0.06, "platform_outage": 0.01},
    "chennai":   {"rain": 0.32, "aqi": 0.03, "bandh": 0.01, "power": 0.07, "platform_outage": 0.01},
    "mumbai":    {"rain": 0.25, "aqi": 0.06, "bandh": 0.02, "power": 0.05, "platform_outage": 0.01},
}

# --- Base disruption coefficients per trigger ---
BASE_COEFFS = {
    "rain": 0.55, "aqi": 0.45, "bandh": 0.85,
    "power": 0.55, "platform_outage": 1.00
}

# --- Role multipliers (indoor roles less affected by weather/aqi) ---
ROLE_MULTIPLIERS = {
    "rider":     {"rain":1.00,"aqi":1.00,"bandh":1.00,"power":1.00,"platform_outage":1.00},
    "picker":    {"rain":0.40,"aqi":0.40,"bandh":0.40,"power":0.40,"platform_outage":1.00},
    "packer":    {"rain":0.40,"aqi":0.40,"bandh":0.40,"power":0.40,"platform_outage":1.00},
    "inventory": {"rain":0.35,"aqi":0.35,"bandh":0.40,"power":0.90,"platform_outage":1.00},
}

# --- Tier coverage ratios ---
TIER_COVERAGE = {"basic": 0.50, "standard": 0.70, "premium": 1.00}

WORKING_DAYS   = 6
CLAIMS_POOL    = 0.35   # 35% of premium goes to claims
PREMIUM_FLOOR  = 29.0   # minimum weekly premium (INR)
PREMIUM_CAP_PC = 0.02   # max 2% of weekly baseline

class PremiumRequest(BaseModel):
    worker_id: int
    tier:      str   # basic / standard / premium

class PremiumResponse(BaseModel):
    worker_id:       int
    tier:            str
    daily_baseline:  float
    weekly_baseline: float
    expected_loss:   float
    weekly_premium:  float
    breakdown:       dict

@router.post("/premium/calculate", response_model=PremiumResponse)
def calculate_premium(req: PremiumRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    city     = worker.zone.split("-")[0].lower()
    probs    = TRIGGER_PROBS.get(city, TRIGGER_PROBS["bengaluru"])
    role_m   = ROLE_MULTIPLIERS.get(worker.role, ROLE_MULTIPLIERS["rider"])
    coverage = TIER_COVERAGE.get(req.tier, 0.70)
    baseline = worker.daily_baseline

    # E[L] per day across all triggers
    breakdown = {}
    total_expected_loss_daily = 0.0
    for trigger, prob in probs.items():
        coeff        = BASE_COEFFS[trigger] * role_m[trigger]
        expected     = baseline * prob * coeff * coverage
        breakdown[trigger] = round(expected, 2)
        total_expected_loss_daily += expected

    weekly_el = total_expected_loss_daily * WORKING_DAYS

    # Scale up by claims pool fraction to get full premium
    raw_premium    = weekly_el / CLAIMS_POOL
    weekly_baseline = baseline * WORKING_DAYS
    cap            = weekly_baseline * PREMIUM_CAP_PC

    final_premium  = max(PREMIUM_FLOOR, min(raw_premium, cap))

    # Save tier and premium to worker record
    worker.tier           = req.tier
    worker.weekly_premium = round(final_premium, 2)
    db.commit()

    return PremiumResponse(
        worker_id=worker.id,
        tier=req.tier,
        daily_baseline=round(baseline, 2),
        weekly_baseline=round(weekly_baseline, 2),
        expected_loss=round(weekly_el, 2),
        weekly_premium=round(final_premium, 2),
        breakdown=breakdown
    )