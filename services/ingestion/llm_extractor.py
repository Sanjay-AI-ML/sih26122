"""
LLM / SLM Extraction Module for Setu (SIH26122 - Member A).
Performs schema-constrained natural language extraction using local models (Qwen / Mistral via Ollama/LiteLLM)
with strict Pydantic validation fallback.
"""

import json
import os
import re
from datetime import date
from typing import List, Optional, Dict, Any
import httpx
from pydantic import ValidationError

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

EXTRACTION_SYSTEM_PROMPT = """You are an expert AI parser for Indian Oil & Gas and Infrastructure Project Management schedules.
Extract structured field events from the given Daily Progress Report text.

Return ONLY a valid JSON object matching this schema:
{
  "events": [
    {
      "activity_phrase": "exact description of what work was done",
      "discipline": "piping | civil | static_rotating | electrical | instrumentation | hse",
      "tag_or_line_id": "equipment tag or pipe line number (e.g. 24-PL-001, TK-101, P-201A) or null",
      "location": "area, unit, or plot name or null",
      "event_type": "start | finish | progress | delay_stoppage | unspecified",
      "event_date": "YYYY-MM-DD or null",
      "quantity": float number or null,
      "unit": "standard unit (spools, joints, meters, cum, MT, etc.) or null",
      "contractor": "contractor/vendor name or null",
      "delay_reason": "explicit delay/bottleneck cause or null",
      "source_excerpt": "the exact sentence or text span",
      "raw_confidence_hint": float between 0.0 and 1.0
    }
  ]
}

Rules:
1. NEVER invent tags, quantities, or dates not present in the text.
2. If Hinglish phrases like "finish ho gaya", "done", "completed" appear, map event_type to "finish".
3. Return ONLY the JSON object. Do not include markdown preamble.
4. CRITICAL: If the input is conversational (e.g. "hi", "hello", "good morning", "thanks") or lacks ANY actual field work, return exactly {"events": []}. Do NOT hallucinate an activity phrase.

Examples:
Input: "EV-8491C Material tally count verification Civil 95% Auto-Approved Oct 24, 08:30 AM Unlinked"
Output: {"events": [{"activity_phrase": "Material tally count verification", "discipline": "civil", "tag_or_line_id": "EV-8491C", "location": null, "event_type": "progress", "event_date": "2026-10-24", "quantity": 95, "unit": "%", "contractor": null, "delay_reason": null, "source_excerpt": "Material tally count verification Civil 95%", "raw_confidence_hint": 0.95}]}

Input: "material Tally account verification"
Output: {"events": [{"activity_phrase": "material Tally account verification", "discipline": "civil", "tag_or_line_id": null, "location": null, "event_type": "unspecified", "event_date": null, "quantity": null, "unit": null, "contractor": null, "delay_reason": null, "source_excerpt": "material Tally account verification", "raw_confidence_hint": 0.85}]}

Input: "link joint inspection at Sector C"
Output: {"events": [{"activity_phrase": "link joint inspection", "discipline": "piping", "tag_or_line_id": null, "location": "Sector C", "event_type": "unspecified", "event_date": null, "quantity": null, "unit": null, "contractor": null, "delay_reason": null, "source_excerpt": "link joint inspection at Sector C", "raw_confidence_hint": 0.9}]}

"""


