# SAMANWAY ML/AI UPGRADE — Complete Project Execution Guide

**Target:** Replace Qwen/Ollama with Claude API + Multi-Stage ML Pipeline  
**Deadline:** 2026-09-20 (before SIH submission)  
**Status:** PHASE 1 Complete (Claude Service Layer)  
**Total Phases:** 10 (65 hours estimated)

---

## CURRENT STATE

### ✅ PHASE 1 COMPLETE: Claude Service Layer
- `services/llm/claude_client.py` — Claude API wrapper with error handling
- `services/llm/models.py` — Pydantic schemas for structured I/O
- `services/llm/prompts.py` — System prompts preventing hallucination
- `.env.example` — Configuration template (API key via env vars only)
- Dependencies updated with `anthropic>=0.25.0`

**Key:** API key NEVER hardcoded, always from `ANTHROPIC_API_KEY` environment variable

---

## REMAINING WORK: 9 PHASES (60 hours)

### PHASE 2: Engineering Knowledge Base + RAG (8 hours)

**Goal:** Build retrievable knowledge to support Claude extraction

**Create:**
- `services/shared/knowledge_base.py` — KB interface
- `data/engineering_glossary.json` — Terminology database
  ```json
  {
    "canonical_term": "piping erection",
    "synonyms": ["spool erection", "line erection", "pipe installation"],
    "discipline": "piping",
    "examples": ["24-inch XX spool erected", "Line 24 installation complete"]
  }
  ```
- `services/ingestion/rag_retriever.py` — RAG engine (BM25 + embedding)

**Domains to cover:**
- Piping (spool, weld, hydrotest, flange, valve, ndt, radiography)
- Civil (excavation, foundation, concrete, rebar, shuttering, piling)
- Electrical (cable pulling, termination, transformer, switchgear)
- Instrumentation (calibration, loop checking, transmitter, plc)
- HSE (safety, incident, permit, audit, training)
- Status terms (start, finish, progress, delay, pending, completed)
- Units (spools, joints, meters, cum, MT, nos)

**Integration:**
```python
# Before Claude extraction, retrieve context
context = rag_retriever.retrieve(field_text, top_k=5)
# Inject into Claude prompt
prompt = get_extraction_prompt_with_context(context)
# Claude uses context to understand terminology
```

---

### PHASE 3: Upgrade Embedding Model (4 hours)

**Goal:** Replace all-MiniLM-L6-v2 with stronger BGE-M3

**Modify:**
- `services/matching/vector_store.py` — Update model initialization
- `services/config.py` — Centralize model config (create if needed)
  ```python
  EMBEDDING_MODEL = os.getenv("EMBEDDING_MODEL", "bge-m3")
  EMBEDDING_DIMENSION = 1024  # BGE-M3 is 1024-dim, not 384
  ```

**Add to requirements:**
- `sentence-transformers>=2.5.0` (already updated)

**Features:**
- Precompute and cache schedule embeddings
- Add persistence/loading from disk
- Test FAISS compatibility with new dimension

---

### PHASE 4: Multi-Stage Retrieval (10 hours)

**Goal:** Hybrid retrieval combining fuzzy + semantic + metadata

**Create:**
- `services/matching/lexical_retriever.py` — RapidFuzz-based
  ```python
  def retrieve_by_fuzzy(event, activities, top_k=100):
      # Compare: activity_name, tag, line_id, wbs, discipline
      # Normalize: lowercase, remove punctuation/hyphens
      # Use: ratio, partial_ratio, token_sort_ratio, token_set_ratio
      return sorted_candidates[:top_k]
  ```
- `services/matching/semantic_retriever.py` — FAISS-based (BGE-M3)
- `services/matching/candidate_union.py` — Merge strategy
- `services/matching/metadata_filter.py` — Constraint filtering

**Pipeline:**
```
Field Event → Normalization → Metadata Filter (2000 candidates)
    ├→ Lexical (RapidFuzz) → 50 candidates
    └→ Semantic (FAISS) → 50 candidates
        ↓ Union & Dedup
        Top 30 candidates → PHASE 5 (Reranker)
```

