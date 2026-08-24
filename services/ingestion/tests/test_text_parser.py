"""
Unit tests for free-text Daily Progress Report parser.
"""

from pathlib import Path
from services.ingestion.parsers.text_parser import TextParser
from shared.schemas.extracted_event import DisciplineEnum, EventTypeEnum, InputFormatEnum


def test_parse_single_piping_line():
    parser = TextParser()
    line = "1. On Line 24-PL-001, L&T piping crew completed spool erection of 14 spools at CDU-II pipe rack."
    event = parser.parse_single_line(
        line_text=line,
        source_document="piping_dpr.txt",
        fallback_date="2026-08-20"
    )

    assert event is not None
    assert event.discipline == DisciplineEnum.PIPING
    assert event.tag_or_line_id == "Line 24-PL-001"
    assert event.event_type == EventTypeEnum.FINISH
    assert event.quantity == 14.0
    assert event.unit == "spools"
    assert "L&T" in event.contractor
    assert event.input_format == InputFormatEnum.FREE_TEXT
    assert event.source_excerpt == line


def test_parse_delay_reason_line():
    parser = TextParser()
    line = "4. Heavy rainfall caused 3 hours work stoppage on Line 30-PL-009 valve assembly; delayed due to waterlogging in valve pit."
    event = parser.parse_single_line(
        line_text=line,
        source_document="piping_dpr.txt",
        fallback_date="2026-08-20"
    )

    assert event is not None
    assert event.tag_or_line_id == "Line 30-PL-009"
    assert event.event_type == EventTypeEnum.PROGRESS
    assert event.delay_reason is not None
    assert "waterlogging" in event.delay_reason.lower() or "heavy rainfall" in event.delay_reason.lower()


def test_parse_civil_foundation_line():
    parser = TextParser()
    line = "Excavation work for Tank TK-101 foundation completed by Tata Projects; 450 cum soil excavated."
    event = parser.parse_single_line(
        line_text=line,
        source_document="civil_dpr.txt",
        fallback_date="2026-08-21"
    )

    assert event is not None
    assert event.discipline == DisciplineEnum.CIVIL
    assert event.tag_or_line_id == "TK-101"
    assert event.event_type == EventTypeEnum.FINISH
    assert event.quantity == 450.0
    assert event.unit == "cum"
    assert "Tata Projects" in event.contractor


def test_parse_full_piping_dpr_file():
    parser = TextParser()
    sample_file = Path("shared/sample-data/daily_progress_report_piping.txt")
    assert sample_file.exists()
    
    content = sample_file.read_text(encoding="utf-8")
    events = parser.parse(content, source_document="daily_progress_report_piping.txt")

    assert len(events) >= 8
    # Verify line IDs captured
    tags = {e.tag_or_line_id for e in events if e.tag_or_line_id}
    assert "Line 24-PL-001" in tags
    assert "Line 12-CS-104" in tags
    assert "Line 08-SS-202" in tags


def test_parse_full_civil_dpr_file():
    parser = TextParser()
    sample_file = Path("shared/sample-data/daily_progress_report_civil.txt")
    assert sample_file.exists()

    content = sample_file.read_text(encoding="utf-8")
    events = parser.parse(content, source_document="daily_progress_report_civil.txt")

    assert len(events) >= 6
    tags = {e.tag_or_line_id for e in events if e.tag_or_line_id}
    assert "TK-101" in tags
    assert "P-201A" in tags
    assert "C-301" in tags