class LLMExtractor:
    """
    Local SLM / LLM extractor using Ollama / LiteLLM with strict fallback.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: float = 60.0
    ):
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = model_name or os.getenv("LLM_MODEL_NAME", "llama3.2:latest")
        self.timeout = timeout

    def is_available(self) -> bool:
        """Checks if local Ollama server is running."""
        try:
            res = httpx.get(f"{self.base_url}/api/tags", timeout=1.0)
            return res.status_code == 200
        except Exception:
            return False

    def extract_with_llm(
        self,
        text: str,
        source_document: str = "daily_progress_report.txt",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Executes LLM extraction via Ollama API. Falls back to rule-guided extraction if offline.
        """
        if not text or not text.strip():
            return []
            
        # Pre-filter conversational junk (like "hi", "hello")
        text_lower = text.lower()
        action_verbs = ["done", "complet", "start", "finish", "progress", "install", "erect", "weld", "inspect", "test", "pour", "excavat", "align", "shift", "mobiliz", "demobiliz", "clear", "ongoing", "lay", "fabricat", "paint", "coat"]
        has_action = any(v in text_lower for v in action_verbs)
        has_disc = any(d in text_lower for d in ["piping", "civil", "electrical", "instrumentation", "mechanical", "hse", "safety"])
        has_numbers = any(char.isdigit() for char in text_lower)
        
        # If it's very short and has no actions, disciplines, or numbers, it's just chat
        if len(text_lower.strip()) < 10 and not has_action and not has_disc and not has_numbers:
            return []


        payload = {
            "model": self.model_name,
            "prompt": f"Extract structured events from this report:\n\n{text}",
            "system": EXTRACTION_SYSTEM_PROMPT,
            "stream": False,
            "format": "json",
            "options": {
                "temperature": 0.1,
                "top_p": 0.9,
            }
        }

        try:
            res = httpx.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=self.timeout
            )
            if res.status_code == 200:
                response_data = res.json()
                raw_response = response_data.get("response", "{}")
                return self._parse_and_validate_llm_json(
                    raw_json_str=raw_response,
                    source_document=source_document,
                    default_date=default_date
                )
        except Exception:
            pass

        # Offline / Fallback parsing
        return self._offline_smart_extractor(text, source_document, default_date)

    def _parse_and_validate_llm_json(
        self,
        raw_json_str: str,
        source_document: str,
        default_date: Optional[str]
    ) -> List[ExtractedEvent]:
        """Cleans, parses, and validates LLM-generated JSON into ExtractedEvent models."""
        cleaned = re.sub(r"```json\s*", "", raw_json_str)
        cleaned = re.sub(r"```\s*", "", cleaned).strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            return []

        events_list = data.get("events", []) if isinstance(data, dict) else (data if isinstance(data, list) else [])
        validated_events: List[ExtractedEvent] = []


        def _clean_val(v):
            if v is None: return None
            if isinstance(v, str) and v.strip().lower() == "null": return None
            return v

        fallback_date = default_date or date.today().isoformat()

        for item in events_list:
            if not isinstance(item, dict):
                continue

            # Ensure discipline is valid enum
            disc_str = str(item.get("discipline", "piping")).lower()
            try:
                discipline = DisciplineEnum(disc_str)
            except ValueError:
                discipline = DisciplineEnum.PIPING

            # Ensure event_type is valid enum
            ev_type_str = str(item.get("event_type", "progress")).lower()
            try:
                event_type = EventTypeEnum(ev_type_str)
            except ValueError:
                event_type = EventTypeEnum.PROGRESS

            # Date fallback
            ev_date = _clean_val(item.get("event_date")) or fallback_date

            try:
                event = ExtractedEvent(
                    activity_phrase=_clean_val(item.get("activity_phrase")) or "Field Activity",
                    discipline=discipline,
                    tag_or_line_id=_clean_val(item.get("tag_or_line_id")),
                    location=_clean_val(item.get("location")),
                    event_type=event_type,
                    event_date=str(ev_date),
                    quantity=float(item["quantity"]) if _clean_val(item.get("quantity")) is not None else None,
                    unit=_clean_val(item.get("unit")),
                    contractor=_clean_val(item.get("contractor")),
                    delay_reason=_clean_val(item.get("delay_reason")),
                    source_document=source_document,
                    source_excerpt=_clean_val(item.get("source_excerpt")) or _clean_val(item.get("activity_phrase")) or "",
                    input_format=InputFormatEnum.FREE_TEXT,
                    raw_confidence_hint=float(item.get("raw_confidence_hint") or 0.85)
                )
                validated_events.append(event)
            except (ValidationError, ValueError, TypeError):
                continue

        return validated_events

    def _offline_smart_extractor(
        self,
        text: str,
        source_document: str,
        default_date: Optional[str]
    ) -> List[ExtractedEvent]:
        """Rule-based smart extraction fallback when local LLM is offline."""
        from services.ingestion.parsers.text_parser import TextParser
        parser = TextParser()
        return parser.parse(text, source_document=source_document, default_date=default_date)
