"""
Shared Pydantic schema for ExtractedEvent in Setu (SIH26122).
All ingestion and extraction services validate against this model.
"""

from datetime import date
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field, ConfigDict


class DisciplineEnum(str, Enum):
    CIVIL = "civil"
    PIPING = "piping"
    STATIC_ROTATING = "static_rotating"
    ELECTRICAL = "electrical"
    INSTRUMENTATION = "instrumentation"
    HSE = "hse"


class EventTypeEnum(str, Enum):
    START = "start"
    FINISH = "finish"
    PROGRESS = "progress"
    UNSPECIFIED = "unspecified"


class InputFormatEnum(str, Enum):
    FREE_TEXT = "free_text"
    SPREADSHEET = "spreadsheet"
    SCAN = "scan"
    VOICE = "voice"


class ExtractedEvent(BaseModel):
    """
    Standardized event extracted from daily reports, spreadsheets,
    voice transcripts, or site diaries.
    """
    model_config = ConfigDict(extra="forbid", populate_by_name=True)

    activity_phrase: str = Field(
        ...,
        description="Extracted activity description phrase, e.g. 'spool erected on Line 24-PL-001'",
        min_length=1
    )
    discipline: DisciplineEnum = Field(
        ...,
        description="Engineering discipline code"
    )
    tag_or_line_id: Optional[str] = Field(
        default=None,
        description="Engineering tag, line number, equipment ID, or spool number"
    )
    location: Optional[str] = Field(
        default=None,
        description="Site unit, plot, bay, or location description"
    )
    event_type: EventTypeEnum = Field(
        default=EventTypeEnum.UNSPECIFIED,
        description="Milestone status (start, finish, progress, unspecified)"
    )
    event_date: str = Field(
        ...,
        description="ISO formatted date string (YYYY-MM-DD)"
    )
    quantity: Optional[float] = Field(
        default=None,
        description="Quantitative progress value completed or logged"
    )
    unit: Optional[str] = Field(
        default=None,
        description="Unit of measurement (e.g. 'joints', 'meters', 'cum', 'MT', 'nos')"
    )
    contractor: Optional[str] = Field(
        default=None,
        description="Executing contractor or subcontractor name"
    )
    delay_reason: Optional[str] = Field(
        default=None,
        description="Reported delay reason, bottleneck, or obstruction"
    )
    source_document: str = Field(
        ...,
        description="Source document name, stream ID, or filename",
        min_length=1
    )
    source_excerpt: str = Field(
        ...,
        description="Exact verbatim original sentence, row, or utterance for audit trail",
        min_length=1
    )
    input_format: InputFormatEnum = Field(
        ...,
        description="Source format modality (free_text, spreadsheet, scan, voice)"
    )
    raw_confidence_hint: Optional[float] = Field(
        default=None,
        ge=0.0,
        le=1.0,
        description="Extractor self-confidence hint between 0.0 and 1.0"
    )
