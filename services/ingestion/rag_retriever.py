"""
RAG Retriever for Domain Context Injection (SIH26122 - Member A).
Loads engineering terminology, equipment taxonomy, and abbreviations from data/engineering_glossary.json
and formats high-relevance domain context to augment LLM system prompts before extraction.
"""

import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Union


class RAGRetriever:
    """
    Retrieves relevant domain glossary definitions and engineering context
    to inject into LLM extraction prompts.
    """

    def __init__(self, glossary_path: Optional[Union[str, Path]] = None):
        self.glossary_path = self._resolve_glossary_path(glossary_path)
        self.glossary_data: Dict[str, Any] = {}
        self.indexed_terms: List[Dict[str, Any]] = []
        self._load_and_index_glossary()

    def _resolve_glossary_path(self, custom_path: Optional[Union[str, Path]]) -> Path:
        if custom_path:
            return Path(custom_path)

        env_path = os.getenv("ENGINEERING_GLOSSARY_PATH")
        if env_path and Path(env_path).exists():
            return Path(env_path)

        # Standard project layout: <root>/data/engineering_glossary.json
        candidate_paths = [
            Path(__file__).resolve().parent.parent.parent / "data" / "engineering_glossary.json",
            Path.cwd() / "data" / "engineering_glossary.json",
            Path("/home/mayank/real/data/engineering_glossary.json")
        ]
        for p in candidate_paths:
            if p.exists():
                return p

        # Fallback default
        return candidate_paths[0]

    def _load_and_index_glossary(self) -> None:
        """Loads and indexes the glossary data for fast term lookup."""
        if not self.glossary_path.exists():
            self.glossary_data = {}
            self.indexed_terms = []
            return

        try:
            with open(self.glossary_path, "r", encoding="utf-8") as f:
                self.glossary_data = json.load(f)
        except Exception:
            self.glossary_data = {}
            self.indexed_terms = []
            return

        disciplines = self.glossary_data.get("disciplines", {})
        terms_list: List[Dict[str, Any]] = []

        for disc_name, items in disciplines.items():
            if isinstance(items, list):
                for item in items:
                    term_str = item.get("term", "").strip()
                    abbr = item.get("abbreviation", "").strip()
                    keywords = [k.lower() for k in item.get("keywords", [])]
                    definition = item.get("definition", "").strip()
                    typical_units = item.get("typical_units", [])
                    discipline = item.get("discipline", disc_name).strip()

                    terms_list.append({
                        "term": term_str,
                        "term_lower": term_str.lower(),
                        "abbreviation": abbr,
                        "abbreviation_lower": abbr.lower(),
                        "discipline": discipline,
                        "definition": definition,
                        "typical_units": typical_units,
                        "keywords": keywords,
                    })

        self.indexed_terms = terms_list

    def retrieve_context(self, text: str, top_k: int = 5, min_score: float = 1.0) -> List[Dict[str, Any]]:
        """
        Retrieves relevant engineering terminology and context matching the input text.
        """
        if not text or not isinstance(text, str) or not self.indexed_terms:
            return []

        text_lower = text.lower()
        scored_results: List[tuple[float, Dict[str, Any]]] = []

        # Find word tokens for whole-word boundary matching
        words = set(re.findall(r"\b\w+\b", text_lower))

        for entry in self.indexed_terms:
            score = 0.0
            term_lower = entry["term_lower"]
            abbr_lower = entry["abbreviation_lower"]
            keywords = entry["keywords"]

            # Exact abbreviation matching (case-insensitive with word boundary)
            if abbr_lower and len(abbr_lower) >= 2 and abbr_lower in words:
                score += 10.0

            # Term exact match or substring in text
            if term_lower in text_lower:
                score += 8.0
            else:
                # Check individual significant words of multi-word terms
                term_tokens = set(re.findall(r"\b\w+\b", term_lower)) - {"and", "or", "the", "in", "of", "for", "to", "a"}
                matched_tokens = term_tokens.intersection(words)
                if matched_tokens:
                    score += len(matched_tokens) * 2.5

            # Keywords matching
            for kw in keywords:
                if " " in kw:
                    if kw in text_lower:
                        score += 5.0
                else:
                    if kw in words:
                        score += 3.0

            # Discipline boost if discipline word mentioned
            if entry["discipline"].lower() in text_lower:
                score += 1.5

            if score >= min_score:
                scored_results.append((score, entry))

        # Sort by score descending
        scored_results.sort(key=lambda x: x[0], reverse=True)

        top_entries: List[Dict[str, Any]] = []
        seen_terms = set()

        for score, entry in scored_results:
            t = entry["term"]
            if t not in seen_terms:
                seen_terms.add(t)
                top_entries.append({
                    "term": entry["term"],
                    "abbreviation": entry["abbreviation"],
                    "discipline": entry["discipline"],
                    "definition": entry["definition"],
                    "typical_units": entry["typical_units"],
                    "relevance_score": round(score, 2)
                })
                if len(top_entries) >= top_k:
                    break

        return top_entries

    def format_context_for_prompt(self, text: str, max_terms: int = 6) -> str:
        """
        Formats retrieved engineering glossary context as markdown bullet points
        ready to be injected into LLM / Claude system prompts.
        """
        retrieved = self.retrieve_context(text, top_k=max_terms)
        if not retrieved:
            return ""

        lines = []
        for item in retrieved:
            term = item["term"]
            abbr = f" ({item['abbreviation']})" if item.get("abbreviation") and item['abbreviation'] != term else ""
            disc = item.get("discipline", "").capitalize()
            defn = item.get("definition", "")
            units = ", ".join(item.get("typical_units", []))
            unit_str = f" [Typical Units: {units}]" if units else ""
            
            lines.append(f"- **{term}{abbr}** [{disc}]: {defn}{unit_str}")

        return "\n".join(lines)


# Singleton instance for quick module access
default_rag_retriever = RAGRetriever()
