# SAMANWAY Setup & Deployment Guide

## Quick Start (5 minutes)

### Prerequisites
- Docker & Docker Compose installed
- Python 3.11+
- Git
- curl or Postman (for API testing)

### 1. Clone & Enter Repository
```bash
git clone https://github.com/Sanjay-AI-ML/sih26122
cd sih26122
```

### 2. Pull & Start Services
```bash
# Start all services (Ollama + 4 FastAPI microservices)
docker-compose up -d

# Wait 30-40 seconds for services to come up
# Check status
docker-compose ps

# View logs (optional)
docker-compose logs -f
```

### 3. Verify Health
```bash
curl http://localhost:8001/health  # Ingestion
curl http://localhost:8002/health  # Matching
curl http://localhost:8003/health  # Writeback
curl http://localhost:8004/health  # Analytics
```

All should return: `{"status":"healthy"}`

### 4. Run End-to-End Test
```bash
python test_e2e.py
```

You should see:
```
✓ ALL TESTS PASSED
```

---

## Architecture Overview

```
PIPELINE FLOW:
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│ Ingestion   │ -> │ Matching    │ -> │ Writeback   │ -> │ Analytics   │
│ (Port 8001) │    │ (Port 8002) │    │ (Port 8003) │    │ (Port 8004) │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       ↑                   ↑                   ↑                   ↑
   TEXT, VOICE,        FAISS Vector         SQLite Audit        DuckDB OLAP
   SPREADSHEET,        Store + Semantic     Log + Queue         Institutional
   SCANNED DOCS        Similarity (via                          Memory
                       Qwen3-4B +
                       Sentence-BERT)
```

---

## Service Details

### 1. **Ingestion Service** (Port 8001)
Parses heterogeneous inputs (free text, voice, spreadsheet, scans) and extracts structured events.

**Key Endpoints:**
- `POST /ingest/text` - Free-text DPR ingestion
- `POST /ingest/voice` - Voice transcript ingestion
- `POST /ingest/file` - File upload (PDF, CSV, XLSX, etc.)
- `POST /ingest/audio` - Audio file transcription + extraction
- `GET /health` - Health check

**Environment Variables:**
- `OLLAMA_BASE_URL` - Default: `http://ollama:11434`
- `LLM_MODEL_NAME` - Default: `qwen3-4b` (must be pulled in Ollama first)

**Sample Request:**
```bash
curl -X POST http://localhost:8001/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Piping discipline: Spool erection at Sector 4 completed. 24-inch main line spol erected.",
    "source_document": "DPR_2026-09-04.txt",
    "default_date": "2026-09-04"
  }'
```

### 2. **Matching Service** (Port 8002)
Resolves extracted events to Primavera L5/L6 schedule activities using semantic similarity + FAISS vector search.

**Key Endpoints:**
- `POST /match` - Match extracted events to schedule activities
- `POST /schedule/load` - Load L6 schedule CSV
- `POST /schedule/activities` - Add new activity to vector store
- `GET /health` - Health check

**Sample Request:**
```bash
curl -X POST http://localhost:8002/match \
  -H "Content-Type: application/json" \
  -d '{
    "extracted_events": [
      {
        "activity_phrase": "Spool erection completed",
        "discipline": "piping",
        "tag_or_line_id": "24-PL-001",
        "event_type": "finish",
        "event_date": "2026-09-04",
        "source_document": "DPR.txt",
        "source_excerpt": "Spool erection completed",
        "input_format": "free_text",
        "raw_confidence_hint": 0.95
      }
    ]
  }'
```

### 3. **Writeback Service** (Port 8003)
Stores approved matches in SQLite audit log with full traceability.

**Key Endpoints:**
- `POST /audit/approve` - Log approved match
- `POST /audit/reject` - Log rejected match
- `GET /audit/history` - Fetch approval history
- `POST /queue/add` - Add to pending queue
- `GET /queue/pending` - Get pending approvals
- `GET /health` - Health check

