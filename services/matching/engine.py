from typing import List, Optional
from rapidfuzz import fuzz

from shared.schemas.extracted_event import ExtractedEvent
from services.matching.schemas import (
    Candidate, MatchResult, ConfidenceBand, ScheduleActivity
)
from services.matching.vector_store import vector_store


class MatchingEngine:
    """
    4-Stage Matching Pipeline:
    1. Deterministic Hard Filter (Discipline & Tag)
    2. Semantic Vector Search
    3. Calibrated Confidence Scoring
    4. Ambiguity Detection
    """

    @staticmethod
    def match(event: ExtractedEvent) -> MatchResult:
        # If no activities loaded, return empty
        if not vector_store.activities:
            return MatchResult(
                event=event,
                top_activity_id=None,
                candidates=[],
                confidence_score=0.0,
                confidence_band=ConfidenceBand.LOW,
                is_ambiguous=False,
                ambiguity_reason="No schedule loaded."
            )

        # 1. Semantic Vector Search (Broad Retrieval)
        # We retrieve a larger pool to allow deterministic filtering to refine it.
        # Include tag and discipline in the query to help FAISS retrieve better candidates.
        query = f"{event.activity_phrase}"
        if event.tag_or_line_id:
            query += f" Tag: {event.tag_or_line_id}"
        disc_str = getattr(event.discipline, "value", str(event.discipline)) if event.discipline else "unspecified"
        query += f" Discipline: {disc_str}"
        
        raw_results = vector_store.search(query, k=50)

        # 2 & 3. Deterministic Filter & Calibrated Confidence Scoring
        scored_candidates = []
        for activity, vec_score in raw_results:
            # Baseline score is the cosine similarity (0.0 - 1.0)
            score = vec_score
            rationale_parts = [f"Semantic similarity: {vec_score:.2f}"]

            # Deterministic: Discipline mismatch penalization
            event_disc = getattr(event.discipline, "value", str(event.discipline)).lower() if event.discipline else ""
            act_disc = getattr(activity.discipline, "value", str(activity.discipline)).lower() if activity.discipline else ""
            if event_disc and act_disc and event_disc != act_disc:
                score *= 0.5  # Heavy penalty for wrong discipline
                rationale_parts.append(f"Discipline mismatch (penalty)")
            else:
                score += 0.05
                rationale_parts.append("Discipline match (+)")

            # Deterministic: Tag matching (Fuzzy)
            if event.tag_or_line_id and activity.tag:
                tag_sim = fuzz.partial_ratio(event.tag_or_line_id.lower(), activity.tag.lower()) / 100.0
                if tag_sim > 0.9:
                    score += 0.2
                    rationale_parts.append(f"Strong tag match '{activity.tag}' (+)")
                elif tag_sim > 0.7:
                    score += 0.1
                    rationale_parts.append(f"Partial tag match '{activity.tag}' (+)")
                else:
                    score *= 0.8
                    rationale_parts.append(f"Tag mismatch '{activity.tag}' (penalty)")

            # Clip score between 0 and 1
            score = min(max(score, 0.0), 1.0)
            
            scored_candidates.append(Candidate(
                activity_id=activity.activity_id,
                activity_name=activity.activity_name,
                tag=activity.tag,
                score=score,
                rationale=", ".join(rationale_parts)
            ))

        # Sort by calibrated score descending
        scored_candidates.sort(key=lambda c: c.score, reverse=True)
        top_candidates = scored_candidates[:3]

        if not top_candidates:
             return MatchResult(
                event=event,
                top_activity_id=None,
                candidates=[],
                confidence_score=0.0,
                confidence_band=ConfidenceBand.LOW,
                is_ambiguous=False,
                ambiguity_reason="No candidates met minimum threshold."
            )

        top_cand = top_candidates[0]
        confidence_score = top_cand.score

        # 4. Ambiguity Detection
        is_ambiguous = False
        ambiguity_reason = None
        
        if len(top_candidates) > 1:
            margin = top_cand.score - top_candidates[1].score
            # If the top 2 matches have very similar scores (margin < 0.05) and are high scoring, it's ambiguous
            if margin < 0.05 and top_cand.score > 0.5:
                is_ambiguous = True
                ambiguity_reason = (f"Ambiguous: Margin between top candidate '{top_cand.activity_id}' "
                                    f"and second candidate '{top_candidates[1].activity_id}' is only {margin:.3f}.")

        # Confidence Band calculation
        if is_ambiguous or confidence_score < 0.50:
            band = ConfidenceBand.LOW
        elif confidence_score < 0.85:
            band = ConfidenceBand.MEDIUM
        else:
            band = ConfidenceBand.HIGH

        return MatchResult(
            event=event,
            top_activity_id=top_cand.activity_id,
            candidates=top_candidates,
            confidence_score=confidence_score,
            confidence_band=band,
            is_ambiguous=is_ambiguous,
            ambiguity_reason=ambiguity_reason
        )

# Expose a singleton instance for simplicity
matching_engine = MatchingEngine()
