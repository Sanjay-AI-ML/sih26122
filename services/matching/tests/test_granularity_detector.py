import unittest
from services.matching.granularity_detector import GranularityDetector, granularity_detector
from services.matching.schemas import Candidate


class TestGranularityDetector(unittest.TestCase):

    def test_detect_granularity_report_level(self):
        self.assertEqual(GranularityDetector.detect_granularity("All spools completed today"), "report")
        self.assertEqual(GranularityDetector.detect_granularity("Every valve tested and cleared"), "report")
        self.assertEqual(GranularityDetector.detect_granularity("Complete set of pipe joints done"), "report")

    def test_detect_granularity_item_level(self):
        self.assertEqual(GranularityDetector.detect_granularity("Spool_24 installed at unit 1"), "item")
        self.assertEqual(GranularityDetector.detect_granularity("Valve #104 pressure tested"), "item")
        self.assertEqual(GranularityDetector.detect_granularity("TAG-201 cable pulling done"), "item")

    def test_detect_granularity_batch_level(self):
        self.assertEqual(GranularityDetector.detect_granularity("5 spools welded in workshop"), "batch")

    def test_find_mismatches_coarse_text(self):
        candidates = [
            Candidate(activity_id="L6-PIP-401", activity_name="Spool 24 Erection", score=0.9, rationale="test"),
            Candidate(activity_id="L6-PIP-402", activity_name="Spool 36 Erection", score=0.85, rationale="test")
        ]
        mismatches = GranularityDetector.find_mismatches("All spools completed", candidates)
        self.assertTrue(any("Coarse text" in m for m in mismatches))

    def test_find_mismatches_quantity(self):
        candidates = [
            Candidate(activity_id="L6-PIP-401", activity_name="Spool 24 Erection", score=0.9, rationale="test"),
            Candidate(activity_id="L6-PIP-402", activity_name="Spool 36 Erection", score=0.85, rationale="test"),
            Candidate(activity_id="L6-PIP-403", activity_name="Spool 42 Erection", score=0.8, rationale="test")
        ]
        mismatches = GranularityDetector.find_mismatches("1 spools done", candidates)
        self.assertTrue(any("Quantity mismatch" in m for m in mismatches))

    def test_suggest_clarification(self):
        candidates = [
            Candidate(activity_id="L6-PIP-401", activity_name="Spool 24", score=0.9, rationale="test"),
            Candidate(activity_id="L6-PIP-402", activity_name="Spool 36", score=0.85, rationale="test")
        ]
        suggestion = GranularityDetector.suggest_clarification("All spools completed", candidates)
        self.assertIn("L6-PIP-401, L6-PIP-402", suggestion)


if __name__ == '__main__':
    unittest.main()
