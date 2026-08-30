"""
Claude AI + RAG Keyword Extraction Service for Primavera Task Matching.
Extracts intelligent keywords from field reports using Claude and matches them to Primavera tasks.
"""

import json
import os
import httpx
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass

from services.matching.vector_store import vector_store
from services.shared.knowledge_base import get_knowledge_base


@dataclass
class KeywordMatch:
    """Represents a keyword extracted from field report and its matches."""
    keyword: str
    category: str  # "equipment", "activity", "location", "contractor", "status"
    confidence: float
    primavera_tasks: List[Dict]  # Matched Primavera tasks


@dataclass
class PrimaveraTaskMatch:
    """Represents a matched Primavera task."""
    activity_id: str
    activity_name: str
    task_code: str
    discipline: str
    status: str
    confidence_score: float
    matched_keywords: List[str]
    rationale: str


class ClaudeKeywordExtractor:
    """
    Uses Claude AI to extract domain-aware keywords from field reports,
    then uses RAG to find matching Primavera tasks.
    """

    def __init__(self):
        """Initialize with knowledge base and vector store."""
        self.kb = get_knowledge_base()
        self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
        self.model_name = os.getenv("LLM_MODEL_NAME", "llama3.2:latest")
        self.anthropic_key = os.getenv("ANTHROPIC_API_KEY")

    def extract_keywords_with_claude(self, field_report: str) -> List[Dict]:
        """
        Use LOCAL Claude (via Ollama/LiteLLM) to intelligently extract keywords from field report.
        Returns keywords with categories and confidence scores.

        NOTE: Only uses local Claude instance - NO external API calls.
        """
        if not field_report or not field_report.strip():
            return []

        system_prompt = """You are an expert in Oil & Gas infrastructure and construction project management.
Extract key information from field reports using domain knowledge.

Categories:
- EQUIPMENT: Piping tags, valves, equipment IDs (e.g., "24-PL-001", "TK-101", "P-201A")
- ACTIVITY: Work activities (e.g., "welding", "testing", "installation", "erection")
- LOCATION: Project areas/sectors (e.g., "Sector 4", "Unit A", "Block B")
- CONTRACTOR: Company names (e.g., "L&T", "Larsen & Toubro", "subcontractor names")
- STATUS: Progress indicators (e.g., "completed", "in progress", "delayed", "finished")
- QUANTITY: Measurable amounts with units (e.g., "95%", "24 spools", "500 meters")

Return ONLY a valid JSON array with this schema:
[
  {
    "keyword": "extracted term",
    "category": "EQUIPMENT|ACTIVITY|LOCATION|CONTRACTOR|STATUS|QUANTITY",
    "confidence": 0.0 to 1.0,
    "context": "sentence where it appears"
  }
]"""

        user_message = f"""Extract keywords from this field report:

{field_report}

Return ONLY the JSON array, no markdown or extra text."""

        # Use ONLY local Ollama/Claude instance - NO external APIs
        try:
            payload = {
                "model": self.model_name,
                "prompt": user_message,
                "system": system_prompt,
                "stream": False,
                "format": "json",
                "options": {"temperature": 0.3, "top_p": 0.9}
            }
            response = httpx.post(
                f"{self.base_url}/api/generate",
                json=payload,
                timeout=60.0
            )
            if response.status_code == 200:
                resp_data = response.json()
                try:
                    keywords = json.loads(resp_data.get("response", "[]"))
                    return keywords if isinstance(keywords, list) else []
                except json.JSONDecodeError:
                    return []
        except Exception as e:
            print(f"Local Claude error: {e}")

        return []

    def match_keywords_to_primavera(self, keywords: List[Dict]) -> List[PrimaveraTaskMatch]:
        """
        Match extracted keywords to Primavera tasks using RAG vector search.
        """
        if not keywords or not vector_store.activities:
            return []

        all_matches: Dict[str, PrimaveraTaskMatch] = {}

        for keyword_obj in keywords:
            keyword = keyword_obj.get("keyword", "").strip()
            category = keyword_obj.get("category", "")
            confidence = keyword_obj.get("confidence", 0.5)

            if not keyword:
                continue

            # Search vector store for matching Primavera tasks
            query = f"{keyword} {category}"
            search_results = vector_store.search(query, k=5)

            for activity, vec_score in search_results:
                # Combine confidence: keyword confidence + vector similarity
                combined_confidence = (confidence * 0.4) + (vec_score * 0.6)

                activity_id = activity.activity_id
                if activity_id not in all_matches:
                    all_matches[activity_id] = PrimaveraTaskMatch(
                        activity_id=activity_id,
                        activity_name=activity.activity_name,
                        task_code=getattr(activity, "task_code", ""),
                        discipline=getattr(activity.discipline, "value", "unknown"),
                        status=getattr(activity, "status", "unknown"),
                        confidence_score=combined_confidence,
                        matched_keywords=[keyword],
                        rationale=f"Matched via keyword '{keyword}' (confidence: {combined_confidence:.2f})"
                    )
                else:
                    # Update existing match with additional keyword
                    existing = all_matches[activity_id]
                    if keyword not in existing.matched_keywords:
                        existing.matched_keywords.append(keyword)
                    # Update confidence if this keyword provides better match
                    if combined_confidence > existing.confidence_score:
                        existing.confidence_score = combined_confidence

        # Sort by confidence score and return top matches
        matches = sorted(all_matches.values(), key=lambda x: x.confidence_score, reverse=True)
        return matches[:10]  # Return top 10 matches

    def extract_and_match(self, field_report: str) -> Dict:
        """
        Full pipeline: extract keywords with Claude, then match to Primavera tasks.
        """
        keywords = self.extract_keywords_with_claude(field_report)

        if not keywords:
            return {
                "success": False,
                "keywords": [],
                "primavera_matches": [],
                "error": "No keywords extracted"
            }

        primavera_matches = self.match_keywords_to_primavera(keywords)

        return {
            "success": True,
            "keywords_extracted": len(keywords),
            "keywords": keywords,
            "primavera_matches": [
                {
                    "activity_id": m.activity_id,
                    "activity_name": m.activity_name,
                    "task_code": m.task_code,
                    "discipline": m.discipline,
                    "confidence_score": round(m.confidence_score, 3),
                    "matched_keywords": m.matched_keywords,
                    "rationale": m.rationale
                }
                for m in primavera_matches
            ]
        }


# Singleton instance
_extractor: Optional[ClaudeKeywordExtractor] = None


def get_claude_keyword_extractor() -> ClaudeKeywordExtractor:
    """Get or create singleton extractor instance."""
    global _extractor
    if _extractor is None:
        _extractor = ClaudeKeywordExtractor()
    return _extractor