**Normalization:**
```
24-inch XX → 24 inch xx
24" XX → 24 inch xx
LINE 24 XX → 24 xx
```

---

### PHASE 5: Cross-Encoder Reranker (6 hours)

**Goal:** Score candidates in context of field event

**Create:**
- `services/matching/reranker.py` — Cross-encoder wrapper
  ```python
  def rerank(field_event, candidates):
      # Input: (field_event_text, candidate_activity_text)
      # Output: relevance score (0-1)
      # Only runs on top-30, not entire schedule
      return reranked_top_10
  ```

**Model Selection:**
- Evaluate locally: BGE-reranker-base
- Add to requirements: Update as needed
- Benchmark: Measure improvement over retrieval alone

**Integration:**
```
Top-30 from retrieval → Reranker → Top-10 ranked
```

---

### PHASE 6: Schedule-Aware Context RAG (6 hours)

**Goal:** Enrich candidates with schedule context for matching

**Create:**
- `services/matching/activity_context.py` — Rich activity representation
  ```python
  {
      "activity_id": "PIP-1047",
      "name": "Erect Line 24\"-XX",
      "discipline": "piping",
      "wbs": "Area 4 / Piping / Installation",
      "tag": "24\"-XX",
      "planned_start": "2026-08-10",
      "planned_finish": "2026-08-12",
      "predecessors": ["PIP-1032"],
      "successors": ["PIP-1060"],
      "contractor": "ABC Engineering",
      "related_activities": ["Fabrication", "Hydrotest"],
      "phase": "Installation"
  }
  ```
- `services/matching/schedule_rag.py` — Context retrieval

**Features:**
- Embed rich activity doc (not just name)
- Use for reranker input
- Validate schedule dependencies

---

### PHASE 7: Granularity Mismatch Detection (5 hours)

**Goal:** Recognize ambiguous field events mapping to multiple activities

**Create:**
- `services/matching/ambiguity_detector.py`
  ```python
  def detect_ambiguity(field_event, top_3_candidates):
      # Check 1: Top-3 margin < 0.05 and score > 0.60 → AMBIGUOUS
      # Check 2: Top-3 span different phases → AMBIGUOUS
      # Check 3: Event type unclear → AMBIGUOUS
      # Return: is_ambiguous, reason, all_candidates
  ```

**Examples:**
- "24-inch XX piping work completed" → Ambiguous (fab/erection/test?)
- "hydrotest completed" → Favor test activities
- "foundation casting" → Favor civil activities

---

### PHASE 8: Calibrated Confidence Model (8 hours)

**Goal:** Train ML model predicting true match probability

**Create:**
- `data/labeled_training_data.json` — 50-100 labeled pairs
  ```json
  {
    "field_event": "24-inch XX spool erection completed",
    "expected_activity_id": "PIP-1047",
    "is_correct": true
  }
  ```
- `services/matching/feature_extractor.py` — Extract features
  ```python
  features = {
      "fuzzy_activity": 0.85,
      "fuzzy_tag": 0.92,
      "embedding_similarity": 0.88,
      "reranker_score": 0.91,
      "discipline_match": 1,
      "line_match": 1,
      "tag_match": 1,
      "event_type_match": 1,
      "date_validity": 1,
      "candidate_margin": 0.08,
      "candidate_count": 3
  }
  ```
- `services/matching/confidence_model.py` — Trained classifier
  ```python
  model = LogisticRegression()  # or CalibratedClassifierCV(GradientBoostingClassifier())
  model.fit(X_train, y_train)
  # Output: calibrated probability (0-1)
  ```
- `scripts/train_confidence_model.py` — Training pipeline

**Thresholds:**
```
>= 0.85 → HIGH (auto-approve)
0.65–0.85 → MEDIUM (confirm)
< 0.65 → LOW (review queue)
```

---

### PHASE 9: Remove All Mock AI (4 hours)

**Goal:** Eliminate fake/demo responses

