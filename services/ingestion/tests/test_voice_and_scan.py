"""
Unit tests for Voice and Scan parsers.
"""

import json
from pathlib import Path
from services.ingestion.parsers.voice_parser import VoiceParser
from services.ingestion.parsers.scan_parser import ScanParser
from shared.schemas.extracted_event import DisciplineEnum, EventTypeEnum, InputFormatEnum


def test_voice_transcripts():
    parser = VoiceParser()
    json_path = Path("shared/sample-data/supervisor_voice_transcripts.json")
    assert json_path.exists()

    with open(json_path, "r", encoding="utf-8") as f:
        transcripts = json.load(f)

    for item in transcripts:
        events = parser.parse(
            transcript=item["transcript"],
            source_document=item["audio_source"],
            default_date="2026-08-20"
        )
        assert len(events) >= 1
        ev = events[0]
        assert ev.input_format == InputFormatEnum.VOICE
        assert ev.discipline.value == item["expected_discipline"]
        assert ev.tag_or_line_id == item["expected_tag"]
        assert ev.event_type.value == item["expected_event_type"]


def test_scan_stub():
    parser = ScanParser()
    events = parser.parse(
        file_input="shared/sample-data/site_diary_scan_sample.txt",
        filename="site_diary_page_1.jpg",
        default_date="2026-08-20"
    )
    assert len(events) == 1
    ev = events[0]
    assert ev.input_format == InputFormatEnum.SCAN
    assert ev.raw_confidence_hint == 0.30
    assert "[SCANNED SITE DIARY ENTRY]" in ev.activity_phrase
    assert ev.source_document == "site_diary_page_1.jpg"
