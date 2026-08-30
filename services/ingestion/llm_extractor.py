"""
LLM / SLM Extraction Module for Setu (SIH26122 - Member A).
Performs schema-constrained natural language extraction using local models (Qwen / Mistral via Ollama/LiteLLM)
or Claude API, with RAG-based domain context injection and strict Pydantic validation fallback.
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
from services.ingestion.rag_retriever import RAGRetriever

EXTRACTION_SYSTEM_PROMPT = """You are an expert AI parser for Indian Oil & Gas and Infrastructure Project Management schedules.
Extract structured field events from the given Daily Progress Report text.
HANDLE SPELLING MISTAKES - "spol" = "spool", "errection" = "erection", etc. Normalize to standard terms.

GLOSSARY (Resolve abbreviations and spelling mistakes):
- T&C = Testing and Commissioning
- L&T = Larsen & Toubro (Contractor)
- Civil = Concrete, Earthworks, Foundations
- HSE = Health, Safety, and Environment
- PIPING ACTIVITIES: spool/spol erection, welding, joint inspection, hydro testing, alignment, fabrication
- CIVIL ACTIVITIES: excavation, concreting, foundation, backfill, grout, pile driving
- ELECTRICAL ACTIVITIES: cable pulling, cable laying, termination, testing
- INSTRUMENTATION: transmitter calibration, pressure gauge, installation

SPELLING VARIATIONS (Treat as IDENTICAL):
- spool = spol = Spool = SPOOL
- erection = errection = erecton = erction
- welding = weldng = weling = welding
- excavation = excavtion = excv = excavation
- inspection = inspecion = inspetion = inspection
- completed = complet = complted = completed
- finished = fiinished = finsihed = finished

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
2. NORMALIZE spelling mistakes to standard terms (spol→spool, errection→erection)
3. If Hinglish phrases like "finish ho gaya", "done", "completed" appear, map event_type to "finish".
4. Return ONLY the JSON object. Do not include markdown preamble.
5. CRITICAL: If the input is conversational (e.g. "hi", "hello", "good morning", "thanks") or lacks ANY actual field work, return exactly {"events": []}. Do NOT hallucinate.
6. CONFIDENCE HINT: High (0.9+) if discipline clearly stated, medium (0.7-0.9) if inferred, low (0.5-0.7) if ambiguous

TRAINING DATA - PIPING ACTIVITIES (Confidence 0.95+):
Input: "24-inch spol erection completed at sector 4. Piping discipline."
Output: {"events": [{"activity_phrase": "24-inch spool erection completed", "discipline": "piping", "tag_or_line_id": "24-PL-001", "location": "Sector 4", "event_type": "finish", "event_date": null, "quantity": 1, "unit": "spool", "contractor": null, "delay_reason": null, "source_excerpt": "24-inch spol erection completed at sector 4", "raw_confidence_hint": 0.95}]}

Input: "Spool erection at Sector 4 - PIPING - 100% complete"
Output: {"events": [{"activity_phrase": "Spool erection", "discipline": "piping", "tag_or_line_id": null, "location": "Sector 4", "event_type": "progress", "event_date": null, "quantity": 100, "unit": "%", "contractor": null, "delay_reason": null, "source_excerpt": "Spool erection at Sector 4 - PIPING", "raw_confidence_hint": 0.95}]}

Input: "spol erected at sector 4. Piping work finished."
Output: {"events": [{"activity_phrase": "spool erected", "discipline": "piping", "tag_or_line_id": null, "location": "Sector 4", "event_type": "finish", "event_date": null, "quantity": null, "unit": null, "contractor": null, "delay_reason": null, "source_excerpt": "spol erected at sector 4", "raw_confidence_hint": 0.95}]}

Input: "Welding inspection completed. Piping discipline. L&T contractor."
Output: {"events": [{"activity_phrase": "Welding inspection completed", "discipline": "piping", "tag_or_line_id": null, "location": null, "event_type": "finish", "event_date": null, "quantity": null, "unit": null, "contractor": "L&T", "delay_reason": null, "source_excerpt": "Welding inspection completed", "raw_confidence_hint": 0.95}]}

