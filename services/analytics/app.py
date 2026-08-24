from fastapi import FastAPI
from services.analytics.engine import analytics_engine

app = FastAPI(
    title="Analytics Service (Member D)",
    description="DuckDB-powered analytics over the institutional memory.",
    version="1.0.0"
)

@app.get("/analytics/s-curve")
def get_s_curve():
    """Returns aggregated daily progress suitable for rendering an S-Curve chart."""
    return analytics_engine.get_progress_s_curve()

@app.get("/analytics/stats")
def get_stats():
    """Returns overall ambiguity and auto-suggestion statistics."""
    return analytics_engine.get_ambiguity_stats()

@app.get("/health")
def health_check():
    return {"status": "healthy"}
