# SAMANWAY ML/AI UPGRADE — Implementation Roadmap

**Status:** In Progress  
**Target Completion:** Before SIH Submission (2026-09-20)  
**Implementation Order:** 27 phases  

---

## PHASE 1 — Audit & Document (✅ COMPLETE)

- [x] Comprehensive audit of existing codebase
- [x] Identify all fake AI components
- [x] Map jury criticism to findings
- [x] Create audit report: `AUDIT_SAMANWAY_ML_LAYER.md`

**Output:** `AUDIT_SAMANWAY_ML_LAYER.md` — Complete technical audit

---

## PHASE 2 — Remove / Label Fake AI (🔄 IN PROGRESS)

**Goal:** Replace all `setTimeout` + hardcoded responses with real backend queries or explicit "DEMO MODE" labels.

### Task 2.1 — MemoryRAGPanel Fix
- **File:** `apps/review-console/src/components/MemoryRAGPanel.tsx`
- **Action:** Remove setTimeout mock, integrate real analytics backend
- **Expected:** Actual database queries or "DEMO MODE" label
- **Duplicates:** `-dark`, `-hi` variants

### Task 2.2 — DelayRiskDashboard Fix
- **File:** `apps/review-console/src/components/DelayRiskDashboard.tsx`
- **Action:** Remove SAMPLE_BOTTLENECKS fallback, query real SQLite/DuckDB
- **Expected:** Real historical data or "DEMO MODE" label
- **Duplicates:** `-dark`, `-hi` variants

### Task 2.3 — ReviewQueueContext Fix
- **File:** `apps/review-console/src/context/ReviewQueueContext.tsx`
- **Action:** Remove fake setTimeout delays
- **Expected:** Real API calls without artificial delays

---

## PHASE 3 — Benchmark Embedding Models

**Goal:** Evaluate all-MiniLM-L6-v2 vs stronger alternatives (BGE-M3, etc.)

### Task 3.1 — Create Benchmark Dataset
- **File:** `scripts/benchmark_embeddings.py`
- **Input:** Oil India synthetic schedule + sample field events
- **Output:** Labeled pairs (field event → expected schedule activity)
- **Count:** 50–100 test cases

