# SAMANWAY ML/AI Layer Audit Report
## SIH26122 — Oil India Limited

**Date:** 2026-08-30  
**Audit Scope:** Complete technical audit of existing AI/ML/RAG components  
**Verdict:** Current implementation is 40% demo/mock, 60% real — MAJOR UPGRADES REQUIRED

---

## EXECUTIVE SUMMARY

The jury's criticism is **entirely justified**. The system presents AI/ML capabilities that are either missing, stubbed, or mocked:

- **0 real reranker models** in production
- **0 trained confidence models** (scores are heuristic-based)
- **0 real institutional memory RAG** (all responses are setTimeout + hardcoded)
- **1 embedding model** (all-MiniLM-L6-v2 — lightweight, 2021-era)
- **1 real fuzzy matcher** (RapidFuzz — actually works)
- **100% fake institutional memory UI** (MemoryRAGPanel)
- **100% fake delay risk analytics** (DelayRiskDashboard uses sample data)
- **NO evaluation methodology** (no benchmarking, no baseline)
- **NO ablation studies** (no proof that layers add value)

---

## DETAILED FINDINGS

### A. EMBEDDING MODEL USAGE

**Location:** `services/matching/vector_store.py` (lines 14, 19)

```python
def __init__(self, model_name: str = 'all-MiniLM-L6-v2'):
    self.model_name = model_name
    if HAS_FAISS:
        self.model = SentenceTransformer(model_name)
```

**Current Model:** `all-MiniLM-L6-v2`
- Dimension: 384
- Year: 2021
- Use: Activity name + tag + discipline → embedding

**Problem:**
- Lightweight model designed for general English
- NOT specialized for technical/industrial terminology
- No multilingual support for mixed Hindi-English field reports
- No specialized training on scheduling/project management language
- Better alternatives exist (BGE-M3, Dubai, etc.)

**Dependencies:**
- `sentence-transformers` (in all service requirements)

---

### B. VECTOR STORE / FAISS USAGE

**Location:** `services/matching/vector_store.py` (lines 6-45)

**Current Implementation:**

```python
try:
    import faiss
    import numpy as np
    from sentence_transformers import SentenceTransformer
    HAS_FAISS = True
except ImportError:
    HAS_FAISS = False
```

**Features:**
- FAISS IndexFlatIP (inner product / cosine similarity)
- L2 normalization
- K-nearest neighbor retrieval (default k=10)

**Problems:**
1. **No persistence** — index rebuilt every startup from CSV
2. **No pre-computed cache** — embeddings recalculated each run
3. **Mock fallback is weak** (lines 67-84):
   ```python
   # Mock score based on overlap
   overlap = sum(1.0 for word in query_lower.split() if word in target)
   mock_score = min(1.0, (overlap / (target_words + 1)) * 1.5)
   ```
   This is NOT semantic matching — it's keyword overlap.

4. **No reranking** — raw FAISS scores used directly as confidence

**Test Status:**
- ✅ Compiles and runs
- ⚠️ Mock fallback is very poor quality

---

### C. FUZZY MATCHING (RapidFuzz) USAGE

**Location:** `services/matching/engine.py` (lines 1, 37-76)

```python
from rapidfuzz import fuzz
...
if event.tag_or_line_id and activity.tag:
    tag_sim = fuzz.partial_ratio(...) / 100.0
    if tag_sim > 0.9:
        score += 0.2
    elif tag_sim > 0.7:
        score += 0.1
    else:
        score *= 0.8
```

**Status:** ✅ **ACTUALLY WORKS** — Only 1 genuinely functional ML component

**Features:**
- Uses `partial_ratio` for tag matching
- Manual thresholding (0.9, 0.7)
- Score adjustment (+0.2, +0.1, ×0.8)

**Problems:**
1. Only applied to tags, not activity names
2. No token normalization (e.g., "24-inch" vs "24 inch")
3. Used in isolation, not integrated with semantic retrieval
4. No evaluation of effectiveness

---

### D. CONFIDENCE SCORE CALCULATION

**Location:** `services/matching/engine.py` (lines 30-102)

**Current Approach:** Heuristic weighted adjustment

```python
score = vec_score  # FAISS score (0-1)
score *= 0.5 if discipline_mismatch else score
score += 0.05 if discipline_match else 0
score += 0.2 if strong_tag_match else 0.1 if partial_tag_match else score * 0.8

# Apply 10% Confidence Score Boost
score = (score * 1.10) + 0.10
score = min(max(score, 0.0), 1.0)
```

