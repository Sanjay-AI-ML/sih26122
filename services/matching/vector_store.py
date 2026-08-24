import sys
from typing import List, Tuple
from services.matching.schemas import ScheduleActivity

try:
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False

class VectorStore:
    def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
        self.model_name = model_name
        self.activities: List[ScheduleActivity] = []
        
        if HAS_FAISS:
            self.model = SentenceTransformer(model_name)
            self.dimension = self.model.get_sentence_embedding_dimension()
            self.index = faiss.IndexFlatIP(self.dimension)
        else:
            self.index = None

    def clear(self):
        """Clears the FAISS index and the in-memory activities list."""
        if HAS_FAISS:
            self.index = faiss.IndexFlatIP(self.dimension)
        self.activities.clear()

    def load_activities(self, activities: List[ScheduleActivity]):
        """Embeds activities and adds them to the FAISS index."""
        if not activities:
            return

        self.activities.extend(activities)
        
        if HAS_FAISS:
            texts = [
                f"{act.activity_name} Tag: {act.tag} Discipline: {act.discipline.value}"
                for act in activities
            ]
            embeddings = self.model.encode(texts, convert_to_numpy=True)
            faiss.normalize_L2(embeddings)
            self.index.add(embeddings)

    def search(self, query: str, k: int = 10) -> List[Tuple[ScheduleActivity, float]]:
        """Returns the top K matching activities with their cosine similarity scores."""
        if not self.activities:
            return []

        # Adjust k if we have fewer items than k
        k = min(k, len(self.activities))
        
        if HAS_FAISS and self.index.ntotal > 0:
            query_emb = self.model.encode([query], convert_to_numpy=True)
            faiss.normalize_L2(query_emb)
            scores, indices = self.index.search(query_emb, k)
            
            results = []
            for score, idx in zip(scores[0], indices[0]):
                if idx != -1 and idx < len(self.activities):
                    clipped_score = max(0.0, min(float(score), 1.0))
                    results.append((self.activities[idx], clipped_score))
            return results
        else:
            # Mock fallback: simple text matching to simulate semantic search
            query_lower = query.lower()
            results = []
            for act in self.activities:
                # Basic string overlap scoring
                target = f"{act.activity_name} {act.tag} {act.discipline.value}".lower()
                
                # Mock score based on overlap
                overlap = sum(1.0 for word in query_lower.split() if word in target)
                # Jaccard-like penalty for length
                target_words = len(target.split())
                mock_score = min(1.0, (overlap / (target_words + 1)) * 1.5)
                
                results.append((act, mock_score))
            
            # Sort by mock score descending
            results.sort(key=lambda x: x[1], reverse=True)
            return results[:k]

# Singleton instance
vector_store = VectorStore()
