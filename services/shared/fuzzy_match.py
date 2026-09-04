"""
Fuzzy keyword matching shared by discipline classifiers and the RAG knowledge base.

Plain substring matching misses inflected word forms that are extremely common
in field reports: "excavation" (glossary term) vs "excavated"/"excavating" (what
someone actually typed), "weld" vs "welding", "concrete" vs "concreting". This
module adds a stem-prefix comparison for that case, which is precise enough to
avoid matching unrelated short words that merely share a substring (e.g. "cable"
must never match "table" or "gable" - those share no common prefix).
"""

import re
from typing import Iterable

_WORD_RE = re.compile(r"[a-z0-9]+")


def tokenize(text_lower: str) -> set:
    """Splits lowercased text into a set of word tokens."""
    return set(_WORD_RE.findall(text_lower))


def _stems_match(a: str, b: str) -> bool:
    """True if `a` and `b` share a long-enough common prefix to be the same
    word stem with a different suffix (verb tense, plural, -ion/-ing/-ed)."""
    if len(a) < 4 or len(b) < 4:
        return False
    shorter = min(len(a), len(b))
    prefix_len = 0
    for ca, cb in zip(a, b):
        if ca != cb:
            break
        prefix_len += 1
    min_prefix = 3 if shorter <= 4 else 4
    return prefix_len >= max(min_prefix, round(0.65 * shorter))


def keyword_in_text(text_lower: str, tokens: set, keyword: str) -> bool:
    """
    True if `keyword` (already lowercase) is present in `text_lower`, exactly or
    as a same-stem match against individual words (covers plurals/verb tenses
    like "excavated" for glossary term "excavation"). `tokens` should be
    tokenize(text_lower), passed in so callers can reuse it across many checks.
    """
    if keyword in text_lower:
        return True

    kw_words = keyword.split()
    if len(kw_words) == 1:
        # Single-word keyword: fuzzy stem match only (exact substring already
        # checked above). Short abbreviations (e.g. "ndt", "mcc") are never
        # long enough for _stems_match, so they require an exact hit.
        return any(_stems_match(keyword, tok) for tok in tokens)

    # Multi-word phrase: every significant word needs a hit; short connector
    # words within the phrase (e.g. "and", "of") don't gate the match.
    return all(
        len(w) < 4 or any(_stems_match(w, tok) for tok in tokens)
        for w in kw_words
    )


def any_keyword_in_text(text_lower: str, keywords: Iterable[str]) -> bool:
    tokens = tokenize(text_lower)
    return any(keyword_in_text(text_lower, tokens, kw) for kw in keywords)