### Task 3.2 — Benchmark Script
- **Metrics:**
  - Top-1 accuracy (correct activity ranked #1)
  - Top-3 accuracy (correct activity in top 3)
  - Mean Reciprocal Rank (MRR)
  - Ambiguous-case detection (multiple similar candidates)
- **Models to Evaluate:**
  - all-MiniLM-L6-v2 (baseline)
  - BGE-M3 (primary candidate)
  - nomic-embed-text or similar (fallback)
- **Output:** Benchmark report with clear winner

### Task 3.3 — Migration Planning
- If BGE-M3 wins: plan migration, test latency
- If all-MiniLM wins: keep but optimize caching
- Document trade-offs (model size, latency, accuracy)

---

## PHASE 4 — Upgrade Embedding Model (if needed)

**Goal:** Replace all-MiniLM-L6-v2 with stronger model (likely BGE-M3)

### Task 4.1 — Update VectorStore
- **File:** `services/matching/vector_store.py`
- **Changes:**
  - Update model name: `'bge-m3'` (or selected winner)
  - Update dimension calculation (BGE-M3 is 1024-dim)
  - Test FAISS IndexFlatIP compatibility
  - Add disk persistence for embeddings

### Task 4.2 — Update Configuration
- **File:** Create `services/config.py` or `.env`
- **Variables:**
  - `EMBEDDING_MODEL='bge-m3'`
  - `EMBEDDING_CACHE_PATH='/tmp/embeddings'`
  - `RERANKER_MODEL='...'`
  - `LLM_MODEL='...'`

### Task 4.3 — Update Requirements
- **File:** `services/matching/requirements.txt`
- **Add:** `sentence-transformers>=2.5.0` (newer version for better models)

### Task 4.4 — Test Migration
- Run existing tests, ensure FAISS still works
- Benchmark new embeddings on Oil India data
- Measure latency impact

---

## PHASE 5 — Build Engineering Knowledge Base / RAG Layer

**Goal:** Create retrievable knowledge to support structured event extraction

### Task 5.1 — Create Glossary KB
- **File:** `services/shared/engineering_glossary.json`
- **Content:**
  - Discipline terminology (piping, civil, electrical, etc.)
  - Common abbreviations (T&C, L&T, HTX, etc.)
  - Status terms (start, finish, progress, delay, etc.)
  - Unit representations (spools, joints, meters, etc.)
  - Equipment naming conventions
  - Contractor names & aliases
- **Format:** JSON with hierarchical structure

### Task 5.2 — Create Examples KB
- **File:** `services/shared/extraction_examples.json`
- **Content:**
  - Field phrases → extracted structured events
  - Example: "spool erected" → { activity_phrase: "erect spool", event_type: "finish", ... }
  - 20–30 diverse examples per discipline

### Task 5.3 — Implement RAG Retrieval
- **File:** `services/ingestion/rag_retriever.py` (new)
- **Function:** Given raw field text, retrieve relevant glossary entries
- **Mechanism:**
  - BM25 / TF-IDF on glossary
  - or simple embedding similarity (all-MiniLM)
  - Return top-K relevant terms + definitions
  
### Task 5.4 — Inject RAG into LLM Extraction
- **File:** `services/ingestion/llm_extractor.py`
- **Change:**
  - Before LLM call, retrieve glossary context
  - Inject context into system prompt
  - LLM uses context to generate better structured events

---

## PHASE 6 — Improve Structured Event Extraction

**Goal:** Hybrid deterministic + RAG + LLM extraction with validation

### Task 6.1 — Enhance Deterministic Extraction
- **File:** `services/ingestion/parsers/text_parser.py`
- **Improvements:**
  - Better date parsing (relative dates, date ranges)
  - Better number/quantity extraction
  - Better tag/line number extraction
  - Normalize abbreviations before matching
  - Preserve source spans for all extractions

### Task 6.2 — Add Source Grounding Validation
- **File:** `services/ingestion/llm_extractor.py`
- **Logic:**
  - LLM proposes extracted event
  - Validate that key fields appear in source text
  - If date not in source → REJECT
  - If quantity not in source → REJECT
  - Mark which fields are "source-grounded"

### Task 6.3 — Create Test Cases for Extraction
- **File:** `services/ingestion/tests/test_extraction_quality.py`
- **Cases:**
  - Exact phrase match
  - Abbreviation handling
  - Date parsing
  - Hindi mixed text
  - Hallucination rejection

---

## PHASE 7 — Implement Hybrid Matching Retrieval

**Goal:** Multi-stage retrieval before reranking

### Task 7.1 — Add Lexical Retrieval Layer
- **File:** `services/matching/lexical_retriever.py` (new)
- **Functions:**
  - RapidFuzz on activity name
  - RapidFuzz on tags
  - RapidFuzz on WBS
  - Exact matches
  - Return ranked candidates

### Task 7.2 — Add Semantic Retrieval Layer  
- **File:** `services/matching/semantic_retriever.py` (new)
- **Function:** FAISS search with new embedding model
- **Return:** Ranked candidates

### Task 7.3 — Merge Retrieval Results
- **File:** `services/matching/retrieval_union.py` (new)
- **Function:** Combine lexical + semantic candidates
- **Strategy:**
  - Union of top-K from each
  - Deduplicate
  - Sort by combined score
  - Return top-20 for reranking

### Task 7.4 — Add Metadata Filtering
- **File:** `services/matching/metadata_filter.py` (new)
- **Filters:**
  - Discipline must match (or be "unspecified")
  - Date must be within ±30 days (or "unspecified")
  - Tag match (if provided)
  - WBS match (optional)
- **Result:** Filtered top-K candidates

---

## PHASE 8 — Add Cross-Encoder Reranker

**Goal:** Use a strong model to rerank top-K candidates

### Task 8.1 — Evaluate Reranker Models
- **File:** `scripts/benchmark_rerankers.py`
- **Candidates:**
  - BGE-reranker-base (popular, good for technical text)
  - jina-reranker-v1-base-en
  - Qwen-Reranker if available locally
  - BAAI-Reranker (fallback)
- **Metric:** Improvement in top-1 accuracy over FAISS alone

### Task 8.2 — Implement Reranker Service
- **File:** `services/matching/reranker.py` (new)
- **Function:** Given field event + top-K candidates, rerank
- **Input:**
  ```python
  event: ExtractedEvent
  candidates: List[ScheduleActivity]
  ```
- **Output:**
  ```python
  reranked_scores: List[float]
  ```

### Task 8.3 — Integrate into Matching Pipeline
- **File:** `services/matching/engine.py`
- **Update:**
  - After metadata filtering → top-20
  - Run through reranker → top-3
  - Use reranker score in confidence model

---

## PHASE 9 — Build Schedule-Aware Context / RAG

**Goal:** Rich activity representations for matching

### Task 9.1 — Create Activity Document Representation
- **File:** `services/matching/activity_context.py` (new)
- **Content per Activity:**
  ```
  ID: L6-PIP-1047
  Name: Erect Line 24"-XX
  Discipline: Piping
  Tag: 24-XX
  WBS: Area 4 / Piping / Installation
  Area: Area 4
  Contractor: ABC Engineering
  Planned Start: 2026-08-10
  Planned Finish: 2026-08-12
  Predecessors: [PIP-1032]
  Successors: [PIP-1060]
  Related Activities: Fabricate, Hydrotest, NDT
  Phase: Installation
  Status: Not Yet Started
  ```

### Task 9.2 — Embed Activities with Context
- **File:** `services/matching/activity_embedder.py` (new)
- **Action:** Embed rich activity doc (not just name)
- **Result:** Better semantic matching

### Task 9.3 — Index for Retrieval
- **Action:** Create secondary FAISS index on rich docs
- **Result:** More contextual similarity

---

## PHASE 10 — Add Granularity-Aware Ambiguity Detection

**Goal:** Identify when one field event maps to multiple activities

### Task 10.1 — Implement One-to-Many Detection
- **File:** `services/matching/ambiguity_detector.py` (new)
- **Logic:**
  - Top-1, Top-2, Top-3 scores
  - If all three are similar (margin < 0.05):
    - Return AMBIGUOUS
    - Show all three candidates
  - If Top-3 span different phases (Fab, Erection, Test):
    - Return AMBIGUOUS (phase unclear)
  - If event type doesn't distinguish:
    - Return AMBIGUOUS

### Task 10.2 — Test Ambiguity Detection
- **File:** `services/matching/tests/test_ambiguity.py`
- **Cases:**
  - "piping work completed" (could be fab, erection, or test)
  - Multiple similar activities
  - Phase mismatch

---

## PHASE 11 — Train Calibrated Confidence Model

**Goal:** ML-based confidence scoring instead of heuristics

### Task 11.1 — Create Labeled Training Dataset
- **File:** `data/labeled_matches.json`
- **Format:**
  ```json
  [
    {
      "field_event": {...},
      "schedule_activity": {...},
      "is_correct": true,
      "confidence_expected": 0.95
    },
    ...
  ]
  ```
- **Count:** 50–100 positive + negative examples

### Task 11.2 — Extract Features
- **File:** `services/matching/feature_extractor.py` (new)
- **Features:**
  - fuzzy_activity_score
  - fuzzy_tag_score
  - embedding_similarity
  - reranker_score
  - discipline_match (binary)
  - tag_match (binary)
  - date_validity (binary)
  - WBS_match (binary)
  - contractor_match (binary)
  - top1_top2_margin
  - candidate_count
  - event_type_match (binary)

### Task 11.3 — Train Model
- **File:** `services/matching/confidence_model.py` (new)
- **Model:** Logistic regression or Calibrated Random Forest
- **Training:**
  - Use labeled dataset
  - 5-fold cross-validation
  - Calibrate probabilities
- **Output:** Sklearn pickle model

### Task 11.4 — Integrate into Matching Engine
- **File:** `services/matching/engine.py`
- **Update:**
  - After reranking, extract features
  - Run through confidence model
  - Get calibrated probability
  - Map to bands (HIGH, MEDIUM, LOW)

### Task 11.5 — Validate Calibration
- **File:** `scripts/validate_confidence.py`
- **Check:**
  - Calibration plot (predicted prob vs actual accuracy)
  - Precision @ recall thresholds
  - AUC score

---

## PHASE 12 — Remove Hardcoded Confidence Multipliers

**Goal:** Replace heuristic scoring with trained model

### Task 12.1 — Refactor Engine Scoring
- **File:** `services/matching/engine.py`
- **Remove:**
  - All hardcoded multipliers (0.5, 0.2, 0.1, 1.10, 0.10)
  - "Apply 10% Confidence Score Boost" comment
  - Manual discipline/tag penalty logic
- **Replace with:**
  - Feature extraction
  - Model prediction

---

## PHASE 13 — Replace Fake Institutional Memory RAG

**Goal:** Real database queries instead of setTimeout mock

### Task 13.1 — Create Approval Event Storage
- **File:** `services/analytics/models.py` (if not exists)
- **Schema:**
  ```python
  class ApprovedEvent:
      id
      field_event_id
      schedule_activity_id
      timestamp
      planner_id
      action (approve/reject/correct)
      discipline
      tag
      actual_start_date
      actual_end_date
      variance_days
      delay_reason
  ```

### Task 13.2 — Implement Analytics Queries
- **File:** `services/analytics/queries.py` (new)
- **Queries:**
  - Duration distribution by discipline
  - Delay causes by contractor
  - Historical variance by activity type
  - Bottleneck frequency
  - Critical path variance

### Task 13.3 — Implement Analytics Endpoint
- **File:** `services/analytics/app.py`
- **Endpoint:** GET `/analytics/query`
- **Parameters:** discipline, contractor, date_range, metric
- **Returns:** Real historical data

### Task 13.4 — Replace Frontend Mock
- **File:** `apps/review-console/src/components/MemoryRAGPanel.tsx`
- **Update:**
  - Remove setTimeout
  - Call real analytics endpoint
  - Display real retrieved data
  - Label as "Historical Data Query" (not "RAG")

---

## PHASE 14 — Replace Fake Delay/Risk Analytics

**Goal:** Real predictive analytics (or honest demo mode)

### Task 14.1 — Option A: Real Historical Analytics (Recommended)
- **File:** `services/analytics/engine.py`
- **Queries:**
  - Planned vs actual duration by discipline
  - Variance distribution
  - On-time completion rate
  - Average delay days
- **Output:** Real metrics to frontend

### Task 14.2 — Option B: Lightweight Delay Risk Model
- **File:** `services/analytics/risk_model.py` (new, optional)
- **Features:**
  - Activity phase (fabrication, erection, etc.)
  - Discipline
  - Planned duration
  - Contractor history
  - Weather/seasonal factors (if available)
- **Target:** Predicted delay probability
- **Caveat:** Only if sufficient labeled historical data exists

### Task 14.3 — Update Frontend Dashboard
- **File:** `apps/review-console/src/components/DelayRiskDashboard.tsx`
- **Changes:**
  - Remove SAMPLE_BOTTLENECKS
  - Query real analytics endpoint
  - Display real historical bottlenecks (not sample)
  - If risk prediction not ready: Label as "HISTORICAL ANALYTICS" (not "predicted")

---

## PHASE 15 — Fix Missing Analytics Fields

**Goal:** Complete DuckDB integration

### Task 15.1 — Add Missing Analytics Endpoints
- **File:** `services/analytics/app.py`
- **Endpoints to add:**
  - GET `/analytics/stats` — return `ambiguous_events` field
  - GET `/analytics/discipline-breakdown`
  - GET `/analytics/contractor-performance`
  - GET `/analytics/bottleneck-frequency`

### Task 15.2 — Update Tests
- **File:** `services/analytics/tests/test_analytics.py`
- **Fix:** `test_stats` to expect real response

---

## PHASE 16 — Create Model Configuration System

**Goal:** Centralized, environment-based model configuration

### Task 16.1 — Create Config Module
- **File:** `services/config.py`
- **Content:**
  ```python
  class EmbeddingConfig:
      MODEL = os.getenv('EMBEDDING_MODEL', 'bge-m3')
      CACHE_PATH = os.getenv('EMBEDDING_CACHE_PATH', '/tmp/embeddings')
  
  class RerankerConfig:
      MODEL = os.getenv('RERANKER_MODEL', 'bge-reranker-base')
  
  class ConfidenceConfig:
      MODEL_PATH = os.getenv('CONFIDENCE_MODEL_PATH', '/tmp/confidence_model.pkl')
  ```

### Task 16.2 — Update All Services
- **Files:**
  - `services/matching/vector_store.py` → use EmbeddingConfig
  - `services/matching/reranker.py` → use RerankerConfig
  - `services/matching/engine.py` → use ConfidenceConfig

### Task 16.3 — Create .env Template
- **File:** `.env.example`
- **Content:** All configuration variables with defaults

---

## PHASE 17 — Build Evaluation Dataset

**Goal:** Labeled data for model evaluation

### Task 17.1 — Create Synthetic Test Cases
- **File:** `data/test_cases.json`
- **Structure:**
  ```json
  [
    {
      "case_id": "CASE-1-EXACT-MATCH",
      "field_event": {...},
      "expected_activity_id": "L6-PIP-1047",
      "category": "exact_match",
      "should_be_high_confidence": true
    },
    ...
  ]
  ```
- **Cases to include:**
  1. Exact match
  2. Semantic variation
  3. Abbreviation
  4. Different terminology
  5. Ambiguous (multiple valid matches)
  6. Wrong discipline
  7. Wrong tag
  8. Unmatched/new activity

### Task 17.2 — Create Negative Examples
- **File:** `data/negative_examples.json`
- **Content:** Field events that should NOT match certain activities

---

## PHASE 18 — Create Evaluation Script

**Goal:** Benchmark baseline vs. upgraded architecture

### Task 18.1 — Implement Evaluation
- **File:** `scripts/evaluate_matching.py`
- **Metrics:**
  - Top-1 accuracy
  - Top-3 accuracy
  - MRR (Mean Reciprocal Rank)
  - Ambiguous-case recall
  - False-match rate
  - Confidence calibration (ECE, MCE)

### Task 18.2 — Run Baseline
- **Configuration:** all-MiniLM-L6-v2 + current heuristic scoring
- **Report:** Baseline performance

### Task 18.3 — Run Upgraded
- **Configuration:** BGE-M3 + reranker + trained confidence model
- **Report:** Upgraded performance

### Task 18.4 — Compare & Report
- **Output:** `EVALUATION_RESULTS.md` with:
  - Baseline metrics
  - Upgraded metrics
  - Improvement ✅ or Regression ❌
  - Per-case analysis

---

## PHASE 19 — Ablation Study

**Goal:** Prove value of each component

### Task 19.1 — Test Configurations
- **Config A:** Fuzzy matching only
- **Config B:** Embedding retrieval only
- **Config C:** Fuzzy + embedding
- **Config D:** Fuzzy + embedding + metadata filtering
- **Config E:** Fuzzy + embedding + reranker
- **Config F:** Full pipeline (E + trained confidence)

### Task 19.2 — Measure Each
- **Metrics:** Top-1 accuracy, top-3 accuracy, MRR per config
- **Output:** `ABLATION_RESULTS.md`

### Task 19.3 — Document Value
- **Claim:** "Each layer improved entity resolution accuracy by X%"
- **Evidence:** Actual measured results

---

## PHASE 20 — Create Strong Test Cases

**Goal:** Prevent regression; validate improvements

### Task 20.1 — Implement Test Suite
- **File:** `services/matching/tests/test_cases.py`
- **Cases:**
  - CASE 1: Exact match → HIGH confidence
  - CASE 2: Semantic variation → HIGH confidence
  - CASE 3: Abbreviation → HIGH confidence
  - CASE 4: Different terminology → GOOD semantic candidate
  - CASE 5: Ambiguous → Multiple candidates
  - CASE 6: Wrong discipline → HEAVY PENALTY
  - CASE 7: Wrong tag → LOW confidence
  - CASE 8: Unmatched → NO FORCED MATCH

### Task 20.2 — Add to CI
- Ensure tests run on every commit
- Fail if accuracy drops below baseline

---

## PHASE 21 — Enhance API Responses

**Goal:** Expose auditable signals for debugging

### Task 21.1 — Update Match Endpoint
- **File:** `services/matching/app.py`
- **Endpoint:** POST `/match`
- **Response:**
  ```json
  {
    "event": {...},
    "top_match": {...},
    "candidates": [...],
    "retrieval": {
      "lexical_candidates": [...],
      "semantic_candidates": [...]
    },
    "reranking": {
      "model": "bge-reranker-base",
      "scores": [...]
    },
    "features": {
      "fuzzy_activity": 0.85,
      "fuzzy_tag": 0.92,
      "embedding": 0.88,
      "reranker": 0.91,
      "discipline_match": true,
      "tag_match": true,
      "date_validity": true,
      "candidate_margin": 0.08
    },
    "confidence": 0.91,
    "confidence_band": "HIGH",
    "is_ambiguous": false,
    "evidence": [...]
  }
  ```

---

## PHASE 22 — Update Frontend to Show Real Evidence

**Goal:** Planner can see WHY each match was made

### Task 22.1 — Update ScheduleMatchModal
- **File:** `apps/review-console/src/components/ScheduleMatchModal.tsx` (or equivalent)
- **Display per candidate:**
  - Activity ID, name, discipline, tag
  - Semantic score, fuzzy score, reranker score
  - Constraint checks (discipline ✓, tag ✓, date ✓)
  - Final calibrated confidence (0–1)
  - Evidence bullets (why this match was selected)

### Task 22.2 — Show Model Attribution
- "Matched using: Semantic retrieval (0.88) + Fuzzy tag (0.92) + Reranker (0.91)"
- "Confidence calibration: 0.91 (HIGH — suggest to planner)"

### Task 22.3 — Handle Ambiguous Cases
- Show top-3 candidates
- Label as AMBIGUOUS
- Force planner to choose
- Do NOT auto-suggest

---

## PHASE 23 — Update Docker / Dependencies

**Goal:** All models included, startup validated

### Task 23.1 — Update requirements.txt
- Add newer sentence-transformers
- Add reranker library
- Add scikit-learn (for confidence model)
- Document all new dependencies

### Task 23.2 — Update Dockerfiles
- Model weight download / caching
- Graceful fallback if models unavailable
- Environment variables for model paths

### Task 23.3 — Create startup-check script
- Verify all models available
- Report mode: MODEL or FALLBACK
- Fail clearly if critical model missing

---

## PHASE 24 — Performance Optimization

**Goal:** System is responsive, not slow

### Task 24.1 — Cache Precomputed Embeddings
- Don't recompute activity embeddings every startup
- Save to disk, load at startup
- Invalidate on schedule change

### Task 24.2 — Optimize Retrieval Pipeline
- Metadata filtering FIRST (reduce search space)
- Then lexical (fast)
- Then semantic (FAISS)
- Then reranker (only on top-20)

### Task 24.3 — Benchmark Latency
- Target: < 2 seconds per match (end-to-end)
- Measure each stage
- Document bottlenecks

---

## PHASE 25 — Security / Data Privacy

**Goal:** No sensitive data sent to public APIs

### Task 25.1 — Local-First by Default
- All inference local (Ollama, transformers)
- No public API calls for core functionality
- Optional cloud fallback clearly marked

### Task 25.2 — Logging
- Do NOT log raw field reports by default
- Log anonymized features only
- Configurable verbosity

---

## PHASE 26 — Documentation & README

**Goal:** Clear instructions for jury

### Task 26.1 — Update Main README
- Explain new ML stack
- List all models used and why
- Instructions to run evaluation
- Instructions to verify real models in use

### Task 26.2 — Create Model Cards
- For each model (embedding, reranker, confidence):
  - Purpose
  - Architecture
  - Performance
  - Limitations

### Task 26.3 — Create Evaluation Guide
- How to run benchmark
- How to run ablation study
- How to interpret results

---

## PHASE 27 — Final Validation & Jury Prep

**Goal:** System is technically honest and impressive

### Task 27.1 — Verify No Fake AI Remains
- Grep for `setTimeout` in frontend
- Grep for hardcoded sample data
- Grep for "mock" or "demo" responses (should be labeled)

### Task 27.2 — Create Jury Demo Script
- **File:** `scripts/demo_for_jury.py`
- **Sequence:**
  1. Show field report input
  2. Run matching pipeline, show each stage
  3. Display top-3 candidates with scores
  4. Show confidence model output
  5. Run evaluation on test cases
  6. Show ablation results

### Task 27.3 — Create Talking Points
- "We rebuilt the ML layer with X components"
- "Embedding model improvement: from Y to Z%"
- "Added reranker, improves accuracy by X%"
- "Confidence calibrated on labeled data"
- "Institutional memory queries real DB"
- "Evaluated: baseline vs upgraded pipeline"

### Task 27.4 — Final Testing
- [ ] All tests pass
- [ ] Evaluation script runs successfully
- [ ] Ablation study complete
- [ ] Demo script works
- [ ] No fake AI remains

---

## TIMELINE ESTIMATE

| Phase | Task Count | Est. Time | Status |
|-------|-----------|-----------|--------|
| 1 | 1 | 3h | ✅ Complete |
| 2 | 3 | 6h | 🔄 In Progress |
| 3 | 3 | 4h | ⏳ Pending |
| 4 | 4 | 6h | ⏳ Pending |
| 5 | 4 | 8h | ⏳ Pending |
| 6 | 3 | 6h | ⏳ Pending |
| 7 | 4 | 8h | ⏳ Pending |
| 8 | 3 | 8h | ⏳ Pending |
| 9 | 3 | 6h | ⏳ Pending |
| 10 | 2 | 4h | ⏳ Pending |
| 11 | 5 | 10h | ⏳ Pending |
| 12 | 1 | 4h | ⏳ Pending |
| 13 | 4 | 8h | ⏳ Pending |
| 14 | 3 | 6h | ⏳ Pending |
| 15 | 2 | 4h | ⏳ Pending |
| 16 | 3 | 4h | ⏳ Pending |
| 17 | 2 | 4h | ⏳ Pending |
| 18 | 4 | 8h | ⏳ Pending |
| 19 | 3 | 6h | ⏳ Pending |
| 20 | 2 | 4h | ⏳ Pending |
| 21 | 1 | 3h | ⏳ Pending |
| 22 | 3 | 6h | ⏳ Pending |
| 23 | 3 | 4h | ⏳ Pending |
| 24 | 3 | 4h | ⏳ Pending |
| 25 | 2 | 2h | ⏳ Pending |
| 26 | 3 | 3h | ⏳ Pending |
| 27 | 4 | 4h | ⏳ Pending |
| **TOTAL** | **90+** | **~145 hours** | |

**Note:** Estimate is based on careful, quality implementation. Jury submission deadline: **2026-09-20** (21 days from audit date).

---

## NEXT IMMEDIATE ACTION

**PROCEED TO PHASE 2:** Remove fake AI indicators from frontend.

**Files to modify:**
1. `apps/review-console/src/components/MemoryRAGPanel.tsx`
2. `apps/review-console/src/components/DelayRiskDashboard.tsx`
3. Duplicates in `-dark` and `-hi` variants
4. `apps/review-console/src/context/ReviewQueueContext.tsx`

---

**Roadmap Created:** 2026-08-30  
**Target Completion:** 2026-09-15 (before submission)
