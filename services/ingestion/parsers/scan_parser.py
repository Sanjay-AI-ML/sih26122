"""
Scanned diary / image input stub per SIH26122 Masterplan.
Production OCR is explicitly out of scope for the prototype;
this stub accepts scanned files and routes them cleanly for manual review.
"""

from datetime import date
from typing import List, Optional, Union
from pathlib import Path

from shared.schemas.extracted_event import (
    ExtractedEvent,
    DisciplineEnum,
    EventTypeEnum,
    InputFormatEnum,
)


class ScanParser:
    """
    Stub parser for scanned site diaries, paper log photos, and image attachments.
    """

    def parse(
        self,
        file_input: Union[str, bytes, Path],
        filename: str = "site_diary_scan.jpg",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Produces a placeholder ExtractedEvent flagged for planner review.
        """
        event_date = default_date or date.today().isoformat()
        
        # If file_input is a path to a text stub, read it
        preview_text = f"[SCANNED ATTACHMENT: {filename}]"
        if isinstance(file_input, (str, Path)):
            p = Path(file_input)
            if p.exists() and p.suffix.lower() in {".txt", ".log"}:
                try:
                    preview_text = p.read_text(encoding="utf-8")[:200]
                except Exception:
                    pass

        event = ExtractedEvent(
            activity_phrase="[SCANNED SITE DIARY ENTRY] Requires manual transcription or review",
            discipline=DisciplineEnum.PIPING,
            tag_or_line_id=None,
            location="Site Field Diary",
            event_type=EventTypeEnum.UNSPECIFIED,
            event_date=event_date,
            quantity=None,
            unit=None,
            contractor=None,
            delay_reason="[SCAN_INPUT] Production OCR out of prototype scope; queued for manual review",
            source_document=filename,
            source_excerpt=preview_text,
            input_format=InputFormatEnum.SCAN,
            raw_confidence_hint=0.30
        )

        return [event]