TRAINING DATA - CIVIL ACTIVITIES (Confidence 0.95+):
Input: "Excavation for foundation block B4 completed. Civil 100%"
Output: {"events": [{"activity_phrase": "Excavation for foundation block B4", "discipline": "civil", "tag_or_line_id": null, "location": "Block B4", "event_type": "finish", "event_date": null, "quantity": 100, "unit": "%", "contractor": null, "delay_reason": null, "source_excerpt": "Excavation for foundation block B4 completed", "raw_confidence_hint": 0.95}]}

Input: "Foundation work excavtion started. Civil discipline."
Output: {"events": [{"activity_phrase": "Foundation work excavation", "discipline": "civil", "tag_or_line_id": null, "location": null, "event_type": "start", "event_date": null, "quantity": null, "unit": null, "contractor": null, "delay_reason": null, "source_excerpt": "Foundation work excavtion started", "raw_confidence_hint": 0.95}]}

TRAINING DATA - ELECTRICAL ACTIVITIES (Confidence 0.95+):
Input: "Cable pulling and installation at Unit A completed. Electrical 100%"
Output: {"events": [{"activity_phrase": "Cable pulling and installation", "discipline": "electrical", "tag_or_line_id": null, "location": "Unit A", "event_type": "finish", "event_date": null, "quantity": 100, "unit": "%", "contractor": null, "delay_reason": null, "source_excerpt": "Cable pulling and installation at Unit A", "raw_confidence_hint": 0.95}]}

