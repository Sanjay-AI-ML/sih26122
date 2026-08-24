from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from datetime import datetime, timezone
from services.writeback.db import Base

class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    
    # Matched schedule activity
    activity_id = Column(String, index=True, nullable=False)
    discipline = Column(String, nullable=False)
    
    # Event metadata
    event_date = Column(String, nullable=False)
    quantity = Column(Float, nullable=True)
    unit = Column(String, nullable=True)
    
    # AI Metadata
    confidence_score = Column(Float, nullable=False)
    confidence_band = Column(String, nullable=False) # high, medium, low
    was_ambiguous = Column(Boolean, default=False)
    
    # Approval tracking
    status = Column(String, default="pending", index=True) # approved, rejected, pending
    approved_by = Column(String, nullable=True)
    approved_at = Column(DateTime, nullable=True)
    
    # Source traceability
    source_document = Column(String, nullable=False)
    source_excerpt = Column(String, nullable=False)
    
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