**Problems:**
1. **Hardcoded multipliers** (0.5, 0.05, 0.2, 1.10, 0.10)
2. **No training data** — these are guesses
3. **No calibration** — scores NOT validated against true accuracy
4. **No feature engineering** — just vector + heuristic additions
5. **"+10% confidence boost everywhere"** — artificially inflates all scores (+comment: "Confidence Score Boost")

**Result:** Confidence scores are **meaningless**. They don't represent actual probability of correctness.

---

### E. OLLAMA / LLM USAGE

**Location:** `services/ingestion/llm_extractor.py` (lines 1-100)

**Current Model:** Ollama (llama3.2:latest)

```python
self.base_url = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
self.model_name = os.getenv("LLM_MODEL_NAME", "llama3.2:latest")
```

**Issues:**
1. **No Qwen** — Jury said system is "too dependent on Qwen," but code uses Llama
2. **Fallback to rules only** if Ollama unavailable (not tested)
3. **No validation** that LLM output actually passes Pydantic schema
4. **Schema-constrained prompt** exists (lines 9-60) but:
   - NOT enforced
   - LLM can hallucinate
   - No source grounding validation

---

### F. HARDCODED / MOCK VALUES

**Location:** Multiple files

#### F.1 — Mock Fallback in Vector Store

**File:** `services/matching/vector_store.py` (lines 67-84)

```python
# Mock fallback: simple text matching to simulate semantic search
# This is NOT real semantic matching
mock_score = min(1.0, (overlap / (target_words + 1)) * 1.5)
```

**Status:** ❌ Used when FAISS unavailable (very poor quality)

#### F.2 — Hardcoded Default Schedule

**File:** `services/matching/app.py` (lines 31-49)

```python
default_activities = [
    ScheduleActivity(activity_id="L6-ELE-201", ...),
    ScheduleActivity(activity_id="L6-PIP-402", ...),
    # 8 hardcoded activities
]
```

**Status:** ✅ Acceptable for demo (fallback)

---

### G. FRONTEND FAKE AI / RAG RESPONSES

#### G.1 — Completely Fake MemoryRAGPanel

**File:** `apps/review-console/src/components/MemoryRAGPanel.tsx` (lines 52-72)

```typescript
// Mock RAG processing delay
setTimeout(() => {
  setIsTyping(false);
  let aiResponse = "I'm analyzing the historical progress data...";
  
  const q = newUserMsg.content.toLowerCase();
  if (q.includes('delay') || q.includes('bottleneck') || q.includes('piping')) {
    aiResponse = "Based on 14 recent execution records in the FAISS database, the primary bottleneck for Piping in Sector 4 is 'Late arrival of Gate Valves'. This has caused a cumulative 12-day schedule variance. Recommendation: Expedite PO-8821 and cross-reference with the baseline MS Project schedule.";
  } else if (q.includes('civil') || q.includes('trench')) {
    aiResponse = "Historical data shows Civil trenching activities are currently running 15% ahead of schedule...";
  }
}, 1800);  // 1.8 second fake delay
```

**Verdict:** ❌ **100% FAKE**
- Uses `setTimeout()` for fake processing delay
- Returns hardcoded responses based on keyword matching
- Claims "Based on 14 recent execution records in the FAISS database"
- Shows "FAISS RAG Active" badge
- No actual database query
- No actual RAG retrieval
- No actual AI analysis

**Duplicated in:**
- `apps/review-console-dark/src/components/MemoryRAGPanel.tsx`
- `apps/review-console-hi/src/components/MemoryRAGPanel.tsx`

**Verdict:** ❌ This is precisely what the jury criticized — fake AI

#### G.2 — Fake Delay/Risk Analytics Dashboard

**File:** `apps/review-console/src/components/DelayRiskDashboard.tsx` (lines 10-85)

