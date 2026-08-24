from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, ConfigDict

from services.writeback.db import engine, Base, get_db
from services.writeback.models import AuditLog

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Writeback Service (Member D)",
    description="Handles appending approved events into SQLite OLTP logs.",
    version="1.0.0"
)

# Pydantic models for API requests/responses
class ApprovalRequest(BaseModel):
    activity_id: str
    discipline: str
    event_date: str
    quantity: Optional[float] = None
    unit: Optional[str] = None
    confidence_score: float
    confidence_band: str
    was_ambiguous: bool
    source_document: str
    source_excerpt: str
    approved_by: str

class AuditLogResponse(ApprovalRequest):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    approved_at: Optional[datetime]

@app.post("/audit/approve", response_model=AuditLogResponse)
def approve_event(request: ApprovalRequest, db: Session = Depends(get_db)):
    """Logs an approved match from the planner UI into the database."""
    log_entry = AuditLog(
        activity_id=request.activity_id,
        discipline=request.discipline,
        event_date=request.event_date,
        quantity=request.quantity,
        unit=request.unit,
        confidence_score=request.confidence_score,
        confidence_band=request.confidence_band,
        was_ambiguous=request.was_ambiguous,
        source_document=request.source_document,
        source_excerpt=request.source_excerpt,
        status="approved",
        approved_by=request.approved_by,
        approved_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

@app.post("/audit/reject", response_model=AuditLogResponse)
def reject_event(request: ApprovalRequest, db: Session = Depends(get_db)):
    """Logs a rejected match from the planner UI into the database."""
    log_entry = AuditLog(
        activity_id=request.activity_id,
        discipline=request.discipline,
        event_date=request.event_date,
        quantity=request.quantity,
        unit=request.unit,
        confidence_score=request.confidence_score,
        confidence_band=request.confidence_band,
        was_ambiguous=request.was_ambiguous,
        source_document=request.source_document,
        source_excerpt=request.source_excerpt,
        status="rejected",
        approved_by=request.approved_by, # user who rejected it
        approved_at=datetime.now(timezone.utc)
    )
    db.add(log_entry)
    db.commit()
    db.refresh(log_entry)
    return log_entry

@app.get("/audit/history", response_model=List[AuditLogResponse])
def get_history(limit: int = 50, db: Session = Depends(get_db)):
    """Fetches the recent history of approvals/rejections."""
    return db.query(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit).all()

@app.get("/health")
def health_check():
    return {"status": "healthy"}
