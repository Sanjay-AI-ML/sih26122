import csv
from io import StringIO
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from shared.schemas.extracted_event import ExtractedEvent
from services.matching.schemas import MatchResult, ScheduleActivity, DisciplineEnum
from services.matching.vector_store import vector_store
from services.matching.engine import matching_engine
from services.matching.claude_keyword_extractor import get_claude_keyword_extractor

app = FastAPI(
    title="Matching & Confidence Engine (Member B)",
    description="Resolves extracted field events to Primavera schedule activities.",
    version="1.0.0"
)


def seed_default_schedule():
    from services.matching.schemas import ScheduleActivity, DisciplineEnum
    default_activities = [
        ScheduleActivity(activity_id="L6-ELE-201", activity_name="Cable pulling for main electrical substation", discipline=DisciplineEnum.ELECTRICAL, tag="TAG-201", wbs_path="Substation / Wiring", planned_start="2026-08-01", planned_finish="2026-08-30"),
        ScheduleActivity(activity_id="L6-PIP-402", activity_name="Hydro-testing primary cooling water line", discipline=DisciplineEnum.PIPING, tag="TAG-402", wbs_path="Cooling / Piping", planned_start="2026-08-01", planned_finish="2026-08-30"),
        ScheduleActivity(activity_id="L6-CIV-104", activity_name="Poured foundation concrete for generator block B", discipline=DisciplineEnum.CIVIL, tag="TAG-104", wbs_path="Civil / Foundation", planned_start="2026-08-01", planned_finish="2026-08-30"),
        ScheduleActivity(activity_id="L6-HSE-301", activity_name="Completed safety briefing and HSE site inspection", discipline=DisciplineEnum.HSE, tag="TAG-301", wbs_path="HSE / Safety", planned_start="2026-08-01", planned_finish="2026-08-30"),
        ScheduleActivity(activity_id="L6-INS-505", activity_name="Calibrated pressure transmitters for Unit 2", discipline=DisciplineEnum.INSTRUMENTATION, tag="TAG-505", wbs_path="Instrumentation / Transmitters", planned_start="2026-08-01", planned_finish="2026-08-30"),
        ScheduleActivity(activity_id="L6-PIP-403", activity_name="Alignment & welding of 6-inch cooling pipe", discipline=DisciplineEnum.PIPING, tag="TAG-403", wbs_path="Cooling / Piping", planned_start="2026-08-01", planned_finish="2026-08-30"),
        ScheduleActivity(activity_id="L6-CIV-402", activity_name="Completed excavation for foundation block B4", discipline=DisciplineEnum.CIVIL, tag="TAG-402", wbs_path="Civil / Excavation", planned_start="2026-08-01", planned_finish="2026-08-30"),
        ScheduleActivity(activity_id="L6-ELE-404", activity_name="Cable tray laying & junction box mounting", discipline=DisciplineEnum.ELECTRICAL, tag="TAG-404", wbs_path="Substation / Wiring", planned_start="2026-08-01", planned_finish="2026-08-30")
    ]
    vector_store.load_activities(default_activities)

@app.on_event("startup")
async def startup_event():
    seed_default_schedule()

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

@app.post("/keywords/extract", response_model=dict)
async def extract_keywords(request: dict):
    """
    Claude AI + RAG: Extract intelligent keywords from field report.
    Returns categorized keywords with confidence scores.

    Request body: {"field_report": "text of the field report"}
    """
    try:
        field_report = request.get("field_report", "")
        if not field_report:
            raise HTTPException(status_code=400, detail="field_report is required")

        extractor = get_claude_keyword_extractor()
        keywords = extractor.extract_keywords_with_claude(field_report)

        return {
            "success": True,
            "keywords_extracted": len(keywords),
            "keywords": keywords
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/keywords/match-primavera", response_model=dict)
async def match_keywords_to_primavera(request: dict):
    """
    Claude AI + RAG: Match extracted keywords to Primavera tasks.
    Returns matched tasks with confidence scores and reasoning.

    Request body: {"keywords": [{"keyword": "...", "category": "...", "confidence": 0.9}]}
    """
    try:
        keywords = request.get("keywords", [])
        if not keywords:
            raise HTTPException(status_code=400, detail="keywords array is required")

        extractor = get_claude_keyword_extractor()
        matches = extractor.match_keywords_to_primavera(keywords)

        return {
            "success": True,
            "total_matches": len(matches),
            "primavera_matches": [
                {
                    "activity_id": m.activity_id,
                    "activity_name": m.activity_name,
                    "task_code": m.task_code,
                    "discipline": m.discipline,
                    "confidence_score": round(m.confidence_score, 3),
                    "matched_keywords": m.matched_keywords,
                    "rationale": m.rationale
                }
                for m in matches
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/keywords/extract-and-match", response_model=dict)
async def extract_and_match_primavera(request: dict):
    """
    Claude AI + RAG: Full pipeline - Extract keywords and match to Primavera tasks in one call.

    Request body: {"field_report": "text of the field report"}

    Returns both extracted keywords and matched Primavera tasks.
    """
    try:
        field_report = request.get("field_report", "")
        if not field_report:
            raise HTTPException(status_code=400, detail="field_report is required")

        extractor = get_claude_keyword_extractor()
        result = extractor.extract_and_match(field_report)

        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "loaded_activities": len(vector_store.activities),
        "faiss_total": vector_store.index.ntotal if vector_store.index else 0,
        "claude_keyword_extraction": "enabled"
    }


# ==================== LangChain RAG Endpoints ====================
# Production-ready RAG using open-source LangChain framework

from services.matching.langchain_rag import get_rag_system


@app.post("/rag/extract-and-match", tags=["RAG"])
async def rag_extract_and_match(payload: dict):
    """
    LangChain RAG pipeline: Extract keywords and match to Primavera tasks.
    Uses open-source LangChain with local Claude + vector search.

    Intelligently handles spelling mistakes: "spol" → "spool", "errection" → "erection"
    """
    field_report = payload.get("field_report", "")

    if not field_report:
        return {"success": False, "error": "field_report required"}

    rag_system = get_rag_system()
    result = rag_system.extract_and_match(field_report)

    return result


@app.post("/rag/semantic-search", tags=["RAG"])
async def rag_semantic_search(payload: dict):
    """
    Semantic search for Primavera tasks using vector similarity (LangChain FAISS).
    """
    query = payload.get("query", "")
    k = payload.get("k", 5)

    if not query:
        return {"success": False, "error": "query required"}

    rag_system = get_rag_system()
    results = rag_system.semantic_search(query, k=k)

    return {
        "success": True,
        "query": query,
        "results": results,
        "count": len(results)
    }


@app.get("/rag/health", tags=["RAG"])
async def rag_health():
    """Health check for LangChain RAG system."""
    rag_system = get_rag_system()
    return {
        "status": "healthy",
        "rag_engine": "LangChain RAG",
        "embeddings": "HuggingFace (all-MiniLM-L6-v2)",
        "llm": "Local Claude (Ollama)",
        "vector_store": "FAISS",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("services.matching.app:app", host="0.0.0.0", port=8002, reload=True)
