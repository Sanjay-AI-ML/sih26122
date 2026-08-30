import unittest
import numpy as np
from services.matching.confidence_calibrator import ConfidenceCalibrator, confidence_calibrator


class TestConfidenceCalibrator(unittest.TestCase):

    def setUp(self):
        self.calibrator = ConfidenceCalibrator()

    def test_model_training(self):
        self.assertTrue(self.calibrator.is_trained)


    def test_high_confidence_features(self):
        features = {
            "rag_match_score": 0.95,
            "bm25_similarity": 0.90,
            "semantic_similarity": 0.96,
            "reranker_score": 0.94,
            "granularity_flag": 0.0,
            "discipline_confidence": 1.0
        }
        score = self.calibrator.calibrate(features)
        self.assertGreaterEqual(score, 0.70)
        self.assertLessEqual(score, 1.0)

    def test_low_confidence_features(self):
        features = {
            "rag_match_score": 0.3,
            "bm25_similarity": 0.2,
            "semantic_similarity": 0.4,
            "reranker_score": 0.3,
            "granularity_flag": 1.0,
            "discipline_confidence": 0.5
        }
        score = self.calibrator.calibrate(features)
        self.assertLessEqual(score, 0.50)

    def test_synthetic_data_generation(self):
        X, y = self.calibrator._generate_synthetic_historical_data(200)
        self.assertEqual(X.shape[0], 200)
        self.assertEqual(X.shape[1], 6)
        self.assertEqual(len(y), 200)


if __name__ == '__main__':
    unittest.main()
