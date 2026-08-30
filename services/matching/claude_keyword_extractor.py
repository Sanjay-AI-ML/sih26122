"""
Claude AI + RAG Keyword Extraction Service for Primavera Task Matching.
Extracts intelligent keywords from field reports using Claude and matches them to Primavera tasks.
"""

import json
import os
import re
import httpx
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from difflib import SequenceMatcher
import string

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
                    if isinstance(keywords, list) and len(keywords) > 0:
                        return keywords
                except json.JSONDecodeError:
                    pass
        except Exception as e:
            print(f"Local Claude error: {e}")

        # Fallback: Rule-based extraction if LLM extraction fails
        return self._rule_based_extraction(field_report)

    def _rule_based_extraction(self, field_report: str) -> List[Dict]:
        """
        Fallback rule-based keyword extraction when LLM fails.
        Uses domain knowledge and regex patterns.
        """
        keywords = []
        text_lower = field_report.lower()

        # ACTIVITY extraction - look for action verbs
        activities = {
            "welding": "ACTIVITY",
            "erection": "ACTIVITY",
            "installation": "ACTIVITY",
            "inspection": "ACTIVITY",
            "testing": "ACTIVITY",
            "alignment": "ACTIVITY",
            "fabrication": "ACTIVITY",
            "painting": "ACTIVITY",
            "commissioning": "ACTIVITY",
            "completion": "ACTIVITY",
            "excavation": "ACTIVITY",
            "concreting": "ACTIVITY"
        }

        for activity, cat in activities.items():
            if activity in text_lower:
                keywords.append({
                    "keyword": activity,
                    "category": cat,
                    "confidence": 0.8,
                    "context": "Found in field report"
                })

        # CONTRACTOR extraction
        contractors = self.kb.get_contractors()
        for contractor in contractors:
            if contractor.lower() in text_lower:
                keywords.append({
                    "keyword": contractor,
                    "category": "CONTRACTOR",
                    "confidence": 0.9,
                    "context": f"Contractor: {contractor}"
                })

        # LOCATION extraction - look for sectors, areas, units
        import re
        sector_matches = re.findall(r'sector\s+(\d+|[A-Z])', text_lower, re.IGNORECASE)
        for sector in sector_matches:
            keywords.append({
                "keyword": f"Sector {sector}",
                "category": "LOCATION",
                "confidence": 0.85,
                "context": f"Location identified"
            })

        # EQUIPMENT extraction - piping tags
        tag_matches = re.findall(r'\d+-[A-Z]+-\d+', field_report)
        for tag in tag_matches:
            keywords.append({
                "keyword": tag,
                "category": "EQUIPMENT",
                "confidence": 0.95,
                "context": f"Equipment tag: {tag}"
            })

        # STATUS extraction
        status_map = self.kb.get_status_terms()
        for status_key, status_dict in status_map.items():
            canonical = status_dict.get("canonical", "").lower()
            if canonical and canonical in text_lower:
                keywords.append({
                    "keyword": canonical,
                    "category": "STATUS",
                    "confidence": 0.85,
                    "context": f"Status: {canonical}"
                })

        # QUANTITY extraction - percentages and measurements
        quantity_matches = re.findall(r'(\d+(?:\.\d+)?)\s*(%|meters|spools|MT|cubic|cum)', text_lower)
        for qty, unit in quantity_matches:
            keywords.append({
                "keyword": f"{qty} {unit}",
                "category": "QUANTITY",
                "confidence": 0.8,
                "context": f"Quantity: {qty} {unit}"
            })

        return keywords if keywords else []

    def _normalize_keyword_for_rag(self, keyword: str) -> Tuple[str, float]:
        """
        Normalize keyword and detect spelling mistakes using fuzzy matching.
        Returns (normalized_keyword, spelling_confidence_boost).

        Examples:
        - "spol" → ("spool", 0.15) - detected typo, boost confidence
        - "errection" → ("erection", 0.15) - detected spelling mistake
        - "spool" → ("spool", 0.0) - correct spelling, no boost
        """
        keyword_lower = keyword.lower().strip()

        # Common spelling mistakes and variations in oil/gas domain
        spelling_corrections = {
            "spol": "spool",
            "errection": "erection",
            "welding": "welding",
            "excavtion": "excavation",
            "complet": "complete",
            "fiinished": "finished",
            "finsihed": "finished",
            "eleectrical": "electrical",
            "pipng": "piping",
            "civl": "civil",
            "instructment": "instrumentation",
            "testin": "testing",
            "inspecion": "inspection",
        }

        if keyword_lower in spelling_corrections:
            # Detected spelling mistake - boost confidence for LOCAL Claude
            corrected = spelling_corrections[keyword_lower]
            return corrected, 0.15  # +15% confidence for spelling correction

        # Fuzzy match against known activities
        known_activities = [
            "spool", "erection", "welding", "inspection", "testing",
            "excavation", "completion", "electrical", "piping", "civil",
            "installation", "alignment", "fabrication", "commissioning"
        ]

        best_match = None
        best_ratio = 0.85  # Only consider >= 85% similarity as a match

        for activity in known_activities:
            ratio = SequenceMatcher(None, keyword_lower, activity).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_match = activity

        if best_match and best_ratio > 0.85:
            # Fuzzy match found - boost confidence
            boost = (best_ratio - 0.85) * 0.3  # Up to +15% based on match quality
            return best_match, boost

        # No correction found - return original
        return keyword_lower, 0.0

    def match_keywords_to_primavera(self, keywords: List[Dict]) -> List[PrimaveraTaskMatch]:
        """
        Match extracted keywords to Primavera tasks using RAG vector search.

        Now includes:
        - Fuzzy matching for spelling mistakes ("spol" → "spool")
        - LOCAL Claude understanding of variations
        - Confidence boost for corrected keywords
        """
        if not keywords or not vector_store.activities:
            return []

        all_matches: Dict[str, PrimaveraTaskMatch] = {}

        for keyword_obj in keywords:
            keyword = keyword_obj.get("keyword", "").strip()
            category = keyword_obj.get("category", "")
            base_confidence = keyword_obj.get("confidence", 0.5)

            if not keyword:
                continue

            # FUZZY MATCHING: Normalize keyword and detect spelling mistakes
            normalized_keyword, spelling_boost = self._normalize_keyword_for_rag(keyword)

            # Boost confidence for spelling corrections (LOCAL Claude intelligence)
            keyword_confidence = min(1.0, base_confidence + spelling_boost)

            # Search vector store for matching Primavera tasks
            # Use normalized keyword for better RAG matching
            query = f"{normalized_keyword} {category}"
            search_results = vector_store.search(query, k=5)

            for activity, vec_score in search_results:
                # Combine confidence: keyword confidence + vector similarity
                combined_confidence = (keyword_confidence * 0.4) + (vec_score * 0.6)

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
                        rationale=f"Matched via keyword '{keyword}' → '{normalized_keyword}' (LOCAL Claude: {combined_confidence:.2f})"
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
