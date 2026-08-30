import unittest
from services.matching.reranker import CrossEncoderReranker, cross_encoder_reranker
from services.matching.schemas import Candidate


class TestCrossEncoderReranker(unittest.TestCase):

    def setUp(self):
        self.reranker = CrossEncoderReranker()
        self.sample_candidates = [
            Candidate(activity_id="L6-ELE-201", activity_name="Cable pulling for main substation", score=0.75, rationale="test"),
            Candidate(activity_id="L6-PIP-402", activity_name="Hydro-testing cooling water line", score=0.80, rationale="test"),
            Candidate(activity_id="L6-CIV-104", activity_name="Generator foundation concrete pour", score=0.60, rationale="test")
        ]

    def test_score_candidates(self):
        query = "Cable pulling electrical substation"
        scored = self.reranker.score_candidates(query, self.sample_candidates)
        self.assertEqual(len(scored), 3)
        self.assertIn("candidate", scored[0])
        self.assertIn("rerank_score", scored[0])
        self.assertGreaterEqual(scored[0]["rerank_score"], 0.0)
        self.assertLessEqual(scored[0]["rerank_score"], 1.0)

    def test_rerank_top_k(self):
        query = "Cable pulling electrical substation"
        reranked = self.reranker.rerank_top_k(query, self.sample_candidates, k=2)
        self.assertEqual(len(reranked), 2)
        # Top candidate should be the electrical cable pulling activity
        self.assertEqual(reranked[0].activity_id, "L6-ELE-201")

    def test_empty_candidates(self):
        scored = self.reranker.score_candidates("Query", [])
        self.assertEqual(scored, [])
        reranked = self.reranker.rerank_top_k("Query", [], k=5)
        self.assertEqual(reranked, [])


if __name__ == "__main__":
    unittest.main()