### 4. **Analytics Service** (Port 8004)
DuckDB-powered analytics over institutional memory.

**Key Endpoints:**
- `GET /analytics/s-curve` - Progress S-curve data
- `GET /analytics/stats` - Overall statistics
- `GET /analytics/delays` - Delay analysis by discipline
- `GET /analytics/confidence` - Confidence score metrics
- `GET /health` - Health check

---

## Sample Data

Pre-loaded sample data available in `shared/sample-data/`:

### 1. Load L6 Schedule
```bash
curl -X POST http://localhost:8002/schedule/load \
  -F "file=@shared/sample-data/l6_schedule.csv"
```

### 2. Ingest Daily Progress Report
```bash
curl -X POST http://localhost:8001/ingest/text \
  -H "Content-Type: application/json" \
  -d @- << 'EOF'
{
  "text": "PIPING: Spool erection at Sector 4 completed. 24-inch main feedline spol #PL-001 erected. CIVIL: Foundation excavation Block B4 started. 50 cum moved today.",
  "source_document": "DPR_2026-09-04.txt",
  "default_date": "2026-09-04"
}
EOF
```

### 3. Match to Schedule
```bash
curl -X POST http://localhost:8002/match \
  -H "Content-Type: application/json" \
  -d @shared/sample-data/sample_match_request.json
```

---

## LLM Configuration: Ollama Qwen3-4B

### Why Qwen3-4B?
- **Small (4B params)** - Runs on laptop/edge hardware (~2GB RAM)
- **Fast inference** - ~100-200ms per extraction
- **Good instruction following** - Fine-tuned for structured extraction
- **Multilingual** - Supports Hinglish (Hindi + English) naturally

### Pulling the Model
The Ollama container should auto-pull on startup, but if you need to manually pull:

```bash
# Enter Ollama container
docker exec -it sih26122-ollama ollama pull qwen3-4b

# Or from your host (if Ollama is running)
ollama pull qwen3-4b
```

### Fallback: Using Claude API
If Ollama is unavailable, the system can fall back to Claude API:

```bash
# Set environment variable
export ANTHROPIC_API_KEY="sk-ant-..."

# Redeploy Ingestion service
docker-compose restart ingestion
```

**Note:** This requires internet and incurs API costs.

### Testing LLM Extraction
```bash
curl -X POST http://localhost:8001/ingest/llm \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Welding inspection for joint P-201A completed. Piping discipline. 95% quality pass.",
    "source_document": "DPR.txt"
  }'
```

---

## Database & Persistence

### SQLite (Writeback Service)
- Location: `services/writeback/audit_log.db`
- Persists approval/rejection audit trail
- Schema: `AuditLog(id, activity_id, discipline, event_date, ..., status, approved_at)`

### DuckDB (Analytics Service)
- Location: `services/analytics/institutional_memory.duckdb`
- Read-only analytics warehouse
- Pre-aggregated: daily progress, discipline breakdowns, delay analysis

### Vector Store (Matching Service)
- In-memory FAISS index (created on startup from L6 schedule CSV)
- Stores embeddings of schedule activities for semantic similarity search

---

## Common Workflows

### Workflow 1: DPR Ingestion → Matching → Approval
```bash
# 1. Ingest DPR
EVENTS=$(curl -X POST http://localhost:8001/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Spool erection Sector 4 PIPING complete",
    "default_date": "2026-09-04"
  }' | jq '.events')

# 2. Match to schedule
curl -X POST http://localhost:8002/match \
  -H "Content-Type: application/json" \
  -d "{\"extracted_events\": $EVENTS}"

# 3. Review console displays match results
# (Manual approval in UI)

# 4. Writeback service logs approval
curl -X POST http://localhost:8003/audit/approve \
  -H "Content-Type: application/json" \
  -d '{
    "activity_id": "L6-PIP-401",
    "discipline": "piping",
    "event_date": "2026-09-04",
    "confidence_score": 0.95,
    "source_document": "DPR_2026-09-04.txt",
    "approved_by": "planner_john"
  }'
```

