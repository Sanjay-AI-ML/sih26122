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
from services.ingestion.parsers.text_parser import TextParser


class OCRParser:
    """
    Image and scanned paper diary OCR processor.
    """

    def __init__(self):
        self.text_parser = TextParser()
        self._reader = None
        self._ocr_checked = False

    def _get_ocr_reader(self):
        """Lazy-loads EasyOCR or Tesseract reader."""
        if self._ocr_checked:
            return self._reader
        self._ocr_checked = True

        try:
            import easyocr
            self._reader = easyocr.Reader(["en"], gpu=False)
            return self._reader
        except ImportError:
            try:
                import pytesseract
                self._reader = "pytesseract"
                return self._reader
            except ImportError:
                self._reader = None
                return None

    def parse_image(
        self,
        image_input: Union[bytes, io.BytesIO, str, Path],
        filename: str = "site_diary_scan.jpg",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Runs OCR on the given image and extracts structured events.
        """
        extracted_text = ""
        reader = self._get_ocr_reader()

        try:
            if isinstance(image_input, (bytes, io.BytesIO)):
                img_bytes = image_input if isinstance(image_input, bytes) else image_input.getvalue()
                image = Image.open(io.BytesIO(img_bytes))
            else:
                image = Image.open(str(image_input))

            if reader == "pytesseract":
                import pytesseract
                extracted_text = pytesseract.image_to_string(image)
            elif reader is not None and hasattr(reader, "readtext"):
                # EasyOCR
                with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp:
                    image.save(tmp.name)
                    tmp_name = tmp.name
                try:
                    results = reader.readtext(tmp_name, detail=0)
                    extracted_text = "\n".join(results)
                finally:
                    if os.path.exists(tmp_name):
                        os.remove(tmp_name)
        except Exception as e:
            print(f"OCR processing note for {filename}: {e}")

        # If OCR extracted readable text, parse it with TextParser
        if extracted_text and len(extracted_text.strip()) > 10:
            events = self.text_parser.parse(
                text=extracted_text,
                source_document=filename,
                default_date=default_date
            )
            scan_events = []
            for ev in events:
                d = ev.model_dump()
                d["input_format"] = InputFormatEnum.SCAN
                d["raw_confidence_hint"] = min(0.75, d.get("raw_confidence_hint", 0.75))
                scan_events.append(ExtractedEvent(**d))
            return scan_events

        # Fallback to manual review stub for degraded images
        from services.ingestion.parsers.scan_parser import ScanParser
        return ScanParser().parse(file_input=image_input, filename=filename, default_date=default_date)
