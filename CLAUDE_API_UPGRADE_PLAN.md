# CLAUDE API UPGRADE — Comprehensive Technical Plan

**Status:** Starting implementation  
**Target:** Complete replacement of Ollama with Claude API  
**Goal:** Build defensible multi-stage ML pipeline with real RAG, reranking, and calibrated confidence

---

## CURRENT STATE (AUDIT COMPLETE)

### What We Have:
- ✅ Ollama/llama3.2 local LLM (httpx-based)
- ✅ all-MiniLM-L6-v2 embeddings (384-dim)
- ✅ FAISS vector store with mock fallback
- ✅ RapidFuzz fuzzy matching
- ✅ Pydantic schema validation
- ✅ Strong system prompt for extraction
- ✅ Multi-format ingestion pipeline

### What's Missing:
- ❌ RAG layer for engineering terminology
- ❌ Stronger embedding model
- ❌ Real reranker (no cross-encoder)
- ❌ Trained confidence model (heuristic only)
- ❌ Schedule-aware context retrieval
- ❌ Granularity mismatch detection
- ❌ Proper evaluation dataset
- ❌ Benchmark baseline vs. upgraded

### Current Limitations:
- Ollama requires local installation
- all-MiniLM is lightweight but weak for technical terms
- No multi-stage retrieval strategy
- Confidence scores are arbitrary heuristics
- No institutional memory RAG (fake on frontend)

---

## IMPLEMENTATION PHASES

### PHASE 1: Claude Service Layer (est. 6 hours)

**Goal:** Create clean abstraction for Claude API with proper configuration, error handling, and structured output

**Files to Create:**
1. `services/llm/claude_client.py` — Claude API wrapper
2. `services/llm/models.py` — Pydantic models for LLM I/O
3. `services/llm/prompts.py` — System prompts and context
4. `.env.example` — Template with placeholders

**Files to Modify:**
1. `services/ingestion/llm_extractor.py` → switch to Claude
2. `services/ingestion/config.py` → add Claude config
3. `requirements.txt` → add anthropic SDK

**Key Features:**
- Environment-based API key (ANTHROPIC_API_KEY)
- Configurable model (CLAUDE_MODEL=claude-sonnet-4-6)
- Structured JSON output with Pydantic validation
- Proper error handling (API failures, timeouts, malformed output)
- No silent fallbacks to fake responses
- Health check endpoint

---

### PHASE 2: Engineering Knowledge Base + RAG (est. 8 hours)

**Goal:** Build retrievable knowledge for terminology context injection

**Files to Create:**
1. `services/shared/knowledge_base.py` — KB interface
2. `data/engineering_glossary.json` — Terminology database
3. `services/ingestion/rag_retriever.py` — RAG engine

**Knowledge Domains:**
- Piping terminology (spool, weld, hydrotest, etc.)
- Civil terminology (foundation, rebar, casting, etc.)
- Electrical terminology (cable pulling, termination, etc.)
- Instrumentation (calibration, loop checking, etc.)
- HSE terminology
- Status terms (start, finish, progress, delay)
- Units and abbreviations
- Contractor names and aliases
- Activity synonyms

**Retrieval Methods:**
- BM25 for keyword-based retrieval
- Embedding-based (all-MiniLM initially, BGE-M3 later)
- Return top-K relevant terms + definitions

**Integration:**
- Called before Claude extraction
- Results injected into Claude system prompt as context
- Example: "spool erection" → retrieve piping terminology → pass to Claude

---

### PHASE 3: Upgrade Embedding Model (est. 4 hours)

**Goal:** Replace all-MiniLM-L6-v2 with stronger BGE-M3

**Files to Modify:**
1. `services/matching/vector_store.py` → upgrade model
2. `services/config.py` → centralize model config
3. `requirements.txt` → add newer sentence-transformers

**Configuration:**
```
EMBEDDING_MODEL=bge-m3
EMBEDDING_CACHE_PATH=/path/to/cache
```

**Changes:**
- Update dimension (1024 for BGE-M3)
- Add embedding persistence/caching
- Test FAISS compatibility
- Benchmark improvement on synthetic test cases

---

### PHASE 4: Multi-Stage Retrieval (est. 10 hours)

**Goal:** Build hybrid retrieval combining fuzzy + semantic + metadata

**Files to Create:**
1. `services/matching/lexical_retriever.py` — RapidFuzz-based
2. `services/matching/semantic_retriever.py` — FAISS-based
3. `services/matching/candidate_union.py` — merge strategy
4. `services/matching/metadata_filter.py` — constraint filtering

