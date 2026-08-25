"""
Digital PDF parser for Daily Progress Reports using pypdf.
"""

import io
from pathlib import Path
from typing import List, Optional, Union
from pypdf import PdfReader

from shared.schemas.extracted_event import ExtractedEvent
from services.ingestion.llm_extractor import LLMExtractor
from services.ingestion.parsers.scan_parser import ScanParser


class PDFParser:
    """
    Extracts text layer from digital PDF documents and delegates to TextParser,
    or falls back to ScanParser if the PDF has no selectable text layer.
    """

    def __init__(self):
        self.llm_extractor = LLMExtractor()
        self.scan_parser = ScanParser()

    def parse_file(
        self,
        file_input: Union[str, Path, bytes, io.BytesIO],
        filename: str = "report.pdf",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Extracts text from PDF pages and parses into ExtractedEvents.
        """
        extracted_text = ""
        try:
            if isinstance(file_input, bytes):
                reader = PdfReader(io.BytesIO(file_input))
            elif isinstance(file_input, io.BytesIO):
                reader = PdfReader(file_input)
            else:
                reader = PdfReader(str(file_input))

            for page in reader.pages:
                t = page.extract_text()
                if t:
                    extracted_text += t + "\n"
        except Exception as e:
            print(f"Error reading PDF {filename}: {e}")

        # If digital text exists, parse with TextParser
        if extracted_text.strip():
            return self.llm_extractor.extract_with_llm(
                text=extracted_text,
                source_document=filename,
                default_date=default_date
            )
        else:
            # Scanned PDF without text layer -> route to scan stub
            return self.scan_parser.parse(
                file_input=file_input,
                filename=filename,
                default_date=default_date
            )
