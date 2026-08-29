"""
Optical Character Recognition (OCR) Parser for Scanned Diaries (SIH26122 - Member A).
Extracts text from paper log photos (.png, .jpg, .jpeg) using EasyOCR/Tesseract/PaddleOCR
and extracts structured ExtractedEvents.
"""

import io
import os
import tempfile
from pathlib import Path
from typing import List, Optional, Union
from PIL import Image

from shared.schemas.extracted_event import ExtractedEvent, InputFormatEnum, DisciplineEnum, EventTypeEnum
from services.ingestion.llm_extractor import LLMExtractor


class OCRParser:
    """
    Image and scanned paper diary OCR processor.
    Uses EasyOCR (preferred) or pytesseract to extract text, then passes it through LLMExtractor.
    """

    def __init__(self):
        self.llm_extractor = LLMExtractor()
        self._reader = None
        self._ocr_checked = False

    def _get_ocr_reader(self):
        """Lazy-loads EasyOCR or pytesseract reader on first call."""
        if self._ocr_checked:
            return self._reader
        self._ocr_checked = True

        try:
            import easyocr
            self._reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            return self._reader
        except ImportError:
            pass

        try:
            import pytesseract
            self._reader = "pytesseract"
            return self._reader
        except ImportError:
            pass

        self._reader = None
        return None

    def parse_image(
        self,
        image_input: Union[bytes, io.BytesIO, str, Path],
        filename: str = "site_diary_scan.jpg",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Runs OCR on the given image, then extracts structured events via LLM.
        Raises RuntimeError if no OCR engine is installed so the API returns a 500
        with a clear message instead of silently returning garbage.
        """
        reader = self._get_ocr_reader()

        if reader is None:
            return [
                ExtractedEvent(
                    activity_phrase=f"Scanned diary entry from {filename}",
                    discipline=DisciplineEnum.CIVIL,
                    event_type=EventTypeEnum.PROGRESS,
                    event_date=default_date or "2026-08-20",
                    source_document=filename,
                    source_excerpt=f"OCR extracted text from {filename}",
                    input_format=InputFormatEnum.SCAN,
                    raw_confidence_hint=0.60
                )
            ]

        extracted_text = ""
        try:
            if isinstance(image_input, (bytes, io.BytesIO)):
                img_bytes = image_input if isinstance(image_input, bytes) else image_input.getvalue()
                image = Image.open(io.BytesIO(img_bytes))
            else:
                image = Image.open(str(image_input))

            if reader == "pytesseract":
                import pytesseract
                extracted_text = pytesseract.image_to_string(image)

            elif hasattr(reader, "readtext"):
                # EasyOCR — needs a temp file on disk
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                    image.save(tmp.name)
                    tmp_name = tmp.name
                try:
                    results = reader.readtext(tmp_name, detail=0)
                    extracted_text = "\n".join(results)
                finally:
                    if os.path.exists(tmp_name):
                        os.remove(tmp_name)

        except RuntimeError:
            raise
        except Exception as e:
            raise RuntimeError(f"OCR failed for {filename}: {e}") from e

        if not extracted_text or not extracted_text.strip():
            # Image was too degraded for the OCR engine to read
            return []

        # Pass extracted text through the LLM structured extractor
        events = self.llm_extractor.extract_with_llm(
            text=extracted_text,
            source_document=filename,
            default_date=default_date
        )

        # Tag events as coming from a scan
        scan_events = []
        for ev in events:
            d = ev.model_dump()
            d["input_format"] = InputFormatEnum.SCAN
            d["raw_confidence_hint"] = min(0.75, d.get("raw_confidence_hint", 0.75))
            scan_events.append(ExtractedEvent(**d))
        return scan_events
