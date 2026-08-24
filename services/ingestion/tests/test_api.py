"""
Integration tests for FastAPI Ingestion endpoints using TestClient.
"""

from pathlib import Path
from fastapi.testclient import TestClient
from services.ingestion.app import app

client = TestClient(app)


def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "service" in data
    assert "supported_modalities" in data


def test_supported_formats_endpoint():
    response = client.get("/supported-formats")
    assert response.status_code == 200
    data = response.json()
    assert "extensions" in data
    assert "modalities" in data
    assert "target_disciplines" in data


def test_ingest_text_json():
    payload = {
        "text": "1. On Line 24-PL-001, L&T piping crew completed spool erection of 14 spools at CDU-II pipe rack.",
        "source_document": "api_test_dpr.txt",
        "default_date": "2026-08-20"
    }
    response = client.post("/ingest/text", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_events"] >= 1
    assert data["input_format"] == "free_text"
    
    event = data["events"][0]
    assert event["tag_or_line_id"] == "Line 24-PL-001"
    assert event["discipline"] == "piping"
    assert event["quantity"] == 14.0
    assert event["unit"] == "spools"


def test_ingest_voice_json():
    payload = {
        "transcript": "Tank TK-101 ka foundation excavation complete kar diya Tata Projects ne, total 450 cum earthwork finish ho gaya.",
        "source_document": "voice_mic_01.wav",
        "default_date": "2026-08-21"
    }
    response = client.post("/ingest/voice", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["input_format"] == "voice"
    event = data["events"][0]
    assert event["discipline"] == "civil"
    assert event["tag_or_line_id"] == "TK-101"
    assert event["quantity"] == 450.0


def test_ingest_file_csv_upload():
    csv_file = Path("shared/sample-data/discipline_progress_piping.csv")
    assert csv_file.exists()

    with open(csv_file, "rb") as f:
        response = client.post(
            "/ingest/file",
            files={"file": ("discipline_progress_piping.csv", f, "text/csv")}
        )

    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert data["total_events"] == 7
    assert data["input_format"] == "spreadsheet"
