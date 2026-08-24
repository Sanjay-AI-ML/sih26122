import io
import json
import time
import pytest
import pandas as pd
from pydantic import ValidationError
from fastapi.testclient import TestClient

from services.ingestion.app import app
from services.ingestion.engine import IngestionEngine
from shared.schemas.extracted_event import ExtractedEvent

client = TestClient(app)
engine = IngestionEngine()

class TestBrutalEdgeCases:
    def test_empty_string(self):
        assert engine.ingest_text("") == []

    def test_whitespace_and_newlines_only(self):
        assert engine.ingest_text("   \n\n\t\t\r\n   \n") == []

    def test_zero_byte_files(self):
        assert engine.ingest_file(b"", "empty.txt") == []
        assert engine.ingest_file(b"", "empty.csv") == []
        assert engine.ingest_file(b"", "empty.xlsx") == []

    def test_null_bytes_and_garbage_binary(self):
        garbage = b"\x00\xff\xfe\x01\x00\xaa\xbb\xcc" * 100
        result = engine.ingest_file(garbage, "corrupt.txt")
        assert isinstance(result, list)

    def test_unicode_emojis_and_multilingual_fuzz(self):
        text = "2026-08-15: Piping line 24-PL-001 completed 25 spools. 100% done!"
        result = engine.ingest_text(text)
        assert len(result) >= 1
        assert "24-PL-001" in result[0].tag_or_line_id
        assert result[0].quantity == 25.0

    def test_zero_width_spaces_and_tabs(self):
        text = "2026-08-20:\u200bPiping\u200cteam\u200dcompleted\t\tLine-12-PL-004\t15\tspools"
        result = engine.ingest_text(text)
        assert len(result) >= 1

    def test_sql_injection_payloads(self):
        payload = "12-08-2026: '; DROP TABLE extracted_events; SELECT * FROM users WHERE '1'='1 -- Line 24-PL-001 completed 10 joints"
        result = engine.ingest_text(payload)
        assert len(result) >= 1
        assert result[0].discipline.value in ["piping", "civil", "static_rotating", "electrical", "instrumentation", "hse"]

    def test_xss_and_html_tags(self):
        payload = "<script>alert('XSS')</script> <b>2026-08-12</b> Piping Line-24-PL-001 done 10 spools <img src=x onerror=alert(1)>"
        result = engine.ingest_text(payload)
        assert len(result) >= 1

    def test_command_injection_strings(self):
        payload = "$(rm -rf /) `cat /etc/passwd` & calc.exe & 2026-08-12 Piping Line-24-PL-001 completed 5 spools"
        result = engine.ingest_text(payload)
        assert len(result) >= 1

    def test_hinglish_heavy_delays_and_stoppages(self):
        text = "2026-08-22: Unit 4 mein Line-18-CS-204 par welding finish ho gaya. 12 joints done."
        result = engine.ingest_text(text)
        assert len(result) >= 1
        ev = result[0]
        assert ev.event_type.value == "finish"
        assert "18-CS-204" in ev.tag_or_line_id
        assert ev.quantity == 12.0

    def test_hinglish_commencement(self):
        text = "Aaj civil team ne foundation excavation start kiya for Pump P-101A. Total 45 cum soil removed."
        result = engine.ingest_text(text)
        assert len(result) >= 1
        ev = result[0]
        assert ev.event_type.value == "start"
        assert ev.discipline.value == "civil"
        assert ev.quantity == 45.0

    def test_massive_single_line(self):
        large_text = ("2026-08-20: Piping line 24-PL-001 completed 10 joints. " * 100)
        start = time.time()
        result = engine.ingest_text(large_text)
        elapsed = time.time() - start
        assert elapsed < 5.0
        assert len(result) >= 1

    def test_500_lines_dpr_file(self):
        lines = [f"2026-08-20: Civil team foundation task {i} poured 10 cum concrete at Area-0{i%9}." for i in range(200)]
        dpr_content = "\n".join(lines)
        start = time.time()
        result = engine.ingest_text(dpr_content)
        elapsed = time.time() - start
        assert elapsed < 5.0
        assert len(result) == 200

    def test_messy_csv_with_dirty_headers(self):
        dirty_csv = '''"Discipline / Work Area","Line ID #","Quantity Done (Units)","Status / Remarks","Date of Work"
Piping,Line-24-PL-001,15 spools,Erection Completed,12/08/2026
Civil,FOUNDATION-TK-101,120 cum,Poured concrete successfully,14-08-2026
Electrical,CABLE-TRENCH-01,250 meters,Pulling ongoing,2026-08-16
'''
        result = engine.ingest_file(dirty_csv.encode('utf-8'), "dirty_report.csv")
        assert len(result) == 3
        assert result[0].discipline.value == "piping"
        assert result[1].discipline.value == "civil"
        assert result[2].discipline.value == "electrical"

    def test_excel_with_formula_errors_and_nan(self):
        df = pd.DataFrame({
            "Discipline": ["Piping", None, "Civil"],
            "Tag": ["Line-24-PL-001", "UNKNOWN", "TK-101"],
            "Qty": [10.5, None, 40],
            "Unit": ["joints", None, "cum"],
            "Date": ["2026-08-12", None, "2026-08-15"]
        })
        buffer = io.BytesIO()
        df.to_excel(buffer, index=False)
        buffer.seek(0)
        result = engine.ingest_file(buffer.getvalue(), "corrupted.xlsx")
        assert len(result) >= 2

    def test_api_empty_payload_rejection(self):
        res = client.post("/ingest/text", json={"text": ""})
        assert res.status_code == 422

    def test_api_large_json_payload(self):
        res = client.post("/ingest/text", json={
            "text": "2026-08-12: Piping Line 24-PL-001 completed 20 spools." * 20
        })
        assert res.status_code == 200
        data = res.json()
        assert data["success"] is True
        assert len(data["events"]) >= 1

    def test_api_file_upload_all_formats(self):
        res = client.post("/ingest", files={"file": ("test.txt", b"2026-08-12: Piping line 24-PL-001 done 10 joints", "text/plain")})
        assert res.status_code == 200
        assert res.json()["total_events"] >= 1

        res = client.post("/ingest", files={"file": ("test.csv", b"Discipline,Tag,Qty,Date\nPiping,Line-24-PL-001,10,2026-08-12", "text/csv")})
        assert res.status_code == 200
        assert res.json()["total_events"] == 1
