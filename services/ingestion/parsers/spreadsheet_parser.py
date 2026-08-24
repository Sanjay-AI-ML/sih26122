"""
Discipline spreadsheet parser for CSV and XLSX files.
Extracts structured ExtractedEvent objects adhering to SIH26122 schema.
"""

import io
from datetime import datetime, date
from pathlib import Path
from typing import List, Optional, Union, Dict, Any
import pandas as pd

from shared.schemas.extracted_event import (
    ExtractedEvent,
    DisciplineEnum,
    EventTypeEnum,
    InputFormatEnum,
)
from services.ingestion.config import DISCIPLINE_KEYWORDS


class SpreadsheetParser:
    """
    Parses discipline progress spreadsheets (.csv, .xlsx, .xls) into ExtractedEvent lists.
    Includes flexible column header mapping and data normalization.
    """

    COLUMN_MAPPINGS = {
        "activity_phrase": [
            "activity_phrase", "activity", "work_description", "description",
            "scope", "work_done", "task", "activity_name", "item_description", "work_scope"
        ],
        "discipline": [
            "discipline", "disc", "department", "trade", "package"
        ],
        "tag_or_line_id": [
            "tag_or_line_id", "tag", "line_id", "line_no", "equipment_tag",
            "equipment_id", "tag_number", "line_number", "spool_no", "tag_id", "item"
        ],
        "location": [
            "location", "site_area", "area", "unit", "plot", "bay", "zone", "section"
        ],
        "event_type": [
            "event_type", "status", "stage", "milestone", "progress_type", "state"
        ],
        "event_date": [
            "event_date", "date", "log_date", "progress_date", "entry_date", "day", "timestamp"
        ],
        "quantity": [
            "quantity", "qty", "volume", "amount", "completed_qty", "qty_done"
        ],
        "unit": [
            "unit", "uom", "unit_of_measure", "units", "uom_code"
        ],
        "contractor": [
            "contractor", "vendor", "agency", "contractor_name", "executed_by", "subcontractor", "partner"
        ],
        "delay_reason": [
            "delay_reason", "delay", "remarks", "bottleneck", "notes", "issue", "comments", "blocker", "reason"
        ],
        "source_excerpt": [
            "source_excerpt", "source_text", "raw_row", "original_text"
        ]
    }

    def parse_file(
        self,
        file_input: Union[str, Path, bytes, io.BytesIO],
        filename: str = "discipline_progress.csv",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Reads CSV or Excel file and parses all rows into ExtractedEvents.
        """
        df = self._read_into_dataframe(file_input, filename)
        if df is None or df.empty:
            return []

        # Clean column names (strip, lowercase, replace spaces with underscores)
        df.columns = [str(col).strip().lower().replace(" ", "_") for col in df.columns]

        # Resolve column mapping
        col_map = self._resolve_column_map(df.columns.tolist())
        
        extracted_events: List[ExtractedEvent] = []

        for idx, row in df.iterrows():
            # Skip empty rows
            if row.dropna().empty:
                continue

            event = self._parse_row(
                row=row,
                col_map=col_map,
                source_document=filename,
                row_index=idx,
                default_date=default_date or date.today().isoformat()
            )
            if event:
                extracted_events.append(event)

        return extracted_events

    def _read_into_dataframe(
        self,
        file_input: Union[str, Path, bytes, io.BytesIO],
        filename: str
    ) -> Optional[pd.DataFrame]:
        """Loads file bytes or path into pandas DataFrame."""
        is_excel = filename.lower().endswith((".xlsx", ".xls"))
        
        try:
            if isinstance(file_input, bytes):
                bio = io.BytesIO(file_input)
                if is_excel:
                    return pd.read_excel(bio)
                else:
                    return pd.read_csv(bio)
            elif isinstance(file_input, io.BytesIO):
                if is_excel:
                    return pd.read_excel(file_input)
                else:
                    return pd.read_csv(file_input)
            else:
                path = Path(file_input)
                if not path.exists():
                    return None
                if is_excel:
                    return pd.read_excel(path)
                else:
                    return pd.read_csv(path)
        except Exception as e:
            print(f"Error reading spreadsheet {filename}: {e}")
            return None

    def _resolve_column_map(self, columns: List[str]) -> Dict[str, Optional[str]]:
        """Maps detected dataframe columns to standard schema fields using fuzzy & substring matching."""
        resolved = {}
        for field, aliases in self.COLUMN_MAPPINGS.items():
            matched_col = None
            # 1. Exact match
            for alias in aliases:
                if alias in columns:
                    matched_col = alias
                    break
            # 2. Normalized Substring match if exact match not found
            if not matched_col:
                for col in columns:
                    clean_col = col.replace("/", " ").replace("#", " ").replace("(", " ").replace(")", " ")
                    clean_tokens = [t.strip() for t in clean_col.split() if t.strip()]
                    for alias in aliases:
                        if alias in clean_col or any(alias == t for t in clean_tokens):
                            matched_col = col
                            break
                    if matched_col:
                        break
            resolved[field] = matched_col
        return resolved

    def _parse_row(
        self,
        row: pd.Series,
        col_map: Dict[str, Optional[str]],
        source_document: str,
        row_index: int,
        default_date: str
    ) -> Optional[ExtractedEvent]:
        """Converts a single spreadsheet row into an ExtractedEvent."""
        
        # 1. Activity Phrase
        act_col = col_map.get("activity_phrase")
        activity_phrase = str(row[act_col]).strip() if act_col and pd.notna(row[act_col]) else None
        if not activity_phrase or activity_phrase.lower() in {"nan", "none", ""}:
            # If no explicit activity phrase, construct from tag and status
            tag_col = col_map.get("tag_or_line_id")
            tag_val = str(row[tag_col]).strip() if tag_col and pd.notna(row[tag_col]) else "Progress"
            activity_phrase = f"Work logged for {tag_val}"

        # 2. Tag / Line ID
        tag_col = col_map.get("tag_or_line_id")
        tag_or_line_id = str(row[tag_col]).strip() if tag_col and pd.notna(row[tag_col]) else None
        if tag_or_line_id and tag_or_line_id.lower() in {"nan", "none"}:
            tag_or_line_id = None

        # 3. Discipline
        disc_col = col_map.get("discipline")
        raw_disc = str(row[disc_col]).strip().lower() if disc_col and pd.notna(row[disc_col]) else None
        discipline = self._normalize_discipline(raw_disc, activity_phrase)

        # 4. Event Type
        status_col = col_map.get("event_type")
        raw_status = str(row[status_col]).strip().lower() if status_col and pd.notna(row[status_col]) else None
        event_type = self._normalize_event_type(raw_status)

        # 5. Event Date
        date_col = col_map.get("event_date")
        raw_date = row[date_col] if date_col and pd.notna(row[date_col]) else None
        event_date = self._normalize_date(raw_date, default_date)

        # 6. Quantity and Unit
        qty_col = col_map.get("quantity")
        quantity = None
        if qty_col and pd.notna(row[qty_col]):
            try:
                quantity = float(row[qty_col])
            except (ValueError, TypeError):
                quantity = None

        unit_col = col_map.get("unit")
        unit = str(row[unit_col]).strip() if unit_col and pd.notna(row[unit_col]) else None
        if unit and unit.lower() in {"nan", "none"}:
            unit = None

        # 7. Contractor
        cont_col = col_map.get("contractor")
        contractor = str(row[cont_col]).strip() if cont_col and pd.notna(row[cont_col]) else None
        if contractor and contractor.lower() in {"nan", "none"}:
            contractor = None

        # 8. Delay Reason
        delay_col = col_map.get("delay_reason")
        delay_reason = str(row[delay_col]).strip() if delay_col and pd.notna(row[delay_col]) else None
        if delay_reason and delay_reason.lower() in {"nan", "none", "-", "nil", "na"}:
            delay_reason = None

        # 9. Location
        loc_col = col_map.get("location")
        location = str(row[loc_col]).strip() if loc_col and pd.notna(row[loc_col]) else None
        if location and location.lower() in {"nan", "none"}:
            location = None

        # 10. Source Excerpt (verbatim row content for audit trail)
        excerpt_col = col_map.get("source_excerpt")
        if excerpt_col and pd.notna(row[excerpt_col]):
            source_excerpt = str(row[excerpt_col]).strip()
        else:
            # Build string from non-null values
            non_nulls = [f"{k}={v}" for k, v in row.dropna().to_dict().items() if str(v).lower() not in {"nan", "none"}]
            source_excerpt = f"Row {row_index+1}: " + " | ".join(non_nulls)

        return ExtractedEvent(
            activity_phrase=activity_phrase,
            discipline=discipline,
            tag_or_line_id=tag_or_line_id,
            location=location,
            event_type=event_type,
            event_date=event_date,
            quantity=quantity,
            unit=unit,
            contractor=contractor,
            delay_reason=delay_reason,
            source_document=source_document,
            source_excerpt=source_excerpt,
            input_format=InputFormatEnum.SPREADSHEET,
            raw_confidence_hint=0.95
        )

    def _normalize_discipline(self, raw_disc: Optional[str], fallback_text: str) -> DisciplineEnum:
        """Normalizes discipline string to enum."""
        if raw_disc:
            val = raw_disc.lower()
            if "pipe" in val or "piping" in val:
                return DisciplineEnum.PIPING
            if "civ" in val or "struct" in val:
                return DisciplineEnum.CIVIL
            if "elec" in val:
                return DisciplineEnum.ELECTRICAL
            if "inst" in val:
                return DisciplineEnum.INSTRUMENTATION
            if "stat" in val or "rotat" in val or "mech" in val:
                return DisciplineEnum.STATIC_ROTATING
            if "hse" in val or "safe" in val:
                return DisciplineEnum.HSE

        # Fallback to keyword search in fallback_text
        text_lower = fallback_text.lower()
        for disc, keywords in DISCIPLINE_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    return DisciplineEnum(disc)
        return DisciplineEnum.PIPING

    def _normalize_event_type(self, raw_status: Optional[str]) -> EventTypeEnum:
        """Normalizes status string to enum."""
        if not raw_status:
            return EventTypeEnum.UNSPECIFIED
        val = raw_status.lower()
        if any(w in val for w in ["finish", "done", "complete", "closed", "100%", "tested"]):
            return EventTypeEnum.FINISH
        if any(w in val for w in ["start", "commence", "began", "initiate", "0%"]):
            return EventTypeEnum.START
        if any(w in val for w in ["progress", "ongoing", "delay", "suspend", "hold", "in_progress"]):
            return EventTypeEnum.PROGRESS
        return EventTypeEnum.UNSPECIFIED

    def _normalize_date(self, raw_date: Any, default_date: str) -> str:
        """Converts raw date / timestamp to ISO format string."""
        if raw_date is None or pd.isna(raw_date):
            return default_date
        if isinstance(raw_date, (datetime, pd.Timestamp)):
            return raw_date.strftime("%Y-%m-%d")
        if isinstance(raw_date, date):
            return raw_date.isoformat()
        
        date_str = str(raw_date).strip()
        for fmt in ["%Y-%m-%d", "%d/%m/%Y", "%d-%m-%Y", "%d-%b-%Y", "%Y/%m/%d"]:
            try:
                dt = datetime.strptime(date_str, fmt)
                return dt.strftime("%Y-%m-%d")
            except ValueError:
                pass
        return default_date
