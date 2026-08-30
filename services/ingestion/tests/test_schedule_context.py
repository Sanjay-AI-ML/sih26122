"""
Unit tests for Phase 5 Schedule-Aware Context Enrichment (ScheduleContextEnricher).
"""

import unittest
from datetime import datetime, date
from services.ingestion.schedule_context import ScheduleContextEnricher


class TestScheduleContextEnricher(unittest.TestCase):

    def test_load_schedule(self):
        enricher = ScheduleContextEnricher()
        schedule = enricher.load_schedule("oil_india_2026")
        self.assertIn("24-inch spool erection", schedule)
        self.assertEqual(schedule["24-inch spool erection"]["discipline"], "piping")
        self.assertEqual(enricher.load_schedule("non_existent_project"), {})

    def test_get_temporal_boost_exact_overlap(self):
        enricher = ScheduleContextEnricher()
        activity = {
            "start_date": "2026-08-20",
            "end_date": "2026-09-05"
        }
        # Current date is inside the schedule window
        boost = enricher.get_temporal_boost(activity, current_date="2026-08-28")
        self.assertEqual(boost, 1.0)

    def test_get_temporal_boost_decaying(self):
        enricher = ScheduleContextEnricher()
        activity = {
            "start_date": "2026-09-15",
            "end_date": "2026-09-30"
        }
        # Current date is 7 days before start_date (2026-09-08 vs 2026-09-15)
        boost = enricher.get_temporal_boost(activity, current_date="2026-09-08")
        self.assertTrue(0.0 < boost < 1.0)
        self.assertEqual(boost, round(1.0 - (7 / 14.0), 3))

        # Current date is far outside the window (> 14 days)
        boost_far = enricher.get_temporal_boost(activity, current_date="2026-08-01")
        self.assertEqual(boost_far, 0.0)

    def test_enrich_results_reranking(self):
        enricher = ScheduleContextEnricher()
        candidates = [
            {
                "activity": "12-inch spool erection",
                "retrieval_score": 0.90
            },
            {
                "activity": "24-inch spool erection",
                "retrieval_score": 0.75
            }
        ]

        # At current_date 2026-08-28, 24-inch spool erection is active (boost = 1.0),
        # while 12-inch spool erection starts 2026-09-15 (boost ~ 0.0)
        enriched = enricher.enrich_results(
            candidates,
            project_id="oil_india_2026",
            current_date="2026-08-28"
        )

        self.assertEqual(len(enriched), 2)
        # 24-inch candidate should be ranked #1 despite lower retrieval_score due to temporal boost
        self.assertEqual(enriched[0]["activity"], "24-inch spool erection")
        self.assertEqual(enriched[0]["temporal_boost"], 1.0)
        self.assertEqual(enriched[0]["final_score"], 1.75)
        self.assertEqual(enriched[1]["activity"], "12-inch spool erection")


if __name__ == "__main__":
    unittest.main()
