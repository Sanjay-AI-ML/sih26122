"""
FastAPI Ingestion Service for Setu (SIH26122 - Member A).
Exposes REST endpoints for ingesting heterogeneous progress reports.
"""

from typing import List, Optional, Union
from fastapi import FastAPI, File, UploadFile, Form, HTTPException, Query, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from shared.schemas.extracted_event import ExtractedEvent
from services.ingestion.engine import IngestionEngine
from services.ingestion.config import (
    SERVICE_NAME,
    SERVICE_VERSION,
    SCHEMA_VERSION,
    SUPPORTED_FILE_EXTENSIONS
)

app = FastAPI(
    title="Setu Ingestion & Extraction Service",
    description="SIH26122 Data Capture Layer for Oil India Limited infrastructure schedules",
    version=SERVICE_VERSION,
)

# Enable CORS for React Review Console and Time Agent frontends
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = IngestionEngine()


# ---------------------------------------------------------------------------
# Request / Response Models
# ---------------------------------------------------------------------------

class TextIngestRequest(BaseModel):
    text: str = Field(..., description="Raw text of daily progress report or field update", min_length=1)
    source_document: Optional[str] = Field(default="typed_dpr_input.txt", description="Document name or stream identifier")
    default_date: Optional[str] = Field(default=None, description="Fallback event date in ISO format (YYYY-MM-DD)")


class VoiceIngestRequest(BaseModel):
    transcript: str = Field(..., description="Transcribed voice utterance from supervisor", min_length=1)
    source_document: Optional[str] = Field(default="voice_audio_stream.wav", description="Audio recording identifier")
    default_date: Optional[str] = Field(default=None, description="Fallback event date in ISO format (YYYY-MM-DD)")


class IngestResponse(BaseModel):
    success: bool = True
    total_events: int
    source_document: str
    input_format: str
    events: List[ExtractedEvent]


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health", tags=["System"])
def health_check():
    """Returns service health, version, and active schema info."""
    return {
        "status": "healthy",
        "service": SERVICE_NAME,
        "version": SERVICE_VERSION,
        "schema_version": SCHEMA_VERSION,
        "supported_modalities": ["free_text", "spreadsheet", "pdf", "voice", "scan_stub"]
    }


@app.get("/supported-formats", tags=["System"])
def supported_formats():
    """Returns supported file extensions and modalities."""
    return {
        "extensions": SUPPORTED_FILE_EXTENSIONS,
        "modalities": {
            "free_text": "Daily Progress Reports (.txt, .log, .dpr) with line items, line tags, quantities",
            "spreadsheet": "Discipline Progress Workbooks (.csv, .xlsx, .xls) with flexible column mapping",
            "pdf": "Digital PDF reports (.pdf) extracted via text layer with OCR/scan fallback",
            "voice": "Typed supervisor logs or transcribed Hinglish/English voice notes",
            "scan": "Scanned paper diaries (.jpg, .png) routed to manual review stub"
        },
        "target_disciplines": [
            "civil", "piping", "static_rotating", "electrical", "instrumentation", "hse"
        ]
    }


@app.post(
    "/ingest",
    response_model=IngestResponse,
    tags=["Ingestion"],
    summary="Unified Ingestion Endpoint"
)
async def ingest_unified(
    file: Optional[UploadFile] = File(None),
    text: Optional[str] = Form(None),
    source_document: Optional[str] = Form(None),
    default_date: Optional[str] = Form(None)
):
    """
    Unified ingestion endpoint accepting either a multipart file upload OR form text.
    """
    if file is not None:
        filename = file.filename or "uploaded_file"
        content = await file.read()
        events = engine.ingest_file(
            file_content=content,
            filename=filename,
            default_date=default_date
        )
        fmt = events[0].input_format.value if events else "unknown"
        return IngestResponse(
            success=True,
            total_events=len(events),
            source_document=filename,
            input_format=fmt,
            events=events
        )
    elif text is not None and text.strip():
        doc_name = source_document or "text_input.txt"
        events = engine.ingest_text(
            text=text,
            source_document=doc_name,
            default_date=default_date
        )
        return IngestResponse(
            success=True,
            total_events=len(events),
            source_document=doc_name,
            input_format="free_text",
            events=events
        )
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either a file upload or text content must be provided."
        )


