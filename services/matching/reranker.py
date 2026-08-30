"""
Cross-Encoder Reranker Module.
Fine-tunes top-k candidate matches using deep cross-attention pairing.
"""

import numpy as np
from typing import List, Dict, Any, Union, Optional
from rapidfuzz import fuzz

try:
    from sentence_transformers import CrossEncoder
    HAS_CROSS_ENCODER = True
except ImportError:
    HAS_CROSS_ENCODER = False


class CrossEncoderReranker:
    """
    Cross-Encoder Reranker that scores (query, candidate) pairs for precise relevance ranking.
    """

    def __init__(self, model_name: str = "cross-encoder/mmarco-mMiniLMv2-L12-H384"):
        self.model_name = model_name
        self.model = None
        if HAS_CROSS_ENCODER:
            try:
                self.model = CrossEncoder(model_name, max_length=512)
            except Exception:
                self.model = None

    def _get_candidate_text(self, candidate: Any) -> str:
        """Extracts text representation from candidate dict or object."""
        if hasattr(candidate, "activity_name"):
            name = candidate.activity_name
            tag = getattr(candidate, "tag", "") or ""
            return f"{name} {tag}".strip()
        elif isinstance(candidate, dict):
            name = candidate.get("activity_name") or candidate.get("title") or candidate.get("name") or ""
            tag = candidate.get("tag") or ""
            return f"{name} {tag}".strip()
        return str(candidate)

    def score_candidates(self, text: str, candidates: List[Any]) -> List[Dict[str, Any]]:
        """
        Scores each query + candidate pair (returns list of dicts with candidate, raw_score, rerank_score).
        """
        if not candidates:
            return []

        pairs = []
        cand_texts = []
        for cand in candidates:
            cand_text = self._get_candidate_text(cand)
            cand_texts.append(cand_text)
            pairs.append([text, cand_text])

        scores = None
        if self.model is not None:
            try:
                raw_scores = self.model.predict(pairs)
                scores = []
                for s in raw_scores:
                    val = float(s)
                    # Convert logit to 0-1 probability via sigmoid if outside 0-1
                    if val < 0.0 or val > 1.0:
                        val = float(1.0 / (1.0 + np.exp(-val)))
                    scores.append(val)
            except Exception:
                scores = None

        # Fallback cross-scoring heuristic if neural cross-encoder unavailable
        if scores is None:
            scores = []
            for cand_text in cand_texts:
                ratio = fuzz.token_set_ratio(text.lower(), cand_text.lower()) / 100.0
                partial = fuzz.partial_ratio(text.lower(), cand_text.lower()) / 100.0
                scores.append(round(0.6 * ratio + 0.4 * partial, 4))

        scored_results = []
        for cand, score in zip(candidates, scores):
            scored_results.append({
                "candidate": cand,
                "rerank_score": float(score)
            })

        return scored_results

    def rerank_top_k(self, text: str, candidates: List[Any], k: int = 5) -> List[Any]:
        """
        Reranks candidates and returns the top k candidates sorted by relevance score.
        """
        scored = self.score_candidates(text, candidates)
        scored.sort(key=lambda x: x["rerank_score"], reverse=True)
        top_k_items = [x["candidate"] for x in scored[:k]]

        # Also update candidate score attribute if available
        for item, sc in zip(top_k_items, scored[:k]):
            if hasattr(item, "score"):
                current_score = getattr(item, "score", 0.5)
                item.score = round(0.7 * current_score + 0.3 * sc["rerank_score"], 4)

        return top_k_items


cross_encoder_reranker = CrossEncoderReranker()
