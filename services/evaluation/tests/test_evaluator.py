import os
import unittest
import tempfile
from services.evaluation.evaluator import EvaluationFramework, evaluator


class TestEvaluationFramework(unittest.TestCase):

    def setUp(self):
        self.eval_framework = EvaluationFramework()

    def test_default_gold_standard(self):
        self.assertEqual(len(self.eval_framework.gold_standard), 50)
        self.assertIn("input_text", self.eval_framework.gold_standard[0])

    def test_evaluate_pipeline(self):
        result = self.eval_framework.evaluate_pipeline(
            self.eval_framework.gold_standard[:10],
            "7_Plus_Logistic_Calibration"
        )
        self.assertEqual(result["phase"], "7_Plus_Logistic_Calibration")
        self.assertGreaterEqual(result["accuracy_pct"], 0.0)
        self.assertLessEqual(result["accuracy_pct"], 100.0)

    def test_run_ablation_study(self):
        results = self.eval_framework.run_ablation_study(self.eval_framework.gold_standard[:10])
        self.assertEqual(len(results), 7)

    def test_generate_report(self):
        with tempfile.TemporaryDirectory() as tmpdir:
            results = self.eval_framework.run_ablation_study(self.eval_framework.gold_standard[:5])
            out = self.eval_framework.generate_report(results, output_dir=tmpdir)
            self.assertTrue(os.path.exists(out["csv_path"]))
            self.assertTrue(os.path.exists(out["json_path"]))
            self.assertTrue(os.path.exists(out["md_path"]))


if __name__ == "__main__":
    unittest.main()