@app.post(
    "/ingest/file",
    response_model=IngestResponse,
    tags=["Ingestion"],
    summary="Upload & Ingest File (.txt, .pdf, .csv, .xlsx, .jpg, .png)"
)
async def ingest_file_endpoint(
    file: UploadFile = File(...),
    default_date: Optional[str] = Form(None)
):
    """
    Ingests an uploaded file and returns extracted events.
    """
    filename = file.filename or "uploaded_file"
    content = await file.read()
    events = engine.ingest_file(
        file_content=content,
        filename=filename,
        default_date=default_date
    )
    fmt = events[0].input_format.value if events else "unknown"
    return IngestResponse(
        success=True,
        total_events=len(events),
        source_document=filename,
        input_format=fmt,
        events=events
    )


@app.post(
    "/ingest/text",
    response_model=IngestResponse,
    tags=["Ingestion"],
    summary="Ingest Raw Text (JSON)"
)
def ingest_text_endpoint(payload: TextIngestRequest):
    """
    Ingests a raw text report or paragraph.
    """
    events = engine.ingest_text(
        text=payload.text,
        source_document=payload.source_document or "typed_dpr_input.txt",
        default_date=payload.default_date
    )
    return IngestResponse(
        success=True,
        total_events=len(events),
        source_document=payload.source_document or "typed_dpr_input.txt",
        input_format="free_text",
        events=events
    )


@app.post(
    "/ingest/voice",
    response_model=IngestResponse,
    tags=["Ingestion"],
    summary="Ingest Voice Transcript (JSON)"
)
def ingest_voice_endpoint(payload: VoiceIngestRequest):
    """
    Ingests supervisor speech-to-text transcript.
    """
    events = engine.ingest_voice(
        transcript=payload.transcript,
        source_document=payload.source_document or "voice_audio_stream.wav",
        default_date=payload.default_date
    )
    return IngestResponse(
        success=True,
        total_events=len(events),
        source_document=payload.source_document or "voice_audio_stream.wav",
        input_format="voice",
        events=events
    )


@app.post(
    "/ingest/audio",
    response_model=IngestResponse,
    tags=["Ingestion"],
    summary="Upload & Transcribe Audio File (.wav, .mp3, .m4a, .ogg)"
)
async def ingest_audio_endpoint(
    file: UploadFile = File(...),
    default_date: Optional[str] = Form(None)
):
    """
    Uploads supervisor voice recording, transcribes via local Whisper model, and extracts events.
    """
    filename = file.filename or "supervisor_voice.wav"
    content = await file.read()
    events = engine.ingest_audio(
        audio_input=content,
        filename=filename,
        default_date=default_date
    )
    return IngestResponse(
        success=True,
        total_events=len(events),
        source_document=filename,
        input_format="voice",
        events=events
    )


@app.post(
    "/ingest/llm",
    response_model=IngestResponse,
    tags=["Ingestion"],
    summary="Ingest Text via Schema-Constrained Local SLM/LLM"
)
def ingest_llm_endpoint(payload: TextIngestRequest):
    """
    Extracts events using local LLM / SLM schema-constrained extraction with Pydantic guard.
    """
    events = engine.ingest_with_llm(
        text=payload.text,
        source_document=payload.source_document or "typed_dpr_input.txt",
        default_date=payload.default_date
    )
    return IngestResponse(
        success=True,
        total_events=len(events),
        source_document=payload.source_document or "typed_dpr_input.txt",
        input_format="free_text",
        events=events
    )


class AssistantQueryRequest(BaseModel):
    question: str
    context: str


class AssistantQueryResponse(BaseModel):
    answer: str
    llm_available: bool


@app.post(
    "/assistant/query",
    response_model=AssistantQueryResponse,
    tags=["Assistant"],
    summary="Free-form Q&A over supplied project context (Institutional Memory)"
)
def assistant_query(payload: AssistantQueryRequest):
    """
    Answers a natural-language question using the local LLM, grounded in the
    caller-supplied context (analytics stats, audit history, etc). Returns a
    plain-text answer, not a structured ExtractedEvent list.
    """
    answer = engine.llm_extractor.ask(payload.question, payload.context)
    if answer is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Local LLM (Ollama) is not available."
        )
    return AssistantQueryResponse(answer=answer, llm_available=True)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.ingestion.app:app", host="0.0.0.0", port=8001, reload=True)

