import os
import pytest
from fastapi.testclient import TestClient

from shared.schemas.extracted_event import ExtractedEvent, DisciplineEnum, EventTypeEnum, InputFormatEnum
from services.matching.app import app
from services.matching.vector_store import vector_store
from services.matching.schemas import ConfidenceBand

client = TestClient(app)

@pytest.fixture(autouse=True)
def load_mock_schedule():
    csv_path = os.path.join(os.path.dirname(__file__), 'mock_schedule.csv')
    with open(csv_path, 'rb') as f:
        response = client.post("/schedule/load", files={"file": ("mock_schedule.csv", f, "text/csv")})
    assert response.status_code == 200
    yield
    # Teardown if needed

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["loaded_activities"] == 7

def test_high_confidence_match():
    event = ExtractedEvent(
        activity_phrase="Erection of Spools",
        discipline=DisciplineEnum.PIPING,
        tag_or_line_id="24-PL-001",
        event_date="2026-08-15",
        source_document="test.txt",
        source_excerpt="erection of spools for 24-pl-001",
        input_format=InputFormatEnum.FREE_TEXT
    )
    
    response = client.post("/match", json=event.model_dump())
    assert response.status_code == 200
    data = response.json()
    
    # Expect ACT-PIPE-102: Erection of Spools for Line 24-PL-001
    assert data["top_activity_id"] == "ACT-PIPE-102"
    assert data["confidence_band"] == ConfidenceBand.HIGH.value
    assert data["is_ambiguous"] is False

def test_ambiguity_detection():
    # Only specifying "spools 24-PL-001", missing erection vs fabrication vs hydrotest context
    event = ExtractedEvent(
        activity_phrase="Worked on spools",
        discipline=DisciplineEnum.PIPING,
        tag_or_line_id="24-PL-001",
        event_date="2026-08-15",
        source_document="test.txt",
        source_excerpt="worked on spools 24-pl-001",
        input_format=InputFormatEnum.FREE_TEXT
    )
    
    response = client.post("/match", json=event.model_dump())
    assert response.status_code == 200
    data = response.json()
    
    # It should detect ambiguity because Fabrication, Erection, and Hydrotest 
    # all have the exact same tag and discipline and similar phrase.
    assert data["is_ambiguous"] is True
    assert data["confidence_band"] == ConfidenceBand.LOW.value
    assert "Ambiguous: Margin between top candidate" in data["ambiguity_reason"]

def test_discipline_mismatch_penalty():
    # Give a civil-sounding phrase but force the PIPING discipline
    event = ExtractedEvent(
        activity_phrase="Excavation for Tank",
        discipline=DisciplineEnum.PIPING, # Intentionally wrong discipline
        tag_or_line_id="TK-100",
        event_date="2026-08-15",
        source_document="test.txt",
        source_excerpt="excavation for tank tk-100",
        input_format=InputFormatEnum.FREE_TEXT
    )
    
    response = client.post("/match", json=event.model_dump())
    assert response.status_code == 200
    data = response.json()
    
    # The true activity (ACT-CIVIL-201) would get penalized because of discipline mismatch
    # So confidence should definitely not be HIGH.
    assert data["confidence_band"] != ConfidenceBand.HIGH.value
    
    # We can check rationale for penalty
    candidates = data["candidates"]
    has_penalty = False
    for c in candidates:
        if c["activity_id"] == "ACT-CIVIL-201" and "Discipline mismatch (penalty)" in c["rationale"]:
            has_penalty = True
            break
    assert has_penalty is True
