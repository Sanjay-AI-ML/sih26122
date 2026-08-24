"""
Unit tests for ExtractedEvent schema validation.
"""

import pytest
from pydantic import ValidationError
from shared.schemas.extracted_event import (
    ExtractedEvent,
    DisciplineEnum,
    EventTypeEnum,
    InputFormatEnum,
)


def test_valid_extracted_event():
    event = ExtractedEvent(
        activity_phrase="Spool erection completed on Line 24-PL-001",
        discipline=DisciplineEnum.PIPING,
        tag_or_line_id="Line 24-PL-001",
        location="CDU-II pipe rack",
        event_type=EventTypeEnum.FINISH,
        event_date="2026-08-20",
        quantity=14.0,
        unit="spools",
        contractor="L&T Heavy Engineering",
        delay_reason=None,
        source_document="DPR_2026-08-20.txt",
        source_excerpt="On Line 24-PL-001, L&T piping crew completed spool erection of 14 spools.",
        input_format=InputFormatEnum.FREE_TEXT,
        raw_confidence_hint=0.92
    )

    assert event.activity_phrase == "Spool erection completed on Line 24-PL-001"
    assert event.discipline == DisciplineEnum.PIPING
    assert event.event_type == EventTypeEnum.FINISH
    assert event.quantity == 14.0
    assert event.unit == "spools"
    assert event.contractor == "L&T Heavy Engineering"


def test_missing_required_fields_raises_error():
    with pytest.raises(ValidationError):
        # Missing activity_phrase and discipline
        ExtractedEvent(
            event_date="2026-08-20",
            source_document="test.txt",
            source_excerpt="sample excerpt",
            input_format=InputFormatEnum.FREE_TEXT
        )


def test_invalid_discipline_raises_error():
    with pytest.raises(ValidationError):
        ExtractedEvent(
            activity_phrase="Excavation completed",
            discipline="invalid_discipline",  # Not in DisciplineEnum
            event_date="2026-08-20",
            source_document="test.txt",
            source_excerpt="sample excerpt",
            input_format=InputFormatEnum.FREE_TEXT
        )


def test_extra_fields_forbidden():
    with pytest.raises(ValidationError):
        ExtractedEvent(
            activity_phrase="Excavation completed",
            discipline=DisciplineEnum.CIVIL,
            event_date="2026-08-20",
            source_document="test.txt",
            source_excerpt="sample excerpt",
            input_format=InputFormatEnum.FREE_TEXT,
            unknown_random_field="not allowed"
        )
