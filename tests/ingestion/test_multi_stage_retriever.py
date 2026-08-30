"""
Unit and Integration Test Suite for MultiStageRetriever (Lexical BM25 + Semantic + Metadata Filtering).

FILE: tests/ingestion/test_multi_stage_retriever.py
"""

import pytest
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../../services")))

from services.ingestion.multi_stage_retriever import (
    MultiStageRetriever,
    DEFAULT_ACTIVITY_CORPUS
)


@pytest.fixture
def multi_retriever() -> MultiStageRetriever:
    return MultiStageRetriever()


def test_retrieve_bm25_lexical_scoring(multi_retriever: MultiStageRetriever):
    """
    Stage 1 Test: Fast keyword matching with RapidFuzz.
    - Returns top_k=20 candidates
    - Candidates contain bm25_score in [0.0, 1.0]
    - Best matching candidate for piping spool erection is ACT-PIP-001
    """
    query = "24-inch cooling line spool erection"
    results = multi_retriever.retrieve_bm25(query, top_k=20)

    assert len(results) > 0
    assert len(results) <= 20
    assert "bm25_score" in results[0]
    assert 0.0 <= results[0]["bm25_score"] <= 1.0
    # Top result should be related to 24-inch CW spool erection
    assert results[0]["id"] == "ACT-PIP-001" or "Spool Erection" in results[0]["activity_name"]


def test_retrieve_semantic_embeddings_scoring(multi_retriever: MultiStageRetriever):
    """
    Stage 2 Test: Contextual similarity scoring via dense / subword vector space.
    - Returns top_k=10 candidates
    - Candidates contain semantic_score in [0.0, 1.0]
    """
    query = "hydrostatic pressure hold test and dewatering"
    results = multi_retriever.retrieve_semantic(query, top_k=10)

    assert len(results) > 0
    assert len(results) <= 10
    assert "semantic_score" in results[0]
    assert 0.0 <= results[0]["semantic_score"] <= 1.0
    top_ids = [r["id"] for r in results[:3]]
    assert "ACT-PIP-003" in top_ids or any("Hydrotest" in r["activity_name"] for r in results[:3])


def test_retrieve_with_filtering_discipline_and_activity_boost(multi_retriever: MultiStageRetriever):
    """
    Stage 3 Test: Metadata filtering & activity-type boosting.
    - Input: "11kV substation feeder cable pulling completed"
    - Expected discipline: "electrical", activity_type: "cable_work"
    - Returns top_k=5 final candidates
    - Boosts electrical cable pulling candidate to rank 1
    """
    query = "11kV substation feeder cable pulling completed"
    results = multi_retriever.retrieve_with_filtering(query, top_k=5)

    assert len(results) <= 5
    assert len(results) > 0
    top = results[0]
    assert top["discipline"] == "electrical"
    assert top["id"] == "ACT-ELE-001"
    assert "ensemble_score" in top
    assert top["metadata_boost"] > 0.0


def test_score_and_rank_ensemble_formula(multi_retriever: MultiStageRetriever):
    """
    Verifies ensemble formula:
      Ensemble score = 0.3 * bm25_score + 0.5 * semantic_score + 0.2 * metadata_boost
    """
    sample_candidates = [
        {"id": "C-1", "bm25_score": 0.8, "semantic_score": 0.6, "metadata_boost": 0.5},
        {"id": "C-2", "bm25_score": 0.4, "semantic_score": 0.9, "metadata_boost": 0.8},
        {"id": "C-3", "bm25_score": 0.2, "semantic_score": 0.3, "metadata_boost": 0.1},
    ]

    ranked = multi_retriever.score_and_rank(sample_candidates, method="ensemble")

    # Verify score calculation for C-1: 0.3*0.8 + 0.5*0.6 + 0.2*0.5 = 0.24 + 0.30 + 0.10 = 0.64
    c1 = next(c for c in ranked if c["id"] == "C-1")
    assert abs(c1["ensemble_score"] - 0.64) < 1e-3

    # Verify score calculation for C-2: 0.3*0.4 + 0.5*0.9 + 0.2*0.8 = 0.12 + 0.45 + 0.16 = 0.73
    c2 = next(c for c in ranked if c["id"] == "C-2")
    assert abs(c2["ensemble_score"] - 0.73) < 1e-3

    # C-2 should rank above C-1
    assert ranked[0]["id"] == "C-2"
    assert ranked[1]["id"] == "C-1"
    assert ranked[2]["id"] == "C-3"


def test_retrieve_empty_and_edge_cases(multi_retriever: MultiStageRetriever):
    """Verifies safe empty list handling for empty queries."""
    assert multi_retriever.retrieve_bm25("") == []
    assert multi_retriever.retrieve_semantic("   ") == []
    assert multi_retriever.retrieve_with_filtering(None) == []


def test_dynamic_add_activities(multi_retriever: MultiStageRetriever):
    """Verifies adding custom activities and retrieving them immediately."""
    new_act = {
        "id": "ACT-CUSTOM-999",
        "activity_name": "Offshore Wellhead Platform Topside Float-over",
        "discipline": "structural",
        "activity_type": "erection",
        "tag": "WHP-01",
        "description": "Barge float-over installation and jacket loadout"
    }
    multi_retriever.add_activities([new_act])

    res = multi_retriever.retrieve_with_filtering("Offshore wellhead topside float-over", top_k=3)
    top_ids = [r["id"] for r in res]
    assert "ACT-CUSTOM-999" in top_ids
