from typing import Optional, Dict, Any
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from services.analytics.engine import analytics_engine

app = FastAPI(
    title="Analytics Service (Member D)",
    description="DuckDB-powered analytics over the institutional memory & historical queries.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HistoricalQueryRequest(BaseModel):
    query: str = Field(..., description="Search query string or question", min_length=1)
    project_id: Optional[str] = Field(default=None, description="Optional project or sector ID")
    date_range: Optional[str] = Field(default=None, description="Optional ISO date range or month filter")


@app.get("/analytics/s-curve")
def get_s_curve():
    """Returns aggregated daily progress suitable for rendering an S-Curve chart."""
    return analytics_engine.get_progress_s_curve()


@app.get("/analytics/stats")
def get_stats():
    """
    Returns overall statistics including ambiguity, discipline breakdown and daily trend.
    Also fetches pending queue count from the writeback bridge service (port 8003)
    to reflect newly submitted activities from the time agent.
    """
    import httpx

    stats = analytics_engine.get_ambiguity_stats()
    breakdown = analytics_engine.get_discipline_breakdown()
    trend = analytics_engine.get_daily_trend()

    # Fetch pending queue from writeback bridge service
    pending_count = 0
    pending_discipline_breakdown: Dict[str, int] = {}
    try:
        resp = httpx.get("http://localhost:8003/queue/pending", timeout=2.0)
        if resp.status_code == 200:
            pending_items = resp.json()
            pending_count = len(pending_items)
            for item in pending_items:
                disc = (item.get("event", {}).get("discipline") or "unknown").lower()
                pending_discipline_breakdown[disc] = pending_discipline_breakdown.get(disc, 0) + 1
    except Exception:
        # Writeback bridge unreachable — silently degrade
        pass

    # Merge pending discipline breakdown with the approved breakdown
    combined_breakdown = {b["discipline"]: b["count"] for b in breakdown}
    for disc, cnt in pending_discipline_breakdown.items():
        combined_breakdown[disc] = combined_breakdown.get(disc, 0)  # keep approved count separate

    # Compute total_submitted: includes all approved + rejected + pending
    approved = stats.get("approved", 0) or 0
    rejected = stats.get("rejected", 0) or 0
    ambiguous = stats.get("ambiguous", 0) or 0
    total_submitted = (stats.get("total_events", 0) or 0) + pending_count

    return {
        **stats,
        "pending": pending_count,
        "total_submitted": total_submitted,
        "approved": approved,
        "rejected": rejected,
        "ambiguous": ambiguous,
        "pending_discipline_breakdown": pending_discipline_breakdown,
        "discipline_breakdown": breakdown,
        "daily_trend": trend,
    }


@app.post("/analytics/historical-queries")
def historical_queries(payload: HistoricalQueryRequest):
    """
    RAG query endpoint: returns similar past extractions, common bottlenecks,
    and timeline insights for the given question/query text.
    """
    return analytics_engine.query_historical_memory(
        query_text=payload.query,
        project_id=payload.project_id,
        date_range=payload.date_range
    )


@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "analytics-service", "port": 8004}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.analytics.app:app", host="0.0.0.0", port=8004, reload=True)
