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
    """Returns overall statistics including ambiguity, discipline breakdown and daily trend."""
    stats = analytics_engine.get_ambiguity_stats()
    breakdown = analytics_engine.get_discipline_breakdown()
    trend = analytics_engine.get_daily_trend()
    return {
        **stats,
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
