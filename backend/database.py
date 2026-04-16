from sqlalchemy import create_engine, Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime

DATABASE_URL = "sqlite:///./shieldpay.db"
engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class Worker(Base):
    __tablename__ = "workers"
    id              = Column(Integer, primary_key=True, index=True)
    phone           = Column(String, unique=True, index=True)
    platform        = Column(String)       # zepto / blinkit / instamart / bigbasket
    platform_id     = Column(String, unique=True)
    role            = Column(String)       # picker / packer / rider / inventory
    zone            = Column(String)       # city-area e.g. "bengaluru-koramangala"
    shift           = Column(String)       # morning / afternoon / night
    daily_baseline  = Column(Float)        # AI predicted daily income
    tier            = Column(String)       # basic / standard / premium
    weekly_premium  = Column(Float)
    enrolled_at     = Column(DateTime, default=datetime.utcnow)
    is_active       = Column(Boolean, default=True)
    loyalty_streak  = Column(Integer, default=0)  # clean quarters

class TriggerEvent(Base):
    __tablename__ = "trigger_events"
    id             = Column(Integer, primary_key=True, index=True)
    zone           = Column(String)
    trigger_type   = Column(String)   # rain / aqi / bandh / power / platform_outage
    severity       = Column(String)   # partial / full
    order_drop_pct = Column(Float)    # second signal — store order drop %
    fired_at       = Column(DateTime, default=datetime.utcnow)

class Payout(Base):
    __tablename__ = "payouts"
    id             = Column(Integer, primary_key=True, index=True)
    worker_id      = Column(Integer)
    trigger_id     = Column(Integer)
    amount         = Column(Float)
    status         = Column(String, default="processed")  # processed / held / blocked
    fraud_score    = Column(Float, default=0.0)
    paid_at        = Column(DateTime, default=datetime.utcnow)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    Base.metadata.create_all(bind=engine)