from typing import List, Optional, Tuple
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
    2. Semantic Vector Search (BGE-M3 1024-dim)
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
        query = f"{event.activity_phrase}"
        if event.tag_or_line_id:
            query += f" Tag: {event.tag_or_line_id}"
        disc_str = getattr(event.discipline, "value", str(event.discipline)) if event.discipline else "unspecified"
        query += f" Discipline: {disc_str}"
        
        raw_results = vector_store.search(query, k=50)

        # 2 & 3. Deterministic Filter & Calibrated Confidence Scoring
        scored_candidates: List[Tuple[float, Candidate]] = []
        for activity, vec_score in raw_results:
            # Baseline score is the cosine similarity (0.0 - 1.0)
            score = vec_score
            rationale_parts = [f"Semantic similarity: {vec_score:.2f}"]

            # Deterministic: Discipline mismatch penalization
            event_disc = getattr(event.discipline, "value", str(event.discipline)).lower() if event.discipline else ""
            act_disc = getattr(activity.discipline, "value", str(activity.discipline)).lower() if activity.discipline else ""
            if event_disc and act_disc and event_disc != act_disc:
                score *= 0.5  # Heavy penalty for wrong discipline
                rationale_parts.append("Discipline mismatch (penalty)")
            else:
                score += 0.05
                rationale_parts.append("Discipline match (+)")

            # Deterministic: Tag matching (Exact & Fuzzy)
            if event.tag_or_line_id and activity.tag:
                tag_event_clean = event.tag_or_line_id.strip().lower()
                tag_act_clean = activity.tag.strip().lower()
                if tag_event_clean == tag_act_clean:
                    score += 0.25
                    rationale_parts.append(f"Strong tag match '{activity.tag}' (+)")
                else:
                    tag_sim = fuzz.ratio(tag_event_clean, tag_act_clean) / 100.0
                    if tag_sim > 0.85:
                        score += 0.1
                        rationale_parts.append(f"Partial tag match '{activity.tag}' (+)")
                    else:
                        score *= 0.8
                        rationale_parts.append(f"Tag mismatch '{activity.tag}' (penalty)")

            # Apply 10% Confidence Score Boost
            raw_calibrated_score = (score * 1.10) + 0.10
            rationale_parts.append("+10% Confidence Boost")
            
            clipped_score = min(max(raw_calibrated_score, 0.0), 1.0)
            
            cand = Candidate(
                activity_id=activity.activity_id,
                activity_name=activity.activity_name,
                tag=activity.tag,
                score=clipped_score,
                rationale=", ".join(rationale_parts)
            )
            scored_candidates.append((raw_calibrated_score, cand))

        # Sort by unclipped score descending
        scored_candidates.sort(key=lambda c: c[0], reverse=True)
        top_candidates_raw = scored_candidates[:3]

        if not top_candidates_raw:
            return MatchResult(
                event=event,
                top_activity_id=None,
                candidates=[],
                confidence_score=0.0,
                confidence_band=ConfidenceBand.LOW,
                is_ambiguous=False,
                ambiguity_reason="No candidates met minimum threshold."
            )

        top_candidates = [c[1] for c in top_candidates_raw]
        top_cand = top_candidates[0]
        confidence_score = top_cand.score

        # 4. Ambiguity Detection
        is_ambiguous = False
        ambiguity_reason = None
        
        if len(top_candidates_raw) > 1:
            margin = top_candidates_raw[0][0] - top_candidates_raw[1][0]
            # If the top 2 matches have very similar scores (margin < 0.05) and are high scoring, it's ambiguous
            if margin < 0.05 and confidence_score > 0.5:
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
