# 🛡️ Enterprise Security & Dual-Layer Firewall Architecture

### Project Samanvay / Setu (SIH26122 — Oil India Limited)
> **Author:** Team StriNova  
> **Classification:** Enterprise Zero-Trust Cyber Security Architecture  
> **Compliance:** CERT-In Guidelines, MoPNG Cyber Security Framework, ISO/IEC 27001, OWASP ASVS 4.0

---

## 📑 Executive Summary

In enterprise infrastructure deployments (such as Oil India Limited's operational project management systems), securing field data ingestion, AI inference, and schedule updates requires a defense-in-depth model. Traditional single-perimeter defenses fail when attackers bypass frontends or exploit application-level vulnerabilities.

Samanvay implements an **Enterprise Dual-Layer Firewall Architecture**:
1. **Web Application Firewall (WAF) — The Front Door (Layer 7):** Sits at the public internet edge, inspecting all HTTP/HTTPS traffic to eliminate SQL Injection (SQLi), Cross-Site Scripting (XSS), Path Traversal, malicious bots, and DDoS flooding before requests reach the application core.
2. **Network Firewalls & VPC Security Groups — The Internal Security Guards (Layer 3/4):** Implements **Zero-Trust Microsegmentation** across segregated virtual private subnets. Databases (PostgreSQL + pgvector) and AI inference engines (vLLM / Ollama) have **0.0.0.0/0 internet routes disabled** and are physically impossible to access from the outside world.

---

## 🏛️ System Security Architecture Diagram

```
                 [ PUBLIC INTERNET / FIELD MOBILE WORKERS ]
                                     │
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │          TIER 1: EDGE WEB APPLICATION FIREWALL (WAF)        │
      │  • Cloudflare WAF / AWS WAF v2 / GCP Cloud Armor            │
      │  • DDoS Rate Limiting (Token Bucket: 180 req/min per IP)    │
      │  • Bot & Scanner Blocking (sqlmap, nikto, gobuster, masscan)│
      │  • OWASP Core Rule Set (CRS 3.3) Layer 7 Deep Inspection    │
      │  • SSL/TLS 1.3 Strict Termination & HSTS Response Headers   │
      └──────────────────────────────┬──────────────────────────────┘
                                     │ (Public DMZ Subnet)
                                     ▼
      ┌─────────────────────────────────────────────────────────────┐
      │         TIER 2: HARDENED NGINX GATEWAY & REVERSE PROXY      │
      │  • Injects X-Internal-Gateway-Token on verified traffic     │
      │  • Client Body Limits (35MB audio/scan max, 2MB JSON)       │
      │  • Routes traffic to internal container subnets             │
      └──────────────┬──────────────────────────────┬───────────────┘
                     │                              │
     (App-Internal Network)          (App-Internal Network)
                     │                              │
                     ▼                              ▼
  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
  │  FASTAPI INGESTION SERVICE :8001 │  │  FASTAPI MATCHING ENGINE :8002   │
  │  [In-App FirewallMiddleware]     │  │  [In-App FirewallMiddleware]     │
  └──────────────────┬───────────────┘  └──────────────────┬───────────────┘
                     │                                     │
  ┌──────────────────┴───────────────┐  ┌──────────────────┴───────────────┐
  │  FASTAPI WRITEBACK SERVICE :8003 │  │  FASTAPI ANALYTICS SERVICE :8004 │
  │  [In-App FirewallMiddleware]     │  │  [In-App FirewallMiddleware]     │
  └──────────────────┬───────────────┘  └──────────────────┬───────────────┘
                     │                                     │
         (Isolated DB Network)                  (Isolated AI Network)
         [internal: true | NO WAN]              [internal: true | NO WAN]
                     │                                     │
                     ▼                                     ▼
  ┌──────────────────────────────────┐  ┌──────────────────────────────────┐
  │   TIER 3: SECURE DATABASE LAYER  │  │   TIER 4: ISOLATED AI/LLM ENGINE │
  │ • PostgreSQL 16 + pgvector (5432)│  │ • Ollama / vLLM Server (11434)   │
  │ • Redis Cache (6379)             │  │ • Sentence-BERT / FAISS Worker   │
  │ • DuckDB Analytical OLAP Store   │  │                                  │
  │ (NO PORT MAPPED TO HOST / WAN)   │  │ (NO INTERNET ROUTE / APP ONLY)   │
  └──────────────────────────────────┘  └──────────────────────────────────┘
```

---

## 🧱 Component Breakdown

### 1. Web Application Firewall (WAF) — The Front Door
* **Location:** Network Edge (Cloudflare / AWS WAF v2 / NGINX Ingress Proxy).
* **Threats Mitigated:**
  * **SQL Injection (SQLi):** Rejects patterns like `' OR 1=1`, `UNION SELECT`, `; DROP TABLE`, and time-based sleep injections.
  * **Cross-Site Scripting (XSS):** Blocks inline `<script>`, `javascript:`, DOM manipulation payloads, and HTML event handlers (`onerror=`, `onload=`).
  * **Path Traversal:** Blocks directory traversal tokens (`../`, `..\`, `%2e%2e%2f`, `/etc/passwd`).
  * **Automated Scanners & Bots:** Identifies and immediately drops requests matching `sqlmap`, `nikto`, `nmap`, `masscan`, `wpscan`, `gobuster`, etc.
  * **DDoS & Flooding:** Enforces per-IP sliding window rate limiting (180 requests/minute, 40 request burst).
* **Enterprise Security Headers Injected:**
  * `X-Content-Type-Options: nosniff`
  * `X-Frame-Options: DENY`
  * `X-XSS-Protection: 1; mode=block`
  * `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  * `Referrer-Policy: strict-origin-when-cross-origin`
  * `Permissions-Policy: camera=(), microphone=(), geolocation=()`

### 2. In-App Security Middleware (`shared/security/firewall.py`)
* **Framework:** Pure ASGI / FastAPI Starlette middleware.
* **Zero-Trust Gateway Verification:** Requires a shared internal cryptographic secret (`X-Internal-Gateway-Token`) on all backend API requests, preventing attackers from communicating directly with microservices even if internal network ports are scanned.
* **Input Sanitization & Boundary Enforcer:** Validates payload sizes before parsing and runs regex inspections over query parameters, URI paths, and JSON bodies.

### 3. Network Firewalls & Cloud Security Groups (Layer 3/4 Zero Trust)
* **Subnet Segregation (AWS VPC / GCP VPC):**
  * `Public Subnet (10.0.1.0/24)`: ALB and Edge WAF only.
  * `Private App Subnet (10.0.10.0/24)`: FastAPI microservices with outbound-only NAT gateway for dependencies.
  * `Isolated Subnet (10.0.20.0/24)`: Database (PostgreSQL + pgvector) and AI Compute nodes. Has **NO route table entry to Internet Gateway or NAT Gateway**.
* **Security Group Ingress Matrices:**
  | Security Group | Allowed Ingress Source | Allowed Ingress Ports | Allowed Egress |
  | :--- | :--- | :--- | :--- |
  | **`alb_waf_sg`** | `0.0.0.0/0` (Filtered by WAF) | 80, 443 | `app_backend_sg` (8001-8004) |
  | **`app_backend_sg`** | `alb_waf_sg` ONLY | 8001, 8002, 8003, 8004 | `db_secure_sg`, `ai_llm_sg`, NAT GW |
  | **`db_secure_sg`** | `app_backend_sg` ONLY | 5432 (Postgres), 6379 (Redis) | Intra-cluster sync only |
  | **`ai_llm_sg`** | `app_backend_sg` ONLY | 11434 (Ollama), 8000 (vLLM) | None (100% isolated) |

---

## 🧪 Testing & Verification

### Running the Security Test Suite
```bash
pytest shared/security/tests/test_firewall.py -v
```
All 9 automated security tests verify:
1. Legitimate construction notes pass without false positives.
2. SQLi injection in query parameters returns `403 Forbidden` (`WAF_INJECTION_DETECTED`).
3. SQLi injection in JSON bodies returns `403 Forbidden` (`WAF_BODY_INJECTION_DETECTED`).
4. XSS payloads (`<script>`, `<img onerror>`) return `403 Forbidden`.
5. Path traversal (`../../etc/passwd`) returns `403 Forbidden`.
6. Malicious user agents (`sqlmap`, `nikto`) return `403 Forbidden` (`WAF_SCANNER_BLOCKED`).
7. Sliding window rate limiter returns `429 Too Many Requests` with `Retry-After`.
8. Zero-Trust Gateway Token blocks direct unauthenticated requests.

### Running with Docker Compose Network Isolation
```bash
docker compose -f docker-compose.security.yml up --build -d
```

---

## 🔒 Oil India & Enterprise Compliance
* **MoPNG Cyber Security Norms:** Isolates critical scheduling data from untrusted field networks.
* **CERT-In Compliance:** Mandatory audit trails, request logging, and rate limiting against DDoS.
* **Zero Trust Standard:** Every microservice authenticates caller identity and assumes network perimeter compromise.
