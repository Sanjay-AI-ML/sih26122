"""
Unit and Integration Test Suite for RAG Domain Knowledge Retriever.
Verifies engineering taxonomy grounding, abbreviation resolution, status mapping,
synonym expansion, canonical normalization, and prompt formatting for Setu Ingestion Service.

FILE: services/ingestion/tests/test_rag_retriever.py
"""

import pytest
import sys
import os

# Ensure services path is available for imports
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.ingestion.rag_retriever import (
    RAGRetriever,
    DEFAULT_DISCIPLINE_TERMS,
    DEFAULT_ABBREVIATIONS,
    CANONICAL_NORMALIZATIONS,
    TERM_SYNONYMS,
    DISCIPLINE_EXAMPLES,
)


@pytest.fixture
def retriever() -> RAGRetriever:
    """Fixture providing a fresh RAGRetriever instance with default domain knowledge."""
    return RAGRetriever()


# ============================================================================
# REQUIRED TEST SPECIFICATIONS
# ============================================================================

def test_retrieve_context_piping_discipline(retriever: RAGRetriever):
    """
    Test 1:
    - Input: "24-inch XX spool erection completed"
    - Assert: discipline="piping", contains "spool erection" term
    """
    input_text = "24-inch XX spool erection completed"
    context = retriever.retrieve_context(input_text)

    assert context["discipline"] == "piping", f"Expected discipline 'piping', got '{context.get('discipline')}'"
    assert "spool erection" in context["terms"], f"Expected 'spool erection' in terms, got {context.get('terms')}"


def test_retrieve_context_finds_abbreviations(retriever: RAGRetriever):
    """
    Test 2:
    - Input: "HSE briefing and NDT inspection completed"
    - Assert: abbreviations include "HSE" and "NDT"
    """
    input_text = "HSE briefing and NDT inspection completed"
    context = retriever.retrieve_context(input_text)

    abbreviations = context.get("abbreviations", {})
    assert "HSE" in abbreviations, f"Expected 'HSE' in abbreviations, got {abbreviations}"
    assert "NDT" in abbreviations, f"Expected 'NDT' in abbreviations, got {abbreviations}"
    assert abbreviations["HSE"] == "Health, Safety, and Environment"
    assert abbreviations["NDT"] == "Non-Destructive Testing"


def test_retrieve_context_status_terms(retriever: RAGRetriever):
    """
    Test 3:
    - Input: "work completed yesterday"
    - Assert: status_terms include "completed" with event_type="finish"
    """
    input_text = "work completed yesterday"
    context = retriever.retrieve_context(input_text)

    status_terms = context.get("status_terms", [])
    matching_terms = [s for s in status_terms if s["term"] == "completed"]

    assert len(matching_terms) > 0, f"Expected 'completed' in status_terms, got {status_terms}"
    assert matching_terms[0]["event_type"] == "finish", f"Expected event_type 'finish', got {matching_terms[0]['event_type']}"


def test_format_context_for_prompt_output_format(retriever: RAGRetriever):
    """
    Test 4:
    - Assert: formatted output contains "RELEVANT ENGINEERING TERMINOLOGY:" header
    - Assert: contains discipline, terms, examples, abbreviations, status
    """
    sample_context = {
        "discipline": "piping",
        "terms": ["spool erection", "hydrotest"],
        "abbreviations": {"P&ID": "Piping and Instrumentation Diagram"},
        "status_terms": [{"term": "completed", "event_type": "finish"}],
        "examples": ["24-inch cooling water line spool erection completed at Pipe Rack PR-05."],
        "synonyms": {"spool erection": ["pipe erection"]}
    }

    formatted = retriever.format_context_for_prompt(sample_context)

    assert "RELEVANT ENGINEERING TERMINOLOGY:" in formatted, "Missing header"
    assert "Discipline: piping" in formatted or "piping" in formatted, "Missing discipline"
    assert "Domain Terms:" in formatted and "spool erection" in formatted, "Missing terms"
    assert "Reference Examples:" in formatted and "Pipe Rack PR-05" in formatted, "Missing examples"
    assert "Abbreviations:" in formatted and "P&ID" in formatted, "Missing abbreviations"
    assert "Status Terms:" in formatted and "completed" in formatted, "Missing status"


def test_find_synonyms_piping_terms(retriever: RAGRetriever):
    """
    Test 5:
    - Search: "spool fabrication"
    - Assert: returns synonyms like "spool welding", "pipe welding"
    """
    search_term = "spool fabrication"
    synonyms = retriever.find_synonyms(search_term)

    assert isinstance(synonyms, list)
    assert "spool welding" in synonyms, f"Expected 'spool welding' in {synonyms}"
    assert "pipe welding" in synonyms, f"Expected 'pipe welding' in {synonyms}"


def test_normalize_term_canonical_form(retriever: RAGRetriever):
    """
    Test 6:
    - Input: "hydro test"
    - Assert: normalizes to "hydrotest"
    """
    input_term = "hydro test"
    normalized = retriever.normalize_term(input_term)

    assert normalized == "hydrotest", f"Expected 'hydrotest', got '{normalized}'"


# ============================================================================
# EXTENDED TEST SUITE FOR MAXIMUM (85%+) CODE COVERAGE
# ============================================================================

