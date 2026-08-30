"""
Unit and Performance Benchmark Tests for RAG Embedding Engine (BAAI/bge-m3).
(SIH26122 - Member B)
"""

import os
import time
import pytest
import numpy as np

from services.matching.rag_engine import RAGEngine, MODEL_NAME, EMBEDDING_DIM


def test_rag_engine_constants():
    """Verify engine constants are set to BAAI/bge-m3 and 1024 dimensions."""
    assert MODEL_NAME == "BAAI/bge-m3"
    assert EMBEDDING_DIM == 1024


def test_rag_engine_initialization_and_rebuild():
    """Verify index rebuild generates 1024-dim embeddings in data/embeddings.pkl."""
    engine = RAGEngine(auto_load=False)
    assert engine.model_name == "BAAI/bge-m3"
    assert engine.embedding_dim == 1024

    rebuild_res = engine.rebuild_index(save=True)
    assert rebuild_res["status"] == "success"
    assert rebuild_res["model_name"] == "BAAI/bge-m3"
    assert rebuild_res["embedding_dim"] == 1024
    assert rebuild_res["num_terms"] >= 100
    assert os.path.exists(rebuild_res["saved_to"])

    # Performance requirement: Index rebuild time < 10 seconds
    assert rebuild_res["duration_sec"] < 10.0, f"Rebuild took {rebuild_res['duration_sec']}s (must be < 10s)"


def test_rag_engine_embedding_dimensions():
    """Verify embeddings matrix shape and normalization."""
    engine = RAGEngine()
    assert engine.embeddings is not None
    assert engine.embeddings.ndim == 2
    assert engine.embeddings.shape[1] == 1024
    assert engine.embeddings.shape[0] >= 100

    # Verify L2 normalization
    norms = np.linalg.norm(engine.embeddings, axis=1)
    for n in norms:
        assert np.isclose(n, 1.0, atol=1e-3)


def test_rag_engine_query_performance_and_accuracy():
    """Verify query latency (< 100ms) and technical term retrieval accuracy."""
    engine = RAGEngine()

    queries = [
        "Hydrotest pressure testing of pipe spools",
        "Excavation and concrete pouring for foundation raft",
        "Transformer erection and switchgear substation cable termination",
        "Control valve calibration and DCS loop check",
        "Permit to work PTW and safety toolbox talk"
    ]

    for q in queries:
        start_time = time.perf_counter()
        results = engine.query(q, top_k=5)
        elapsed_ms = (time.perf_counter() - start_time) * 1000

        assert len(results) > 0
        # Performance requirement: Query latency < 100ms
        assert elapsed_ms < 100.0, f"Query '{q}' took {elapsed_ms:.2f}ms (must be < 100ms)"
        assert results[0]["query_time_ms"] < 100.0
        assert results[0]["similarity_score"] > 0.0


def test_rag_engine_multilingual_and_technical_matching():
    """Verify multilingual (Hinglish) and technical acronym matching."""
    engine = RAGEngine()

    # Multilingual / Hinglish query
    res_hinglish = engine.query("Piping line ka hydrotest complete ho gaya and spools erect kiya", top_k=3)
    assert len(res_hinglish) > 0
    top_terms = [r["term"].lower() for r in res_hinglish]
    assert any("spool" in t or "hydrostatic" in t for t in top_terms)

    # Technical acronym query
    res_acronym = engine.query("PWHT and NDT radiography inspection done on weld joint", top_k=3)
    assert len(res_acronym) > 0
    abbrs = [r.get("abbreviation", "").lower() for r in res_acronym]
    terms = [r["term"].lower() for r in res_acronym]
    assert any("pwht" in a or "rt" in a or "weld" in t for a, t in zip(abbrs, terms))
