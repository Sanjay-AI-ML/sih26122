"""
Engineering Knowledge Base for SAMANWAY.
Provides retrievable terminology, examples, and context for field report interpretation.
"""

import json
import os
from typing import List, Dict, Optional
from pathlib import Path


class EngineeringKnowledgeBase:
    """
    In-memory engineering knowledge base with terminology, examples, and context.
    """

    def __init__(self, glossary_path: Optional[str] = None):
        """
        Initialize knowledge base from glossary JSON.

        Args:
            glossary_path: Path to engineering_glossary.json
        """
        if glossary_path is None:
            # Default path
            glossary_path = os.path.join(
                os.path.dirname(__file__),
                "../../data/engineering_glossary.json"
            )

        self.glossary_path = glossary_path
        self.data = self._load_glossary()

    def _load_glossary(self) -> dict:
        """Load glossary from JSON file."""
        if not os.path.exists(self.glossary_path):
            return {}

        try:
            with open(self.glossary_path, 'r', encoding='utf-8') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError) as e:
            print(f"Warning: Could not load glossary: {e}")
            return {}

    def get_discipline_terms(self, discipline: str) -> List[Dict]:
        """
        Get all terminology for a discipline.

        Args:
            discipline: piping, civil, electrical, instrumentation, hse

        Returns:
            List of term dictionaries
        """
        return self.data.get(discipline, [])

    def get_status_terms(self) -> Dict:
        """Get status terminology mapping."""
        return self.data.get("status_terms", {})

    def get_units(self) -> Dict:
        """Get standard units."""
        return self.data.get("units", {})

    def get_contractors(self) -> List[str]:
        """Get list of known contractors."""
        return self.data.get("contractors", [])

    def get_abbreviations(self) -> Dict:
        """Get abbreviation mappings."""
        return self.data.get("abbreviations", {})

    def find_synonyms(self, term: str) -> List[str]:
        """
        Find all synonyms for a term across all disciplines.

        Args:
            term: The search term

        Returns:
            List of matching terms and their synonyms
        """
        results = []
        term_lower = term.lower()

        # Search through disciplines
        for discipline in ["piping", "civil", "electrical", "instrumentation", "hse"]:
            terms = self.get_discipline_terms(discipline)
            for term_dict in terms:
                if (term_lower in term_dict.get("canonical_term", "").lower() or
                    any(term_lower in s.lower() for s in term_dict.get("synonyms", []))):
                    results.append({
                        "canonical_term": term_dict.get("canonical_term"),
                        "synonyms": term_dict.get("synonyms", []),
                        "discipline": term_dict.get("discipline"),
                        "examples": term_dict.get("examples", [])
                    })

        # Search through status terms
        status_terms = self.get_status_terms()
        for status_key, status_dict in status_terms.items():
            if (term_lower in status_dict.get("canonical", "").lower() or
                any(term_lower in s.lower() for s in status_dict.get("synonyms", []))):
                results.append({
                    "canonical_term": status_dict.get("canonical"),
                    "synonyms": status_dict.get("synonyms", []),
                    "event_type": status_dict.get("event_type"),
                    "type": "status"
                })

        return results

    def get_discipline_from_keywords(self, text: str) -> Optional[str]:
        """
        Infer discipline from keywords in text.

        Args:
            text: Field report text

        Returns:
            Inferred discipline or None
        """
        text_lower = text.lower()

        # Check each discipline
        for discipline in ["piping", "civil", "electrical", "instrumentation", "hse"]:
            terms = self.get_discipline_terms(discipline)
            for term_dict in terms:
                canonical = term_dict.get("canonical_term", "").lower()
                if canonical in text_lower:
                    return discipline
                for synonym in term_dict.get("synonyms", []):
                    if synonym.lower() in text_lower:
                        return discipline

        return None

    def get_context_for_extraction(self, text: str, max_items: int = 5) -> str:
        """
        Generate context for LLM extraction from field text.

        Args:
            text: Field report text
            max_items: Maximum items to include

        Returns:
            Formatted context string for LLM prompt
        """
        context_parts = []

        # Infer discipline
        discipline = self.get_discipline_from_keywords(text)
        if discipline:
            context_parts.append(f"**Detected Discipline: {discipline.upper()}**")
            terms = self.get_discipline_terms(discipline)[:max_items]
            for term_dict in terms:
                canonical = term_dict.get("canonical_term", "")
                synonyms = ", ".join(term_dict.get("synonyms", []))
                examples = "; ".join(term_dict.get("examples", [])[:2])
                context_parts.append(
                    f"\n- {canonical} (also: {synonyms})\n  Example: {examples}"
                )

        # Add abbreviations if relevant
        abbrev = self.get_abbreviations()
        found_abbrevs = []
        for abbr_key, abbr_val in abbrev.items():
            if abbr_key.lower() in text.lower():
                found_abbrevs.append(f"{abbr_key} = {abbr_val}")

        if found_abbrevs:
            context_parts.append("\n**Abbreviations Found:**")
            context_parts.extend([f"- {a}" for a in found_abbrevs])

        # Add status terms
        status_terms = self.get_status_terms()
        found_status = []
        for status_key, status_dict in status_terms.items():
            canonical = status_dict.get("canonical", "").lower()
            if canonical in text.lower():
                found_status.append(
                    f"{canonical} → event_type: {status_dict.get('event_type')}"
                )

        if found_status:
            context_parts.append("\n**Status Indicators:**")
            context_parts.extend([f"- {s}" for s in found_status])

        return "\n".join(context_parts) if context_parts else ""


# Singleton instance
_kb: Optional[EngineeringKnowledgeBase] = None


def get_knowledge_base() -> EngineeringKnowledgeBase:
    """Get or create singleton knowledge base instance."""
    global _kb
    if _kb is None:
        _kb = EngineeringKnowledgeBase()
    return _kb


def reset_knowledge_base() -> None:
    """Reset singleton instance (useful for testing)."""
    global _kb
    _kb = None
