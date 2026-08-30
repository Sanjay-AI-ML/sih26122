# SAMANWAY ML/AI Pipeline Improvement Prompts

Copy-paste ready prompts for antigravity implementation. Each phase is self-contained.

---

## PHASE 1.4: RAG Integration into LLM Extractor

```
Integrate the RAG retriever into services/ingestion/llm_extractor.py to inject engineering context before LLM extraction.

CURRENT STATE:
- services/ingestion/rag_retriever.py exists with retrieve_context() and format_context_for_prompt() methods
- services/ingestion/llm_extractor.py currently extracts without domain context
- data/engineering_glossary.json contains 100+ engineering terms organized by discipline

TASK:
1. Import RAGRetriever in llm_extractor.py
2. In the extract() method, before calling Claude:
   - Call rag_retriever.format_context_for_prompt(field_text)
   - Inject result into Claude system prompt as "DOMAIN CONTEXT" section
3. Add optional retrieve_context flag (default True) to disable RAG for testing
4. Verify extraction still works and produces valid JSON output

EXPECTED OUTPUT:
- llm_extractor.py modified with RAG injection
- No breaking changes to existing API
- System prompt now includes engineering terminology context when available
```

---

## PHASE 1.5: RAG System Testing

```
Create test suite for RAG retriever to verify domain knowledge injection works correctly.

FILE: tests/ingestion/test_rag_retriever.py

TESTS TO IMPLEMENT:
1. test_retrieve_context_piping_discipline
   - Input: "24-inch XX spool erection completed"
   - Assert: discipline="piping", contains "spool erection" term

2. test_retrieve_context_finds_abbreviations
   - Input: "HSE briefing and NDT inspection completed"
   - Assert: abbreviations include "HSE" and "NDT"

3. test_retrieve_context_status_terms
   - Input: "work completed yesterday"
   - Assert: status_terms include "completed" with event_type="finish"

4. test_format_context_for_prompt_output_format
   - Assert: formatted output contains "RELEVANT ENGINEERING TERMINOLOGY:" header
   - Assert: contains discipline, terms, examples, abbreviations, status

5. test_find_synonyms_piping_terms
   - Search: "spool fabrication"
   - Assert: returns synonyms like "spool welding", "pipe welding"

6. test_normalize_term_canonical_form
   - Input: "hydro test"
   - Assert: normalizes to "hydrotest"

COVERAGE TARGET: 85%+ of RAG retriever methods
```

---

## PHASE 2: Embedding Model Upgrade (BGE-M3)

```
Upgrade embedding model from all-MiniLM-L6-v2 to BGE-M3 for better multi-lingual and technical term matching.

CURRENT STATE:
- services/matching/rag_engine.py uses SentenceTransformer(all-MiniLM-L6-v2)
- works fine but has limited technical vocabulary
- requires 384-dim embeddings

TASK:
1. Replace model_name in services/matching/rag_engine.py:
   OLD: "sentence-transformers/all-MiniLM-L6-v2"
   NEW: "BAAI/bge-m3"

2. Update EMBEDDING_DIM to 1024 (BGE-M3 output size)

3. Regenerate all embeddings in data/embeddings.pkl via:
   - Load existing glossary terms
   - Re-embed with BGE-M3
   - Save new embedding file

4. Update requirements.txt if needed (sentence-transformers already handles it)

5. Performance test:
   - Index rebuild time should be <10 seconds
   - Query time should be <100ms for single term

EXPECTED OUTCOME:
- Better matching for technical/engineering terms
- Improved multilingual support
- Slightly slower inference but better accuracy
```

---

## PHASE 3: Multi-Stage Retrieval Pipeline

