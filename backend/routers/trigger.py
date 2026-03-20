from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Worker, TriggerEvent, Payout
from datetime import datetime
from typing import List
import random

router = APIRouter()

BASE_COEFFS = {
    "rain": 0.55, "aqi": 0.45, "bandh": 0.85,
    "power": 0.55, "platform_outage": 1.00
}
ROLE_MULTIPLIERS = {
    "rider":     {"rain":1.00,"aqi":1.00,"bandh":1.00,"power":1.00,"platform_outage":1.00},
    "picker":    {"rain":0.40,"aqi":0.40,"bandh":0.40,"power":0.40,"platform_outage":1.00},
    "packer":    {"rain":0.40,"aqi":0.40,"bandh":0.40,"power":0.40,"platform_outage":1.00},
    "inventory": {"rain":0.35,"aqi":0.35,"bandh":0.40,"power":0.90,"platform_outage":1.00},
}
TIER_COVERAGE    = {"basic": 0.50, "standard": 0.70, "premium": 1.00}
SEVERITY_COEFF   = {"partial": 0.50, "full": 1.00}

class TriggerRequest(BaseModel):
    zone:         str    # e.g. bengaluru-koramangala
    trigger_type: str    # rain/aqi/bandh/power/platform_outage
    severity:     str    # partial / full

class PayoutResult(BaseModel):
    worker_id:    int
    role:         str
    platform:     str
    amount:       float
    status:       str
    fraud_note:   str

class TriggerResponse(BaseModel):
    trigger_id:    int
    zone:          str
    trigger_type:  str
    severity:      str
    order_drop_pct: float
    workers_found:  int
    payouts:        List[PayoutResult]
    total_disbursed: float

@router.post("/trigger/simulate", response_model=TriggerResponse)
def simulate_trigger(req: TriggerRequest, db: Session = Depends(get_db)):
    # Simulate second signal — store order drop
    # In production: fetched from platform API for this zone
    drop_map = {
        "rain":            {"partial": 0.42, "full": 0.68},
        "aqi":             {"partial": 0.44, "full": 0.72},
        "bandh":           {"partial": 0.55, "full": 0.88},
        "power":           {"partial": 0.48, "full": 0.62},
        "platform_outage": {"partial": 0.90, "full": 0.99},
    }
    order_drop = drop_map.get(req.trigger_type, {}).get(req.severity, 0.50)
    # Add small random noise
    order_drop = round(min(0.99, order_drop + random.uniform(-0.04, 0.04)), 2)

    # Two-signal check — must exceed 40%
    if order_drop < 0.40:
        raise HTTPException(
            status_code=400,
            detail=f"Second signal failed — order drop {order_drop:.0%} below 40% threshold. No payout."
        )

    # Log trigger event
    event = TriggerEvent(
        zone=req.zone, trigger_type=req.trigger_type,
        severity=req.severity, order_drop_pct=order_drop
    )
    db.add(event)
    db.commit()
    db.refresh(event)

    # Find all active workers in this zone
    city = req.zone.split("-")[0].lower()
    workers = db.query(Worker).filter(
        Worker.zone == req.zone,
        Worker.is_active == True
    ).all()

    payouts = []
    total   = 0.0

    for w in workers:
        base_coeff   = BASE_COEFFS.get(req.trigger_type, 0.55)
        role_mult    = ROLE_MULTIPLIERS.get(w.role, ROLE_MULTIPLIERS["rider"]).get(req.trigger_type, 1.0)
        sev_mult     = SEVERITY_COEFF.get(req.severity, 1.0)
        coverage     = TIER_COVERAGE.get(w.tier, 0.70)
        amount       = w.daily_baseline * base_coeff * role_mult * sev_mult * coverage

        # Simple fraud check — flag if amount > 2x cohort average for this trigger
        cohort_avg   = w.daily_baseline * base_coeff * coverage
        fraud_score  = amount / cohort_avg if cohort_avg > 0 else 1.0
        if fraud_score > 2.0:
            status     = "held"
            fraud_note = f"Fraud score {fraud_score:.2f} — held for review"
        else:
            status     = "processed"
            fraud_note = "Cleared"
            total     += amount

        payout = Payout(
            worker_id=w.id, trigger_id=event.id,
            amount=round(amount, 2), status=status,
            fraud_score=round(fraud_score, 2)
        )
        db.add(payout)
        payouts.append(PayoutResult(
            worker_id=w.id, role=w.role, platform=w.platform,
            amount=round(amount, 2), status=status, fraud_note=fraud_note
        ))

    db.commit()

    return TriggerResponse(
        trigger_id=event.id, zone=req.zone,
        trigger_type=req.trigger_type, severity=req.severity,
        order_drop_pct=order_drop, workers_found=len(workers),
        payouts=payouts, total_disbursed=round(total, 2)
    )