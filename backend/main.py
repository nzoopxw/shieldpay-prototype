from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import onboard, premium, trigger, fraud, weather, payout, admin

app = FastAPI(title="ShieldPay API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

app.include_router(onboard.router,  tags=["Onboarding"])
app.include_router(premium.router,  tags=["Premium"])
app.include_router(trigger.router,  tags=["Trigger"])
app.include_router(fraud.router,    tags=["Fraud Detection"])
app.include_router(weather.router,  tags=["Weather"])
app.include_router(payout.router,   tags=["Payouts"])
app.include_router(admin.router,    tags=["Admin"])

@app.get("/")
def root():
    return {"status": "ShieldPay API v3.0 running"}