### Workflow 2: Voice Supervisor Report
```bash
# 1. Transcribe voice (real app: use Whisper locally)
TRANSCRIPT="Piping discipline, spool erection finished at sector 4"

# 2. Ingest transcript
curl -X POST http://localhost:8001/ingest/voice \
  -H "Content-Type: application/json" \
  -d "{
    \"transcript\": \"$TRANSCRIPT\",
    \"default_date\": \"2026-09-04\"
  }"

# 3. Proceeds through matching & approval workflow
```

### Workflow 3: View Analytics
```bash
# Get overall stats
curl http://localhost:8004/analytics/stats | jq

# Get delay analysis
curl http://localhost:8004/analytics/delays | jq

# Get S-curve progress
curl http://localhost:8004/analytics/s-curve | jq
```

---

## Troubleshooting

### Issue: Services won't start
```bash
# Check Docker logs
docker-compose logs ingestion
docker-compose logs ollama

# Ensure ports are free
lsof -i :8001  # Check port 8001
netstat -an | grep 8001  # Windows
```

### Issue: "Connection refused" to Ollama
```bash
# Check if Ollama container is healthy
docker-compose ps

# If unhealthy, restart
docker-compose restart ollama

# Check model is available
docker exec sih26122-ollama ollama list
```

### Issue: LLM extraction returns empty events
- **Cause:** Input text doesn't contain action verbs or discipline keywords
- **Fix:** Check input text has words like "completed", "piping", "civil", etc.
- **Fallback:** Offline rule-based extraction kicks in

### Issue: Matching confidence is low
- **Cause:** Schedule activities don't match event tags/names
- **Fix:** Load correct L6 schedule CSV with matching tags
- **Verify:** `GET http://localhost:8002/activities` should list all loaded activities

### Issue: Database locked (SQLite)
```bash
# Delete old DB and restart writeback
rm services/writeback/audit_log.db
docker-compose restart writeback
```

---

## Performance Tuning

### 1. LLM Extraction Speed
- Qwen3-4B: ~100-150ms per event
- If slower, check Ollama logs and available GPU memory

### 2. Matching Performance
- FAISS vector search: ~5-10ms per query
- Increase batch size for bulk matching

### 3. Database Query Speed
- For large audit logs (>100k rows), add indexes on `activity_id`, `discipline`
- Use DuckDB analytics for reporting (read-only OLAP)

---

## Deployment to Production

### Containerized (Recommended)
```bash
# Build custom images if needed
docker-compose build

# Push to registry
docker tag sih26122-ingestion:latest myregistry/sih26122-ingestion:latest
docker push myregistry/sih26122-ingestion:latest

# Deploy to Kubernetes
kubectl apply -f k8s/
```

### Non-containerized (Local Dev)
```bash
# Install Ollama on host
ollama pull qwen3-4b

# Install Python dependencies
pip install -r services/ingestion/requirements.txt
pip install -r services/matching/requirements.txt
pip install -r services/writeback/requirements.txt
pip install -r services/analytics/requirements.txt

# Start services individually
python -m uvicorn services.ingestion.app:app --port 8001 &
python -m uvicorn services.matching.app:app --port 8002 &
python -m uvicorn services.writeback.app:app --port 8003 &
python -m uvicorn services.analytics.app:app --port 8004 &
```

---

## Next Steps

1. ✅ **Services Running** → Test with `python test_e2e.py`
2. 🎯 **Load Real Data** → Use /schedule/load and /ingest endpoints
3. 🖼️ **Frontend** → Start React apps in `apps/review-console/`
4. 📊 **Monitor** → Check analytics dashboards
5. 🚀 **Deploy** → Follow production deployment guide

---

## Support & Issues

- **GitHub Issues:** [Link to repo issues]
- **API Docs:** Visit http://localhost:8001/docs (Swagger UI)
- **Discord/Slack:** [Link to community]

---

Generated: September 2026
Version: SAMANWAY v1.0.0 (SIH26122)
