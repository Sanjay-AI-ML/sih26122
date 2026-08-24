import os
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from services.writeback.app import app, get_db
from services.writeback.db import Base

TEST_DB_PATH = "test_writeback.db"
SQLALCHEMY_DATABASE_URL = f"sqlite:///{TEST_DB_PATH}"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(autouse=True)
def setup_database():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)
    engine.dispose()
    if os.path.exists(TEST_DB_PATH):
        try:
            os.remove(TEST_DB_PATH)
        except Exception:
            pass

client = TestClient(app)

def test_approve_event():
    payload = {
        "activity_id": "ACT-PIPE-101",
        "discipline": "piping",
        "event_date": "2026-08-20",
        "quantity": 14.5,
        "unit": "joints",
        "confidence_score": 0.92,
        "confidence_band": "high",
        "was_ambiguous": False,
        "source_document": "daily_report.txt",
        "source_excerpt": "14.5 joints erected on ACT-PIPE-101",
        "approved_by": "planner_smith"
    }
    
    response = client.post("/audit/approve", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "approved"
    assert data["id"] == 1
    assert data["activity_id"] == "ACT-PIPE-101"

def test_reject_event():
    payload = {
        "activity_id": "ACT-CIVIL-202",
        "discipline": "civil",
        "event_date": "2026-08-20",
        "quantity": 100,
        "unit": "cum",
        "confidence_score": 0.45,
        "confidence_band": "low",
        "was_ambiguous": True,
        "source_document": "daily_report_2.txt",
        "source_excerpt": "poured 100 cum",
        "approved_by": "planner_jones"
    }
    
    response = client.post("/audit/reject", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "rejected"
    assert data["id"] == 1

def test_history():
    payload = {
        "activity_id": "ACT-ELEC-301",
        "discipline": "electrical",
        "event_date": "2026-08-21",
        "quantity": None,
        "unit": None,
        "confidence_score": 0.88,
        "confidence_band": "high",
        "was_ambiguous": False,
        "source_document": "elec_log.txt",
        "source_excerpt": "cable pulled",
        "approved_by": "planner_smith"
    }
    client.post("/audit/approve", json=payload)
    
    response = client.get("/audit/history")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["activity_id"] == "ACT-ELEC-301"