def test_retrieve_context_empty_and_whitespace(retriever: RAGRetriever):
    """Verifies that empty and whitespace-only queries return default safe empty context."""
    for empty_input in ["", "   ", "\n\t  ", None]:
        res = retriever.retrieve_context(empty_input)
        assert res["discipline"] is None
        assert res["terms"] == []
        assert res["abbreviations"] == {}
        assert res["status_terms"] == []
        assert res["examples"] == []
        assert res["synonyms"] == {}


def test_retrieve_context_all_disciplines(retriever: RAGRetriever):
    """Tests discipline detection and term extraction across all supported disciplines."""
    discipline_test_cases = [
        ("Excavation and raft foundation concrete pouring ongoing for Substation", "civil", "foundation"),
        ("Pump alignment and baseplate grouting completed for P-201A", "static_rotating", "pump alignment"),
        ("Cable pulling of 500m and cable termination for switchgear panel", "electrical", "cable pulling"),
        ("Transmitter calibration and loop check for PT-101 in Unit 01", "instrumentation", "loop check"),
        ("Conducted toolbox talk and HSE briefing on work permit safety", "hse", "hse briefing"),
    ]

    for text, expected_discipline, expected_term in discipline_test_cases:
        ctx = retriever.retrieve_context(text)
        assert ctx["discipline"] == expected_discipline, f"Failed for text '{text}': got {ctx['discipline']}"
        assert any(expected_term in term for term in ctx["terms"]), f"Expected term '{expected_term}' in {ctx['terms']}"


def test_retrieve_context_various_status_terms(retriever: RAGRetriever):
    """Tests detection of start, progress, and delay milestone phrases."""
    status_cases = [
        ("Excavation started today for pipe rack", "start", "start"),
        ("Welding ongoing for 12-CS-104", "progress", "progress"),
        ("Work suspended due to heavy rain stoppage", "delay_stoppage", "delay_stoppage")
    ]

    for text, expected_type, label in status_cases:
        ctx = retriever.retrieve_context(text)
        types_found = [s["event_type"] for s in ctx["status_terms"]]
        assert expected_type in types_found, f"Expected status type '{expected_type}' for '{text}', got {types_found}"


def test_find_synonyms_edge_cases(retriever: RAGRetriever):
    """Tests synonym lookup with normalization, substring matches, and unknown terms."""
    # Normalized search (e.g. with extra space or punctuation)
    syns_hydro = retriever.find_synonyms("hydro test")
    assert "hydrostatic test" in syns_hydro or "pressure test" in syns_hydro

    # Reverse lookup from list member
    syns_reverse = retriever.find_synonyms("pipe welding")
    assert "spool fabrication" in syns_reverse or "spool welding" in syns_reverse

    # Empty and unknown term
    assert retriever.find_synonyms("") == []
    assert retriever.find_synonyms(None) == []
    assert retriever.find_synonyms("completely_unknown_super_rare_term_xyz_123") == []


def test_normalize_term_additional_patterns(retriever: RAGRetriever):
    """Tests various canonical normalization mappings."""
    assert retriever.normalize_term("x-ray") == "radiography"
    assert retriever.normalize_term("rt inspection") == "radiography"
    assert retriever.normalize_term("spool fab") == "spool fabrication"
    assert retriever.normalize_term("cable pull") == "cable pulling"
    assert retriever.normalize_term("t & c") == "testing and commissioning"
    assert retriever.normalize_term("l & t") == "L&T"
    assert retriever.normalize_term("") == ""
    assert retriever.normalize_term(None) == ""
    assert retriever.normalize_term("unregistered term") == "unregistered term"


def test_format_context_variations(retriever: RAGRetriever):
    """Tests format_context_for_prompt with string inputs, empty dicts, and invalid types."""
    # Test formatting directly from a string query
    formatted_str = retriever.format_context_for_prompt("Piping spool erection completed at PR-05")
    assert "RELEVANT ENGINEERING TERMINOLOGY:" in formatted_str
    assert "piping" in formatted_str

    # Test formatting empty context dict
    empty_fmt = retriever.format_context_for_prompt({})
    assert "RELEVANT ENGINEERING TERMINOLOGY:" in empty_fmt
    assert "None identified" in empty_fmt
    assert "Abbreviations: None" in empty_fmt
    assert "Status Terms: None" in empty_fmt

    # Test formatting invalid types
    assert retriever.format_context_for_prompt(None) == ""
    assert retriever.format_context_for_prompt(12345) == ""


def test_custom_domain_knowledge_injection():
    """Verifies that RAGRetriever can be instantiated with custom taxonomy dictionaries."""
    custom_terms = {"marine": ["jetty piling", "mooring dolphin erection"]}
    custom_abbr = {"BOP": "Balance of Plant"}
    custom_norm = {"dolphins": "mooring dolphin erection"}
    custom_syn = {"jetty piling": ["marine piling", "quay foundation"]}
    custom_examples = {"marine": ["Completed jetty piling at Berth 02."]}

    custom_retriever = RAGRetriever(
        discipline_terms=custom_terms,
        abbreviations=custom_abbr,
        canonical_normalizations=custom_norm,
        synonyms=custom_syn,
        discipline_examples=custom_examples
    )

    ctx = custom_retriever.retrieve_context("BOP team completed jetty piling at offshore berth")
    assert ctx["discipline"] == "marine"
    assert "jetty piling" in ctx["terms"]
    assert "BOP" in ctx["abbreviations"]
    assert ctx["abbreviations"]["BOP"] == "Balance of Plant"
    assert "marine piling" in custom_retriever.find_synonyms("jetty piling")