**Pipeline:**
```
Field Event
    ↓
Normalization (lowercase, punctuation, abbreviations)
    ↓
Metadata Filtering (discipline, date window, area)
    ↓ 2,000 candidates
    
├→ Lexical Retrieval (RapidFuzz)  ─┐
│                                   ├→ Union & Dedup
└→ Semantic Retrieval (FAISS)  ────┘
    ↓ ~100 candidates
    
Candidate Merger
    ↓ ~50 unique candidates
    
Reranker (Phase 5)
```

**Fuzzy Metrics:**
- `ratio()` — activity name similarity
- `partial_ratio()` — tag matching
- `token_sort_ratio()` — normalized token order
- `token_set_ratio()` — token set intersection

**Normalization Examples:**
```
24-inch XX → 24 inch xx
24" XX → 24 inch xx
LINE 24 XX → 24 xx
PIP-1047 → pip 1047
```

---

### PHASE 5: Cross-Encoder Reranker (est. 6 hours)

**Goal:** Add reranker to score candidates in context of field event

**Files to Create:**
1. `services/matching/reranker.py` — Cross-encoder wrapper
2. `services/matching/reranker_config.py` — Model config

**Model Selection:**
- Evaluate BGE-reranker-base locally
- Fallback: lightweight BAAI reranker if needed
- Input: (field_event, candidate_activity)
- Output: relevance score (0-1)

**Integration:**
```
Top-50 candidates from retrieval
    ↓
Reranker (scores all 50)
    ↓
Top-10 ranked by reranker score
    ↓
Schedule constraints validation
    ↓
Confidence model
```

**Important:** Reranker runs on top-K, not entire schedule (scalability)

---

### PHASE 6: Schedule-Aware Context RAG (est. 6 hours)

**Goal:** Enrich candidate activities with schedule context for matching

**Files to Create:**
1. `services/matching/activity_context.py` — Rich activity representation
2. `services/matching/schedule_rag.py` — Context retrieval

**Activity Enrichment:**
```
Activity ID: PIP-1047
Name: Erect Line 24"-XX
Discipline: Piping
WBS: Area 4 / Piping / Installation
Tag: 24"-XX
Planned Start: 2026-08-10
Planned Finish: 2026-08-12
Predecessors: PIP-1032 (Fabricate Line 24"-XX)
Successors: PIP-1060 (Hydrotest Line 24"-XX)
Contractor: ABC Engineering
Related Activities: Fabrication, Hydrotest, NDT
Phase: Installation
Status: Not Yet Started
Dependencies: Must follow PIP-1032
```

**Context Retrieval:**
- Enrich each candidate with full context
- Embed rich representation (not just name)
- Use for reranker input
- Validate schedule dependencies

---

### PHASE 7: Granularity Mismatch Detection (est. 5 hours)

**Goal:** Recognize ambiguous field events that map to multiple valid activities

**Files to Create:**
1. `services/matching/ambiguity_detector.py` — Ambiguity logic

**Detection Strategy:**
```
Top-3 candidates:
  PIP-1001 (Fabricate) score=0.72
  PIP-1002 (Erect) score=0.70
  PIP-1003 (Hydrotest) score=0.68

Margin (top1-top2): 0.02
If margin < 0.05 and score > 0.60:
  → AMBIGUOUS
  
Span check:
  If top-3 span different phases:
    → AMBIGUOUS
    
Event type check:
  If field says "piping work" (unclear phase):
    → AMBIGUOUS
```

**Output:**
```
{
  "is_ambiguous": true,
  "top_candidates": [PIP-1001, PIP-1002, PIP-1003],
  "reason": "Field report does not identify execution phase (fab/erection/test)"
}
```

---

### PHASE 8: Calibrated Confidence Model (est. 8 hours)

**Goal:** Train ML model to predict true match probability

**Files to Create:**
1. `data/labeled_training_data.json` — Labeled field→activity pairs
2. `services/matching/feature_extractor.py` — Extract features
3. `services/matching/confidence_model.py` — Trained model + inference
4. `scripts/train_confidence_model.py` — Training pipeline

**Features:**
```
fuzzy_activity: 0-1
fuzzy_tag: 0-1
embedding_similarity: 0-1
reranker_score: 0-1
discipline_match: 0 or 1
line_match: 0 or 1
tag_match: 0 or 1
event_type_match: 0 or 1
date_validity: 0 or 1
WBS_match: 0 or 1
top1_top2_margin: 0-1
candidate_count: integer
dependency_validity: 0 or 1
schedule_compatibility: 0 or 1
```

**Model:**
- Logistic Regression (interpretable)
- or Light GBM (calibrated with CalibratedClassifierCV)
- 5-fold cross-validation on labeled data
- Output: calibrated probability (0-1)

**Thresholds:**
```
>= 0.85 → HIGH (planner approval)
0.65–0.85 → MEDIUM (active confirmation)
< 0.65 → LOW (review queue)
```

