"""
Voice transcript and supervisor speech-to-text parser.
Handles typed supervisor updates and code-mixed (Hinglish) field reports.
"""

import re
from datetime import date
from typing import List, Optional, Dict, Any

from shared.schemas.extracted_event import (
    ExtractedEvent,
    DisciplineEnum,
    EventTypeEnum,
    InputFormatEnum,
)
from services.ingestion.parsers.text_parser import TextParser


class VoiceParser:
    """
    Parses supervisor voice transcripts and spoken messages.
    """

    def __init__(self):
        self.text_parser = TextParser()

    def parse(
        self,
        transcript: str,
        source_document: str = "voice_transcript_stream.wav",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Parses a spoken or typed supervisor utterance into ExtractedEvent objects.
        """
        if not transcript or not transcript.strip():
            return []

        # Run core text parser
        events = self.text_parser.parse(
            text=transcript,
            source_document=source_document,
            default_date=default_date
        )

        # Set input_format to VOICE for all returned events
        voice_events = []
        for ev in events:
            ev_dict = ev.model_dump()
            ev_dict["input_format"] = InputFormatEnum.VOICE
            voice_events.append(ExtractedEvent(**ev_dict))

        if not voice_events and transcript.strip():
            voice_events.append(ExtractedEvent(
                activity_phrase=f"Voice update: {transcript.strip()[:80]}",
                discipline=DisciplineEnum.PIPING,
                tag_or_line_id=None,
                location=None,
                event_type=EventTypeEnum.UNSPECIFIED,
                event_date=default_date or date.today().isoformat(),
                quantity=None,
                unit=None,
                contractor=None,
                delay_reason=None,
                source_document=source_document,
                source_excerpt=transcript.strip(),
                input_format=InputFormatEnum.VOICE,
                raw_confidence_hint=0.40
            ))

        return voice_events
