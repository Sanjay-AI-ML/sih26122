import csv
from io import StringIO
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from shared.schemas.extracted_event import ExtractedEvent
from services.matching.schemas import MatchResult, ScheduleActivity, DisciplineEnum
from services.matching.vector_store import vector_store
from services.matching.engine import matching_engine

app = FastAPI(
    title="Matching & Confidence Engine (Member B)",
    description="Resolves extracted field events to Primavera schedule activities.",
    version="1.0.0"
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

@app.post("/match", response_model=MatchResult)
async def match_event(event: ExtractedEvent):
    """
    Takes an ExtractedEvent and returns the Top-3 matching Primavera activities
    along with calibrated confidence scores and ambiguity detection.
    """
    try:
        result = matching_engine.match(event)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "loaded_activities": len(vector_store.activities),
        "faiss_total": vector_store.index.ntotal if vector_store.index else 0
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.matching.app:app", host="0.0.0.0", port=8002, reload=True)
