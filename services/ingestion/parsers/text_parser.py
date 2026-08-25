"""
Free-text parser for Daily Progress Reports (DPRs) and typed field logs.
Extracts structured ExtractedEvent objects adhering to SIH26122 schema.
"""

import re
from datetime import datetime, date
from typing import List, Optional, Tuple, Dict, Any

from shared.schemas.extracted_event import (
    ExtractedEvent,
    DisciplineEnum,
    EventTypeEnum,
    InputFormatEnum,
)
from services.ingestion.config import (
    DISCIPLINE_KEYWORDS,
    KNOWN_CONTRACTORS,
    STANDARD_UNITS,
)


class TextParser:
    """
    Deterministic rule-based and NLP extractor for free-text Daily Progress Reports.
    Preserves exact source_excerpt for full auditability.
    """

    # Comprehensive Engineering Tag & Line ID patterns
    TAG_PATTERNS = [
        # Line numbers: Line 24-PL-001, Line 12-CS-104, 24-PL-001, 08-SS-202
        r"\b(?:Line\s*)?([0-9]{2,3}-[A-Z]{2,4}-[0-9]{3,4}[A-Z]?)\b",
        # Equipment tags: Tank TK-101, TK-101, Pump P-201A, P-201A, Compressor C-301, C-301, E-102, V-101
        r"\b(?:Tank|Equipment|Pump|Compressor|Exchanger|Vessel|Column|Reactor)?\s*([A-Z]{1,3}-[0-9]{3,4}[A-Z]?)\b",
        # Structures and Units: Pipe Rack PR-05, PR-05, Cable Trench CT-04, Substation SS-01, TY-02, VP-02
        r"\b(?:Pipe\s*Rack|Cable\s*Trench|Substation|Transformer\s*Yard|Valve\s*Pit)?\s*([A-Z]{2,3}-[0-9]{2,3}[A-Z]?)\b",
        # General tag: TAG-1234
        r"\b([A-Z]{2,4}-[0-9]{2,4})\b"
    ]

    # Date regex patterns
    DATE_PATTERNS = [
        (r"\b(\d{4}-\d{2}-\d{2})\b", "%Y-%m-%d"),
        (r"\b(\d{2}/\d{2}/\d{4})\b", "%d/%m/%Y"),
        (r"\b(\d{2}-\d{2}-\d{4})\b", "%d-%m-%Y"),
        (r"\b(\d{2}-[A-Za-z]{3}-\d{4})\b", "%d-%b-%Y"),
        (r"\b(\d{1,2}\s+[A-Za-z]{3}\s+\d{4})\b", "%d %b %Y"),
    ]

    # Status / Milestone indicators
    FINISH_KEYWORDS = [
        "finish ho gaya", "complete ho gaya", "complete kar diya", "completed",
        "finished", "cleared", "done", "hydrotested", "closed", "approved"
    ]
    START_KEYWORDS = [
        "start ho gaya", "start kiya", "commenced", "started", "initiated",
        "began", "started today", "pouring started", "excavation started"
    ]
    PROGRESS_KEYWORDS = [
        "ongoing", "in progress", "suspended", "delayed", "holding",
        "work stoppage", "underway", "awaiting", "progressing", "curing"
    ]

    # Quantity + Unit pattern
    QTY_UNIT_PATTERN = re.compile(
        r"\b(\d+(?:\.\d+)?)\s*(spools?|joints?|meters?|mtrs?|cum|m3|cubic\s*meters?|MT|metric\s*tons?|tons?|nos?|nos\.|units?|inch-dia|inch-meter|sqm|kg|liters?|bays?)\b",
        re.IGNORECASE
    )

    # Delay markers - prioritized order
    DELAY_PATTERNS = [
        r"(?:delayed\s+due\s+to|delayed\s+because|work\s+suspended\s+due\s+to|stopped\s+due\s+to|held\s+up\s+by|bottleneck:?|issue:?|delay:?)\s*([^.;]+)",
        r"(?:due\s+to\s+)([^.;]+)",
        r"(?:heavy\s+rainfall[a-zA-Z\s0-9]*stoppage[^.;]*)",
        r"(?:waterlogging\s+in\s+[^.;]+)",
        r"(?:crane\s+permit\s+delay[^.;]*)",
        r"(?:delayed\s+because\s+[^.;]+)",
    ]

    # Location markers
    LOCATION_PATTERNS = [
        r"\bat\s+([A-Za-z0-9\s\-]+(?:pipe\s*rack|area|bay|manifold|yard|unit|zone|pad|house|substation|corridor|pit))",
        r"\b(?:connecting\s+to|located\s+at)\s+([A-Za-z0-9\s\-]+(?:Exchanger\s+[A-Z0-9\-]+|Pump\s+[A-Z0-9\-]+|Unit|Bay|Pit))"
    ]

    def parse(
        self,
        text: str,
        source_document: str = "daily_progress_report.txt",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Parses multi-line report text into a list of ExtractedEvent objects.
        """
        if not text or not text.strip():
            return []

        # 1. Extract global header metadata (e.g. Date: 2026-08-20, Location: CDU-II)
        global_date = self._extract_header_date(text) or default_date or date.today().isoformat()
        global_discipline = self._extract_header_discipline(text)
        global_location = self._extract_header_location(text)

        # 2. Extract itemized and sentence lines
        lines = self._split_into_logical_lines(text)
        extracted_events: List[ExtractedEvent] = []

        for line in lines:
            line_clean = line.strip()
            if not line_clean or len(line_clean) < 8:
                continue
            # Skip pure decorative headers or summary labels
            if line_clean.startswith("==") or line_clean.startswith("--") or line_clean.lower().startswith("shift:"):
                continue

            event = self.parse_single_line(
                line_text=line_clean,
                source_document=source_document,
                fallback_date=global_date,
                fallback_discipline=global_discipline,
                fallback_location=global_location
            )
            if event:
                extracted_events.append(event)

        return extracted_events

    def parse_single_line(
        self,
        line_text: str,
        source_document: str,
        fallback_date: str,
        fallback_discipline: Optional[DisciplineEnum] = None,
        fallback_location: Optional[str] = None
    ) -> Optional[ExtractedEvent]:
        """
        Extracts a single ExtractedEvent from one report line or sentence.
        """
        source_excerpt = line_text.strip()
        # Remove item bullet prefix if present: "1. ", "a) ", "- "
        cleaned_phrase = re.sub(r"^(?:\d+[\.\)]|[a-zA-Z][\.\)]|\-|\*)\s*", "", source_excerpt).strip()

        # 1. Tag or Line ID Extraction

        # Conversational / Small Talk / Unrelated Filter
        # If the phrase doesn't have a known tag, and doesn't contain basic construction verbs, drop it.
        action_verbs = [
            "done", "complet", "start", "finish", "progress", "install", "erect", 
            "weld", "inspect", "test", "pour", "excavat", "align", "shift", 
            "mobiliz", "demobiliz", "clear", "ongoing", "lay", "fabricat", "paint", 
            "coat", "trench", "backfill", "grout", "calibrate", "commission", 
            "hydrotest", "radiography", "ndt", "blasting", "insulation", "wrapping", 
            "pull", "terminate", "loop", "check", "tally", "verification"
        ]
        tag_or_line_id = self._extract_tag_or_line_id(cleaned_phrase)
        
        has_action = any(v in cleaned_phrase.lower() for v in action_verbs)
        # We also check for disciplines just in case
        has_disc = any(d in cleaned_phrase.lower() for d in ["piping", "civil", "electrical", "instrumentation", "mechanical", "hse", "safety", "structural", "equipment"])
        
        if not tag_or_line_id and not has_action and not has_disc:
            return None


        # 2. Discipline Classification
        discipline = self._classify_discipline(cleaned_phrase, tag_or_line_id, fallback_discipline)

        # 3. Event Type (Status milestone)
        event_type = self._determine_event_type(cleaned_phrase)

        # 4. Event Date
        event_date = self._extract_line_date(cleaned_phrase) or fallback_date

        # 5. Quantity & Unit
        quantity, unit = self._extract_quantity_and_unit(cleaned_phrase)

        # 6. Contractor
        contractor = self._extract_contractor(cleaned_phrase)

        # 7. Delay Reason
        delay_reason = self._extract_delay_reason(cleaned_phrase)

        # 8. Location
        location = self._extract_location(cleaned_phrase) or fallback_location

        # 9. Activity Phrase normalization
        activity_phrase = self._extract_activity_phrase(cleaned_phrase, tag_or_line_id)

        # 10. Confidence Hint Calculation
        confidence_hint = self._calculate_confidence_hint(
            has_tag=bool(tag_or_line_id),
            has_qty=bool(quantity is not None),
            has_contractor=bool(contractor),
            event_type=event_type,
            has_delay=bool(delay_reason)
        )

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
            input_format=InputFormatEnum.FREE_TEXT,
            raw_confidence_hint=confidence_hint
        )

    def _split_into_logical_lines(self, text: str) -> List[str]:
        """Splits multi-paragraph or numbered reports into actionable lines."""
        raw_lines = text.split("\n")
        processed_lines = []
        for line in raw_lines:
            line_str = line.strip()
            # If line has multiple numbered items on one line, split them
            if re.search(r"\d+\.\s+[A-Z]", line_str):
                parts = re.split(r"(?=\b\d+\.\s+)", line_str)
                for p in parts:
                    if p.strip():
                        processed_lines.append(p.strip())
            else:
                if line_str:
                    processed_lines.append(line_str)
        return processed_lines

    def _extract_tag_or_line_id(self, text: str) -> Optional[str]:
        """Extracts primary engineering tag or line number."""
        for pattern in self.TAG_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                val = match.group(1).strip()
                # Ensure it's not a common word mistakenly captured
                if val.upper() not in {"THE", "AND", "DAY", "UNIT", "AREA", "DPR", "HSE", "OIL"}:
                    # Prefix with 'Line ' if it matches line pattern without prefix for consistency
                    if re.match(r"^\d{2}-[A-Z]{2,4}-\d{3,4}", val, re.IGNORECASE):
                        if not val.lower().startswith("line"):
                            return f"Line {val}"
                    return val
        return None

    def _classify_discipline(
        self,
        text: str,
        tag_or_line_id: Optional[str] = None,
        fallback: Optional[DisciplineEnum] = None
    ) -> DisciplineEnum:
        """Classifies the discipline based on technical keyword density and tag identifiers."""
        text_lower = text.lower()
        scores: Dict[str, int] = {k: 0 for k in DISCIPLINE_KEYWORDS}

        # Tag-based strong signals
        if tag_or_line_id:
            tag_upper = tag_or_line_id.upper()
            if any(p in tag_upper for p in ["-PL-", "-CS-", "-SS-", "-AS-", "-P-", "-GL-"]):
                scores["piping"] += 5
            elif tag_upper.startswith("CT-"):
                scores["civil"] += 4
            elif tag_upper.startswith("PR-"):
                scores["civil"] += 3
            elif tag_upper.startswith("SS-") or tag_upper.startswith("TY-"):
                scores["civil"] += 2
                scores["electrical"] += 2
            elif tag_upper.startswith("TK-"):
                if any(w in text_lower for w in ["excavat", "foundat", "civil", "earth", "soil", "rebar"]):
                    scores["civil"] += 5
                else:
                    scores["static_rotating"] += 3

        for disc, kw_set in DISCIPLINE_KEYWORDS.items():
            for kw in kw_set:
                if kw in text_lower:
                    scores[disc] += 1

        best_disc = max(scores, key=scores.get)
        if scores[best_disc] > 0:
            return DisciplineEnum(best_disc)
        if fallback:
            return fallback
        return DisciplineEnum.PIPING # Default domain for Oil India problem statement

    def _determine_event_type(self, text: str) -> EventTypeEnum:
        """Determines milestone stage (start, finish, progress, unspecified)."""
        text_lower = text.lower()
        
        # Check start markers first if they are prominent action verbs
        start_indices = [text_lower.find(kw) for kw in self.START_KEYWORDS if kw in text_lower]
        finish_indices = [text_lower.find(kw) for kw in self.FINISH_KEYWORDS if kw in text_lower]
        progress_indices = [text_lower.find(kw) for kw in self.PROGRESS_KEYWORDS if kw in text_lower]

        first_start = min(start_indices) if start_indices else None
        first_finish = min(finish_indices) if finish_indices else None
        first_prog = min(progress_indices) if progress_indices else None

        # If both start and finish appear, the earlier one in the main clause usually dominates
        candidates = []
        if first_start is not None:
            candidates.append((first_start, EventTypeEnum.START))
        if first_finish is not None:
            candidates.append((first_finish, EventTypeEnum.FINISH))
        if first_prog is not None:
            candidates.append((first_prog, EventTypeEnum.PROGRESS))

        if candidates:
            candidates.sort(key=lambda x: x[0])
            return candidates[0][1]

        return EventTypeEnum.UNSPECIFIED

    def _extract_header_date(self, text: str) -> Optional[str]:
        """Extracts date from report header."""
        for line in text.split("\n")[:10]:
            match = re.search(r"Date:\s*([0-9A-Za-z\/\-]+)", line, re.IGNORECASE)
            if match:
                date_str = match.group(1).strip()
                parsed = self._normalize_date(date_str)
                if parsed:
                    return parsed
        return None

    def _extract_line_date(self, text: str) -> Optional[str]:
        """Extracts date if mentioned explicitly within a single report line."""
        for pattern, dt_fmt in self.DATE_PATTERNS:
            match = re.search(pattern, text)
            if match:
                parsed = self._normalize_date(match.group(1).strip())
                if parsed:
                    return parsed
        return None

    def _normalize_date(self, date_str: str) -> Optional[str]:
        """Converts varied date strings to ISO YYYY-MM-DD format."""
        date_str = date_str.strip()
        for pattern, fmt in self.DATE_PATTERNS:
            if re.match(pattern, date_str):
                try:
                    dt = datetime.strptime(date_str, fmt)
                    return dt.strftime("%Y-%m-%d")
                except ValueError:
                    pass
        try:
            # Fallback ISO check
            dt = datetime.fromisoformat(date_str)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            return None

    def _extract_header_discipline(self, text: str) -> Optional[DisciplineEnum]:
        """Extracts discipline from report header."""
        for line in text.split("\n")[:8]:
            line_lower = line.lower()
            if "piping" in line_lower:
                return DisciplineEnum.PIPING
            if "civil" in line_lower or "structural" in line_lower:
                return DisciplineEnum.CIVIL
            if "electrical" in line_lower:
                return DisciplineEnum.ELECTRICAL
            if "instrumentation" in line_lower:
                return DisciplineEnum.INSTRUMENTATION
            if "mechanical" in line_lower or "equipment" in line_lower:
                return DisciplineEnum.STATIC_ROTATING
            if "hse" in line_lower or "safety" in line_lower:
                return DisciplineEnum.HSE
        return None

    def _extract_header_location(self, text: str) -> Optional[str]:
        """Extracts location from report header."""
        for line in text.split("\n")[:8]:
            match = re.search(r"Location:\s*([^|\n]+)", line, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_quantity_and_unit(self, text: str) -> Tuple[Optional[float], Optional[str]]:
        """Extracts numeric progress quantity and standard unit of measurement."""
        match = self.QTY_UNIT_PATTERN.search(text)
        if match:
            try:
                qty = float(match.group(1))
                unit = match.group(2).lower()
                # Normalize unit names
                if unit in {"mtrs", "mtr", "meter"}:
                    unit = "meters"
                elif unit in {"m3", "cubic meters", "cubic meter"}:
                    unit = "cum"
                elif unit in {"nos.", "units"}:
                    unit = "nos"
                elif unit in {"spool"}:
                    unit = "spools"
                elif unit in {"joint"}:
                    unit = "joints"
                return qty, unit
            except ValueError:
                pass
        return None, None

    def _extract_contractor(self, text: str) -> Optional[str]:
        """Identifies executing contractor."""
        for contractor in KNOWN_CONTRACTORS:
            pattern = r"\b" + re.escape(contractor) + r"\b"
            if re.search(pattern, text, re.IGNORECASE):
                # Standardize acronyms to full canonical name
                if contractor.upper() == "L&T":
                    return "L&T Heavy Engineering"
                return contractor
        return None

    def _extract_delay_reason(self, text: str) -> Optional[str]:
        """Extracts bottleneck or delay explanation if present."""
        for pattern in self.DELAY_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                # If pattern has capturing group, use it, else whole match
                if match.groups() and match.group(1):
                    res = match.group(1).strip()
                else:
                    res = match.group(0).strip()
                # Clean up leading 'due to' / 'delayed due to'
                res = re.sub(r"^(?:delayed\s+due\s+to|delayed\s+because|work\s+suspended\s+due\s+to|stopped\s+due\s+to|due\s+to)\s*", "", res, flags=re.IGNORECASE).strip()
                if len(res) > 3:
                    return res
        return None

    def _extract_location(self, text: str) -> Optional[str]:
        """Extracts specific site location / bay / unit."""
        for pattern in self.LOCATION_PATTERNS:
            match = re.search(pattern, text, re.IGNORECASE)
            if match:
                return match.group(1).strip()
        return None

    def _extract_activity_phrase(self, text: str, tag: Optional[str]) -> str:
        """Extracts a clean, descriptive activity phrase."""
        # Remove preamble phrases like 'On Line 24-PL-001, ' or '1. '
        cleaned = re.sub(r"^On\s+(?:Line\s*)?[A-Z0-9\-]+,?\s*", "", text, flags=re.IGNORECASE).strip()
        # Truncate at secondary clauses like '; delayed due to' or '; test pressure'
        cleaned = re.split(r"[;]", cleaned)[0].strip()
        if not cleaned:
            return text
        return cleaned

    def _calculate_confidence_hint(
        self,
        has_tag: bool,
        has_qty: bool,
        has_contractor: bool,
        event_type: EventTypeEnum,
        has_delay: bool
    ) -> float:
        """Calculates parser extraction confidence score."""
        score = 0.50
        if has_tag:
            score += 0.20
        if has_qty:
            score += 0.10
        if has_contractor:
            score += 0.08
        if event_type != EventTypeEnum.UNSPECIFIED:
            score += 0.07
        if has_delay:
            score += 0.05
        return min(round(score, 2), 0.98)
