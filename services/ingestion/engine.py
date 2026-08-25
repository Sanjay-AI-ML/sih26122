"""
Master Ingestion Engine for Setu (SIH26122 - Member A).
Routes incoming heterogeneous documents, spreadsheets, scans, and voice transcripts
to their dedicated parsing modules and returns validated ExtractedEvent records.
"""

import io
from pathlib import Path
from typing import List, Optional, Union, Dict, Any

from shared.schemas.extracted_event import ExtractedEvent, InputFormatEnum
from services.ingestion.config import SUPPORTED_FILE_EXTENSIONS
from services.ingestion.parsers.text_parser import TextParser
from services.ingestion.parsers.spreadsheet_parser import SpreadsheetParser
from services.ingestion.parsers.pdf_parser import PDFParser
from services.ingestion.parsers.voice_parser import VoiceParser
from services.ingestion.parsers.scan_parser import ScanParser
from services.ingestion.parsers.audio_parser import AudioParser
from services.ingestion.parsers.ocr_parser import OCRParser
from services.ingestion.llm_extractor import LLMExtractor


class IngestionEngine:
    """
    Central orchestration engine for processing multi-format engineering updates.
    """

    def __init__(self):
        self.text_parser = TextParser()
        self.spreadsheet_parser = SpreadsheetParser()
        self.pdf_parser = PDFParser()
        self.voice_parser = VoiceParser()
        self.scan_parser = ScanParser()
        self.audio_parser = AudioParser()
        self.ocr_parser = OCRParser()
        self.llm_extractor = LLMExtractor()

    def ingest_file(
        self,
        file_content: Union[bytes, str, Path, io.BytesIO],
        filename: str,
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """
        Auto-detects format from filename extension and dispatches to the correct parser.
        """
        ext = Path(filename).suffix.lower()
        modality = SUPPORTED_FILE_EXTENSIONS.get(ext, "unknown")

        if modality == "spreadsheet" or ext in {".csv", ".tsv", ".xlsx", ".xls"}:
            return self.spreadsheet_parser.parse_file(
                file_input=file_content,
                filename=filename,
                default_date=default_date
            )
        elif modality == "pdf" or ext == ".pdf":
            return self.pdf_parser.parse_file(
                file_input=file_content,
                filename=filename,
                default_date=default_date
            )
        elif modality == "audio" or ext in {".wav", ".mp3", ".m4a", ".ogg", ".flac"}:
            return self.audio_parser.parse_audio(
                audio_input=file_content,
                filename=filename,
                default_date=default_date
            )
        elif modality == "scan" or ext in {".jpg", ".jpeg", ".png", ".tiff", ".bmp"}:
            return self.ocr_parser.parse_image(
                image_input=file_content,
                filename=filename,
                default_date=default_date
            )
        else:
            # Default to free text
            if isinstance(file_content, bytes):
                text = file_content.decode("utf-8", errors="replace")
            elif isinstance(file_content, (str, Path)) and Path(str(file_content)).exists():
                text = Path(str(file_content)).read_text(encoding="utf-8", errors="replace")
            else:
                text = str(file_content)

            return self.llm_extractor.extract_with_llm(
                text=text,
                source_document=filename,
                default_date=default_date
            )

    def ingest_text(
        self,
        text: str,
        source_document: str = "daily_progress_report.txt",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """Ingests raw text string."""
        return self.text_parser.parse(
            text=text,
            source_document=source_document,
            default_date=default_date
        )

    def ingest_voice(
        self,
        transcript: str,
        source_document: str = "voice_transcript_stream.wav",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """Ingests voice transcript string."""
        return self.voice_parser.parse(
            transcript=transcript,
            source_document=source_document,
            default_date=default_date
        )

    def ingest_spreadsheet(
        self,
        file_input: Union[bytes, str, Path, io.BytesIO],
        filename: str = "spreadsheet_report.csv",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """Explicitly ingests spreadsheet."""
        return self.spreadsheet_parser.parse_file(
            file_input=file_input,
            filename=filename,
            default_date=default_date
        )

    def ingest_audio(
        self,
        audio_input: Union[bytes, str, Path, io.BytesIO],
        filename: str = "supervisor_voice.wav",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """Transcribes audio and extracts events."""
        return self.audio_parser.parse_audio(
            audio_input=audio_input,
            filename=filename,
            default_date=default_date
        )

    def ingest_with_llm(
        self,
        text: str,
        source_document: str = "daily_progress_report.txt",
        default_date: Optional[str] = None
    ) -> List[ExtractedEvent]:
        """Extracts events using local LLM/SLM schema-constrained prompt."""
        return self.llm_extractor.extract_with_llm(
            text=text,
            source_document=source_document,
            default_date=default_date
        )
