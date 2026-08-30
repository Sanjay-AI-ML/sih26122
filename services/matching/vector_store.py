"""
Vector Store for Primavera Schedule Activity Retrieval (SIH26122 - Member B).
Powered by BAAI/bge-m3 (1024-dim) dense semantic embeddings with FAISS Index.
"""

import sys
from typing import List, Tuple
import numpy as np

from services.matching.schemas import ScheduleActivity
from services.matching.rag_engine import rag_engine, MODEL_NAME, EMBEDDING_DIM

try:
    import faiss
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False


class VectorStore:
    def __init__(self, model_name: str = MODEL_NAME, dimension: int = EMBEDDING_DIM):
        self.model_name = model_name
        self.dimension = dimension
        self.activities: List[ScheduleActivity] = []
        
        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.dimension)
        else:
            self.index = None

    def clear(self):
        """Clears the FAISS index and the in-memory activities list."""
        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.dimension)
        self.activities.clear()

    def load_activities(self, activities: List[ScheduleActivity]):
        """Embeds activities using BGE-M3 (1024-dim) and adds them to the FAISS index."""
        if not activities:
            return

        self.activities.extend(activities)
        
        texts = [
            f"{act.activity_name} Tag: {act.tag} Discipline: {act.discipline.value}"
            for act in activities
        ]
        
        embeddings = rag_engine.encode(texts)
        if len(embeddings.shape) == 1:
            embeddings = embeddings.reshape(1, -1)

        if HAS_FAISS and self.index is not None:
            faiss.normalize_L2(embeddings)
            self.index.add(embeddings)

    def search(self, query: str, k: int = 10) -> List[Tuple[ScheduleActivity, float]]:
        """Returns the top K matching activities with their cosine similarity scores."""
        if not self.activities:
            return []

        k = min(k, len(self.activities))
        
        if HAS_FAISS and self.index is not None and self.index.ntotal > 0:
            query_emb = rag_engine.encode(query).reshape(1, -1)
            faiss.normalize_L2(query_emb)
            scores, indices = self.index.search(query_emb, k)
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx != -1 and idx < len(self.activities):
                    clipped_score = max(0.0, min(float(score), 1.0))
                    results.append((self.activities[idx], clipped_score))
            return results
        else:
            # Fallback dot product on numpy embeddings
            query_emb = rag_engine.encode(query)
            texts = [
                f"{act.activity_name} Tag: {act.tag} Discipline: {act.discipline.value}"
                for act in self.activities
            ]
            act_embs = rag_engine.encode(texts)
            scores = np.dot(act_embs, query_emb)
            top_indices = np.argsort(scores)[::-1][:k]
            
            results = []
            for idx in top_indices:
                score = float(scores[idx])
                results.append((self.activities[idx], max(0.0, min(score, 1.0))))
            return results


# Singleton instance
vector_store = VectorStore()
