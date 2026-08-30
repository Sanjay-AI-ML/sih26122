#!/usr/bin/env python3
"""
SAMANWAY / SETU (SIH26122) — Master Local Orchestrator.
Launches all 4 backend microservices and 2 Vite frontend apps concurrently.

Ports:
  - 8001: Ingestion & Document Extraction API
  - 8002: Matching & Semantic Confidence Engine
  - 8003: Writeback & Audit Database API
  - 8004: Analytics & Institutional Memory API
  - 5173: Supervisor Time Agent (Vite Frontend)
  - 5174: Planner Review Console (Vite Frontend)
"""

import os
import sys
import time
import signal
import socket
import subprocess
from pathlib import Path
import urllib.request

WORKSPACE_DIR = Path(__file__).resolve().parent
VENV_PYTHON = Path("/home/mayank/sih/.venv/bin/python")
PYTHON_EXE = str(VENV_PYTHON) if VENV_PYTHON.exists() else sys.executable

SERVICES = [
    {
        "name": "1. Ingestion Service",
        "port": 8001,
        "type": "python",
        "cmd": [PYTHON_EXE, "-m", "uvicorn", "services.ingestion.app:app", "--host", "0.0.0.0", "--port", "8001"],
        "cwd": str(WORKSPACE_DIR),
        "health_url": "http://127.0.0.1:8001/health"
    },
    {
        "name": "2. Matching Engine",
        "port": 8002,
        "type": "python",
        "cmd": [PYTHON_EXE, "-m", "uvicorn", "services.matching.app:app", "--host", "0.0.0.0", "--port", "8002"],
        "cwd": str(WORKSPACE_DIR),
        "health_url": "http://127.0.0.1:8002/health"
    },
    {
        "name": "3. Writeback Service",
        "port": 8003,
        "type": "python",
        "cmd": [PYTHON_EXE, "-m", "uvicorn", "services.writeback.app:app", "--host", "0.0.0.0", "--port", "8003"],
        "cwd": str(WORKSPACE_DIR),
        "health_url": "http://127.0.0.1:8003/health"
    },
    {
        "name": "4. Analytics Service",
        "port": 8004,
        "type": "python",
        "cmd": [PYTHON_EXE, "-m", "uvicorn", "services.analytics.app:app", "--host", "0.0.0.0", "--port", "8004"],
        "cwd": str(WORKSPACE_DIR),
        "health_url": "http://127.0.0.1:8004/health"
    },
    {
        "name": "5. Time Agent Frontend",
        "port": 5173,
        "type": "node",
        "cmd": ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5173"],
        "cwd": str(WORKSPACE_DIR / "apps" / "time-agent"),
        "health_url": "http://127.0.0.1:5173"
    },
    {
        "name": "6. Review Console Frontend",
        "port": 5174,
        "type": "node",
        "cmd": ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "5174"],
        "cwd": str(WORKSPACE_DIR / "apps" / "review-console"),
        "health_url": "http://127.0.0.1:5174"
    }
]

processes = []

def kill_port(port: int):
    """Terminates any process occupying the given port."""
    try:
        cmd = f"fuser -k {port}/tcp 2>/dev/null || true"
        subprocess.run(cmd, shell=True)
    except Exception:
        pass

def cleanup_and_exit(signum=None, frame=None):
    """Gracefully terminates all child processes."""
    print("\n[!] Shutting down all SAMANWAY services...")
    for p in processes:
        try:
            p.terminate()
            p.wait(timeout=2)
        except Exception:
            try:
                p.kill()
            except Exception:
                pass
    print("[✓] All services stopped cleanly.")
    sys.exit(0)

signal.signal(signal.SIGINT, cleanup_and_exit)
signal.signal(signal.SIGTERM, cleanup_and_exit)

def main():
    print("=" * 65)
    print("      🚀 SAMANWAY (SIH26122) — LOCAL HOST ORCHESTRATOR")
    print("=" * 65)
    print(f"[*] Workspace Root: {WORKSPACE_DIR}")
    print(f"[*] Python Runtime: {PYTHON_EXE}")
    print("-" * 65)

    # 1. Clean existing ports
    for s in SERVICES:
        kill_port(s["port"])

    time.sleep(0.5)

    # 2. Launch each service
    for s in SERVICES:
        print(f"[*] Launching {s['name']} (Port {s['port']})...")
        env = os.environ.copy()
        env["PYTHONPATH"] = str(WORKSPACE_DIR)
        
        proc = subprocess.Popen(
            s["cmd"],
            cwd=s["cwd"],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE
        )
        processes.append(proc)

    print("\n[*] Waiting for services to initialize...")
    time.sleep(3)

    # 3. Health check loop
    print("\n" + "=" * 65)
    print("                    SERVICE STATUS DASHBOARD")
    print("=" * 65)
    
    all_healthy = True
    for s in SERVICES:
        is_up = False
        for _ in range(5):
            try:
                req = urllib.request.Request(s["health_url"], headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=2.0) as res:
                    if res.status in (200, 304):
                        is_up = True
                        break
            except Exception:
                time.sleep(0.5)

        status_tag = "🟢 RUNNING" if is_up else "🔴 PENDING"
        print(f"  {status_tag:<12} | {s['name']:<25} | {s['health_url']}")
        if not is_up:
            all_healthy = False

    print("=" * 65)
    if all_healthy:
        print("\n✨ ALL 6 MICROSERVICES & FRONTENDS ARE LIVE ON LOCALHOST!")
        print("-----------------------------------------------------------------")
        print("  👉 Supervisor Time Agent:     http://localhost:5173")
        print("  👉 Planner Review Console:    http://localhost:5174")
        print("  👉 Ingestion API Swagger:     http://localhost:8001/docs")
        print("  👉 Matching Engine Swagger:   http://localhost:8002/docs")
        print("  👉 Writeback API Swagger:     http://localhost:8003/docs")
        print("  👉 Analytics API Swagger:     http://localhost:8004/docs")
        print("-----------------------------------------------------------------")
        print("Press Ctrl+C to stop all services.\n")
    else:
        print("\n⚠️  Some services took longer to respond. Check process logs.")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        cleanup_and_exit()

if __name__ == "__main__":
    main()