**Audit & Fix:**
- `apps/review-console/src/components/MemoryRAGPanel.tsx` — Remove setTimeout, fake responses
- `apps/review-console/src/components/DelayRiskDashboard.tsx` — Remove SAMPLE_BOTTLENECKS
- `apps/review-console-dark/*` — Same fixes
- `apps/review-console-hi/*` — Same fixes
- Any hardcoded confidence scores
- Any fake "RAG Active" indicators

**Validation:**
```bash
grep -r "setTimeout\|SAMPLE_\|hardcoded\|mock" apps services --include="*.tsx" --include="*.py"
# Should return: 0 results (except comments explaining removed items)
```

---

### PHASE 10: Evaluation & Benchmarking (8 hours)

**Goal:** Prove improvements with measurable results

**Create:**
- `data/evaluation_test_cases.json` — 50-100 test cases
  ```json
  {
    "case_id": "EXACT_001",
    "field_report": "24-inch XX spool erection completed",
    "expected_activity_id": "PIP-1047",
    "expected_discipline": "piping",
    "category": "exact_match"
  }
  ```
- `scripts/evaluate_matching.py` — Evaluation framework
- `scripts/run_ablation_study.py` — Ablation (A/B/C/D/E/F configs)
- `EVALUATION_RESULTS.md` — Results report

**Metrics:**
- Top-1 accuracy
- Top-3 accuracy
- Mean Reciprocal Rank (MRR)
- Precision @ recall
- Ambiguous detection rate
- False-match rate
- Confidence calibration (ECE)
- Latency (target: < 2 sec/match)

**Ablation Configs:**
```
A. Fuzzy only
B. Embedding only
C. Fuzzy + embedding
D. Fuzzy + embedding + metadata
E. Fuzzy + embedding + reranker
F. Full (E + confidence model)
```

**Report:**
- Baseline: Current Ollama + all-MiniLM + heuristic scoring
- Upgraded: Claude + BGE-M3 + reranker + trained confidence
- Improvement: % gains per metric

---

## EXECUTION CHECKLIST

### Setup
- [ ] `ANTHROPIC_API_KEY` set in `.env` (never hardcoded)
- [ ] Python 3.9+
- [ ] Dependencies: `pip install -r services/*/requirements.txt`
- [ ] `.env` file created from `.env.example`

### Per Phase
- [ ] Code written
- [ ] Tests pass
- [ ] No hardcoded values
- [ ] Backward compatibility maintained
- [ ] Git committed

### Final Validation
- [ ] All fake AI removed
- [ ] Claude API wired end-to-end
- [ ] RAG layer functional
- [ ] Reranker operational
- [ ] Confidence model trained
- [ ] Evaluation completed
- [ ] Benchmark results documented
- [ ] All 3 frontend variants (light/dark/Hindi) updated

---

## KEY PRINCIPLES

✅ **Technical Integrity**
- No hallucinated data
- All errors reported
- API key never exposed
- Structured output validated

✅ **Defensibility**
- Every layer measurable
- Ablation study shows value
- Baseline vs. upgraded comparison
- Reproducible evaluation

✅ **Security**
- ANTHROPIC_API_KEY from environment
- .env excluded from git
- No API key logging
- Error messages don't expose secrets

✅ **Performance**
- Multi-stage retrieval (filter before expensive operations)
- Embeddings precomputed and cached
- Reranker only on top-K candidates
- Target: < 2 seconds/match

---

## TIMELINE

| Phase | Task | Hours | Status |
|-------|------|-------|--------|
| 1 | Claude Service | 6 | ✅ Complete |
| 2 | Knowledge RAG | 8 | ⏳ Pending |
| 3 | Upgrade Embeddings | 4 | ⏳ Pending |
| 4 | Multi-Stage Retrieval | 10 | ⏳ Pending |
| 5 | Reranker | 6 | ⏳ Pending |
| 6 | Schedule RAG | 6 | ⏳ Pending |
| 7 | Granularity Detection | 5 | ⏳ Pending |
| 8 | Confidence Model | 8 | ⏳ Pending |
| 9 | Remove Mock AI | 4 | ⏳ Pending |
| 10 | Evaluation & Benchmark | 8 | ⏳ Pending |
| **TOTAL** | | **65h** | 6% |

