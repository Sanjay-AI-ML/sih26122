# SIH26122 — Technical Architecture & Build Plan

### Intelligent Data Capture & Schedule-Linking Layer — 30-hour build, 6-person team

*Companion document to [SIH26122_MASTER_BRIEF.md](SIH26122_MASTER_BRIEF.md). Grounded in that brief's verified competitive gaps and honest scalability framing — nothing here overclaims what a 30-hour prototype can defensibly do.*

---

## 1. System Architecture

### 1.1 Component diagram (2026 stack)

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                FRONTEND (React + Vite)                           │
│                                                                                   │
│  ┌────────────────────────┐  ┌──────────────────────────┐  ┌──────────────────┐ │
│  │  Supervisor "Time       │  │  Planner Review Queue     │  │  Analytics &     │ │
│  │  Agent" — chat UI +     │  │  — accept/reject/correct  │  │  Institutional   │ │
│  │  file upload widget     │  │  with source, top-3,      │  │  Memory Query UI │ │
│  │  (text/CSV/PDF)         │  │  confidence, explanation  │  │  (SQLite + DuckDB│
│  └────────────┬────────────┘  └────────────┬──────────────┘  └────────┬─────────┘ │
└───────────────┼────────────────────────────┼────────────────────────┼──────────┘
                │ POST /ingest                │ GET /review, POST /approve
                │ (files or text)             │ POST /approve (accept/reject/correct)
                ▼                             ▼
     ┌──────────────────────────────────────────────────────────────────┐
     │  BACKEND PIPELINE (FastAPI + LangChain orchestration)            │
     │                                                                   │
     │  [1. Document Processing]                                        │
     │    PyMuPDF / python-docx / pdfplumber → text extraction          │
     │    ↓ if text quality poor                                        │
     │    PaddleOCR-VL-1.6 (layout-aware) → Markdown                    │
     │    ↓ if handwriting/severe degradation                           │
     │    Chandra OCR 2 or DeepSeek-OCR-2 fallback                      │
     │    ↓                                                              │
     │  [2. Deterministic Extraction (Regex + RapidFuzz)]               │
     │    Line/tag numbers, discipline codes, dates, contractor names   │
     │    ↓                                                              │
     │  [3. Schema-Constrained LLM Extraction (Qwen3-4B)]               │
     │    LLM call → candidate JSON for activity, quantity, status      │
     │    ↓                                                              │
     │  [4. Pydantic Validation]                                        │
     │    Enforce required fields, date formats, enums, quantities      │
     │    ↓ invalid → flag, valid → proceed                             │
     │  [5. Deterministic Matching Filter]                              │
     │    Line/tag/discipline/date compatibility → filtered candidates  │
     │    ↓                                                              │
     │  [6. Semantic Retrieval (Qwen3-Embedding-0.6B + FAISS)]           │
     │    Embed event, search top-10 candidates                         │
     │    ↓                                                              │
     │  [7. Reranking (Qwen3-Reranker-0.6B)]                             │
     │    Re-score top-10 → refined top-3 ranked list                   │
     │    ↓                                                              │
     │  [8. Ambiguity Detection + Confidence Scoring]                   │
     │    Calibrated logistic regression on validation features         │
     │    One-to-many check via schedule dependencies                   │
     │    Output: score, top-3, explanation, confidence band            │
     │    ↓                                                              │
     │  [9. Confidence Routing]                                         │
     │    ≥0.85: auto-suggest | 0.65–0.85: confirm required            │
     │    <0.65: ambiguous, route to review queue                       │
     │    ↓                                                              │
     │  [10. Planner Decision → Audit Log]                              │
     │    Accept/reject/correct → immutable audit_log entry             │
     │    ↓                                                              │
     │  [11. Write-back + Institutional Memory]                         │
     │    Approved → schedule_activities update                         │
     │    All events → SQLite (transactional) + DuckDB (analytics)      │
     └──────────────────────────────────────────────────────────────────┘
                     │                                    │
         ┌───────────┴───────────────┐        ┌──────────┴────────────────────┐
         ▼                           ▼        ▼                               ▼
     ┌──────────────────┐    ┌──────────────────────────────────┐    ┌─────────────────┐
     │  CORE MODELS     │    │  VECTOR/ANALYTICS STORAGE        │    │  SCHEDULE DATA  │
     │  (local via      │    │                                   │    │                 │
     │  Ollama or API)  │    │  SQLite (transactional)           │    │  schedule.csv   │
     │                  │    │  - raw_reports                    │    │  (L5/L6 WBS)    │
     │  • Qwen3-4B      │    │  - extracted_events               │    │  Load at startup│
     │    Instruct      │    │  - matches                        │    │                 │
     │    (extraction)  │    │  - audit_log                      │    │  Cached in FAISS│
     │                  │    │  - approvals                      │    │  embeddings     │
     │  • Qwen3-        │    │                                   │    │                 │
     │    Embedding-    │    │  DuckDB (analytical)              │    │                 │
     │    0.6B          │    │  - discipline-wise variance view  │    │                 │
     │    (embeddings)  │    │  - contractor productivity stats  │    │                 │
     │                  │    │  - delay-cause frequency          │    │                 │
     │  • Qwen3-        │    │  - confidence vs. correction rate │    │                 │
     │    Reranker-     │    │                                   │    │                 │
     │    0.6B          │    │  FAISS (vector index)             │    │                 │
     │    (reranking)   │    │  - all activity descriptions      │    │                 │
     │                  │    │  - pre-computed embeddings        │    │                 │
     │  • Qwen3-ASR     │    │  - queried at match time          │    │                 │
     │    (optional,    │    │                                   │    │                 │
     │    speech-to-    │    │  PaddleOCR-VL-1.6 (OCR)           │    │                 │
     │    text)         │    │  - layout-aware extraction        │    │                 │
     │                  │    │                                   │    │                 │
     │  Fallbacks:      │    │                                   │    │                 │
     │  • Groq API      │    │                                   │    │                 │
     │    (faster LLM)  │    │                                   │    │                 │
     │  • Gemini free   │    │                                   │    │                 │
     │    tier          │    │                                   │    │                 │
     │  • Whisper v3    │    │                                   │    │                 │
     │    (ASR)         │    │                                   │    │                 │
     └──────────────────┘    └──────────────────────────────────┘    └─────────────────┘
```

### 1.2 Data flow — from supervisor action to institutional memory

1. Supervisor types (or uploads) a daily update via the Time Agent chat UI, **or** a discipline lead uploads a spreadsheet.
2. `/ingest` stores the raw input verbatim (`raw_reports`) and **invokes the document-processing cascade:**

- **Text extraction**: PyMuPDF (digital PDFs) or python-docx (Word) — fast, no OCR needed.
- **OCR fallback**: If text quality is poor, invoke **PaddleOCR-VL-1.6** for layout-aware extraction. If that is slow or fails on handwriting, escalate to **Chandra OCR 2**.
- **Output**: Clean text, structured as Markdown if possible.
3. **Structured extraction** (Qwen3-4B Instruct, schema-constrained):

- **Stage A (deterministic)**: Regex + RapidFuzz extract line numbers (e.g., "24-XX"), discipline codes, dates, contractor names. These are hard facts, never guessed.
- **Stage B (LLM)**: Qwen3-4B generates candidate structured JSON (activity phrase, quantity, unit, status, delay reason) using the cleaned text.
- **Stage C (validation)**: Pydantic schema validation — enforce required fields, date formats, discipline enums, quantity types. Reject and flag any output that fails validation.
- **Output**: Structured event with source span retained (the exact text this came from).
4. The **Hybrid Matcher** runs in two substages:

- **Deterministic filter** (hard filter): Line/tag match, discipline match, date-window compatibility. Produces a **filtered candidate set** (e.g., 3–5 activities instead of 100).
- **Semantic retrieval** (FAISS + reranking): Embed the extracted event with **Qwen3-Embedding-0.6B**, search FAISS for top-10 activities, then **Qwen3-Reranker-0.6B** rescores them to produce a final top-3 ranked list.
5. The **Confidence Engine** (calibrated logistic regression):

- Input features: rule_score, embedding_score, reranker_score, line_match, discipline_match, date_validity, candidate_margin.
- Output: Calibrated 0–1 confidence score, plus a plain-language explanation ("matched on tag + discipline + semantic similarity 0.82; margin to #2 candidate is 0.14").
6. **Granularity/ambiguity detection**: If the top-3 candidates include activities that are semantically close (e.g., "fabrication," "erection," "hydrotest" all for the same line), flag as one-to-many and route to human review, rather than force a single match.
7. Confidence routing: **≥0.85 → auto-suggested** (one-click planner confirmation, never silent); **0.65–0.85 → planner must actively confirm**; **<0.65 → routed to review queue as ambiguous/unmatched, never dropped.**
8. Planner acts in the **Review Queue** UI — accept, reject, or manually correct. Every action is written to `audit_log` (who, when, from what source, what was chosen vs. suggested).
9. Accepted events write the actual start/end date back to `schedule_activities` (simulated in prototype; P6 EPPM REST API call demonstrated in code).
10. All accepted (and rejected/corrected) events accumulate into **institutional memory**:

- **SQLite**: transactional event storage (immutable append log).
- **DuckDB**: analytical view for discipline-wise variance, contractor productivity, delay causes, confidence vs. correction rate.
- **Query interface**: Filter by discipline/contractor/activity type/date range; retrieve historical patterns (e.g., "piping spool erection took 3–5 days on average under Contractor X").

---

## 2. Feature List

### Core (build first — the demo does not work without these)

- CSV/XLSX upload of a synthetic Primavera-style L5/L6 schedule (activity ID, name, discipline, line/tag, WBS, planned start/finish)
- Free-text daily-report ingestion → LLM extraction → structured event with source sentence retained
- Spreadsheet (discipline-wise) ingestion → same extraction path
- Hybrid matcher: deterministic filter + semantic similarity, producing a confidence score and top-3 alternates
- Planner review queue: accept / reject / correct, with source evidence always visible
- Audit trail: immutable log of every extraction and every planner decision
- Confidence-banded routing (auto-suggest / confirm / flag-ambiguous)
- One end-to-end "planned vs. actual" view showing at least one activity's date updated by an approved event
- A **granularity-mismatch demo case**: one input that legitimately could map to more than one L6 activity, correctly flagged as ambiguous rather than force-matched

### Nice-to-have (add only if core is done and stable)

- Institutional-memory query interface (filter/search past approved events by discipline, contractor, delay cause)
- Discipline-wise variance / S-curve chart on the analytics dashboard
- A lightly-mocked "voice" input (speech-to-text via browser Web Speech API feeding the same text pipeline — not a custom ASR model)
- A second, harder input format (e.g., a scanned-diary-style image run through a basic OCR call) to demonstrate breadth beyond the two required formats
- Multi-turn conversational refinement in the Time Agent (e.g., the agent asks a clarifying question if a report is ambiguous, instead of only flagging it downstream)

### Features to FAKE / MOCK in the demo (look real, are hardcoded or scripted)

- **Voice input**, if attempted at all: pre-scripted phrases fed to the browser's built-in speech recognition, not a trained ASR model — say this plainly if asked, don't imply a custom voice model exists
- **Primavera/PMIS write-back**: a stubbed API call that logs "would call P6 EPPM REST API with payload: {...}" — do not claim a live Primavera connection unless the team genuinely wires one up against a demo P6 instance (unlikely in 30 hours and not required by the problem statement)
- **Scanned-diary OCR** (if included as a stretch item): run it on 1–2 pre-selected, pre-cleaned sample images, not arbitrary live-uploaded scans
- **"1,847 projects at national scale"** framing on the dashboard: the demo runs on one synthetic project's dataset; any "scale" visual should be explicitly labeled as an illustrative projection, not live data

### Out of scope — tell the jury this is future work

- Production-grade OCR/ASR pipelines
- A full Primavera/MS Project replacement or live write to a real, credentialed schedule
- Enterprise SSO, multi-tenant security hardening, data residency controls
- A trained predictive/forecasting model on the institutional-memory dataset (the *data foundation* for this is in scope; the *model* is not)
- Multilingual support
- Mobile native apps (a responsive web UI is sufficient)
- Any live government-portal integration (PAIMANA/DPIIT IPMP) — cite this as the real-world Phase 4 target (see the master brief's business-model section), not a demo deliverable

---

## 3. Tech Stack Recommendation (Upgraded with 2026 model improvements)

| Layer | Recommendation | Why |
| --- | --- | --- |
| **Frontend** | React + Vite + shadcn/ui + Tailwind CSS | Fast to scaffold, component-rich for both a chat UI and a data-heavy review queue, no license cost |
| **Charts** | Recharts | Lightweight, works well with React, sufficient for S-curve/variance visuals |
| **Backend** | FastAPI (Python) + LangChain | Async-friendly, auto-generated OpenAPI docs, natural fit with Python ML/NLP stack; LangChain orchestrates extraction → matching → confidence chains |
| **Database** | **SQLite** (operational event storage) + **DuckDB** (analytical queries) | SQLite: zero-ops, portable to laptop, transactional. DuckDB: efficient aggregation for discipline-wise variance, delay trends, contractor productivity — both local, no hosted DB dependency |
| **PDF/Document extraction** | **PyMuPDF** (digital PDFs) + **python-docx** (Word diaries) | Fast text-layer extraction; only invoke OCR if text quality is poor |
| **OCR cascade** | **Primary: PaddleOCR-VL-1.6** (layout understanding, 100+ languages, structured output). **Fast fallback: DeepSeek-OCR-2** (efficient Markdown conversion). **Handwriting escalation: Chandra OCR 2** (if hardware permits, for degraded scans). | PaddleOCR-VL-1.6 handles layout-aware extraction with high accuracy; DeepSeek-OCR-2 prioritizes throughput and Markdown conversion; Chandra OCR 2 for messy handwritten regions. Do NOT replace pdfplumber entirely. |
| **Structured extraction (NLP)** | **Regex + RapidFuzz** (deterministic field detection) → **Qwen3-4B Instruct** (schema-constrained JSON extraction) → **Pydantic validation** (enforce required fields, enums, date formats) | Deterministic rules catch line numbers, dates, discipline codes; Qwen3-4B generates candidate JSON; Pydantic rejects invalid output before it reaches the matcher. Never allow free-form hallucination. |
| **Embeddings / semantic retrieval** | **Qwen3-Embedding-0.6B** (primary, technical terminology, instruction-aware) or **BGE-M3** (if multilingual field reports are expected). | Qwen3-Embedding-0.6B outperforms all-MiniLM-L6-v2 on construction terminology and supports long context. BGE-M3 adds hybrid retrieval (dense + sparse) for multilingual Indian field reports. |
| **Deterministic matching (hard filter)** | **RapidFuzz** + **regex** for tag/line-number/discipline-code exact/fuzzy matches | Catches the majority of matches; semantic similarity only ranks within the deterministically-filtered set |
| **Vector search + reranking** | **FAISS** (top-10 candidate retrieval) → **Qwen3-Reranker-0.6B** (top-3 reranking). Keep FAISS; add reranker. | FAISS is zero-infrastructure and sufficient for 30–100 activities. Qwen3-Reranker-0.6B re-scores the top-10 using full candidate context, significantly improves top-3 accuracy without major latency cost. |
| **Confidence scoring** | **Calibrated logistic regression** on validation features: (rule_score, embedding_score, reranker_score, line_match, discipline_match, date_validity, candidate_margin). | Do NOT use raw cosine similarity as confidence. Train a simple classifier on 100–300 labeled examples from your synthetic dataset; use it to map raw signals to 0–1 confidence. Policy: ≥0.85 auto-suggest, 0.65–0.85 confirm, <0.65 flag. |
| **Speech-to-text (optional)** | **Qwen3-ASR** (multilingual, including Tamil-English code-switching) or **Whisper large-v3** (mature, multilingual fallback). Browser Web Speech API only as fallback. | Qwen3-ASR supports 52+ languages/dialects; Whisper is production-proven. Browser Web Speech API is unreliable for noisy site conditions and offline scenarios. |
| **Schedule reasoning (ambiguity detection)** | **Rule-based + typed schedule graph**: validate one-to-many cases via predecessor/successor dependencies, date-window compatibility, discipline consistency. | Avoid full GNNs. A simple constraint checker (is this feasible given the schedule's dependencies?) catches one-to-many ambiguity and flags it for human review instead of forcing a false match. |
| **Deployment for the demo** | **Docker Compose** bundling frontend + FastAPI + SQLite + DuckDB + local models (Ollama for LLM, transformers for embeddings/reranker). **Run entirely on a local laptop, no cloud dependency.** | Eliminates venue-wifi as single point of failure. All model weights pre-downloaded and cached. Includes backup video as fallback. |
| **Cloud fallback (if local inference fails)** | **Groq API** (LLM extraction, 2x faster than Gemini) or **Google Gemini free tier** (as last resort). Use **LiteLLM** wrapper to swap APIs without code changes. | Groq is faster; Gemini is more familiar. LiteLLM lets the team switch between Groq, Gemini, OpenRouter, and local Ollama without rewriting the extraction logic. |

### Free/open-source-first, by design

Every component above has a fully free, open-source, offline-capable option. This is a deliberate choice, not just a budget one: **the problem statement explicitly involves NDA-sensitive, sample-only data**, and a local-inference architecture directly demonstrates that the design takes data privacy seriously — a point worth making proactively to the jury.

### 3.1 Exact model versions and requirements.txt

```
# requirements.txt — Python backend dependencies

# FastAPI & web
fastapi==0.104.0
uvicorn==0.24.0
pydantic==2.5.0
pydantic-settings==2.1.0

# LLM orchestration
langchain==0.1.0
langchain-core==0.1.0
litellm==1.0.0  # abstraction for LLM APIs (Groq, Gemini, Ollama, OpenRouter)

# PDF and document handling
PyMuPDF==1.23.0  # pdfplumber alternative, faster for text extraction
python-docx==0.8.11
pandas==2.1.0

# OCR models (primary cascade)
paddleocr==2.7.0  # includes PaddleOCR-VL support
torch==2.1.0
torchvision==0.16.0
# For Chandra OCR 2 (optional, if hardware permits): not available via pip, requires source build

# NLP and embeddings (Qwen3 suite)
transformers==4.35.0
sentence-transformers==2.2.0
torch==2.1.0

# Qwen3 specific models (download once at startup)
# Qwen3-4B Instruct: https://huggingface.co/Qwen/Qwen3-4B-Instruct
# Qwen3-Embedding-0.6B: https://huggingface.co/Qwen/Qwen3-Embedding-0.6B
# Qwen3-Reranker-0.6B: https://huggingface.co/Qwen/Qwen3-Reranker-0.6B
# (auto-downloaded via transformers + HuggingFace login)

# Vector search
faiss-cpu==1.7.4  # or faiss-gpu if GPU available

# Speech-to-text (optional)
openai-whisper==20231117  # Whisper large-v3
# OR for Qwen3-ASR: included in transformers via HuggingFace

# Confidence calibration
scikit-learn==1.3.0

# Database
sqlalchemy==2.0.0
duckdb==0.9.0
duckdb-engine==0.10.0  # SQLAlchemy support for DuckDB

# Utils
python-dotenv==1.0.0
requests==2.31.0
aiohttp==3.9.0

# Frontend build (npm install, not pip)
# npm packages: react, vite, shadcn/ui, recharts, tailwindcss, typescript
```

**Local model download strategy:**

- Pre-download model weights at Docker build time (or during team setup) from HuggingFace using `huggingface-hub` CLI.
- Cache them in `/models/` directory inside the Docker image.
- At runtime, point `TRANSFORMERS_CACHE=/models/` environment variable.
- This ensures models are available offline at demo time, not downloaded live on stage.

**Example Ollama setup (local LLM fallback/primary):**

```
ollama pull qwen3:4b-instruct      # Qwen3-4B for extraction
ollama pull mistral:7b              # Mistral 7B as alternative
# Models run on localhost:11434, accessible via LiteLLM or ollama Python library
```

**LangChain orchestration example (extraction chain):**

```
from langchain import PromptTemplate, LLMChain
from langchain.llms import Ollama

llm = Ollama(model="qwen3:4b-instruct", base_url="http://localhost:11434")
prompt = PromptTemplate(
    input_variables=["report_text"],
    template="""Extract structured fields from this construction report.
Return JSON with fields: activity_phrase, discipline, line_number, quantity, unit, status.
REPORT: {report_text}
JSON: """
)
extraction_chain = LLMChain(llm=llm, prompt=prompt)
result = extraction_chain.run(report_text="Spool erected at line 24-XX, 18 joints, piping team, 12 Aug")
# Pydantic validation applied to result
```

### Government APIs (data.gov.in, DigiLocker, UMANG, etc.) — honest assessment

**None of these fit this problem, and forcing one in would look unearned.** This is an internal enterprise execution-tracking problem (a CPSE's own schedule vs. its own field reports), not a citizen-facing or public-dataset problem — DigiLocker (identity documents) and UMANG (citizen services) have no natural connection to it. The one real government-system connection is architectural, not a live integration: **PAIMANA** (MoSPI's project-monitoring portal, already integrated with DPIIT's IPMP via API) is the eventual real-world target this system would feed into, as a Phase 4 adoption step — cite this as the *positioning*, not as something the prototype calls live. If a jury member asks "which government API do you use," the honest and correct answer is: *"None directly — this operates upstream of PAIMANA, inside a single organization's own schedule and field reports. The natural integration point is PAIMANA's existing DPIIT-IPMP API layer, which we've designed our schema to be compatible with, but a 30-hour prototype doesn't call it live."*

---

## 4. MVP Definition

### The minimum viable demo that will impress judges

A single, complete, **live** pass through the whole loop, on real (synthetic) data, told as one story in under 3 minutes:

1. Show the synthetic L5/L6 schedule already loaded (Primavera-style CSV, 30–50 activities across civil/piping/electrical/HSE).
2. Type (live, on stage) a free-text daily report sentence into the Time Agent — something with a terminology mismatch built in on purpose, e.g. *"Spool erected on Line 24-XX, 18 joints done, piping team, 12 Aug."*
3. Show the extraction happen (structured JSON with source sentence retained) and the match resolve — **high confidence, auto-suggested**, matched on tag+discipline+date, with the plain-language explanation visible.
4. Upload a discipline spreadsheet row with a **deliberately ambiguous** case — e.g., a description that could map to either "fabrication" or "erection" of the same line — and show it correctly **flagged for planner review**, not force-matched. This is the single most important beat: it proves the system knows what it doesn't know.
5. Planner reviews and accepts/corrects in the queue; show the audit log entry appear.
6. Show the schedule's actual-date field update, and the institutional-memory table gain a new queryable row.
7. Close on the analytics dashboard: "this is what a growing institutional memory looks like after 50 more of these."

### What MUST work live

- Steps 2–6 above, on the team's own laptop, offline. This is the non-negotiable core loop.
- The ambiguous/flagged case (step 4) — this is the differentiator; don't cut it under time pressure.

### What can be shown as screenshots/video if not stable live

- The analytics/institutional-memory dashboard (step 7) — if charting or aggregate-query logic is fragile, a pre-recorded 20-second clip or static screenshots are acceptable here; judges care more about the extraction-to-match-to-audit loop being real and live.
- Any voice-input demo, if attempted — record it once, working, rather than risk a live mic/browser-permissions failure on stage.
- The P6 EPPM write-back stub — a code/log snippet shown as a slide is fine; don't try to fake a live Primavera UI.

---

## 5. Build Plan — 6 people, 30 hours

### Roles

| Person | Role |
| --- | --- |
| **A** | Backend/ML Lead — extraction pipeline, hybrid matcher, confidence engine |
| **B** | Backend/API Engineer — FastAPI endpoints, DB schema, audit trail, write-back stub |
| **C** | Frontend Lead — Time Agent (supervisor chat/upload UI) + Review Queue UI |
| **D** | Frontend/Dashboard Engineer — analytics dashboard, institutional-memory query UI |
| **E** | Data & Prompt Engineer — synthetic schedule + sample reports/spreadsheets, few-shot prompt design, curated demo dataset |
| **F** | Integration Lead / Presentation — local deployment (Docker Compose), end-to-end rehearsal, slide deck, demo script, jury Q&A prep |

### Critical path

**Person E's synthetic dataset blocks everyone else** and must be first. Nobody can test extraction, matching, or UI wiring against fake placeholder data and expect it to still work once real data shows up — build the dataset (with its deliberate terminology mismatches and one ambiguous case) in the first 4 hours, non-negotiably, even in rough form, and refine it in parallel afterward.

### Hour-by-hour (revised for 2026 stack with OCR, Qwen3, reranking, calibration)

**Hr 0–2 — Kickoff & contract**

- Whole team: lock down the JSON schema for "extracted event" and "schedule activity." Define the Pydantic models. Define confidence thresholds (0.85 auto-suggest, 0.65–0.85 confirm, <0.65 ambiguous).
- B: set up FastAPI skeleton, SQLite + DuckDB schema, `.env` configuration for model paths.
- F: repo setup, Docker Compose skeleton (including model cache volumes), download model weights at build time.

**Hr 2–6 — Foundations & data prep (parallel)**

- **E (critical path)**: Build synthetic L5/L6 schedule (30–50 activities, civil/piping/electrical/instrumentation/HSE disciplines) + 2–3 free-text daily reports + 1–2 discipline spreadsheets. **Include deliberate test cases: terminology mismatches (e.g., "spool erected" vs plan's "Erect Line 24-XX"), one one-to-many ambiguous case (e.g., "erect line" could be fabrication/erection/hydrotest), one high-confidence case.**
- A: set up Ollama locally (download Qwen3-4B, Mistral 7B) and test a single extraction call against one E-provided report. Lock down extraction output schema.
- B: implement the **validation schema** (Pydantic models for extracted event, with enums for discipline, required fields, date validation).
- C: React scaffold (Vite + shadcn/ui), Time Agent chat UI skeleton, file-upload widget.
- D: Analytics dashboard skeleton, pick Recharts, mock data layout.
- F: write final demo script (the 7-beat story from §4, timed), slide deck skeleton.

**Hr 6–10 — Document processing cascade (A + B)**

- A: integrate **PyMuPDF** for text-layer extraction; test on E's sample PDFs.
- A: integrate **PaddleOCR-VL-1.6** as fallback (if text quality is poor). Test on scanned diary samples. Document latency.
- B: build `/ingest` endpoint to accept file upload or text, run the extraction pipeline, store raw input in `raw_reports` table.
- Decision point (Hr 8): If PaddleOCR-VL latency >2 sec per page, defer to "fallback" behavior (show static screenshot of OCR working, not live). If <1 sec, use live.

**Hr 10–15 — Extraction + deterministic matching (A + B)**

- A: implement **Regex + RapidFuzz** deterministic extractor (line/tag, discipline, dates, contractor names). Test against E's dataset.
- A: call **Qwen3-4B Instruct** (via Ollama) for free-form field extraction (activity phrase, quantity, status, delay reason). Schema-constrained JSON output.
- B: implement **Pydantic validation** — reject invalid extracted events, flag and store invalid attempts in `extraction_errors` table for planner review.
- B: `/match` endpoint — deterministic filter (line/tag/discipline/date match) producing filtered candidate set.
- A: pre-load schedule activities into FAISS with **Qwen3-Embedding-0.6B** embeddings at server startup. Test retrieval latency.
- C: wire Time Agent UI to real `/ingest` endpoint; test file upload, display extracted JSON.

**Hr 15–18 — Semantic retrieval + reranking (A + B)**

- A: FAISS top-10 candidate retrieval for each extracted event.
- A: call **Qwen3-Reranker-0.6B** on top-10 candidates to produce refined top-3 ranking.
- B: `/match` endpoint outputs top-3 with reranker scores and plain-language explanations (e.g., "matched on tag 24-XX, discipline piping, semantic similarity 0.82").
- A: implement **one-to-many granularity detection** — if top-3 candidates are semantically close (e.g., all relate to "line erection"), flag as ambiguous instead of force-ranking.

**Hr 18–22 — Confidence calibration + routing (A + B)**

- **A: Build a small validation set** (20–30 examples from E's dataset with correct matches hand-labeled). Extract features: (rule_score, embedding_score, reranker_score, line_match, discipline_match, date_validity, candidate_margin).
- **A: Train calibration model** (logistic regression via scikit-learn) to map raw signals to 0–1 confidence. Test on validation set.
- A: implement confidence-band routing: ≥0.85 → auto-suggest, 0.65–0.85 → confirm, <0.65 → flag ambiguous.
- B: `/match` endpoint outputs confidence band and reasoning.
- C: build Review Queue UI — display source evidence, top-3 alternates, confidence score, explanation; planner can accept/reject/correct.
- D: start building institutional-memory query UI (basic filters by discipline/contractor/date).

**Hr 22–26 — Integration, audit, analytics (B + D + C)**

- B: implement `/review` and `/approve` endpoints, `audit_log` table (immutable append log of all planner decisions).
- B: implement write-back stub (simulated `schedule_activities` update, log the "P6 EPPM REST API call" that would happen in production).
- D: build institutional-memory views in DuckDB (discipline-wise variance, contractor productivity, delay-cause frequency, confidence vs. correction rate).
- C: wire Review Queue to real `/approve` endpoint; add accept/reject/correct buttons, show audit log entries appear live.
- **D: Build analytics dashboard** — S-curve chart (planned vs. actual by discipline), variance summary card, memory query interface.
- A + E: finalize **curated demo dataset** — the exact live-input test case (high-confidence extraction + match + approve + update) and the ambiguous case (one-to-many, correctly flagged), validated end-to-end.
- F: rehearse demo script (full 7-beat run-through), catch integration gaps.

**Hr 26–29 — Polish, freeze, rehearsal**

- **Hard feature freeze at Hr 26.** Only bug fixes on the demo path after this.
- Whole team: **full end-to-end rehearsal #1** — ingest → extract → match → review → approve → dashboard. Time it.
- C: UI polish — error states, loading spinners, empty states. No broken CSS.
- F: **record a backup video** of the demo working end-to-end (offline on the team's laptop, no network calls).
- **E: pre-stage the exact demo inputs** (typed text, CSV upload) in a dedicated demo folder so they're ready at contest time.
- F: finalize slide deck, prep answers to jury questions (Doxel comparison, "isn't this just fuzzy matching," one-to-many granularity reasoning, scalability honesty, confidence calibration method).
- **Rehearsal #2** — run the full demo live one more time, with timer and a mock jury to ask questions.

**Hr 29–30 — Buffer**

- Reserve final hour for last-minute environment troubleshooting, model cache verification, Docker Compose test run on the actual demo laptop.
- No new code after Hr 26.

---

## 6. Risk Analysis

### Risk 1: Qwen3-4B extraction produces invalid JSON or hallucinated fields

**Why it's real:** Qwen3-4B is good at constrained extraction, but can still invent dates or quantities not in the source text if the prompt isn't airtight.
**Backup plan:** (a) Use **grammar-constrained decoding** (if available in the Ollama client) to force valid JSON schema. (b) Pydantic validation is mandatory — any invalid extracted event is rejected and logged, never passed to the matcher. (c) Always record the **exact source span** (the text fragment this came from) alongside every extracted field. (d) If extraction failure rate >10% on E's dataset by Hr 12, switch to regex + RapidFuzz deterministic-only path for the demo and present Qwen3-4B as "production enhancement" via the backup video. (e) The live demo should run on **curated, pre-tested inputs** (typed live, but validated to extract correctly beforehand).

### Risk 2: Qwen3-Reranker-0.6B is slow or produces worse rankings than semantic similarity alone

**Why it's real:** Adding a reranking step introduces latency (another model inference) and could theoretically degrade results if the reranker is poorly calibrated to your domain.
**Backup plan:** (a) Test reranker latency early (by Hr 17). If >1 sec per match, cache reranker scores for the synthetic schedule at startup instead of calling live. (b) If reranker accuracy is worse than expected, disable it and use pure semantic similarity (FAISS) for the demo, noting reranking as a "production optimization" in the deck. (c) Reranking is a "nice-to-have" not "must-have" — semantic similarity alone still produces top-3 candidates; reranking just polishes the ranking.

### Risk 3: PaddleOCR-VL-1.6 is too slow or fails on handwritten scans

**Why it's real:** OCR models are data-hungry and handwriting is notoriously hard. PaddleOCR-VL-1.6 may be slower than expected or may misparse degraded/handwritten documents.
**Backup plan:** (a) Test PaddleOCR latency on E's sample scanned documents by Hr 8. If >2 sec per page, fall back to **DeepSeek-OCR-2** (faster, designed for throughput) or skip OCR entirely for the demo and use E's pre-extracted text instead. (b) If handwriting is a blocker, pre-process via **Chandra OCR 2** (if time and hardware permit) or show a static screenshot/video of OCR working rather than attempting live OCR on messy handwriting. (c) For the demo, focus on the "clean PDF with text layer + one well-formed scanned diary page" test cases — avoid adversarial handwritten inputs.

### Risk 4: Confidence calibration logistic regression underfits or overfits on small validation set

**Why it's real:** if you only have 20–30 hand-labeled examples, the calibrator may overfit or fail to generalize.
**Backup plan:** (a) Use simple logistic regression, not a complex model — regularization (L1/L2) helps on small datasets. (b) If calibration quality is poor, use **fixed confidence thresholds** instead (e.g., "if embedding_score > 0.80 and rule_score > 0.7, then confidence = 0.85") — crude but interpretable. (c) The jury cares about the *explanation* (why the match was chosen) more than the numerical confidence score itself — if your explainability story is strong, a rough confidence estimate is acceptable.

### Risk 5: Live demo environment breaks on stage (model cache missing, dependency conflict, wifi, projector mismatch)

**Why it's real:** this is the single most common way strong hackathon projects fail to land.
**Backup plan:** (a) Package the entire stack in **Docker Compose** with model weights pre-downloaded and cached inside the image. (b) Test the Docker build and full pipeline on the **exact demo laptop** at least 4 hours before presenting — not the night before. (c) Pre-download all model weights to disk by Hr 22; do not rely on live downloads at demo time. (d) Have the **pre-recorded backup video** (from Hr 26) ready to play instantly if live breaks — do not attempt debugging on stage. (e) Test on the venue's actual display/projector if possible; if not, present from the team's laptop screen-shared. (f) Designate Person F as the sole decision-maker: if something breaks, F decides in <10 seconds whether to retry, switch to video, or skip to static screenshots — no committee discussion on stage.

### Risk 6: Ambiguity detection (one-to-many granularity check) doesn't work and forces false single-match on demo case

**Why it's real:** the ambiguity-detection logic (schedule dependency graph, semantic closeness check) can miss cases or be too aggressive.
**Backup plan:** (a) Hardcode the one-to-many test case detection: if the top-3 candidates are all for the same line and activity type but different phases (fabrication/erection/hydrotest), flag as ambiguous regardless of semantic score. (b) If automatic detection fails, add a manual flag in E's curated dataset: mark the ambiguous case as "expected_ambiguous: true" and check for it in the code. (c) The demo beat is "correctly flagging ambiguity" — if this fails live, narrate what should happen and show a screenshot or pre-recorded clip instead.

### If something fails *during* the live demo

1. **Don't debug on stage.** Narrate what *should* be happening, switch immediately to the backup video for that segment, and continue the story.
2. **Keep a screenshot deck of every key screen state** (extraction result, match with confidence, review queue, ambiguous-flag case, audit log, dashboard) as a slide-level fallback even beneath the video, for a true worst-case (e.g., no working laptop at all).
3. **Assign one person (F) as the sole "recovery" decision-maker** during the demo — if something breaks, F decides in real time whether to retry, skip to video, or skip to screenshots, so the presenter isn't making that call while also talking.
