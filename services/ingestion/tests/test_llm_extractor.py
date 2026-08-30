import unittest
from unittest.mock import patch, MagicMock
from services.ingestion.llm_extractor import LLMExtractor


class TestLLMExtractorStrict(unittest.TestCase):

    def setUp(self):
        self.extractor = LLMExtractor(base_url="http://localhost:11434", model_name="llama3.2:latest")

    @patch("httpx.post")
    def test_successful_llm_extraction(self, mock_post):
        mock_resp1 = MagicMock()
        mock_resp1.status_code = 200
        mock_resp1.json.return_value = {
            "response": '{"events": [{"activity_phrase": "Cable pulling", "discipline": "electrical", "tag_or_line_id": "TAG-201", "quantity": 100, "unit": "meters"}]}'
        }

        mock_resp2 = MagicMock()
        mock_resp2.status_code = 200
        mock_resp2.json.return_value = {
            "response": '{"events": [{"activity_phrase": "Cable pulling", "discipline": "electrical", "tag_or_line_id": "TAG-201", "quantity": 100, "unit": "meters"}]}'
        }

        mock_post.side_effect = [mock_resp1, mock_resp2]

        events = self.extractor.extract_with_llm("Cable pulling for main substation 100 meters done")
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0].activity_phrase, "Cable pulling")
        self.assertEqual(events[0].tag_or_line_id, "TAG-201")
        self.assertEqual(events[0].quantity, 100.0)

    @patch("httpx.post")
    def test_llm_failure_raises_loudly(self, mock_post):
        mock_resp = MagicMock()
        mock_resp.status_code = 500
        mock_resp.text = "Internal Server Error"
        mock_post.return_value = mock_resp

        with self.assertRaises(RuntimeError) as ctx:
            self.extractor.extract_with_llm("Cable pulling for main substation 100 meters done")

        self.assertIn("LLM Extraction failed with status code 500", str(ctx.exception))


if __name__ == "__main__":
    unittest.main()
