"""
Unit tests for CSV and XLSX spreadsheet parser.
"""

from pathlib import Path
from services.ingestion.parsers.spreadsheet_parser import SpreadsheetParser
from shared.schemas.extracted_event import DisciplineEnum, EventTypeEnum, InputFormatEnum


def test_parse_piping_csv():
    parser = SpreadsheetParser()
    csv_path = Path("shared/sample-data/discipline_progress_piping.csv")
    assert csv_path.exists()

    events = parser.parse_file(csv_path, filename="discipline_progress_piping.csv")
    assert len(events) == 7

    e0 = events[0]
    assert e0.discipline == DisciplineEnum.PIPING
    assert e0.tag_or_line_id == "Line 24-PL-001"
    assert e0.event_type == EventTypeEnum.FINISH
    assert e0.quantity == 14.0
    assert e0.unit == "spools"
    assert e0.contractor == "L&T Heavy Engineering"
    assert e0.input_format == InputFormatEnum.SPREADSHEET


def test_parse_civil_xlsx():
    parser = SpreadsheetParser()
    xlsx_path = Path("shared/sample-data/discipline_progress_civil.xlsx")
    assert xlsx_path.exists()

    events = parser.parse_file(xlsx_path, filename="discipline_progress_civil.xlsx")
    assert len(events) == 5

    e0 = events[0]
    assert e0.discipline == DisciplineEnum.CIVIL
    assert e0.tag_or_line_id == "TK-101"
    assert e0.event_type == EventTypeEnum.FINISH
    assert e0.quantity == 450.0
    assert e0.unit == "cum"
    assert e0.contractor == "Tata Projects"
    assert e0.input_format == InputFormatEnum.SPREADSHEET


def test_parse_custom_columns_csv():
    parser = SpreadsheetParser()
    custom_csv = """Task,Trade,Item,Volume,UOM,Partner,Date,State
Rebar tying for column plinth,civil,C-301,15.5,MT,Bridge & Roof,2026-08-22,complete
"""
    events = parser.parse_file(custom_csv.encode("utf-8"), filename="custom.csv")
    assert len(events) == 1
    ev = events[0]
    assert ev.activity_phrase == "Rebar tying for column plinth"
    assert ev.discipline == DisciplineEnum.CIVIL
    assert ev.tag_or_line_id == "C-301"
    assert ev.quantity == 15.5
    assert ev.unit == "MT"
    assert ev.contractor == "Bridge & Roof"
    assert ev.event_type == EventTypeEnum.FINISH
