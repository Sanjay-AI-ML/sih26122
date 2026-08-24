"""
Unit and Integration Tests for Advanced Ingestion Features:
Audio parsing, OCR parsing, LLM extraction, and new FastAPI endpoints.
"""

import io
from fastapi.testclient import TestClient
from services.ingestion.app import app
from services.ingestion.parsers.audio_parser import AudioParser
from services.ingestion.parsers.ocr_parser import OCRParser
from services.ingestion.llm_extractor import LLMExtractor

client = TestClient(app)


def test_audio_parser_fallback():
    parser = AudioParser()
    events = parser.parse_audio(b"FAKE_AUDIO_BYTES", filename="test_supervisor.wav")
    assert len(events) >= 1
    assert events[0].source_document == "test_supervisor.wav"
    assert events[0].input_format.value == "voice"


def test_ocr_parser_fallback():
    parser = OCRParser()
    events = parser.parse_image(b"FAKE_IMAGE_BYTES", filename="diary_scan_01.jpg")
    assert len(events) >= 1
    assert events[0].source_document == "diary_scan_01.jpg"
    assert events[0].input_format.value == "scan"


def test_llm_extractor_offline_fallback():
    extractor = LLMExtractor()
    text = "2026-08-15: Piping line 24-PL-001 completed 20 spools."
    events = extractor.extract_with_llm(text)
    assert len(events) >= 1
    assert "24-PL-001" in events[0].tag_or_line_id
    assert events[0].quantity == 20.0


def test_api_ingest_audio_endpoint():
    res = client.post(
        "/ingest/audio",
        files={"file": ("memo.wav", b"RIFF....WAVEfmt ", "audio/wav")}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["input_format"] == "voice"
    assert data["total_events"] >= 1


def test_api_ingest_llm_endpoint():
    res = client.post(
        "/ingest/llm",
        json={"text": "2026-08-20: Civil team excavated 100 cum soil for Foundation TK-101."}
    )
    assert res.status_code == 200
    data = res.json()
    assert data["success"] is True
    assert data["total_events"] >= 1
