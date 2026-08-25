from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from services.analytics.engine import analytics_engine

app = FastAPI(
    title="Analytics Service (Member D)",
    description="DuckDB-powered analytics over the institutional memory.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

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

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.analytics.app:app", host="0.0.0.0", port=8004, reload=True)
