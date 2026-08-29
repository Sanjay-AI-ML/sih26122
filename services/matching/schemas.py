from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

# We import the shared schema from the ingestion layer
from shared.schemas.extracted_event import ExtractedEvent, DisciplineEnum

class ConfidenceBand(str, Enum):
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class ScheduleActivity(BaseModel):
    activity_id: str
    activity_name: str
    discipline: DisciplineEnum
    tag: str
    wbs_path: str
    planned_start: str
    planned_finish: str

class Candidate(BaseModel):
    activity_id: str
    activity_name: str
    score: float = Field(ge=0.0, le=1.0)
    tag: Optional[str] = None
    rationale: str

class MatchResult(BaseModel):
    event: ExtractedEvent
    top_activity_id: Optional[str]
    candidates: List[Candidate]
    confidence_score: float = Field(ge=0.0, le=1.0)
    tag: Optional[str] = None
    confidence_band: ConfidenceBand
    is_ambiguous: bool
    ambiguity_reason: Optional[str] = None

    # ── XGBoost Stage 5 Output Fields ─────────────────────────────────────────
    # routing:
    #   "auto_approve" → Model is confident enough to bypass human review
    #   "auto_reject"  → Model is confident this is a wrong match
    #   "needs_human"  → Genuinely ambiguous, route to planner queue
    xgb_routing: Optional[str] = None
    xgb_approval_probability: Optional[float] = None
    xgb_explanation: Optional[Dict[str, str]] = None
    xgb_model_active: Optional[bool] = None
