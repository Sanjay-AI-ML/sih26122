"""
Claude API wrapper for SAMANWAY LLM operations.
Handles all communication with Anthropic Claude API.

IMPORTANT: API key is managed via environment variables, NEVER hardcoded.
"""

import json
import os
from typing import Optional, List

from anthropic import Anthropic, APIError, APIConnectionError, RateLimitError
from pydantic import ValidationError

from services.llm.models import (
    StructuredFieldEvent,
    ExtractionResponse,
    HistoricalQueryResponse,
    ModelHealthStatus,
)
from services.llm.prompts import (
    EXTRACTION_SYSTEM_PROMPT,
    GROUNDED_HISTORY_PROMPT,
    get_extraction_prompt_with_context,
)


class ClaudeExtractor:
    """
    Claude-based structured information extraction for SAMANWAY.
    Handles schema-constrained extraction with proper error handling.
    """

    def __init__(self):
        """Initialize Claude client from environment variables."""
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError(
                "ANTHROPIC_API_KEY not set. Provide via environment variable."
            )

        self.client = Anthropic(api_key=api_key)
        self.model = os.getenv("CLAUDE_MODEL", "claude-sonnet-4-6")
        self.timeout = int(os.getenv("CLAUDE_TIMEOUT", "60"))

    def extract_field_event(
        self,
        text: str,
        source_document: str = "unknown",
        retrieved_context: Optional[str] = None,
    ) -> ExtractionResponse:
        """
        Extract structured field events from unstructured text using Claude.

        Args:
            text: Raw field report or document text
            source_document: Name of source document for tracking
            retrieved_context: Optional retrieved engineering terminology

        Returns:
            ExtractionResponse with structured events or error details

        Raises:
            Does NOT raise exceptions. Returns error in ExtractionResponse.
        """
        if not text or not text.strip():
            return ExtractionResponse(
                events=[],
                raw_text="",
                extraction_successful=False,
                error_message="Empty input text",
            )

        # Prepare system prompt with context if provided
        system_prompt = (
            get_extraction_prompt_with_context(retrieved_context)
            if retrieved_context
            else EXTRACTION_SYSTEM_PROMPT
        )

        # Prepare user message
        user_message = f"""Extract structured field events from this document:

---
{text}
---

Remember:
- Extract ONLY what's stated in the document
- Return null for unknown fields
- Preserve exact source spans
- If no events, return empty list
- Return valid JSON only

Return the JSON response:"""

        try:
            # Call Claude API
            message = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                timeout=self.timeout,
            )

            # Extract response text
            response_text = message.content[0].text

            # Parse JSON
            try:
                parsed = json.loads(response_text)
            except json.JSONDecodeError as e:
                return ExtractionResponse(
                    raw_text=text,
                    extraction_successful=False,
                    error_message=f"Claude returned invalid JSON: {str(e)}",
                )

            # Validate and convert to StructuredFieldEvent objects
            events = []
            event_list = parsed.get("events", [])

            for event_data in event_list:
                try:
                    # Ensure source_document is set
                    event_data["source_document"] = source_document
                    event = StructuredFieldEvent(**event_data)
                    events.append(event)
                except ValidationError as ve:
                    # Log validation error but continue processing other events
                    print(f"Validation error for event: {ve}")
                    continue

            return ExtractionResponse(
                events=events,
                raw_text=text,
                extraction_model=self.model,
                extraction_successful=True,
            )

        except APIConnectionError as e:
            return ExtractionResponse(
                raw_text=text,
                extraction_successful=False,
                error_message=f"Claude API connection error: {str(e)}",
            )

        except RateLimitError as e:
            return ExtractionResponse(
                raw_text=text,
                extraction_successful=False,
                error_message=f"Claude API rate limit exceeded: {str(e)}",
            )

        except APIError as e:
            return ExtractionResponse(
                raw_text=text,
                extraction_successful=False,
                error_message=f"Claude API error: {str(e)}",
            )

        except Exception as e:
            return ExtractionResponse(
                raw_text=text,
                extraction_successful=False,
                error_message=f"Unexpected error in Claude extraction: {str(e)}",
            )

    def answer_grounded_query(
        self,
        question: str,
        retrieved_records: str,
        record_count: int,
    ) -> HistoricalQueryResponse:
        """
        Answer a query using only retrieved historical records.
        No fabrication — if data insufficient, says so.

        Args:
            question: User's question about project history
            retrieved_records: JSON-formatted historical records
            record_count: Number of records retrieved

        Returns:
            HistoricalQueryResponse with grounded answer or data gap notice
        """
        if record_count == 0:
            return HistoricalQueryResponse(
                answer="No sufficient historical execution data available.",
                has_sufficient_data=False,
                record_count=0,
                data_gaps="No matching historical records found.",
            )

        # Prepare system prompt with data
        system_prompt = GROUNDED_HISTORY_PROMPT + f"""

RETRIEVED DATA ({record_count} records):
{retrieved_records}

Answer based ONLY on this data. If insufficient, say so."""

        user_message = f"Question: {question}"

        try:
            message = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}],
                timeout=self.timeout,
            )

            response_text = message.content[0].text

            # Try to parse structured response
            try:
                parsed = json.loads(response_text)
                return HistoricalQueryResponse(
                    answer=parsed.get("answer", response_text),
                    has_sufficient_data=parsed.get("has_sufficient_data", False),
                    record_count=record_count,
                    supporting_evidence=parsed.get("supporting_evidence", []),
                    data_gaps=parsed.get("data_gaps"),
                )
            except json.JSONDecodeError:
                # Claude returned prose instead of JSON — wrap it
                return HistoricalQueryResponse(
                    answer=response_text,
                    has_sufficient_data=record_count > 0,
                    record_count=record_count,
                    supporting_evidence=[],
                )

        except Exception as e:
            return HistoricalQueryResponse(
                answer=f"Error querying historical data: {str(e)}",
                has_sufficient_data=False,
                record_count=0,
                data_gaps=f"Query failed: {str(e)}",
            )

    def check_availability(self) -> bool:
        """
        Check if Claude API is available and API key is valid.

        Returns:
            True if API is accessible, False otherwise
        """
        try:
            # Simple test call to verify API key and connectivity
            self.client.messages.create(
                model=self.model,
                max_tokens=10,
                messages=[{"role": "user", "content": "ping"}],
                timeout=5,  # Short timeout for health check
            )
            return True
        except Exception:
            return False

    def get_health_status(self) -> ModelHealthStatus:
        """
        Get detailed health status of Claude extraction capability.

        Returns:
            ModelHealthStatus with API availability and model info
        """
        is_available = self.check_availability()

        return ModelHealthStatus(
            llm_available=is_available,
            llm_model=self.model if is_available else "unavailable",
            system_operational=is_available,
        )


# Singleton instance
_extractor: Optional[ClaudeExtractor] = None


def get_claude_extractor() -> ClaudeExtractor:
    """
    Get or create singleton Claude extractor instance.

    Returns:
        ClaudeExtractor instance

    Raises:
        ValueError if ANTHROPIC_API_KEY is not set
    """
    global _extractor
    if _extractor is None:
        _extractor = ClaudeExtractor()
    return _extractor


def reset_claude_extractor() -> None:
    """Reset singleton instance (useful for testing)."""
    global _extractor
    _extractor = None
