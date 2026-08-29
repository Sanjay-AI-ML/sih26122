# 🏗️ Samanvay (Setu) — SIH26122
### **Intelligent Data Capture & Schedule-Linking Layer for Infrastructure Project Management**
> **Organization:** Oil India Limited (Ministry of Petroleum & Natural Gas)  
> **Problem Statement ID:** SIH26122 | **Theme:** Smart Automation | **Category:** Software  
> **Team:** StriNova

---

## 📌 Executive Summary (In Simple Words)

In mega infrastructure projects (such as oil refineries, pipelines, and highways), master schedules are planned down to micro-activities (**L5/L6 level in Primavera P6**). However, on the actual job site, daily progress arrives through messy daily progress reports (DPRs), Excel sheets, paper diaries, and verbal supervisor voice notes across 6+ different disciplines (Civil, Piping, Electrical, etc.).

Because a pipe fitter says *"Spool erected"* while the master plan calls it *"Erect Line 24-PL-001"*, schedules lag reality by weeks, performance data goes stale, and execution knowledge is lost once the project closes.

**Samanvay is the AI-assisted planning-to-execution bridge:**
1. **Ingests Any Field Format:** Daily reports (PDF/Text), spreadsheets (Excel/CSV), scanned site diaries (OCR), and voice notes (Whisper ASR).
2. **AI & Deterministic Linking:** Automatically extracts engineering tags and maps unstructured site notes to the exact Primavera L5/L6 activity node using a 4-stage semantic pipeline.
3. **Planner Approval Gate:** High-confidence matches auto-link; medium and ambiguous matches are flagged for human-in-the-loop review.
4. **Institutional Memory & Analytics:** Builds a queryable historical database of real durations, productivity, and delay patterns for future projects.
5. **Enterprise Dual-Layer Firewall:** Protects government infrastructure data with an Edge WAF and Zero-Trust Network Isolation.

---

## 🛠️ Complete Technology Stack

| Layer | Technologies Used | Purpose |
| :--- | :--- | :--- |
| **Frontend (Web & Mobile)** | **React 18, Vite, TypeScript, Tailwind CSS, Recharts, Lucide Icons** | **Review Console** (Desktop dashboard for planning engineers) and **Time Agent** (Mobile PWA for site supervisors with voice logging & offline queue). |
| **Backend Microservices** | **Python 3.11+, FastAPI, Uvicorn, Starlette, Pydantic v2** | High-performance asynchronous microservice architecture (Ingestion :8001, Matching :8002, Writeback :8003, Analytics :8004). |
| **AI & NLP Extraction** | **Qwen / Mistral (via LiteLLM/Ollama), Whisper ASR, EasyOCR / Tesseract** | Schema-constrained field entity extraction, Hinglish voice transcription, and paper diary OCR. |
| **Semantic Matching Engine** | **Sentence-BERT (`all-MiniLM-L6-v2`), FAISS, RapidFuzz** | 4-Stage matching: Deterministic Hard Filter $\rightarrow$ Semantic Vector Search $\rightarrow$ Calibrated Confidence Bands $\rightarrow$ Ambiguity Detection. |
| **Database & Analytics** | **PostgreSQL 16 + pgvector, SQLite (OLTP), DuckDB (OLAP S-Curve engine), Redis** | Zero-latency audit logging, fast S-Curve aggregations, and vectorized memory store. |
| **Edge WAF & Security** | **Cloudflare WAF, NGINX Reverse Proxy, In-App Firewall Middleware** | OWASP Top 10 mitigation, SQLi/XSS blocking, IP rate limiting (Token Bucket), and security response headers. |
| **Network & Infrastructure** | **Docker Compose, Terraform (AWS VPC & Security Groups), Kubernetes NetworkPolicies** | Zero-Trust 4-tier network microsegmentation and isolated subnets. |

---

## 🛡️ Enterprise Security & Dual-Layer Firewall Architecture

To secure sensitive Oil & Gas infrastructure schedules, Samanvay implements a **Zero-Trust Dual-Layer Firewall**:

```
                 [ PUBLIC INTERNET / FIELD MOBILE WORKERS ]
                                     │
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │          TIER 1: EDGE WEB APPLICATION FIREWALL (WAF)        │
      │  • Cloudflare WAF / AWS WAF / NGINX Reverse Proxy Gateway   │
      │  • Stops SQL Injection, Cross-Site Scripting (XSS) & Scanners│
      │  • Token-Bucket Rate Limiter (180 req/min per client IP)    │
      │  • Injects cryptographic X-Internal-Gateway-Token           │
      └──────────────────────────────┬──────────────────────────────┘
                                     │ (Public DMZ Network)
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │           TIER 2: FASTAPI BACKEND MICROSERVICES             │
      │  • Ingestion (:8001) | Matching (:8002)                    │
      │  • Writeback (:8003) | Analytics (:8004)                    │
      │  • Enforces In-App FirewallMiddleware on every endpoint     │
      └──────────────┬──────────────────────────────┬───────────────┘
                     │                              │
         (Isolated DB Network)                  (Isolated AI Network)
         [internal: true | NO WAN]              [internal: true | NO WAN]
                     │                              │
                     ▼                              ▼
  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
  │   TIER 3: ZERO-TRUST DATABASE    │  │   TIER 4: ISOLATED AI/LLM ENGINE │
  │ • PostgreSQL 16 + pgvector (5432)│  │ • Local vLLM / Ollama Server     │
  │ • Redis Cache (6379)             │  │ • FAISS Vector Index Worker      │
  │ (NO OUTSIDE ROUTE / NO HOST PORT)│  │ (ACCESSIBLE ONLY BY BACKEND)     │
  └──────────────────────────────────┘  └──────────────────────────────────┘
```

