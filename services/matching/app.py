import csv
from io import StringIO
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from shared.schemas.extracted_event import ExtractedEvent
from services.matching.schemas import MatchResult, ScheduleActivity, DisciplineEnum
from services.matching.vector_store import vector_store
from services.matching.engine import matching_engine
from services.matching.xgb_classifier import xgb_classifier

app = FastAPI(
    title="Matching & Confidence Engine (Member B)",
    description="Resolves extracted field events to Primavera schedule activities.",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/schedule/load")
async def load_schedule(file: UploadFile = File(...)):
    """
    Loads a Primavera L5/L6 CSV schedule.
    Expected CSV headers: activity_id, activity_name, discipline, tag, wbs_path, planned_start, planned_finish
    """
    if not file.filename.endswith('.csv'):
        raise HTTPException(status_code=400, detail="Only CSV files are supported.")
        
    content = await file.read()
    text = content.decode('utf-8')
    reader = csv.DictReader(StringIO(text))
    
    activities = []
    for row in reader:
        try:
            # Map CSV string to DisciplineEnum
            disc_str = row.get("discipline", "").strip().lower()
            discipline = DisciplineEnum(disc_str) if disc_str else DisciplineEnum.UNSPECIFIED
            
            act = ScheduleActivity(
                activity_id=row["activity_id"],
                activity_name=row["activity_name"],
                discipline=discipline,
                tag=row.get("tag", ""),
                wbs_path=row.get("wbs_path", ""),
                planned_start=row.get("planned_start", ""),
                planned_finish=row.get("planned_finish", "")
            )
            activities.append(act)
        except Exception as e:
            # Skip invalid rows for now
            print(f"Skipping row due to error: {e}")
            continue

    if not activities:
        raise HTTPException(status_code=400, detail="No valid activities found in CSV.")

    vector_store.clear()
    vector_store.load_activities(activities)
    
    return {"message": f"Successfully loaded {len(activities)} activities into FAISS vector store."}

@app.post("/schedule/activities", response_model=dict)
async def add_activity(activity: ScheduleActivity):
    """
    Appends a single new activity to the vector store without clearing existing ones.
    Used by the Review Console's Create New Activity form.
    """
    try:
        vector_store.load_activities([activity])
        return {"message": f"Activity '{activity.activity_id}' added to vector store.", "activity_id": activity.activity_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/schedule/activities")
async def get_activities():
    """Returns a summary of all loaded Primavera schedule activities."""
    return {
        "total": len(vector_store.activities),
        "activities": [
            {
                "activity_id": a.activity_id,
                "activity_name": a.activity_name,
                "discipline": a.discipline.value,
                "tag": a.tag,
            }
            for a in vector_store.activities[:50]  # Cap at 50 for readability
        ]
    }

@app.post("/match", response_model=MatchResult)
async def match_event(event: ExtractedEvent):
    """
    Takes an ExtractedEvent and returns the Top-3 matching Primavera activities
    along with calibrated confidence scores, ambiguity detection, and
    XGBoost routing decision (auto_approve / auto_reject / needs_human).
    """
    try:
        result = matching_engine.match(event)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ── XGBoost Human Intervention Eliminator Endpoints ───────────────────────────

@app.post("/match/train")
async def train_xgb_model():
    """
    Trains (or retrains) the XGBoost human intervention eliminator on all
    historical planner decisions stored in the audit_log SQLite database.

    Requires: ≥ 50 approved/rejected records in services/writeback/setu.db.
    Returns:  Training accuracy, ROC-AUC, feature importances, and estimated
              human queue reduction percentage.
    """
    try:
        result = xgb_classifier.train()
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/match/xgb-status")
async def get_xgb_status():
    """
    Returns the current status of the XGBoost model:
    - Whether a trained model is loaded
    - Audit cache size (number of historical tags in memory)
    - Decision thresholds
    - Feature list
    """
    return xgb_classifier.status()

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "loaded_activities": len(vector_store.activities),
        "faiss_total": vector_store.index.ntotal if vector_store.index else 0,
        "xgb_model_trained": xgb_classifier.model is not None,
        "xgb_audit_cache_size": len(xgb_classifier._tag_approval_cache),
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.matching.app:app", host="0.0.0.0", port=8002, reload=True)
