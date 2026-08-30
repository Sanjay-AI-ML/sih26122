"""
RAG (Retrieval-Augmented Generation) Retriever for SAMANWAY.
Retrieves relevant engineering knowledge to augment LLM extraction.
"""

from typing import List, Dict, Optional
from services.shared.knowledge_base import get_knowledge_base


class RAGRetriever:
    """
    Retrieves relevant engineering context from knowledge base.
    Used to augment LLM extraction prompts with domain knowledge.
    """

    def __init__(self):
        """Initialize RAG retriever with knowledge base."""
        self.kb = get_knowledge_base()

    def retrieve_context(
        self,
        text: str,
        max_items: int = 5,
        include_abbreviations: bool = True,
        include_status: bool = True,
    ) -> Dict:
        """
        Retrieve relevant context from knowledge base for given text.

        Args:
            text: Field report text to analyze
            max_items: Maximum items per category to retrieve
            include_abbreviations: Whether to include abbreviation mappings
            include_status: Whether to include status term mappings

        Returns:
            Dictionary with retrieved context organized by category
        """
        context = {
            "discipline": None,
            "discipline_terms": [],
            "examples": [],
            "abbreviations": [],
            "status_terms": [],
            "units": [],
            "contractors": []
        }

        text_lower = text.lower()

        # 1. Detect discipline from keywords
        discipline = self.kb.get_discipline_from_keywords(text)
        if discipline:
            context["discipline"] = discipline
            # Get all terms for this discipline
            terms = self.kb.get_discipline_terms(discipline)[:max_items]
            for term_dict in terms:
                context["discipline_terms"].append({
                    "canonical": term_dict.get("canonical_term"),
                    "synonyms": term_dict.get("synonyms", []),
                    "activity_type": term_dict.get("activity_type")
                })
                # Add examples
                for example in term_dict.get("examples", [])[:2]:
                    context["examples"].append(example)

        # 2. Find relevant abbreviations
        if include_abbreviations:
            abbrev_map = self.kb.get_abbreviations()
            for abbr, full in abbrev_map.items():
                if abbr.lower() in text_lower:
                    context["abbreviations"].append({
                        "abbreviation": abbr,
                        "meaning": full
                    })

        # 3. Find relevant status terms
        if include_status:
            status_map = self.kb.get_status_terms()
            for status_key, status_dict in status_map.items():
                canonical = status_dict.get("canonical", "").lower()
                if canonical in text_lower:
                    context["status_terms"].append({
                        "term": status_dict.get("canonical"),
                        "event_type": status_dict.get("event_type"),
                        "synonyms": status_dict.get("synonyms", [])
                    })

        # 4. Find relevant units
        units_map = self.kb.get_units()
        for unit_category, unit_list in units_map.items():
            for unit in unit_list:
                if unit.lower() in text_lower:
                    context["units"].append(unit)

        # 5. Find relevant contractors
        contractors = self.kb.get_contractors()
        for contractor in contractors:
            if contractor.lower() in text_lower:
                context["contractors"].append(contractor)

        return context

    def format_context_for_prompt(
        self,
        text: str,
        max_items: int = 5
    ) -> str:
        """
        Format retrieved context as a string for LLM prompt injection.

        Args:
            text: Field report text
            max_items: Maximum items per category

        Returns:
            Formatted string for including in LLM system/user prompt
        """
        context = self.retrieve_context(text, max_items)

        if not any([context["discipline_terms"], context["abbreviations"], context["status_terms"]]):
            return ""  # No relevant context found

        prompt_lines = []

        # Add discipline-specific terms
        if context["discipline_terms"]:
            prompt_lines.append("RELEVANT ENGINEERING TERMINOLOGY:")
            prompt_lines.append(f"Discipline: {context['discipline'].upper()}")
            for term in context["discipline_terms"]:
                canonical = term.get("canonical", "")
                synonyms = ", ".join(term.get("synonyms", []))
                prompt_lines.append(f"  • {canonical} (also called: {synonyms})")

        # Add examples
        if context["examples"]:
            prompt_lines.append("\nEXAMPLES FROM THIS DISCIPLINE:")
            for example in context["examples"][:3]:
                prompt_lines.append(f"  • {example}")

        # Add abbreviations
        if context["abbreviations"]:
            prompt_lines.append("\nABBREVIATIONS IN THIS DOCUMENT:")
            for abbr in context["abbreviations"]:
                prompt_lines.append(f"  • {abbr['abbreviation']} = {abbr['meaning']}")

        # Add status terms
        if context["status_terms"]:
            prompt_lines.append("\nSTATUS TERMS DETECTED:")
            for status in context["status_terms"]:
                prompt_lines.append(f"  • '{status['term']}' indicates event_type: {status['event_type']}")

        return "\n".join(prompt_lines)

    def find_synonyms(self, term: str) -> List[str]:
        """
        Find all synonyms for a term.

        Args:
            term: The search term

        Returns:
            List of matching terms and synonyms
        """
        results = self.kb.find_synonyms(term)
        all_synonyms = []
        for result in results:
            all_synonyms.append(result.get("canonical_term"))
            all_synonyms.extend(result.get("synonyms", []))
        return list(set(all_synonyms))

    def normalize_term(self, term: str) -> Optional[str]:
        """
        Normalize a term to its canonical form.

        Args:
            term: The term to normalize

        Returns:
            Canonical term or None if not found
        """
        results = self.kb.find_synonyms(term)
        if results:
            return results[0].get("canonical_term")
        return None


# Singleton instance
_retriever: Optional[RAGRetriever] = None


def get_rag_retriever() -> RAGRetriever:
    """Get or create singleton RAG retriever instance."""
    global _retriever
    if _retriever is None:
        _retriever = RAGRetriever()
    return _retriever


def reset_rag_retriever() -> None:
    """Reset singleton instance (useful for testing)."""
    global _retriever
    _retriever = None