**Training Data Examples:**
```
{
  "field_event": "24-inch XX spool erection completed",
  "expected_activity_id": "PIP-1047",
  "is_correct": true
}
{
  "field_event": "24-inch AB spool erected",
  "expected_activity_id": "PIP-1047",
  "is_correct": false,
  "reason": "wrong_line_number"
}
```

---

### PHASE 9: Remove All Mock AI (est. 4 hours)

**Goal:** Eliminate all fake/demo responses from frontend and backend

**Files to Modify:**
1. `apps/review-console/src/components/MemoryRAGPanel.tsx` — Remove setTimeout, add real backend
2. `apps/review-console/src/components/DelayRiskDashboard.tsx` — Remove sample data
3. All `-dark`, `-hi` variants
4. Any hardcoded confidence scores
5. Any setTimeout mocks

**Validation:**
```bash
grep -r "setTimeout\|SAMPLE_\|hardcoded\|mock.*AI" apps services --include="*.tsx" --include="*.py"
```

Should return zero results (except comments explaining removed items).

---

### PHASE 10: Evaluation & Benchmarking (est. 8 hours)

**Goal:** Prove improvements with measurable benchmarks

**Files to Create:**
1. `data/evaluation_test_cases.json` — 50-100 labeled test cases
2. `scripts/evaluate_matching.py` — Evaluation framework
3. `scripts/run_ablation_study.py` — Ablation study
4. `EVALUATION_RESULTS.md` — Results report

**Test Cases Structure:**
```json
{
  "case_id": "EXACT_MATCH_001",
  "field_report": "24-inch XX spool erection completed",
  "expected_activity_id": "PIP-1047",
  "expected_discipline": "piping",
  "expected_line": "24-inch XX",
  "expected_event_type": "completion",
  "category": "exact_match",
  "difficulty": "easy"
}
```

**Metrics:**
- Top-1 accuracy
- Top-3 accuracy
- Mean Reciprocal Rank (MRR)
- Precision @ recall thresholds
- Ambiguous-case detection rate
- False-match rate
- Confidence calibration (ECE, MCE)
- Processing latency

**Ablation Configurations:**
```
A. Fuzzy only
B. Embedding only
C. Fuzzy + embedding
D. Fuzzy + embedding + metadata
E. Fuzzy + embedding + reranker
F. Full pipeline (E + confidence model)
```

**Baseline vs. Upgraded:**
```
Baseline: Ollama + all-MiniLM + current heuristic
Upgraded: Claude + BGE-M3 + reranker + trained confidence

Comparison: Measure improvement for each configuration
```

---

## ARCHITECTURE DIAGRAM

```
┌─────────────────────────────────────────────────────────────┐
│                        FIELD INPUT                           │
│           (text/CSV/PDF/voice/Excel/image)                  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
        ┌────────────────────────────────┐
        │   TEXT EXTRACTION & OCR         │
        │   (PyMuPDF, PaddleOCR, etc.)    │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  TEXT NORMALIZATION            │
        │  (case, whitespace, units)     │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  ENGINEERING KNOWLEDGE RAG     │
        │  (retrieve terminology context)│
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  CLAUDE API EXTRACTION         │
        │  (schema-constrained output)   │
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌────────────────────────────────┐
        │  PYDANTIC VALIDATION           │
        │  (enforce schema, reject invalid)
        └────────┬───────────────────────┘
                 │
                 ▼
        ┌─────────────────────────────────────────────────┐
        │           STRUCTURED EVENT EXTRACTION           │
        │   activity_phrase, discipline, tag, etc.       │
        └─────────────┬─────────────────────────────────┘
                      │
                      ▼
        ┌──────────────────────────────────────────────────┐
        │          ENTITY NORMALIZATION                    │
        │  (standardize tag, line, contractor names)      │
        └────────────┬─────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
    ┌──────────────┐      ┌──────────────────┐
    │   FUZZY      │      │   SEMANTIC       │
    │ MATCHING     │      │ RETRIEVAL        │
    │ (RapidFuzz)  │      │ (FAISS + BGE-M3) │
    └──────┬───────┘      └────────┬─────────┘
           │                       │
           └───────────┬───────────┘
                       │
                       ▼
        ┌──────────────────────────────────────────┐
        │  METADATA FILTERING                      │
        │  (discipline, date, area constraints)   │
        └────────────┬─────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────────┐
        │  CANDIDATE UNION & DEDUP                 │
        │  Merge fuzzy + semantic candidates      │
        └────────────┬─────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────────┐
        │  SCHEDULE-AWARE RAG                      │
        │  Enrich candidates with context         │
        └────────────┬─────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────────┐
        │  CROSS-ENCODER RERANKER                  │
        │  Score candidates in context            │
        └────────────┬─────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────────┐
        │  GRANULARITY MISMATCH DETECTION          │
        │  Identify ambiguous matches             │
        └────────────┬─────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────────┐
        │  SCHEDULE CONSTRAINT VALIDATION          │
        │  (predecessors, dependencies, etc.)     │
        └────────────┬─────────────────────────────┘
                     │
                     ▼
        ┌──────────────────────────────────────────┐
        │  CALIBRATED CONFIDENCE MODEL             │
        │  Predict true match probability         │
        └────────────┬─────────────────────────────┘
                     │
           ┌─────────┴──────────┐
           │                    │
      HIGH CONFIDENCE       AMBIGUOUS/LOW
           │                    │
           ▼                    ▼
      PLANNER APPROVAL    REVIEW QUEUE
           │                    │
           └─────────┬──────────┘
                     │
                     ▼
        ┌──────────────────────────────────────────┐
        │  AUDIT LOG & INSTITUTIONAL MEMORY        │
        │  (SQLite + DuckDB)                       │
        └──────────────────────────────────────────┘
```