**Deadline:** 2026-09-20 (20 days)  
**Pace:** ~3 hours/day required

---

## ARCHITECTURE FLOW

```
FIELD REPORT
    ↓
[Phase 2] Engineering RAG → Retrieved context
    ↓
[Phase 1] Claude API → Structured extraction (Pydantic validated)
    ↓
STRUCTURED EVENT
    ↓
Entity Normalization
    ↓
    ├→ [Phase 4a] Lexical Retrieval (RapidFuzz)
    └→ [Phase 4b] Semantic Retrieval (FAISS + Phase 3 BGE-M3)
        ↓
    [Phase 4c] Candidate Union & Dedup
        ↓
    [Phase 6] Schedule-Aware RAG (enrich candidates)
        ↓
    [Phase 5] Cross-Encoder Reranker
        ↓
    [Phase 7] Granularity Mismatch Detection
        ↓
    Schedule Constraint Validation
        ↓
    [Phase 8] Calibrated Confidence Model
        ↓
        ├→ HIGH (≥0.85)  → PLANNER APPROVAL
        └→ LOW (<0.65)   → REVIEW QUEUE
        ↓
    AUDIT LOG + INSTITUTIONAL MEMORY
        ↓
    [Phase 10] EVALUATION METRICS
```

---

## JURY DEFENSE POINTS

When jury asks...

**"Where is your ML?"**
> Phase 1: Claude API (claude-sonnet-4-6) for natural language understanding  
> Phase 3: BGE-M3 embeddings for semantic retrieval  
> Phase 5: Cross-encoder reranker for relevance scoring  
> Phase 8: Trained calibrated confidence model for match probability  

**"Why should I trust the match?"**
> Multi-stage pipeline: 1) Fuzzy matching (exact identifiers) 2) Semantic retrieval (context) 3) Reranking (comparative scoring) 4) Schedule validation (constraints) 5) Calibrated confidence (probability estimation). Planner approves final decision.

**"How do you prevent hallucination?"**
> Claude system prompt forbids inventing facts. Pydantic validation rejects invalid output. All source spans preserved as evidence. If extraction fails, error reported (not fabricated data).

**"What about performance?"**
> Multi-stage retrieval filters before expensive operations: metadata → lexical → semantic → reranker. Embeddings precomputed and cached. Target: <2 seconds/match end-to-end.

**"Did you evaluate this?"**
> Phase 10 creates 50-100 labeled test cases. Runs ablation study (6 configurations). Compares baseline vs. upgraded architecture. Measures: accuracy, MRR, precision, ambiguity detection, false-match rate, calibration.

---

## GITHUB

**Repository:** https://github.com/Sanjay-AI-ML/sih26122-new  
**Current Commits:**
- PHASE 1: Claude API Service Layer ✅

**Next Commits:**
- PHASE 2: Engineering Knowledge Base + RAG
- PHASE 3: Embedding Model Upgrade
- ... (continue for all 10 phases)

---

## QUICK START

```bash
# 1. Clone
git clone https://github.com/Sanjay-AI-ML/sih26122-new.git
cd sih26122-new

# 2. Setup
cp .env.example .env
# Edit .env, add your ANTHROPIC_API_KEY

# 3. Install
pip install -r services/ingestion/requirements.txt
pip install -r services/matching/requirements.txt
pip install -r services/analytics/requirements.txt
pip install -r services/writeback/requirements.txt

# 4. Test Claude service
python
>>> from services.llm.claude_client import get_claude_extractor
>>> extractor = get_claude_extractor()
>>> response = extractor.extract_field_event("24-inch XX spool erected")
>>> print(response.events[0].activity_phrase if response.extraction_successful else response.error_message)

# 5. Begin PHASE 2
# Follow the guide above for engineering knowledge base + RAG
```

---

**Version:** 1.0  
**Last Updated:** 2026-08-30  
**Next Update:** After each phase completion