```
Implement three-stage retrieval: lexical (BM25) + semantic (embeddings) + metadata filtering.

FILE: services/ingestion/multi_stage_retriever.py (NEW)

ARCHITECTURE:
Stage 1 - LEXICAL (BM25): Fast keyword matching
  - Uses RapidFuzz for fuzzy string matching
  - Returns top_k=20 candidates by string similarity

Stage 2 - SEMANTIC (Embeddings): Contextual similarity
  - Uses BGE-M3 embeddings
  - Scores candidates by cosine similarity
  - Returns top_k=10 by embedding similarity

Stage 3 - METADATA FILTERING: Discipline + activity type
  - Filter results by detected discipline from text
  - Boost candidates matching activity_type
  - Return top_k=5 final results

CLASS: MultiStageRetriever
METHODS:
- retrieve_bm25(text, top_k=20) → List[Dict]
- retrieve_semantic(text, top_k=10) → List[Dict]
- retrieve_with_filtering(text, top_k=5) → List[Dict]
- score_and_rank(candidates, method='ensemble') → List[Dict]

SCORING LOGIC:
- Ensemble score = 0.3*bm25_score + 0.5*semantic_score + 0.2*metadata_boost
- Return top results sorted by ensemble score

INTEGRATION: 
Replace rag_retriever.retrieve_context() calls with multi_stage_retriever.retrieve_with_filtering()
```

---

## PHASE 4: Cross-Encoder Reranking

```
Add cross-encoder reranker to fine-tune top-k results from multi-stage retrieval.

FILE: services/matching/reranker.py (NEW)

WHAT IT DOES:
- Takes candidate terms + field text as pairs
- Scores each pair (0-1 relevance score)
- Returns reranked top-k results

MODEL: cross-encoder/mmarco-mMiniLMv2-L12-H384 (or similar)

CLASS: CrossEncoderReranker
METHODS:
- score_candidates(text, candidates) → List[Dict with scores]
- rerank_top_k(text, candidates, k=5) → List[Dict reranked]

USAGE:
```python
candidates = multi_stage_retriever.retrieve_with_filtering(text)
reranked = reranker.rerank_top_k(text, candidates, k=5)
```

EXPECTED IMPROVEMENT:
- Top-1 accuracy improves by 15-25%
- Better handling of ambiguous technical terms
```

---

## PHASE 5: Schedule-Aware Context Enrichment

```
Enhance RAG with schedule context to disambiguate activities by project timeline.

CONCEPT:
Field text: "24-inch spool erection in progress"
Without schedule: Could match any spool erection
With schedule: If project timeline shows "24-inch XX erection scheduled 2026-08-28", boost relevance

IMPLEMENTATION:
1. Load schedule data from project metadata
2. For each candidate, check if activity_dates overlap with current period
3. Apply temporal boost to candidates matching current project phase
4. Return top-k ranked by (retrieval_score + temporal_boost)

FILE: services/ingestion/schedule_context.py (NEW)

CLASS: ScheduleContextEnricher
METHODS:
- load_schedule(project_id) → Dict[activity: dates]
- get_temporal_boost(activity, current_date) → float (0-1)
- enrich_results(candidates, project_id, current_date) → List[Dict boosted]

INTEGRATION:
```python
enriched = schedule_enricher.enrich_results(
    candidates, 
    project_id="oil_india_2026",
    current_date=datetime.now()
)
```
```

---

## PHASE 6: Granularity Mismatch Detection

```
Detect and handle mismatches between document-level and item-level granularity.

PROBLEM:
Report: "All spools completed"  (ambiguous: which spools?)
Items: [spool_24, spool_36, spool_42]  (granular detail)

SOLUTION:
Detect when field text is coarser than available items and emit confidence flags.

FILE: services/matching/granularity_detector.py (NEW)

DETECTION RULES:
1. text_contains("all", "every", "complete set") → granularity="report_level"
2. text_contains_quantity < items_in_scope → potential_mismatch
3. If drill-down terms missing (size, location, type) → ambiguous

CLASS: GranularityDetector
METHODS:
- detect_granularity(text) → str ("report", "batch", "item", "unknown")
- find_mismatches(text, matched_items) → List[str warnings]
- suggest_clarification(text, items) → str prompt_for_user

CONFIDENCE ADJUSTMENT:
- Coarse granularity match → reduce confidence by 20-30%
- Emit flag in output: "granularity_warning": "coarse_match"
```

---

## PHASE 7: Confidence Calibration Model