---

## CONFIGURATION

### Environment Variables

```bash
# Claude API
ANTHROPIC_API_KEY=sk-...
CLAUDE_MODEL=claude-sonnet-4-6

# Embeddings
EMBEDDING_MODEL=bge-m3
EMBEDDING_CACHE_PATH=/var/cache/embeddings

# Reranker
RERANKER_MODEL=bge-reranker-base

# Confidence Model
CONFIDENCE_MODEL_PATH=/models/confidence_model.pkl

# System
LLM_PROVIDER=anthropic
LLM_STATUS=AVAILABLE
```

### .env.example

```
# CLAUDE API CONFIGURATION
ANTHROPIC_API_KEY=
CLAUDE_MODEL=claude-sonnet-4-6

# EMBEDDING CONFIGURATION
EMBEDDING_MODEL=bge-m3
EMBEDDING_CACHE_PATH=./embeddings_cache

# RERANKER CONFIGURATION
RERANKER_MODEL=bge-reranker-base

# CONFIDENCE MODEL
CONFIDENCE_MODEL_PATH=./models/confidence_model.pkl

# FEATURE FLAGS
ENABLE_CLAUDE_EXTRACTION=true
ENABLE_RAG=true
ENABLE_RERANKER=true
ENABLE_CONFIDENCE_MODEL=true

# THRESHOLDS
CONFIDENCE_HIGH=0.85
CONFIDENCE_MEDIUM=0.65

# TIMEOUTS
CLAUDE_TIMEOUT=60
RERANKER_TIMEOUT=30
```

---

## TIMELINE

| Phase | Task | Est. Hours | Actual | Status |
|-------|------|-----------|--------|--------|
| 1 | Claude Service Layer | 6 | — | ⏳ |
| 2 | Knowledge Base + RAG | 8 | — | ⏳ |
| 3 | Upgrade Embeddings | 4 | — | ⏳ |
| 4 | Multi-Stage Retrieval | 10 | — | ⏳ |
| 5 | Cross-Encoder Reranker | 6 | — | ⏳ |
| 6 | Schedule-Aware RAG | 6 | — | ⏳ |
| 7 | Granularity Detection | 5 | — | ⏳ |
| 8 | Confidence Model | 8 | — | ⏳ |
| 9 | Remove Mock AI | 4 | — | ⏳ |
| 10 | Evaluation & Benchmark | 8 | — | ⏳ |
| **TOTAL** | | **65 hours** | | |

---

## VALIDATION CHECKLIST

### Per Phase:
- [ ] All files created/modified
- [ ] No hardcoded values
- [ ] Tests pass
- [ ] API key never logged
- [ ] Error handling complete
- [ ] Documentation updated

### Final Validation:
- [ ] No Ollama code remains
- [ ] No fake AI responses
- [ ] Claude API integrated end-to-end
- [ ] RAG layer functional
- [ ] Reranker operational
- [ ] Confidence model trained
- [ ] Evaluation run
- [ ] Benchmark results documented
- [ ] All three frontend variants updated

---

## SUCCESS CRITERIA

✅ **Technical:**
- Claude API handles all structured extraction
- Engineering RAG retrieves relevant context
- BGE-M3 embeddings used for semantic matching
- Cross-encoder reranker scores candidates
- Confidence model calibrated on labeled data
- Multi-stage retrieval reduces false matches
- No mock AI or hardcoded responses remain

✅ **Measurable:**
- Top-1 matching accuracy ≥ 85%
- Ambiguous detection rate ≥ 80%
- Confidence calibration ECE ≤ 0.05
- Processing latency < 2 seconds

✅ **Jury Defensible:**
- "Where is your ML?" → Can show each component
- "Why should I trust?" → Can show evidence chain
- "How is this better?" → Can show benchmark results
- "What's not working?" → Can admit limitations honestly

---

**Next Step:** PHASE 1 — Create Claude Service Layer
