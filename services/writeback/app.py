from datetime import datetime, timezone
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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
    approved_by: Optional[str] = None

class AuditLogResponse(ApprovalRequest):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    approved_at: Optional[datetime]


# ---------------------------------------------------------
# Temporary In-Memory Queue (For Time Agent -> Review Console Handoff)
# ---------------------------------------------------------
pending_queue = []

class QueueItemRequest(BaseModel):
    event: dict
    match: dict

@app.post("/queue/add")
def add_to_queue(item: QueueItemRequest):
    import uuid
    item_id = str(uuid.uuid4())
    record = {"queue_id": item_id, "event": item.event, "match": item.match}
    pending_queue.insert(0, record)
    return {"status": "added", "id": item_id}

@app.get("/queue/pending")
def get_queue():
    return pending_queue

@app.delete("/queue/{item_id}")
def remove_from_queue(item_id: str):
    global pending_queue
    if item_id == "ALL_CLEAR":
        pending_queue.clear()
        return {"status": "cleared"}
    pending_queue = [q for q in pending_queue if q["queue_id"] != item_id]
    return {"status": "removed"}

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

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.writeback.app:app", host="0.0.0.0", port=8003, reload=True)