* **1. WAF — The Front Door:** Inspects incoming web traffic and immediately drops malicious SQL injection payloads (`' OR 1=1`, `UNION SELECT`), XSS attack scripts (`<script>`), path traversal (`../etc/passwd`), and automated vulnerability scanners (`sqlmap`, `nikto`).
* **2. Network Firewall & VPC — The Internal Guards:** The database (PostgreSQL) and AI inference server are locked in isolated private subnets with **no route to the public internet**. External hackers cannot reach or ping them directly.

---

## 📂 Repository Structure

```
sih26122/
├── apps/
│   ├── review-console/         # Planning Engineer Web Dashboard (React + Vite + Tailwind)
│   └── time-agent/             # Field Supervisor Mobile PWA (React + Vite + Voice/Camera)
├── services/
│   ├── ingestion/              # Multi-modal Ingestion Service (:8001)
│   │   └── parsers/            # Text, CSV/Excel, PDF, Audio Whisper, OCR parsers
│   ├── matching/               # FAISS + RapidFuzz 4-Stage Matching Engine (:8002)
│   ├── writeback/              # SQLite/PostgreSQL OLTP Audit Logger (:8003)
│   └── analytics/              # DuckDB S-Curve & Institutional Memory Service (:8004)
├── shared/
│   ├── schemas/                # ExtractedEvent unified contract (Pydantic / TypeScript / JSON)
│   ├── security/               # Enterprise WAF & Zero-Trust Firewall Middleware
│   │   ├── firewall.py         # Layer 7 inspection, rate limiting & token verification
│   │   └── tests/              # 9 automated security & attack test cases
│   └── sample-data/            # Synthetic Oil India DPRs, piping/civil sheets, voice logs
├── infra/
│   ├── waf/                    # Hardened NGINX WAF configuration & Cloudflare ruleset
│   ├── terraform/              # AWS 3-Tier Multi-AZ VPC & Zero-Trust Security Groups
│   └── k8s/                    # Kubernetes Zero-Trust NetworkPolicies
├── docs/
│   └── SECURITY_ARCHITECTURE.md# Comprehensive Enterprise Security Deep-Dive
├── bridge.js                   # Node.js event bus & sync bridge (:3000)
├── docker-compose.security.yml  # Zero-Trust 4-tier network deployment
├── start_all.bat               # One-click Windows development launcher
└── run.bat                     # Quick launcher script
```

---

## 🚀 Quickstart & Local Setup

### Option 1: One-Click Secure Docker Compose (Recommended)
Run the entire hardened multi-tier environment (WAF, 4 Microservices, 2 Frontends, PostgreSQL, Redis) with network isolation:

```bash
docker compose -f docker-compose.security.yml up --build -d
```

* **Planning Engineer Dashboard:** `http://localhost`
* **Supervisor Mobile Time Agent:** `http://localhost/agent`
* **Unified API Gateway:** `http://localhost/api/v1/`

---

### Option 2: Running Microservices Locally

1. **Create and Activate Python Virtual Environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: .\venv\Scripts\activate
   pip install -r services/ingestion/requirements.txt
   pip install -r services/matching/requirements.txt
   pip install -r services/writeback/requirements.txt
   pip install -r services/analytics/requirements.txt
   ```

2. **Start Backend Microservices:**
   ```bash
   # Terminal 1: Ingestion Service
   uvicorn services.ingestion.app:app --port 8001 --reload

   # Terminal 2: Matching Service
   uvicorn services.matching.app:app --port 8002 --reload

   # Terminal 3: Writeback Service
   uvicorn services.writeback.app:app --port 8003 --reload

   # Terminal 4: Analytics Service
   uvicorn services.analytics.app:app --port 8004 --reload
   ```

3. **Start Frontend Applications:**
   ```bash
   # Terminal 5: Review Console
   cd apps/review-console && npm install && npm run dev

   # Terminal 6: Time Agent
   cd apps/time-agent && npm install && npm run dev
   ```

---

## 🧪 Running the Automated Test Suite

Run all **60 unit, integration, and security firewall tests**:

```bash
pytest services/ shared/
```

To run the security and attack test suite specifically:
```bash
pytest shared/security/tests/test_firewall.py -v
```

---

## 📡 API Services Reference

| Service | Port | Key Endpoints | Description |
| :--- | :--- | :--- | :--- |
| **Ingestion** | `8001` | `POST /ingest`, `POST /ingest/file`, `POST /ingest/text`, `POST /ingest/voice`, `POST /ingest/audio`, `POST /ingest/llm` | Ingests PDF/CSV/DPR/Voice notes and returns validated `ExtractedEvent` objects. |
| **Matching** | `8002` | `POST /match`, `POST /schedule/load`, `GET /schedule/activities` | Resolves extracted events to L5/L6 WBS activities with calibrated confidence scores. |
| **Writeback** | `8003` | `POST /audit/approve`, `POST /audit/reject`, `GET /audit/history` | Human-in-the-loop audit logger and schedule actual date writeback. |
| **Analytics** | `8004` | `GET /analytics/s-curve`, `GET /analytics/stats` | S-Curve actuals vs planned progress and ambiguity metrics via DuckDB. |
| **Bridge** | `3000` | `POST /queue/add`, `GET /queue`, `POST /sync` | Offline sync bridge for field supervisor mobile client. |

---

## 👥 Team StriNova (SIH 2026)
* Problem Statement SIH26122 · Oil India Limited
* Solution: **Samanvay (Setu / PlanBridge)**
