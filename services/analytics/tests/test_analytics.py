import os
import sqlite3
import pytest
from fastapi.testclient import TestClient
import pandas as pd

from services.analytics.app import app
from services.analytics.engine import analytics_engine

client = TestClient(app)

@pytest.fixture(autouse=True)
def setup_mock_sqlite():
    # Mock the SQLite DB that the engine reads from
    import services.analytics.engine as engine_module
    
    test_db_path = "test_setu.db"
    engine_module.DB_PATH = test_db_path
    
    # Create mock SQLite table with some data
    with sqlite3.connect(test_db_path) as conn:
        conn.execute("DROP TABLE IF EXISTS audit_log")
        conn.execute('''
            CREATE TABLE IF NOT EXISTS audit_log (
                id INTEGER PRIMARY KEY,
                activity_id TEXT,
                discipline TEXT,
                event_date TEXT,
                quantity REAL,
                status TEXT,
                confidence_score REAL,
                confidence_band TEXT,
                was_ambiguous BOOLEAN
            )
        ''')
        conn.execute("DELETE FROM audit_log")
        conn.execute("INSERT INTO audit_log VALUES (1, 'A1', 'piping', '2026-08-01', 10.0, 'approved', 90.0, 'high', 0)")
        conn.execute("INSERT INTO audit_log VALUES (2, 'A1', 'piping', '2026-08-02', 15.0, 'approved', 75.0, 'medium', 0)")
        conn.execute("INSERT INTO audit_log VALUES (3, 'A2', 'civil', '2026-08-01', 50.0, 'approved', 45.0, 'low', 1)")
        conn.execute("INSERT INTO audit_log VALUES (4, 'A3', 'piping', '2026-08-03', NULL, 'rejected', 45.0, 'low', 1)")
    
    yield
    
    # Cleanup
    try:
        engine_module.analytics_engine.con.close()
        # Reinitialize for the next test
        import duckdb
        engine_module.analytics_engine.con = duckdb.connect(database=':memory:')
    except Exception:
        pass

    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except Exception:
            pass

def test_s_curve():
    response = client.get("/analytics/s-curve")
    assert response.status_code == 200
    data = response.json()
    
    # Should have 3 rows of aggregations (piping day 1, civil day 1, piping day 2)
    assert len(data) == 3
    
    # Find piping on 2026-08-01
    piping_day1 = next(d for d in data if d["event_date"] == "2026-08-01" and d["discipline"] == "piping")
    assert piping_day1["daily_quantity"] == 10.0
    
    civil_day1 = next(d for d in data if d["discipline"] == "civil")
    assert civil_day1["daily_quantity"] == 50.0

def test_stats():
    response = client.get("/analytics/stats")
    assert response.status_code == 200
    data = response.json()
    
    assert data["total_events"] == 4
    assert data["ambiguous"] == 2
    assert data["approved"] == 3
    assert data["rejected"] == 1
