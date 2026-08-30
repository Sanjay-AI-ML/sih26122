"""
Granularity Mismatch Detection Module (Phase 6).
Detects and handles mismatches between document-level and item-level granularity.
"""

import re
from typing import List, Optional, Dict, Any


class GranularityDetector:
    """
    Detects when field update text is coarser or more ambiguous than available
    schedule items or scope items.
    """

    REPORT_LEVEL_KEYWORDS = [
        "all", "every", "complete set", "full batch", "entire", "all of the",
        "whole", "total", "overall", "bulk", "complete", "everything"
    ]

    DRILL_DOWN_TERMS = [
        "size", "inch", "mm", "tag", "line", "unit", "area", "zone", "sector",
        "block", "spool_", "pipe_", "valve_", "foundation_", "spool #", "line #"
    ]

    @classmethod
    def detect_granularity(cls, text: str) -> str:
        """
        Determines the granularity level of the text.
        Returns: "report", "batch", "item", or "unknown"
        """
        if not text or not text.strip():
            return "unknown"

        text_lower = text.lower()

        # Check for item-level specific tags/identifiers or numbers with units/identifiers
        has_item_tag = bool(re.search(r'\b[a-z0-9]+[-_][a-z0-9]+[-_]?[a-z0-9]*\b', text_lower))
        has_item_num = bool(re.search(r'\b(spool|line|tag|valve|pipe|node|block|substation)\s*#?\s*\d+\b', text_lower))

        # Check for report-level coarse keywords
        has_coarse_kw = any(re.search(rf"\b{re.escape(kw)}\b", text_lower) for kw in cls.REPORT_LEVEL_KEYWORDS)

        if has_item_tag or has_item_num:
            if has_coarse_kw:
                return "batch"
            return "item"

        if has_coarse_kw:
            return "report"

        # Check if text contains batch indicators (e.g., "5 spools", "3 valves")
        batch_match = re.search(r'\b\d+\s+(spools|valves|lines|pipes|joints|foundations|cables)\b', text_lower)
        if batch_match:
            return "batch"

        return "unknown"

    @classmethod
    def find_mismatches(cls, text: str, matched_items: List[Any]) -> List[str]:
        """
        Detects mismatches between text granularity and matched_items.
        Returns a list of warning strings.
        """
        warnings = []
        if not text:
            return warnings

        text_lower = text.lower()
        granularity = cls.detect_granularity(text)

        # Rule 1: Coarse text ("all", "every") vs specific scope/items
        has_coarse_kw = any(re.search(rf"\b{re.escape(kw)}\b", text_lower) for kw in cls.REPORT_LEVEL_KEYWORDS)
        if has_coarse_kw and len(matched_items) > 1:
            warnings.append(
                f"Coarse text ('{text}') matched against {len(matched_items)} items. Granularity mismatch (report-level vs item-level)."
            )

        # Rule 2: Quantity mismatch (text quantity < items in scope)
        qty_match = re.search(r'\b(\d+)\s+(?:spools|valves|items|lines|units|joints)\b', text_lower)
        if qty_match:
            stated_qty = int(qty_match.group(1))
            if stated_qty < len(matched_items):
                warnings.append(
                    f"Quantity mismatch: Field text specifies {stated_qty} item(s), but {len(matched_items)} candidate items are in scope."
                )

        # Rule 3: Missing drill-down terms (size, location, tag)
        has_drill_down = any(term in text_lower for term in cls.DRILL_DOWN_TERMS) or bool(re.search(r'\b\d+[-_]?[a-z]+\b', text_lower))
        if not has_drill_down and len(matched_items) > 1:
            warnings.append("Ambiguous granularity: Missing specific drill-down details (size, location, or tag identifier).")

        return warnings

    @classmethod
    def suggest_clarification(cls, text: str, items: List[Any]) -> str:
        """
        Generates a user prompt requesting clarification when granularity is coarse or ambiguous.
        """
        item_names = []
        for it in items:
            if hasattr(it, "activity_id"):
                item_names.append(it.activity_id)
            elif hasattr(it, "activity_name"):
                item_names.append(it.activity_name)
            elif isinstance(it, dict):
                item_names.append(it.get("activity_id") or it.get("name") or str(it))
            else:
                item_names.append(str(it))

        items_str = ", ".join(item_names[:5])
        if len(item_names) > 5:
            items_str += f" (+{len(item_names)-5} more)"

        return (
            f"Field report '{text}' is at report-level granularity. "
            f"Please clarify which specific item(s) among [{items_str}] this update applies to."
        )


granularity_detector = GranularityDetector()