```
Build logistic regression model to predict true extraction confidence vs raw scores.

PROBLEM:
Current system gives raw scores (0-1) that don't correlate with actual correctness.
Goal: Calibrate scores using historical correctness data.

DATA PREPARATION:
1. Collect 200+ historical extractions
2. Mark each as correct/incorrect
3. Extract features:
   - RAG_match_score (retrieval quality)
   - BM25_similarity
   - Semantic_similarity
   - Reranker_score
   - Granularity_flag
   - Discipline_confidence

TRAINING:
```python
from sklearn.linear_model import LogisticRegression
model = LogisticRegression()
model.fit(X_features, y_correct)
```

USAGE IN EXTRACTION:
```python
raw_score = rag_result.score
confidence = calibration_model.predict_proba([[raw_score]])[0][1]
```

FILE: services/matching/confidence_calibrator.py (NEW)

EXPECTED OUTCOME:
- Confidence scores now match observed accuracy
- Threshold tuning becomes data-driven
- Better user trust in system confidence
```

---

## PHASE 8: Remove Mock AI Fallback

```
Remove mock AI fallback from extraction pipeline now that local Claude is fully integrated.

CURRENT STATE:
- services/ingestion/llm_extractor.py has fallback to mock extraction
- Used during development when Claude unavailable

TASK:
1. Remove mock_extract() method and all fallback logic
2. Remove try/except that catches Claude errors
3. Let extraction fail loudly if Claude unavailable (better for debugging)
4. Clean up MOCK_MODE environment variable references
5. Update tests to expect actual Claude calls (not mocked)

FILES TO CLEAN:
- services/ingestion/llm_extractor.py (remove mock fallback)
- services/ingestion/mock_data.py (delete if only used for fallback)
- tests/ingestion/test_llm_extractor.py (remove mock tests)

VERIFICATION:
- Run integration tests against actual Claude
- Verify all extraction calls hit Claude
- Check error handling for Claude timeouts
```

---

## PHASE 9: Comprehensive Evaluation & Ablation Studies

```
Build evaluation framework to measure improvement from each phase.

METRICS:
1. Accuracy: % of extractions matching gold standard
2. Confidence Calibration: P(correct | confidence=X)
3. Latency: End-to-end extraction time (ms)
4. Cost: Tokens per extraction (if using Claude API)

ABLATION STUDY:
Test each component independently to measure contribution:

- Baseline (no RAG): accuracy=X%, latency=Ams
- + RAG only: accuracy=+Y1%, latency=+B1ms
- + Multi-stage: accuracy=+Y2%, latency=+B2ms
- + Reranking: accuracy=+Y3%, latency=+B3ms
- + Schedule: accuracy=+Y4%, latency=+B4ms
- + Granularity: accuracy=+Y5%, latency=+B5ms
- + Calibration: accuracy=+Y6%, confidence_cal=+Y7%

IMPLEMENTATION:
FILE: services/evaluation/evaluator.py (NEW)

```python
class EvaluationFramework:
    def evaluate(self, test_set, components_to_use):
        # Run extraction on test set
        # Compare against gold standard
        # Compute metrics
        # Return results
        pass
```

REPORT OUTPUT:
- CSV with phase-by-phase metrics
- Confidence calibration curve plot
- Latency breakdown chart
- Recommendations for production thresholds
```

---

## Quick Reference

| Phase | File | Time | Status |
|-------|------|------|--------|
| 1.4 | services/ingestion/llm_extractor.py | 2h | Ready |
| 1.5 | tests/ingestion/test_rag_retriever.py | 2h | Ready |
| 2 | services/matching/rag_engine.py | 2h | Ready |
| 3 | services/ingestion/multi_stage_retriever.py | 4h | Ready |
| 4 | services/matching/reranker.py | 3h | Ready |
| 5 | services/ingestion/schedule_context.py | 3h | Ready |
| 6 | services/matching/granularity_detector.py | 3h | Ready |
| 7 | services/matching/confidence_calibrator.py | 4h | Ready |
| 8 | services/ingestion/llm_extractor.py | 1h | Ready |
| 9 | services/evaluation/evaluator.py | 4h | Ready |

**Total estimated time: 28 hours**

---

Use these prompts in antigravity one at a time. Each builds on the previous phase.
