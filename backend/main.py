from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routers import onboard, premium, trigger

app = FastAPI(title="ShieldPay API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],   # tighten in production
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

app.include_router(onboard.router,  tags=["Onboarding"])
app.include_router(premium.router,  tags=["Premium"])
app.include_router(trigger.router,  tags=["Trigger"])

@app.get("/")
def root():
    return {"status": "ShieldPay API running"}