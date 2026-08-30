# PHASE 5-9 Prompts for Antigravity

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
