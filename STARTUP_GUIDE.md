# SAMANWAY ML/AI Pipeline - Startup Guide

**Status:** All 9 phases complete, pushed to GitHub, ready to run

---

## Pre-Startup Checklist

### 1. Prerequisites
```bash
# Python 3.10+
python --version

# Node.js 18+
node --version
npm --version

# Virtual environment (recommended)
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 2. Install Backend Dependencies
```bash
# Install all service requirements
pip install -r services/ingestion/requirements.txt
pip install -r services/matching/requirements.txt
pip install -r services/writeback/requirements.txt
pip install -r services/analytics/requirements.txt
```

### 3. Install Frontend Dependencies
```bash
cd apps/review-console
npm install

# Optional: Install other frontends
cd ../time-agent
npm install
```

---

## Starting the Application

### Terminal 1: Ingestion Service (Port 8001)
```bash
cd repo/services/ingestion
python app.py
# Or: python -m services.ingestion.app
```
**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8001
```

### Terminal 2: Matching Service (Port 8002)
```bash
cd repo/services/matching
python app.py
```
**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8002
```

### Terminal 3: Writeback Service (Port 8003)
```bash
cd repo/services/writeback
python app.py
```
**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8003
```

### Terminal 4: Analytics Service (Port 8004)
```bash
cd repo/services/analytics
python app.py
```
**Expected Output:**
```
INFO:     Uvicorn running on http://0.0.0.0:8004
```

### Terminal 5: Review Console Frontend (Port 5173)
```bash
cd repo/apps/review-console
npm run dev
```
**Expected Output:**
```
VITE v5.x.x  ready in XXX ms

➜  Local:   http://localhost:5173/
```

---

## Service Health Check

Once all services are running, verify they're working:

### Check Each Service
```bash
# Terminal 6 (new terminal)
curl http://localhost:8001/health
curl http://localhost:8002/health
curl http://localhost:8003/health
curl http://localhost:8004/health
```

**Expected Response:**
```json
{
  "status": "healthy",
  "service": "Setu Ingestion & Extraction Service",
  "version": "1.0.0",
  "schema_version": "v2"
}
```

---

## Testing the Full Pipeline

### 1. Test Ingestion (RAG-Enhanced Extraction)
```bash
curl -X POST http://localhost:8001/ingest/text \
  -H "Content-Type: application/json" \
  -d '{
    "text": "24-inch XX spool erection completed at sector 4",
    "source_document": "daily_progress_report.txt",
    "default_date": "2026-08-30"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "total_events": 1,
  "events": [
    {
      "activity_phrase": "24-inch XX spool erection",
      "discipline": "piping",
      "tag_or_line_id": "24-XX",
      "event_type": "finish",
      "raw_confidence_hint": 0.92
    }
  ]
}
```

### 2. Test Matching (Multi-Stage + Calibration)
```bash
curl -X POST http://localhost:8002/match \
  -H "Content-Type: application/json" \
  -d '{
    "activity_phrase": "24-inch XX spool erection",
    "discipline": "piping",
    "tag_or_line_id": "24-XX",
    "event_type": "finish"
  }'
```

**Expected Response:**
```json
{
  "confidence_score": 0.87,
  "confidence_band": "high",
  "candidates": [
    {
      "activity_id": "ACT-2026-001",
      "activity_name": "24-inch XX Spool Erection",
      "score": 0.87
    }
  ],
  "is_ambiguous": false
}
```

### 3. Test Analytics
```bash
curl http://localhost:8004/analytics/health
```

---

## Accessing the Frontend

1. **Open Browser:** http://localhost:5173
2. **Login Screen:** Appears (Keycloak integration)
3. **Review Console:** Shows queue of items to review
4. **Click Record:** Opens RecordDetailScreen

---

## ML/RAG Features Verification

### In RecordDetailScreen, verify:
- ✅ Source excerpt displayed
- ✅ Extracted fields shown in table
- ✅ Match candidates listed with scores
- ⚠️ Confidence band (coming from UI components)
- ⚠️ RAG context panel (coming from UI components)
- ⚠️ Granularity warning (coming from UI components)

---

## Troubleshooting

### Port Already in Use
```bash
# Kill process using port
lsof -i :8001
kill -9 <PID>
```

### Module Import Errors
```bash
# Ensure Python path includes project root
export PYTHONPATH="${PYTHONPATH}:$(pwd)"
python app.py
```

### Database Lock Error (Writeback)
```bash
# Delete SQLite lock file if exists
rm services/writeback/audit_log.db
python app.py
```

### Frontend Not Loading
```bash
# Clear npm cache
npm cache clean --force
npm install
npm run dev
```

---

## Monitoring Services

### View Logs
```bash
# Each service logs to terminal, or redirect to file:
python app.py > logs/ingestion.log 2>&1 &
```

### API Documentation
- Ingestion: http://localhost:8001/docs
- Matching: http://localhost:8002/docs
- Writeback: http://localhost:8003/docs
- Analytics: http://localhost:8004/docs

---

## Next Steps

1. ✅ All services running
2. ✅ Frontend connected to backend
3. ⚠️ Build missing UI components (ConfidenceBand, GranularityWarning, RAGContext, etc.)
4. ⚠️ Wire MemoryRAGPanel to analytics backend
5. ⚠️ Run end-to-end integration tests

---

## Performance Notes

- Initial startup: ~10-15 seconds (model loading)
- First extraction: ~3-5 seconds (embedding generation)
- Subsequent extractions: <1 second
- Full pipeline (ingest → match → writeback): ~5-10 seconds

