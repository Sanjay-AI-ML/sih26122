# Setu — Ingestion & Extraction Service (Member A)

> **SIH26122 · Oil India Limited · Smart Automation**  
> *Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management*

The Ingestion & Extraction service serves as **Stage 1 & 2** of the Setu pipeline. It ingests heterogeneous field data (unstructured daily progress reports, discipline spreadsheets, voice transcripts, digital PDFs, and scanned diaries), extracts structured entity records, and normalizes them against the shared contract schema (`shared/schemas/extracted_event.json`) with strict source excerpt retention for auditability.

---

## 1. Supported Input Modalities

| Modality | Formats | Processing Engine | Output Characteristics |
| :--- | :--- | :--- | :--- |
| **Free-Text DPR** | `.txt`, `.log`, `.dpr`, raw text | `TextParser` (regex + engineering entity extraction) | Tag/Line ID detection, milestone detection, contractor identification, delay reason extraction, verbatim excerpt |
| **Discipline Spreadsheets** | `.csv`, `.tsv`, `.xlsx`, `.xls` | `SpreadsheetParser` (flexible column alias normalization) | High-precision mapping from custom tabular headers into standard schema |
| **Digital PDFs** | `.pdf` | `PDFParser` (`pypdf` digital text cascade) | Text layer extracted page-by-page; falls back gracefully to scan stub if unreadable |
| **Supervisor Voice** | Typed transcripts, Hinglish logs | `VoiceParser` (English + Code-mixed support) | Supports phrases like *"Line 24-PL-001 pe spool erection complete ho gaya"* |
| **Scanned Paper Logs** | `.jpg`, `.jpeg`, `.png`, `.tiff` | `ScanParser` (governed prototype review stub) | Flags input with `input_format=scan` and routes to human review queue without crashing |

---

## 2. Schema Contract (`shared/schemas/extracted_event.json`)

Every extracted event validates against this exact contract before downstream consumption by **Member B (Matching)** and **Member D (Write-back)**:

```json
{
  "activity_phrase": "spool erection of 14 spools at CDU-II pipe rack",
  "discipline": "piping",
  "tag_or_line_id": "Line 24-PL-001",
  "location": "CDU-II pipe rack",
  "event_type": "finish",
  "event_date": "2026-08-20",
  "quantity": 14.0,
  "unit": "spools",
  "contractor": "L&T Heavy Engineering",
  "delay_reason": null,
  "source_document": "daily_progress_report_piping.txt",
  "source_excerpt": "1. On Line 24-PL-001, L&T piping crew completed spool erection of 14 spools at CDU-II pipe rack.",
  "input_format": "free_text",
  "raw_confidence_hint": 0.95
}
```

---

## 3. REST API Reference

### Health Check
- **`GET /health`**
  - Returns service status, version, and supported modalities.

### Supported Formats Metadata
- **`GET /supported-formats`**
  - Returns schema details, supported file extensions, and discipline taxonomies.

### Unified Ingestion Endpoint
- **`POST /ingest`**
  - Accepts multipart file upload (`file`) OR form field (`text`).

### Dedicated Endpoints
- **`POST /ingest/file`** (Multipart File Upload: `.txt`, `.pdf`, `.csv`, `.xlsx`, `.jpg`, `.png`)
- **`POST /ingest/text`** (JSON Payload: `{"text": "...", "source_document": "...", "default_date": "..."}`)
- **`POST /ingest/voice`** (JSON Payload: `{"transcript": "...", "source_document": "...", "default_date": "..."}`)

---

## 4. Example Usages (cURL)

### A. Ingest Free-Text DPR via JSON
```bash
curl -X POST "http://localhost:8001/ingest/text" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Excavation work for Tank TK-101 foundation completed by Tata Projects; 450 cum soil excavated.",
    "source_document": "DPR_Civil_2026-08-21.txt",
    "default_date": "2026-08-21"
  }'
```

### B. Ingest Discipline Spreadsheet File Upload
```bash
curl -X POST "http://localhost:8001/ingest/file" \
  -F "file=@shared/sample-data/discipline_progress_piping.csv"
```

### C. Ingest Code-Mixed Hinglish Supervisor Voice Transcript
```bash
curl -X POST "http://localhost:8001/ingest/voice" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "Line 12-CS-104 pe hydrostatic test start ho gaya hai Punj Lloyd ke through, 6 joints complete check kiya pressure 18 bar hold hai.",
    "source_document": "voice_mic_02.wav",
    "default_date": "2026-08-20"
  }'
```

---

## 5. Local Setup & Running Tests

### Install dependencies:
```bash
pip install -r services/ingestion/requirements.txt
```

### Run tests:
```bash
pytest services/ingestion/tests/ -v
```

### Start the FastAPI service:
```bash
uvicorn services.ingestion.app:app --host 0.0.0.0 --port 8001 --reload
```
Interactive Swagger documentation will be available at `http://localhost:8001/docs`.
