"""
LLM / SLM Extraction Module for Setu (SIH26122 - Member A).
Performs schema-constrained natural language extraction using Ollama Qwen3-4B
with RAG-based domain context injection and strict Pydantic validation fallback.
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
7. CRITICAL - ONE EVENT PER ACTIVITY: A report often describes several DIFFERENT activities, one per discipline or team (e.g. "Piping team completed X. Civil team finished Y. Electrical crew did Z."). Each such activity is a SEPARATE event object in the array, even when they appear back-to-back in the same paragraph or are separated only by a period. NEVER merge two different disciplines, teams, or activity_phrases into one event object. Count the distinct activities described before writing the JSON, and emit exactly that many event objects. A report naming N teams/disciplines with N distinct actions must produce N events, not fewer."""


class LLMExtractor:
    """
    Ollama Qwen3-4B extractor with RAG domain context injection
    and strict rule-based fallback for offline mode.
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
        """Checks if Ollama server is running and model is available."""
        try:
            res = httpx.get(f"{self.base_url}/api/tags", timeout=2.0)
            if res.status_code == 200:
                data = res.json()
                models = [m.get("name", "") for m in data.get("models", [])]
                return any(self.model_name in m for m in models)
            return False
        except Exception:
            return False

    def ask(self, question: str, context: str) -> Optional[str]:
        """
        Free-form question answering over supplied project context (analytics
        stats, audit history, etc). Unlike extract_with_llm, this does NOT try
        to parse structured field events — it returns a plain-text answer, or
        None if Ollama is unavailable or the call fails.
        """
        if not self.is_available():
            return None
        try:
            res = httpx.post(
                f"{self.base_url}/api/generate",
                json={
                    "model": self.model_name,
                    "prompt": (
                        "You are an assistant for an oil & gas infrastructure project "
                        "tracking system (piping, civil, electrical, instrumentation, "
                        "static/rotating equipment, HSE).\n\n"
                        "STRICT RULES:\n"
                        "1. Answer using ONLY facts explicitly present in PROJECT DATA below.\n"
                        "2. NEVER invent, guess, or extrapolate numbers, dates, names, contractors, "
                        "budgets, costs, deadlines, or causes that are not explicitly stated in "
                        "PROJECT DATA - not even as a 'typical' or 'likely' example.\n"
                        "3. If PROJECT DATA does not contain the answer, say exactly: "
                        "\"I don't have that information in the current project data.\" "
                        "Do not fill the gap with general industry knowledge.\n"
                        "4. Keep answers concise and cite the specific numbers/activity IDs from "
                        "PROJECT DATA that support your answer.\n\n"
                        f"PROJECT DATA:\n{context}\n\nQUESTION: {question}\n\nANSWER:"
                    ),
                    "stream": False,
                    "options": {"temperature": 0.0},
                },
                timeout=self.timeout,
            )
            if res.status_code == 200:
                return res.json().get("response", "").strip() or None
        except Exception as e:
            print(f"[LLM] ask() failed: {e}")
        return None

    def build_system_prompt(self, text: str, retrieve_context: bool = True) -> str:
        """
        Builds the system prompt, injecting retrieved domain glossary context.
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
        Extracts structured events from text using Ollama Qwen3-4B.
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
        Executes LLM extraction via Ollama Qwen3-4B with RAG context injection.
        Falls back to rule-guided extraction if offline.
        """
        if not text or not text.strip():
            return []

        # Pre-filter conversational / unrelated junk
        text_lower = text.lower()
        action_verbs = [
            "done", "complet", "start", "finish", "progress", "install", "erect",
            "weld", "inspect", "test", "pour", "excavat", "align", "shift",
            "mobiliz", "demobiliz", "clear", "ongoing", "lay", "fabricat", "paint",
            "coat", "trench", "backfill", "grout", "calibrate", "commission",
            "hydrotest", "radiography", "ndt", "blasting", "insulation", "wrapping",
            "pull", "terminate", "loop", "check", "tally", "verification", "delay", "pending"
        ]
        has_action = any(v in text_lower for v in action_verbs)
        has_disc = any(d in text_lower for d in ["piping", "civil", "electrical", "instrumentation", "mechanical", "hse", "safety", "structural", "equipment"])
        has_numbers = any(char.isdigit() for char in text_lower)

        if not has_action and not has_disc and not has_numbers:
            return []

        # Build prompt with RAG context
        system_prompt = self.build_system_prompt(text, retrieve_context=retrieve_context)

        # Small local models (llama3.2:3B, qwen3:4b) do NOT reliably split
        # multiple distinct activities out of one paragraph even when told to
        # ("ONE EVENT PER ACTIVITY" rule) - they merge 3-4 sentences into a
        # single event. So we split the report into per-sentence chunks
        # ourselves and call the LLM once per chunk - each call then only
        # ever sees ONE activity, which the model handles reliably.
        chunks = self._split_into_activity_chunks(text)

        try:
            if len(chunks) <= 1:
                all_events = self._extract_chunk(text, system_prompt, source_document, default_date)
            else:
                all_events: List[ExtractedEvent] = []
                for chunk in chunks:
                    all_events.extend(
                        self._extract_chunk(chunk, system_prompt, source_document, default_date)
                    )
            print(f"[LLM] Ollama extraction succeeded via {self.model_name} ({len(chunks)} chunk(s), {len(all_events)} raw event(s))")
            return self._consolidate_and_rank_events(all_events)
        except Exception as e:
            print(f"[LLM] Ollama extraction failed: {e}")

        # Fallback: offline extraction
        print(f"[LLM] Falling back to offline extraction")
        return self._offline_smart_extractor(text, source_document, default_date)

    # Each chunk costs one sequential Ollama call (~10-40s on modest local
    # hardware). A long PDF/report can have 50+ sentences - uncapped, that is
    # many minutes of blocking work per upload. Cap the call count and, if a
    # document has more sentences than that, batch several sentences per
    # remaining chunk instead of dropping any content.
    MAX_LLM_CHUNKS = 12

    def _split_into_activity_chunks(self, text: str) -> List[str]:
        """
        Splits report text into per-sentence chunks so each LLM call only
        ever has to parse ONE activity. Splits on newlines first, then on
        sentence boundaries within each line. Chunks under 8 chars (stray
        punctuation) are dropped. Bounded to MAX_LLM_CHUNKS - see above.
        """
        sentences: List[str] = []
        for line in text.split("\n"):
            line = line.strip()
            if not line:
                continue
            for s in re.split(r"(?<=[.!?])\s+(?=[A-Z])", line):
                s = s.strip()
                if len(s) >= 8:
                    sentences.append(s)

        if not sentences:
            return [text.strip()] if text.strip() else []

        if len(sentences) <= self.MAX_LLM_CHUNKS:
            return sentences

        # Too many sentences for one-call-per-sentence: batch them evenly
        # into MAX_LLM_CHUNKS groups (still far fewer activities per call
        # than the original whole-document prompt that caused the merging).
        import math
        batch_size = math.ceil(len(sentences) / self.MAX_LLM_CHUNKS)
        return [
            " ".join(sentences[i:i + batch_size])
            for i in range(0, len(sentences), batch_size)
        ]

    def _extract_chunk(
        self,
        chunk_text: str,
        system_prompt: str,
        source_document: str,
        default_date: Optional[str]
    ) -> List[ExtractedEvent]:
        """Runs one Ollama call over a single chunk and returns validated (unconsolidated) events."""
        res = httpx.post(
            f"{self.base_url}/api/generate",
            json={
                "model": self.model_name,
                "prompt": f"{system_prompt}\n\nExtract structured events from this report:\n\n{chunk_text}",
                "stream": False,
                # Ollama's /api/generate ignores a top-level "temperature" —
                # it must be nested under "options" or the request silently
                # runs at Ollama's default temperature instead.
                "options": {"temperature": 0.0},
            },
            timeout=self.timeout
        )
        if res.status_code != 200:
            return []
        raw_text = res.json().get("response", "")
        return self._parse_and_validate_llm_json(
            raw_json_str=raw_text,
            source_document=source_document,
            default_date=default_date,
            consolidate=False
        )

    def _parse_and_validate_llm_json(
        self,
        raw_json_str: str,
        source_document: str,
        default_date: Optional[str],
        consolidate: bool = True
    ) -> List[ExtractedEvent]:
        """Cleans, parses, and validates LLM-generated JSON into ExtractedEvent models."""
        cleaned = re.sub(r"```json\s*", "", raw_json_str)
        cleaned = re.sub(r"```\s*", "", cleaned).strip()

        try:
            data = json.loads(cleaned)
        except json.JSONDecodeError:
            print(f"[Parse] JSON decode failed: {cleaned[:100]}")
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

            disc_str = str(item.get("discipline", "piping")).lower()
            try:
                discipline = DisciplineEnum(disc_str)
            except ValueError:
                discipline = DisciplineEnum.PIPING

            ev_type_str = str(item.get("event_type", "progress")).lower()
            try:
                event_type = EventTypeEnum(ev_type_str)
            except ValueError:
                event_type = EventTypeEnum.PROGRESS

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
            except (ValidationError, ValueError, TypeError) as e:
                print(f"[Validation] Skipping event: {e}")
                continue

        return self._consolidate_and_rank_events(validated_events) if consolidate else validated_events

    def _consolidate_and_rank_events(self, events: List[ExtractedEvent]) -> List[ExtractedEvent]:
        """
        Consolidates duplicate activities and returns ranked events.
        """
        if not events:
            return []

        if len(events) == 1:
            event = events[0]
            event.raw_confidence_hint = min(1.0, (event.raw_confidence_hint or 0.85) * 1.15)
            return [event]

        def normalize_activity(phrase: str) -> str:
            """Normalizes activity names to detect duplicates."""
            return re.sub(r"\s+", " ", phrase.lower().strip()).replace("spol", "spool")

        # Group by normalized activity phrase
        grouped: Dict[str, List[ExtractedEvent]] = {}
        for event in events:
            key = normalize_activity(event.activity_phrase)
            if key not in grouped:
                grouped[key] = []
            grouped[key].append(event)

        result = []
        for group in grouped.values():
            if len(group) == 1:
                result.append(group[0])
            else:
                # Pick highest confidence, boost by 10%
                best = max(group, key=lambda e: e.raw_confidence_hint or 0.5)
                best.raw_confidence_hint = min(1.0, (best.raw_confidence_hint or 0.85) * 1.1)
                result.append(best)

        return result

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