```typescript
// Rich realistic fallback data for presentation demo
const SAMPLE_BOTTLENECKS = [
  { id: "Q-1001", reason: "Crane availability delay for 12-inch heavy valve lifting at Cooling Line", ... delayDays: 12 },
  { id: "Q-1002", reason: "Monsoon rainwater accumulation in Substation Transformer pit", ... delayDays: 8 },
  { id: "Q-1003", reason: "Cable tray alignment conflict with overhead HVAC ducting", ... delayDays: 5 },
  { id: "Q-1004", reason: "Scaffold re-certification pending at Hydrocracker Unit 3", ... delayDays: 3 },
  { id: "Q-1005", reason: "Calibration rig test certificate delay from supplier", ... delayDays: 2 }
];

const SAMPLE_CRITICAL_PATH = [
  { node: "L6-PIP-402", name: "Cooling Line 24-CW Valve Erection", ... riskPct: 35, status: "Expediting Crane", band: "high-risk" },
  ...
];

// Line 39: if no real queue items, use SAMPLE data
const activeBottlenecksList = realBottlenecks.length > 0 
  ? realBottlenecks.map(...)
  : SAMPLE_BOTTLENECKS;

// Line 51: Hardcoded schedule variance
const scheduleVariance = -14; // -14 Days cumulative schedule delay

// Line 52: Hardcoded risk
const riskLevel = 'HIGH';

// Line 137: "Predicted Risk Level"
// But there is NO prediction model — it's hardcoded
```

**Verdict:** ❌ **100% FAKE**
- Uses hardcoded sample data as fallback
- Claims "Predicted Risk Level: HIGH"
- NO actual ML risk model exists
- NO actual delay prediction
- NO actual analytics calculation
- All "discipline delay" values hardcoded (lines 61-67)

**Duplicated in:**
- `apps/review-console-dark/src/components/DelayRiskDashboard.tsx`
- `apps/review-console-hi/src/components/DelayRiskDashboard.tsx`

#### G.3 — Fake Async in ReviewQueueContext

**File:** `apps/review-console/src/context/ReviewQueueContext.tsx` (line 544)

```typescript
setTimeout(() => {
  setIsLoading(false);
  setMatches([...]);
}, 2500);  // Fake 2.5 second delay
```

**Verdict:** ❌ Placeholder demo behavior

---

### H. INSTITUTIONAL MEMORY / ANALYTICS

**Current State:** Schema exists, queries NOT implemented

**File:** `services/analytics/engine.py`

```python
# S-curve query, stats query exist
# But DuckDB integration is incomplete
```

**Test Results:**
- ❌ `test_stats` FAILS (missing `ambiguous_events` field)
- ⚠️ Analytics service runs but lacks real queries

---

## SUMMARY TABLE

| Component | Status | Real/Fake | Quality | Evidence |
|-----------|--------|-----------|---------|----------|
| **Embedding Model** | ✅ Works | Real (all-MiniLM-L6-v2) | ⚠️ Weak | 2021 model, not technical |
| **FAISS Vector Store** | ✅ Works | Real | ⚠️ Mock fallback weak | No persistence, mock = keyword overlap |
| **RapidFuzz Fuzzy Match** | ✅ Works | Real | ✅ Good | Only 1 real ML component |
| **Confidence Scoring** | ❌ Fake | Heuristic | ❌ Meaningless | Hardcoded multipliers, no training |
| **LLM/Ollama** | ✅ Works | Real | ⚠️ Fallback only | No validation |
| **Reranker** | ❌ Missing | N/A | N/A | N/A |
| **Schedule-aware Constraints** | ⚠️ Partial | Rules only | ⚠️ Limited | Discipline/tag checks only |
| **Institutional Memory RAG** | ❌ 100% Fake | setTimeout + hardcoded | ❌ Demo only | MemoryRAGPanel.tsx |
| **Delay Risk Analytics** | ❌ 100% Fake | Sample data | ❌ Demo only | DelayRiskDashboard.tsx |
| **ML Risk Prediction** | ❌ Missing | N/A | N/A | N/A |
| **Evaluation Dataset** | ❌ Missing | N/A | N/A | N/A |
| **Benchmark / Baseline** | ❌ Missing | N/A | N/A | N/A |

---

## JURY CRITICISM MAPPED TO FINDINGS

| Jury Criticism | Finding | Evidence |
|---|---|---|
| "ML/AI layer is too dependent on Qwen and is considered weak" | Uses Llama (not Qwen), embedding model is weak | llm_extractor.py, vector_store.py |
| "System needs a stronger, more meaningful ML pipeline" | Single embedding model + heuristic scoring | engine.py lines 30-102 |
| "Additional ML/retrieval layers needed" | No reranker, no confidence model, no RAG | No cross-encoder, no trained classifier |
| "Stronger RAG/retrieval between stages" | Frontend RAG is 100% fake | MemoryRAGPanel.tsx with setTimeout |
| "Fuzzy/semantic matching needs to be more robust" | Only RapidFuzz works; FAISS fallback is keyword-based | vector_store.py lines 67-84 |
| "Must demonstrate genuine ML/AI behavior" | Hardcoded confidence, hardcoded sample data, hardcoded delays | Throughout |
| "NO hardcoded fake AI results" | MemoryRAGPanel returns fixed responses, DelayRiskDashboard shows SAMPLE data | Multiple .tsx files |

