"""
Setu (SIH26122) - Master Microservices Orchestrator.
Launches all four backend microservices concurrently with health checks
and automatic schedule priming.
"""

import sys
import time
import subprocess
import requests
from pathlib import Path

SERVICES = [
    {
        "name": "Ingestion & Extraction Service (Member A)",
        "module": "services.ingestion.app:app",
        "host": "127.0.0.1",
        "port": 8001,
        "health_url": "http://127.0.0.1:8001/docs",
    },
    {
        "name": "Matching & Confidence Engine (Member B)",
        "module": "services.matching.app:app",
        "host": "127.0.0.1",
        "port": 8002,
        "health_url": "http://127.0.0.1:8002/docs",
    },
    {
        "name": "Write-Back & Governance Service (Member D)",
        "module": "services.writeback.app:app",
        "host": "127.0.0.1",
        "port": 8003,
        "health_url": "http://127.0.0.1:8003/docs",
    },
    {
        "name": "DuckDB Analytics & Memory Engine (Member D)",
        "module": "services.analytics.app:app",
        "host": "127.0.0.1",
        "port": 8004,
        "health_url": "http://127.0.0.1:8004/health",
    },
]


def start_services():
    root_dir = Path(__file__).parent.resolve()
    processes = []

    print("=" * 70)
    print("  SETU (SIH26122) - Starting Intelligent Data Capture Layer")
    print("=" * 70)

    for svc in SERVICES:
        cmd = [
            sys.executable,
            "-m",
            "uvicorn",
            svc["module"],
            "--host",
            svc["host"],
            "--port",
            str(svc["port"]),
            "--log-level",
            "warning",
        ]
        print(f"[*] Launching {svc['name']} on http://{svc['host']}:{svc['port']} ...")
        proc = subprocess.Popen(cmd, cwd=str(root_dir))
        processes.append((svc, proc))

    print("\n[*] Waiting for services to initialize...")
    time.sleep(3)

    # Health check loop
    print("\n--- Health Check Status ---")
    all_healthy = True
    for svc, proc in processes:
        if proc.poll() is not None:
            print(f"[FAIL] {svc['name']} process exited unexpectedly with code {proc.returncode}!")
            all_healthy = False
            continue

        try:
            res = requests.get(svc["health_url"], timeout=3)
            if res.status_code in (200, 307):
                print(f"[OK]   {svc['name']} is LIVE at http://{svc['host']}:{svc['port']}")
            else:
                print(f"[WARN] {svc['name']} returned status code {res.status_code}")
        except Exception as e:
            print(f"[WARN] {svc['name']} not responding yet ({e})")
            all_healthy = False

    # Seed baseline schedule into Matching service
    schedule_file = root_dir / "dummy_schedule.csv"
    if schedule_file.exists():
        print(f"\n[*] Priming Matching Engine with baseline schedule ({schedule_file.name})...")
        try:
            with open(schedule_file, "rb") as f:
                res = requests.post(
                    "http://127.0.0.1:8002/schedule/load",
                    files={"file": (schedule_file.name, f, "text/csv")},
                    timeout=5,
                )
            if res.status_code == 200:
                data = res.json()
                print(f"[OK]   Loaded {data.get('total_activities_loaded', 0)} L5/L6 activities into FAISS index!")
            else:
                print(f"[WARN] Failed to load schedule: {res.text}")
        except Exception as e:
            print(f"[WARN] Error connecting to matching engine: {e}")

    print("\n" + "=" * 70)
    print("  ALL SETU SERVICES READY & RUNNING")
    print("  Ingestion:    http://127.0.0.1:8001/docs")
    print("  Matching:     http://127.0.0.1:8002/docs")
    print("  Writeback:    http://127.0.0.1:8003/docs")
    print("  Analytics:    http://127.0.0.1:8004/docs")
    print("=" * 70)
    print("Press Ctrl+C to terminate all services.\n")

    try:
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\n[*] Shutting down all services...")
        for _, proc in processes:
            proc.terminate()
        for _, proc in processes:
            proc.wait()
        print("[*] All services stopped.")


if __name__ == "__main__":
    start_services()
