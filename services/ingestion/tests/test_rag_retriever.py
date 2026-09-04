"""
Unit and Integration Tests for RAG Retriever & LLM Extractor Domain Context Injection.
(SIH26122 - Member A)
"""

import pytest
from services.ingestion.rag_retriever import RAGRetriever
from services.ingestion.llm_extractor import LLMExtractor, EXTRACTION_SYSTEM_PROMPT
from shared.schemas.extracted_event import DisciplineEnum, EventTypeEnum


def test_rag_retriever_glossary_loading():
    """Verify that RAGRetriever loads and indexes 100+ engineering terms."""
    retriever = RAGRetriever()
    assert len(retriever.indexed_terms) >= 100
    assert len(retriever.glossary_data.get("disciplines", {})) >= 6


def test_rag_retriever_retrieval_piping():
    """Verify retrieval of piping specific terms and abbreviations."""
    retriever = RAGRetriever()
    query = "Completed 18 spools on line 24-PL-001 and conducted hydrotest and RT weld inspection."
    results = retriever.retrieve_context(query, top_k=5)
    
    assert len(results) > 0
    matched_terms = [r["term"].lower() for r in results]
    matched_abbrs = [r.get("abbreviation", "").lower() for r in results]
    
    assert any("spool" in t for t in matched_terms)
    assert any("hydrotest" in t or "hydrostatic" in t for t in matched_terms)
    assert any("rt" in a or "radiography" in t for a, t in zip(matched_abbrs, matched_terms))


def test_rag_retriever_retrieval_civil():
    """Verify retrieval of civil engineering terms."""
    retriever = RAGRetriever()
    query = "Civil team poured 120 cum of RCC for foundation TK-101 and completed rebar tying."
    results = retriever.retrieve_context(query, top_k=5)
    
    assert len(results) > 0
    matched_terms = [r["term"].lower() for r in results]
    matched_disciplines = [r["discipline"] for r in results]
    
    assert any("rcc" in t or "concrete" in t for t in matched_terms)
    assert any("rebar" in t or "reinforcement" in t for t in matched_terms)
    assert "civil" in matched_disciplines


def test_rag_retriever_retrieval_electrical_instrumentation():
    """Verify retrieval of electrical and instrumentation terms."""
    retriever = RAGRetriever()
    query = "Calibrated PT-204 transmitter and completed DCS loop check after cable glanding in Substation."
    results = retriever.retrieve_context(query, top_k=5)
    
    assert len(results) > 0
    matched_terms = [r["term"].lower() for r in results]
    assert any("transmitter" in t or "loop check" in t or "glanding" in t for t in matched_terms)


def test_rag_retriever_format_context_for_prompt():
    """Verify formatted markdown string ready for system prompt injection."""
    retriever = RAGRetriever()
    text = "Erected 12 spools on line 24-PL-001 with flange torquing and PWHT."
    formatted = retriever.format_context_for_prompt(text, max_terms=4)
    
    assert formatted != ""
    assert "- **" in formatted
    assert "[" in formatted and "]" in formatted
    assert "Spool" in formatted or "Torquing" in formatted or "PWHT" in formatted


def test_rag_retriever_empty_or_non_matching():
    """Verify clean empty output for irrelevant or empty input."""
    retriever = RAGRetriever()
    assert retriever.format_context_for_prompt("") == ""
    assert retriever.format_context_for_prompt("hello good morning how are you") == ""


def test_llm_extractor_system_prompt_rag_injection():
    """Verify system prompt dynamically contains DOMAIN CONTEXT when enabled."""
    extractor = LLMExtractor()
    text = "Line 24-PL-001: 20 spools fabricated and hydrotest completed."
    
    prompt_with_rag = extractor.build_system_prompt(text, retrieve_context=True)
    assert "DOMAIN CONTEXT:" in prompt_with_rag
    assert "Spool" in prompt_with_rag or "Hydrostatic" in prompt_with_rag
    
    prompt_without_rag = extractor.build_system_prompt(text, retrieve_context=False)
    assert "DOMAIN CONTEXT" not in prompt_without_rag
    assert prompt_without_rag == EXTRACTION_SYSTEM_PROMPT


def test_llm_extractor_extract_method_compatibility():
    """Verify both extract() and extract_with_llm() work seamlessly with retrieve_context flag."""
    extractor = LLMExtractor()
    text = "2026-08-20: Piping line 24-PL-001 completed 15 spools."
    
    # 1. extract() with retrieve_context=True (default)
    events1 = extractor.extract(text, retrieve_context=True)
    assert len(events1) >= 1
    assert "24-PL-001" in (events1[0].tag_or_line_id or events1[0].source_excerpt)
    assert events1[0].quantity == 15.0
    
    # 2. extract() with retrieve_context=False
    events2 = extractor.extract(text, retrieve_context=False)
    assert len(events2) >= 1
    assert events2[0].quantity == 15.0

    # 3. extract_with_llm() with retrieve_context
    events3 = extractor.extract_with_llm(text, retrieve_context=True)
    assert len(events3) >= 1
    assert events3[0].quantity == 15.0


def test_llm_extractor_json_validation_with_rag():
    """Verify JSON parsing and Pydantic validation handles domain-augmented outputs."""
    extractor = LLMExtractor()
    mock_json = """
    {
      "events": [
        {
          "activity_phrase": "Hydrotest and NDT inspection completed for piping loop",
          "discipline": "piping",
          "tag_or_line_id": "24-PL-001",
          "location": "Battery Limit Area 01",
          "event_type": "finish",
          "event_date": "2026-08-25",
          "quantity": 1.0,
          "unit": "circuits",
          "contractor": "L&T Heavy Engineering",
          "delay_reason": null,
          "source_excerpt": "Hydrotest and NDT inspection completed for piping loop 24-PL-001",
          "raw_confidence_hint": 0.95
        }
      ]
    }
    """
    events = extractor._parse_and_validate_llm_json(
        raw_json_str=mock_json,
        source_document="dpr_aug25.txt",
        default_date="2026-08-25"
    )
    assert len(events) == 1
    ev = events[0]
    assert ev.discipline == DisciplineEnum.PIPING
    assert ev.event_type == EventTypeEnum.FINISH
    assert ev.tag_or_line_id == "24-PL-001"
    assert ev.quantity == 1.0
    assert ev.unit == "circuits"
    assert ev.contractor == "L&T Heavy Engineering"
