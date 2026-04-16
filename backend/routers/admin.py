from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db, Worker, TriggerEvent, Payout
from datetime import datetime, timedelta
import random

router = APIRouter()

TRIGGER_PROBS = {
    "bengaluru": {"rain":0.28,"aqi":0.04,"bandh":0.01,"power":0.05,"platform_outage":0.01},
    "delhi":     {"rain":0.15,"aqi":0.30,"bandh":0.02,"power":0.06,"platform_outage":0.01},
    "chennai":   {"rain":0.32,"aqi":0.03,"bandh":0.01,"power":0.07,"platform_outage":0.01},
    "mumbai":    {"rain":0.25,"aqi":0.06,"bandh":0.02,"power":0.05,"platform_outage":0.01},
}

BASE_COEFFS = {"rain":0.55,"aqi":0.45,"bandh":0.85,"power":0.55,"platform_outage":1.00}

@router.get("/admin/overview")
def admin_overview(db: Session = Depends(get_db)):
    workers  = db.query(Worker).all()
    payouts  = db.query(Payout).all()
    triggers = db.query(TriggerEvent).all()

    total_premium_collected = sum(w.weekly_premium or 0 for w in workers)
    total_disbursed         = sum(p.amount for p in payouts if p.status == "processed")
    held_payouts            = [p for p in payouts if p.status == "held"]
    loss_ratio              = round(total_disbursed / max(1, total_premium_collected) * 100, 1)

    # Zone breakdown
    zone_stats = {}
    for w in workers:
        z = w.zone
        if z not in zone_stats:
            zone_stats[z] = {"workers":0, "premium":0.0, "disbursed":0.0}
        zone_stats[z]["workers"]  += 1
        zone_stats[z]["premium"]  += w.weekly_premium or 0

    for p in payouts:
        w = next((x for x in workers if x.id == p.worker_id), None)
        if w and p.status == "processed":
            zone_stats.setdefault(w.zone, {"workers":0,"premium":0.0,"disbursed":0.0})
            zone_stats[w.zone]["disbursed"] += p.amount

    # Loss ratio per zone
    for z in zone_stats:
        pr = zone_stats[z]["premium"]
        di = zone_stats[z]["disbursed"]
        zone_stats[z]["loss_ratio_pct"] = round(di / max(1, pr) * 100, 1)

    return {
        "total_workers":            len(workers),
        "active_workers":           sum(1 for w in workers if w.is_active),
        "total_triggers":           len(triggers),
        "total_premium_collected":  round(total_premium_collected, 2),
        "total_disbursed":          round(total_disbursed, 2),
        "loss_ratio_pct":           loss_ratio,
        "held_payouts":             len(held_payouts),
        "fraud_hold_rate_pct":      round(len(held_payouts)/max(1,len(payouts))*100, 1),
        "zone_breakdown":           zone_stats,
    }

@router.get("/admin/predictive")
def predictive_analytics(db: Session = Depends(get_db)):
    """
    Next-week risk forecast per city.
    Uses historical trigger frequency from DB + base probability table.
    """
    workers  = db.query(Worker).all()
    triggers = db.query(TriggerEvent).filter(
        TriggerEvent.fired_at >= datetime.utcnow() - timedelta(days=30)
    ).all()

    # Count recent triggers per city per type
    city_trigger_counts = {}
    for t in triggers:
        city = t.zone.split("-")[0]
        city_trigger_counts.setdefault(city, {})
        city_trigger_counts[city][t.trigger_type] = city_trigger_counts[city].get(t.trigger_type, 0) + 1

    forecasts = {}
    for city, base_probs in TRIGGER_PROBS.items():
        city_workers = [w for w in workers if w.zone.startswith(city)]
        avg_baseline = sum(w.daily_baseline for w in city_workers) / max(1, len(city_workers))

        trigger_forecasts = {}
        for ttype, base_prob in base_probs.items():
            recent_count = city_trigger_counts.get(city, {}).get(ttype, 0)
            # Bayesian-style update — recent history nudges the base probability
            adjusted_prob = round(min(0.99, base_prob + (recent_count * 0.02)), 3)
            expected_payout = round(avg_baseline * adjusted_prob * BASE_COEFFS[ttype] * len(city_workers), 2)
            trigger_forecasts[ttype] = {
                "base_probability":     base_prob,
                "adjusted_probability": adjusted_prob,
                "recent_triggers_30d":  recent_count,
                "expected_payout_pool": expected_payout,
                "risk_level":           "high" if adjusted_prob > 0.20 else "medium" if adjusted_prob > 0.08 else "low"
            }

        forecasts[city] = {
            "workers":          len(city_workers),
            "avg_daily_baseline": round(avg_baseline, 2),
            "trigger_forecasts": trigger_forecasts,
            "highest_risk":     max(trigger_forecasts, key=lambda k: trigger_forecasts[k]["adjusted_probability"])
        }

    return {"generated_at": datetime.utcnow().isoformat(), "forecasts": forecasts}

@router.get("/admin/fraud-flags")
def fraud_flags(db: Session = Depends(get_db)):
    held = db.query(Payout).filter(Payout.status == "held").all()
    workers = db.query(Worker).all()
    worker_map = {w.id: w for w in workers}
    return {
        "total_flagged": len(held),
        "flags": [
            {
                "payout_id":   p.id,
                "worker_id":   p.worker_id,
                "zone":        worker_map.get(p.worker_id, Worker()).zone,
                "amount":      p.amount,
                "fraud_score": p.fraud_score,
                "flagged_at":  p.paid_at.isoformat() if p.paid_at else "—"
            }
            for p in held
        ]
    }

@router.get("/admin/loss-ratios")
def loss_ratios(db: Session = Depends(get_db)):
    workers  = db.query(Worker).all()
    payouts  = db.query(Payout).all()

    by_tier = {}
    for w in workers:
        t = w.tier or "standard"
        by_tier.setdefault(t, {"premium":0.0,"disbursed":0.0,"workers":0})
        by_tier[t]["premium"]  += w.weekly_premium or 0
        by_tier[t]["workers"]  += 1

    for p in payouts:
        if p.status != "processed": continue
        w = next((x for x in workers if x.id == p.worker_id), None)
        if w:
            t = w.tier or "standard"
            by_tier.setdefault(t, {"premium":0.0,"disbursed":0.0,"workers":0})
            by_tier[t]["disbursed"] += p.amount

    result = {}
    for tier, d in by_tier.items():
        result[tier] = {
            "workers":          d["workers"],
            "premium_collected": round(d["premium"], 2),
            "total_disbursed":  round(d["disbursed"], 2),
            "loss_ratio_pct":   round(d["disbursed"] / max(1, d["premium"]) * 100, 1)
        }

    return {"loss_ratios_by_tier": result}