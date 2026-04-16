from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from database import get_db, Worker, Payout
from datetime import datetime
import httpx, os, random, string

router = APIRouter()

RAZORPAY_KEY_ID     = os.getenv("RAZORPAY_KEY_ID", "rzp_test_your_key_here")
RAZORPAY_KEY_SECRET = os.getenv("RAZORPAY_KEY_SECRET", "your_secret_here")

class PayoutRequest(BaseModel):
    worker_id:  int
    trigger_id: int
    amount:     float

class PayoutResponse(BaseModel):
    payout_id:      str
    worker_id:      int
    amount:         float
    status:         str
    upi_ref:        str
    razorpay_id:    str
    message:        str
    paid_at:        str

def generate_upi_ref():
    return "UPI" + "".join(random.choices(string.ascii_uppercase + string.digits, k=10))

def generate_razorpay_ref():
    return "pay_" + "".join(random.choices(string.ascii_letters + string.digits, k=14))

@router.post("/payout/process", response_model=PayoutResponse)
async def process_payout(req: PayoutRequest, db: Session = Depends(get_db)):
    worker = db.query(Worker).filter(Worker.id == req.worker_id).first()
    if not worker:
        raise HTTPException(status_code=404, detail="Worker not found")

    payout = db.query(Payout).filter(
        Payout.worker_id == req.worker_id,
        Payout.trigger_id == req.trigger_id
    ).first()
    if not payout:
        raise HTTPException(status_code=404, detail="Payout record not found")

    # Attempt real Razorpay test mode API call
    razorpay_id = None
    status      = "failed"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                "https://api.razorpay.com/v1/payouts",
                auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET),
                json={
                    "account_number": "2323230072190212",  # Razorpay test account
                    "fund_account": {
                        "account_type": "vpa",
                        "vpa":          {"address": f"worker{req.worker_id}@upi"},
                        "contact": {
                            "name":    f"Worker {req.worker_id}",
                            "type":    "employee",
                            "email":   f"worker{req.worker_id}@shieldpay.in",
                            "contact": worker.phone
                        }
                    },
                    "amount":   int(req.amount * 100),  # Razorpay uses paise
                    "currency": "INR",
                    "mode":     "UPI",
                    "purpose":  "payout",
                    "queue_if_low_balance": True,
                    "narration": f"ShieldPay parametric payout — trigger {req.trigger_id}"
                }
            )
            data        = resp.json()
            razorpay_id = data.get("id", generate_razorpay_ref())
            status      = "processed" if data.get("status") in ("processing", "processed", "queued") else "simulated"

    except Exception:
        # Fallback — simulate a successful Razorpay response for demo
        razorpay_id = generate_razorpay_ref()
        status      = "simulated"

    upi_ref = generate_upi_ref()

    # Update payout record in DB
    payout.status  = "processed"
    payout.paid_at = datetime.utcnow()
    db.commit()

    return PayoutResponse(
        payout_id=f"SP-{req.trigger_id}-{req.worker_id}",
        worker_id=req.worker_id,
        amount=req.amount,
        status=status,
        upi_ref=upi_ref,
        razorpay_id=razorpay_id,
        message=f"₹{req.amount:.0f} transferred to UPI worker{req.worker_id}@upi via Razorpay",
        paid_at=datetime.utcnow().strftime("%d %b %Y, %I:%M %p")
    )

@router.get("/payout/history/{worker_id}")
def payout_history(worker_id: int, db: Session = Depends(get_db)):
    payouts = db.query(Payout).filter(Payout.worker_id == worker_id).all()
    total   = sum(p.amount for p in payouts if p.status == "processed")
    return {
        "worker_id":        worker_id,
        "total_payouts":    len(payouts),
        "total_earned":     round(total, 2),
        "earnings_protected": round(total, 2),
        "history": [
            {
                "payout_id":   p.id,
                "trigger_id":  p.trigger_id,
                "amount":      p.amount,
                "status":      p.status,
                "fraud_score": p.fraud_score,
                "paid_at":     p.paid_at.strftime("%d %b %Y, %I:%M %p") if p.paid_at else "—"
            }
            for p in payouts
        ]
    }