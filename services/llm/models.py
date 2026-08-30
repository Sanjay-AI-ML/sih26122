"""
Pydantic models for Claude LLM I/O.
Ensures structured, validated communication with Claude API.
"""

from typing import Optional, List
from pydantic import BaseModel, Field


class StructuredFieldEvent(BaseModel):
    """
    Structured extraction of a field event from unstructured report.
    All fields are optional — only populated if supported by source.
    """
    activity_phrase: Optional[str] = Field(
        default=None,
        description="Exact description of work performed from source text"
    )
    event_type: Optional[str] = Field(
        default=None,
        description="start | finish | progress | delay_stoppage | unspecified"
    )
    actual_start: Optional[str] = Field(
        default=None,
        description="Actual start date (YYYY-MM-DD) if available"
    )
    actual_end: Optional[str] = Field(
        default=None,
        description="Actual end/completion date (YYYY-MM-DD) if available"
    )
    discipline: Optional[str] = Field(
        default=None,
        description="piping | civil | static_rotating | electrical | instrumentation | hse"
    )
    line_id: Optional[str] = Field(
        default=None,
        description="Pipe line number or identifier (e.g. 24-inch XX, 24-PL-001)"
    )
    equipment_tag: Optional[str] = Field(
        default=None,
        description="Equipment or vessel tag (e.g. P-201, TK-101, HX-05)"
    )
    quantity: Optional[float] = Field(
        default=None,
        description="Numeric quantity if stated"
    )
    unit: Optional[str] = Field(
        default=None,
        description="Unit of measurement (spools, joints, meters, MT, %, etc.)"
    )
    status: Optional[str] = Field(
        default=None,
        description="Work status: completed, in_progress, delayed, pending"
    )
    delay_reason: Optional[str] = Field(
        default=None,
        description="If delayed/stopped, the stated reason"
    )
    location: Optional[str] = Field(
        default=None,
        description="Area, unit, sector, or location mentioned"
    )
    contractor: Optional[str] = Field(
        default=None,
        description="Contractor or vendor name if mentioned"
    )
    source_span: str = Field(
        ...,
        description="Exact text span from source document supporting this extraction"
    )
    source_document: str = Field(
        default="unknown",
        description="Name of source document"
    )
    confidence_hint: float = Field(
        default=0.5,
        ge=0.0,
        le=1.0,
        description="Claude's confidence in this extraction (0-1)"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "activity_phrase": "24-inch XX spool erection",
                "event_type": "finish",
                "actual_end": "2026-08-30",
                "discipline": "piping",
                "line_id": "24-inch XX",
                "status": "completed",
                "source_span": "24-inch XX spool erection completed today",
                "source_document": "daily_progress_report_20260830.txt",
                "confidence_hint": 0.92
            }
        }


class ExtractionResponse(BaseModel):
    """
    Claude's response to a structured extraction request.
    """
    events: List[StructuredFieldEvent] = Field(
        default_factory=list,
        description="List of extracted structured events"
    )
    raw_text: str = Field(
        default="",
        description="Original text that was analyzed"
    )
    extraction_model: str = Field(
        default="claude-sonnet-4-6",
        description="Which Claude model performed the extraction"
    )
    extraction_successful: bool = Field(
        default=True,
        description="Whether extraction completed successfully"
    )
    error_message: Optional[str] = Field(
        default=None,
        description="Error details if extraction failed"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "events": [
                    {
                        "activity_phrase": "24-inch XX spool erection",
                        "event_type": "finish",
                        "actual_end": "2026-08-30",
                        "discipline": "piping",
                        "status": "completed",
                        "source_span": "24-inch XX spool erection completed",
                        "confidence_hint": 0.92
                    }
                ],
                "extraction_model": "claude-sonnet-4-6",
                "extraction_successful": True
            }
        }


class HistoricalQueryResponse(BaseModel):
    """
    Claude's response to a grounded historical memory query.
    Based on actual retrieved execution records, NOT fabricated.
    """
    answer: str = Field(
        ...,
        description="Answer grounded in retrieved historical records"
    )
    has_sufficient_data: bool = Field(
        default=False,
        description="Whether sufficient evidence was available to answer"
    )
    record_count: int = Field(
        default=0,
        description="Number of historical records that informed the answer"
    )
    supporting_evidence: List[dict] = Field(
        default_factory=list,
        description="Specific records used to generate the answer"
    )
    data_gaps: Optional[str] = Field(
        default=None,
        description="If data was insufficient, what's missing"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "answer": "Based on 7 historical spool erection records, piping activities under ABC Engineering typically take 2-4 days, with an average of 2.8 days.",
                "has_sufficient_data": True,
                "record_count": 7,
                "supporting_evidence": [
                    {"activity": "Spool Erection", "duration_days": 3, "contractor": "ABC"},
                    {"activity": "Spool Erection", "duration_days": 2.5, "contractor": "ABC"}
                ]
            }
        }


class ModelHealthStatus(BaseModel):
    """
    Health status of all ML components.
    """
    llm_available: bool = Field(
        default=False,
        description="Claude API accessible"
    )
    llm_model: str = Field(
        default="",
        description="Currently configured Claude model"
    )
    embedding_available: bool = Field(
        default=False,
        description="Embedding model loaded"
    )
    embedding_model: str = Field(
        default="",
        description="Currently configured embedding model"
    )
    reranker_available: bool = Field(
        default=False,
        description="Reranker model loaded"
    )
    reranker_model: str = Field(
        default="",
        description="Currently configured reranker"
    )
    vector_store_available: bool = Field(
        default=False,
        description="FAISS vector index loaded"
    )
    confidence_model_available: bool = Field(
        default=False,
        description="Trained confidence model loaded"
    )
    system_operational: bool = Field(
        default=False,
        description="Overall system operational status"
    )

    class Config:
        json_schema_extra = {
            "example": {
                "llm_available": True,
                "llm_model": "claude-sonnet-4-6",
                "embedding_available": True,
                "embedding_model": "bge-m3",
                "reranker_available": True,
                "reranker_model": "bge-reranker-base",
                "vector_store_available": True,
                "confidence_model_available": True,
                "system_operational": True
            }
        }
