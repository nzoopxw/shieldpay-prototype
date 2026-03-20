from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Worker
import joblib, os, numpy as np
import pandas as pd

router = APIRouter()

# Load model once at import time
_pkg  = joblib.load(os.path.join(os.path.dirname(__file__), "../ml/baseline_model.joblib"))
model       = _pkg["model"]
le_platform = _pkg["le_platform"]
le_role     = _pkg["le_role"]
le_shift    = _pkg["le_shift"]
le_city     = _pkg["le_city"]

# City extracted from zone string e.g. "bengaluru-koramangala" → "bengaluru"
def extract_city(zone: str) -> str:
    city = zone.split("-")[0].lower()
    valid = list(le_city.classes_)
    return city if city in valid else "bengaluru"

class OnboardRequest(BaseModel):
    phone:              str
    platform:           str   # zepto/blinkit/instamart/bigbasket
    platform_id:        str
    role:               str   # picker/packer/rider/inventory
    zone:               str   # e.g. bengaluru-koramangala
    shift:              str   # morning/afternoon/night
    experience_weeks:   int   = 12
    income_correction:  float = None   # worker's manual correction

class OnboardResponse(BaseModel):
    worker_id:       int
    daily_baseline:  float
    cohort_note:     str
    flagged:         bool

@router.post("/onboard", response_model=OnboardResponse)
def onboard_worker(req: OnboardRequest, db: Session = Depends(get_db)):
    # Check duplicate phone or platform_id
    if db.query(Worker).filter(Worker.phone == req.phone).first():
        raise HTTPException(status_code=400, detail="Phone already registered")
    if db.query(Worker).filter(Worker.platform_id == req.platform_id).first():
        raise HTTPException(status_code=400, detail="Platform ID already registered")

    # Predict income baseline
    city = extract_city(req.zone)
    x = pd.DataFrame([[
    le_platform.transform([req.platform])[0],
    le_role.transform([req.role])[0],
    le_shift.transform([req.shift])[0],
    le_city.transform([city])[0],
    req.experience_weeks
]], columns=["platform_enc","role_enc","shift_enc","city_enc","experience_weeks"])
    predicted = float(model.predict(x)[0])

    # Cohort 95th percentile (simplified — 1.6x the prediction)
    cohort_95th = predicted * 1.6
    flagged = False
    final_baseline = predicted

    if req.income_correction:
        if req.income_correction > cohort_95th:
            # Flag — cap at cohort median until week 4 data arrives
            final_baseline = predicted
            flagged = True
        else:
            final_baseline = req.income_correction

    worker = Worker(
        phone=req.phone, platform=req.platform,
        platform_id=req.platform_id, role=req.role,
        zone=req.zone, shift=req.shift,
        daily_baseline=round(final_baseline, 2),
        tier="standard"  # default — updated by premium endpoint
    )
    db.add(worker)
    db.commit()
    db.refresh(worker)

    note = ("Income correction flagged — payout capped at cohort median until week 4."
            if flagged else
            "Baseline set from cohort model. Updates with your real earnings over 4 weeks.")

    return OnboardResponse(
        worker_id=worker.id,
        daily_baseline=round(final_baseline, 2),
        cohort_note=note,
        flagged=flagged
    )