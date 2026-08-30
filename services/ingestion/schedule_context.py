"""
Schedule-Aware Context Enrichment Module for Setu Ingestion Service (SIH26122 - Member A).
Enhances RAG with schedule context to disambiguate field activities by project timeline.
"""

from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional, Union


class ScheduleContextEnricher:
    """
    Enriches candidate activities with temporal boost scores based on project schedule alignment.
    """

    def __init__(self, schedule_store: Optional[Dict[str, Dict[str, Dict[str, Any]]]] = None):
        """
        Initialize with optional schedule store mapping project_id -> {activity_id/name: schedule_info}
        """
        self._schedule_store = schedule_store or {
            "oil_india_2026": {
                "24-inch spool erection": {
                    "start_date": "2026-08-20",
                    "end_date": "2026-09-05",
                    "discipline": "piping"
                },
                "12-inch spool erection": {
                    "start_date": "2026-09-15",
                    "end_date": "2026-09-30",
                    "discipline": "piping"
                },
                "Foundation TK-101 excavation": {
                    "start_date": "2026-08-10",
                    "end_date": "2026-08-25",
                    "discipline": "civil"
                },
                "Piping line 24-PL-001": {
                    "start_date": "2026-08-15",
                    "end_date": "2026-08-31",
                    "discipline": "piping"
                }
            }
        }

    def load_schedule(self, project_id: str) -> Dict[str, Dict[str, Any]]:
        """
        Loads schedule metadata for the given project_id.
        Returns a dictionary mapping activity key to date information.
        """
        return self._schedule_store.get(project_id, {})

    def _parse_date(self, val: Union[datetime, date, str]) -> Optional[date]:
        """Helper to safely parse dates into datetime.date."""
        if isinstance(val, datetime):
            return val.date()
        if isinstance(val, date):
            return val
        if isinstance(val, str):
            try:
                return datetime.fromisoformat(val.replace("Z", "")).date()
            except Exception:
                try:
                    return datetime.strptime(val, "%Y-%m-%d").date()
                except Exception:
                    return None
        return None

    def get_temporal_boost(
        self,
        activity: Dict[str, Any],
        current_date: Optional[Union[datetime, date, str]] = None
    ) -> float:
        """
        Calculates a temporal boost score between 0.0 and 1.0 based on whether
        the activity's scheduled dates overlap with or are close to current_date.
        """
        if current_date is None:
            curr = date.today()
        else:
            parsed_curr = self._parse_date(current_date)
            curr = parsed_curr if parsed_curr is not None else date.today()

        # Extract start and end dates from candidate or activity schedule metadata
        start_date = self._parse_date(activity.get("start_date") or activity.get("scheduled_start"))
        end_date = self._parse_date(activity.get("end_date") or activity.get("scheduled_end"))

        if not start_date and not end_date:
            return 0.0

        if start_date and not end_date:
            end_date = start_date + timedelta(days=7)
        elif end_date and not start_date:
            start_date = end_date - timedelta(days=7)

        assert start_date is not None and end_date is not None

        # Check exact overlap window
        if start_date <= curr <= end_date:
            return 1.0

        # Calculate distance if out of window
        if curr < start_date:
            diff_days = (start_date - curr).days
        else:
            diff_days = (curr - end_date).days

        # Decaying boost for nearby dates (within 14 days)
        if diff_days <= 14:
            return round(max(0.0, 1.0 - (diff_days / 14.0)), 3)

        return 0.0

    def enrich_results(
        self,
        candidates: List[Dict[str, Any]],
        project_id: str = "oil_india_2026",
        current_date: Optional[Union[datetime, date, str]] = None
    ) -> List[Dict[str, Any]]:
        """
        Enriches a list of candidate dictionaries with temporal boost and reranks them.
        Returns top-k ranked candidates by (retrieval_score + temporal_boost).
        """
        schedule_data = self.load_schedule(project_id)
        enriched_candidates = []

        for cand in candidates:
            item = dict(cand)

            # Lookup activity schedule info from project schedule if available
            act_name = item.get("activity") or item.get("activity_name") or item.get("title") or ""
            if act_name in schedule_data:
                sched_info = schedule_data[act_name]
                if "start_date" not in item and "start_date" in sched_info:
                    item["start_date"] = sched_info["start_date"]
                if "end_date" not in item and "end_date" in sched_info:
                    item["end_date"] = sched_info["end_date"]

            temporal_boost = self.get_temporal_boost(item, current_date=current_date)
            retrieval_score = float(item.get("retrieval_score", item.get("score", 0.5)))
            final_score = round(retrieval_score + temporal_boost, 3)

            item["temporal_boost"] = temporal_boost
            item["retrieval_score"] = retrieval_score
            item["final_score"] = final_score
            item["score"] = final_score

            enriched_candidates.append(item)

        # Rank candidates by final_score descending
        enriched_candidates.sort(key=lambda x: x["final_score"], reverse=True)
        return enriched_candidates