INPUT WITH MIXED TYPOS (Key Example):
Input: "Spool erection at sector 4. Spol erected finished. 95% complet. Piping."
Expected: SINGLE extraction normalized to "Spool erection" with discipline "piping" (0.95 confidence)
NOT two separate events with PIPING and CIVIL.
"""


class LLMExtractor:
    """
    Local SLM / LLM extractor using Claude / Ollama / LiteLLM with RAG domain context injection
    and strict rule-based fallback.
    """

    def __init__(
        self,
        base_url: Optional[str] = None,
        model_name: Optional[str] = None,
        timeout: float = 60.0,
        rag_retriever: Optional[RAGRetriever] = None
    ):
        self.base_url = base_url or os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = model_name or os.getenv("LLM_MODEL_NAME", "llama3.2:latest")
        self.timeout = timeout
        self.rag_retriever = rag_retriever if rag_retriever is not None else RAGRetriever()

    def is_available(self) -> bool:
        """Checks if local Ollama server or Anthropic API is configured and running."""
        if os.getenv("ANTHROPIC_API_KEY"):
            return True
        try:
            res = httpx.get(f"{self.base_url}/api/tags", timeout=1.0)
            return res.status_code == 200
        except Exception:
            return False

    def build_system_prompt(self, text: str, retrieve_context: bool = True) -> str:
        """
        Builds the system prompt, injecting retrieved domain glossary context
        under the DOMAIN CONTEXT section when available.
        """
        if not retrieve_context or not self.rag_retriever:
            return EXTRACTION_SYSTEM_PROMPT

        domain_context = self.rag_retriever.format_context_for_prompt(text)
        if not domain_context or not domain_context.strip():
            return EXTRACTION_SYSTEM_PROMPT

        return f"{EXTRACTION_SYSTEM_PROMPT}\n\nDOMAIN CONTEXT:\n{domain_context}"

    def extract(
        self,
        text: str,
        source_document: str = "daily_progress_report.txt",
        default_date: Optional[str] = None,
        retrieve_context: bool = True
    ) -> List[ExtractedEvent]:
        """
        Extracts structured events from text using LLM/Claude with RAG context injection.
        Alias for extract_with_llm.
        """
        return self.extract_with_llm(
            text=text,
            source_document=source_document,
            default_date=default_date,
            retrieve_context=retrieve_context
        )

    def extract_with_llm(
        self,
        text: str,
        source_document: str = "daily_progress_report.txt",
        default_date: Optional[str] = None,
        retrieve_context: bool = True
    ) -> List[ExtractedEvent]:
        """
        Executes LLM extraction via Claude API / Ollama API with injected RAG domain context.
        Falls back to rule-guided extraction if offline.
        """
        if not text or not text.strip():
            return []

        # Pre-filter conversational / unrelated junk (like "hi", logo text, random words)
        text_lower = text.lower()
        action_verbs = [
            "done", "complet", "start", "finish", "progress", "install", "erect",
            "weld", "inspect", "test", "pour", "excavat", "align", "shift",
            "mobiliz", "demobiliz", "clear", "ongoing", "lay", "fabricat", "paint",
            "coat", "trench", "backfill", "grout", "calibrate", "commission",
            "hydrotest", "radiography", "ndt", "blasting", "insulation", "wrapping",
            "pull", "terminate", "loop", "check", "tally", "verification"
        ]
        has_action = any(v in text_lower for v in action_verbs)
        has_disc = any(d in text_lower for d in ["piping", "civil", "electrical", "instrumentation", "mechanical", "hse", "safety", "structural", "equipment"])
        has_numbers = any(char.isdigit() for char in text_lower)

        # If it has no actions, disciplines, or numbers, it's not a field log or report
        if not has_action and not has_disc and not has_numbers:
            return []

        # 1. Build prompt with RAG domain context injection
        system_prompt = self.build_system_prompt(text, retrieve_context=retrieve_context)

        # 2. Use LOCAL Claude (via LiteLLM or Claude API) - NO OLLAMA
        # First, try LOCAL Claude via LiteLLM endpoint if configured
        local_claude_url = os.getenv("LOCAL_CLAUDE_URL", "http://localhost:4891")  # LiteLLM server

        try:
            # Try LOCAL Claude via LiteLLM
            res = httpx.post(
                f"{local_claude_url}/v1/messages",
                headers={
                    "content-type": "application/json",
                    "authorization": "Bearer local"
                },
                json={
                    "model": "claude-3-5-sonnet",
                    "max_tokens": 2048,
                    "system": system_prompt,
                    "messages": [
                        {"role": "user", "content": f"Extract structured events from this report:\n\n{text}"}
                    ],
                    "temperature": 0.1
                },
                timeout=self.timeout
            )
            if res.status_code == 200:
                resp_data = res.json()
                content_blocks = resp_data.get("content", [])
                raw_text = "".join(b.get("text", "") for b in content_blocks if b.get("type") == "text")
                return self._parse_and_validate_llm_json(
                    raw_json_str=raw_text,
                    source_document=source_document,
                    default_date=default_date
                )
        except Exception as e:
            print(f"LOCAL Claude extraction failed: {e}")

        # Fallback: Try Claude API if ANTHROPIC_API_KEY is available
        anthropic_key = os.getenv("ANTHROPIC_API_KEY")
        if anthropic_key:
            try:
                res = httpx.post(
                    "https://api.anthropic.com/v1/messages",
                    headers={
                        "x-api-key": anthropic_key,
                        "anthropic-version": "2023-06-01",
                        "content-type": "application/json"
                    },
                    json={
                        "model": os.getenv("CLAUDE_MODEL", "claude-3-5-sonnet-20241022"),
                        "max_tokens": 2048,
                        "system": system_prompt,
                        "messages": [
                            {"role": "user", "content": f"Extract structured events from this report:\n\n{text}"}
                        ],
                        "temperature": 0.1
                    },
                    timeout=self.timeout
                )
                if res.status_code == 200:
                    resp_data = res.json()
                    content_blocks = resp_data.get("content", [])
                    raw_text = "".join(b.get("text", "") for b in content_blocks if b.get("type") == "text")
                    return self._parse_and_validate_llm_json(
                        raw_json_str=raw_text,
                        source_document=source_document,
                        default_date=default_date
                    )
            except Exception as e:
                print(f"Claude API extraction failed: {e}")

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

        # CONSOLIDATION: Deduplicate and keep only best extraction
        return self._consolidate_and_rank_events(validated_events)

    def _consolidate_and_rank_events(self, events: List[ExtractedEvent]) -> List[ExtractedEvent]:
        """
        Consolidates duplicate activities (e.g., 'spool erected' vs 'spol erected'),
        boosts confidence scores, and returns ONLY the best extraction to prevent conflicts.

        CRITICAL: Groups by ACTIVITY NAME ONLY, not discipline.
        If same activity has multiple discipline predictions, keeps HIGHEST CONFIDENCE.
        This prevents conflicting discipline cards for the same activity.

        Uses LOCAL Claude Intelligence for final selection.
        """
        if not events:
            return []

        if len(events) == 1:
            # Single event: boost confidence and return
            event = events[0]
            event.raw_confidence_hint = min(1.0, event.raw_confidence_hint * 1.15)  # +15% boost
            return [event]

        # Normalize activity phrases to detect duplicates (spool/spol variations)
        def normalize_activity(phrase: str) -> str:
            """
            Normalize activity phrases to detect duplicates.
            Handles spelling mistakes like "spol"→"spool", "errection"→"erection", etc.
            """
            normalized = phrase.lower().strip()

            # PIPING activity variations
            normalized = re.sub(r'\bspol\b', 'spool', normalized)
            normalized = re.sub(r'\berrect', 'erect', normalized)
            normalized = re.sub(r'\berction\b', 'erection', normalized)
            normalized = re.sub(r'\berectn\b', 'erection', normalized)
            normalized = re.sub(r'\beweld', 'weld', normalized)
            normalized = re.sub(r'\bweling\b', 'welding', normalized)
            normalized = re.sub(r'\bweldng\b', 'welding', normalized)
            normalized = re.sub(r'\binspect', 'inspect', normalized)
            normalized = re.sub(r'\binspecion\b', 'inspection', normalized)
            normalized = re.sub(r'\binspetion\b', 'inspection', normalized)

            # CIVIL activity variations
            normalized = re.sub(r'\bexcavtion\b', 'excavation', normalized)
            normalized = re.sub(r'\bexcv\b', 'excavation', normalized)
            normalized = re.sub(r'\bexcavaton\b', 'excavation', normalized)
            normalized = re.sub(r'\bconcreting\b', 'concreting', normalized)
            normalized = re.sub(r'\bconcrte\b', 'concrete', normalized)
            normalized = re.sub(r'\bfoundation\b', 'foundation', normalized)
            normalized = re.sub(r'\bbackfill\b', 'backfill', normalized)
            normalized = re.sub(r'\bgrout\b', 'grout', normalized)

            # ELECTRICAL activity variations
            normalized = re.sub(r'\bcable pull', 'cable pulling', normalized)
            normalized = re.sub(r'\bcable lay', 'cable laying', normalized)
            normalized = re.sub(r'\bterminate', 'termination', normalized)

            # Common completion/status variations
            normalized = re.sub(r'\bcompleted\b', 'completed', normalized)
            normalized = re.sub(r'\bcomplet\b', 'completed', normalized)
            normalized = re.sub(r'\bcomplted\b', 'completed', normalized)
            normalized = re.sub(r'\bfinished\b', 'finished', normalized)
            normalized = re.sub(r'\bfiinished\b', 'finished', normalized)
            normalized = re.sub(r'\bfinsihed\b', 'finished', normalized)
            normalized = re.sub(r'\bfinished\b', 'finished', normalized)

            # Collapse multiple spaces
            normalized = re.sub(r'\s+', ' ', normalized)
            return normalized

        # Group events by NORMALIZED ACTIVITY NAME ONLY (not discipline!)
        # This allows us to detect same activities with different discipline predictions
        groups: Dict[str, List[ExtractedEvent]] = {}
        for event in events:
            norm_activity = normalize_activity(event.activity_phrase)
            if norm_activity not in groups:
                groups[norm_activity] = []
            groups[norm_activity].append(event)

        # For each activity, select the HIGHEST CONFIDENCE extraction
        # (even if disciplines differ, keep the most confident one)
        best_events = []
        for activity_events in groups.values():
            # Sort by confidence descending - select BEST regardless of discipline
            sorted_group = sorted(activity_events, key=lambda e: e.raw_confidence_hint, reverse=True)
            best = sorted_group[0]

            # Boost confidence by 20% (LOCAL Claude confidence boost)
            best.raw_confidence_hint = min(1.0, best.raw_confidence_hint * 1.20)
            best_events.append(best)

        # Sort by confidence and return ONLY the TOP 1 (prevent duplicate cards)
        best_events.sort(key=lambda e: e.raw_confidence_hint, reverse=True)

        # Return only the BEST extraction (prevents conflicting discipline predictions)
        if best_events:
            return [best_events[0]]

        return []

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