---

## RECOMMENDATIONS

### PHASE 1 — Remove Fake AI
- [ ] Delete hardcoded responses from MemoryRAGPanel
- [ ] Delete SAMPLE_BOTTLENECKS from DelayRiskDashboard
- [ ] Remove fake setTimeout delays
- [ ] Replace with real backend queries or labeled "DEMO MODE"

### PHASE 2 — Upgrade Embeddings
- [ ] Benchmark all-MiniLM-L6-v2 vs BGE-M3 on Oil India dataset
- [ ] Measure top-1, top-3 accuracy; MRR; ambiguity detection
- [ ] Migrate if BGE-M3 wins
- [ ] Cache embeddings to disk

### PHASE 3 — Build Real RAG Stack
- [ ] Engineering glossary / terminology KB
- [ ] Historical examples retrieval
- [ ] Schedule activity enrichment with metadata
- [ ] Context injection into LLM/SLM

### PHASE 4 — Add Reranker
- [ ] Evaluate BGE-reranker or CrossEncoder
- [ ] Integrate into matching pipeline (top-K → reranker → top-3)
- [ ] Measure improvement

### PHASE 5 — Train Confidence Model
- [ ] Create labeled dataset (field event → correct schedule activity)
- [ ] Extract features (fuzzy, embedding, reranker, metadata)
- [ ] Train logistic regression or calibrated GB
- [ ] Cross-validate
- [ ] Calibrate thresholds (HIGH ≥ 0.85, MEDIUM 0.65–0.85, LOW < 0.65)

### PHASE 6 — Real Institutional Memory
- [ ] Store approved events with metadata
- [ ] Index historical activities
- [ ] Implement real queries (duration, variance, delay causes)
- [ ] Remove fake responses

### PHASE 7 — Evaluation & Benchmarking
- [ ] Create test cases (exact match, ambiguous, wrong discipline, etc.)
- [ ] Run ablation study (fuzzy only, embedding only, fuzzy+embedding, etc.)
- [ ] Measure end-to-end accuracy
- [ ] Document baseline vs upgraded

---

## FILES TO MODIFY / CREATE

### Remove / Replace Fake UI
```
apps/review-console/src/components/MemoryRAGPanel.tsx ❌ FAKE
apps/review-console/src/components/DelayRiskDashboard.tsx ❌ FAKE
apps/review-console-dark/* — duplicates
apps/review-console-hi/* — duplicates
apps/review-console/src/context/ReviewQueueContext.tsx ⚠️ Mock delays
```

### Upgrade ML Components
```
services/matching/vector_store.py — Upgrade embedding model
services/matching/engine.py — Add reranker, train confidence model
services/ingestion/llm_extractor.py — Add RAG layer
services/analytics/engine.py — Real queries
```

### Create New Files
```
services/shared/knowledge_base.py — Engineering glossary RAG
services/matching/reranker.py — Cross-encoder reranker
services/matching/confidence_model.py — Calibrated confidence classifier
scripts/evaluate_matching.py — Evaluation script
scripts/benchmark_embeddings.py — Embedding model benchmark
data/labeled_training_set.json — Labeled examples for confidence model
```

---

## CONCLUSION

The current system is **presented as having strong AI/ML/RAG capabilities, but most of this is demonstration scaffolding, not real functionality**.

The jury's criticism is valid.

An audit reveals:
- ✅ 1 real fuzzy matcher (RapidFuzz)
- ✅ 1 real embedding model (all-MiniLM, but weak)
- ✅ 1 real vector store (FAISS, with poor mock fallback)
- ✅ 1 LLM fallback (Ollama)
- ❌ 0 rerankers
- ❌ 0 trained confidence models
- ❌ 0 real RAG systems (frontend RAG is 100% fake)
- ❌ 0 real institutional memory queries
- ❌ 0 real risk prediction models

**Required:** Complete rebuild of the ML/AI layer with genuine components, proper evaluation, and honest labeling of demo vs. real functionality.

---

**Audit Completed:** 2026-08-30  
**Next Phase:** PHASE 1 — Remove Fake AI Indicators
