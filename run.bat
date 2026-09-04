@echo off
title Kadam Master Launcher - SIH 2026
cls
echo ============================================================
echo         KADAM SYSTEM - ONE-CLICK MASTER LAUNCHER
echo ============================================================

set "ROOT=%~dp0"
set "VENV_PY=%ROOT%.venv\Scripts\python.exe"

if not exist "%VENV_PY%" (
    echo [SETUP] No virtual environment found at .venv - creating one now...
    py -3.11 -m venv "%ROOT%.venv"
    if errorlevel 1 (
        echo [ERROR] Failed to create virtual environment. Install Python 3.11 and retry.
        pause
        exit /b 1
    )
    echo [SETUP] Installing Python dependencies for all services...
    "%VENV_PY%" -m pip install --upgrade pip -q
    "%VENV_PY%" -m pip install -q -r "%ROOT%services\ingestion\requirements.txt"
    "%VENV_PY%" -m pip install -q -r "%ROOT%services\matching\requirements.txt"
    "%VENV_PY%" -m pip install -q -r "%ROOT%services\analytics\requirements.txt"
    "%VENV_PY%" -m pip install -q -r "%ROOT%services\writeback\requirements.txt"
    echo [SETUP] Dependencies installed.
)

echo [1/6] Starting Python Ingestion Service (Port 8001)...
start "1. Python Ingestion (8001)" cmd /k "cd /d "%ROOT%" && set PYTHONPATH=services&& "%VENV_PY%" -m uvicorn services.ingestion.app:app --port 8001"

echo [2/6] Starting Python Matching Engine (Port 8002)...
start "2. Python Matching (8002)" cmd /k "cd /d "%ROOT%" && set PYTHONPATH=services&& "%VENV_PY%" -m uvicorn services.matching.app:app --port 8002"

echo [3/6] Starting Writeback Service (Port 8003)...
start "3. Writeback (8003)" cmd /k "cd /d "%ROOT%" && set PYTHONPATH=services&& "%VENV_PY%" -m uvicorn services.writeback.app:app --port 8003"

echo [4/6] Starting Analytics Service (Port 8004)...
start "4. Analytics (8004)" cmd /k "cd /d "%ROOT%" && set PYTHONPATH=services&& "%VENV_PY%" -m uvicorn services.analytics.app:app --port 8004"

echo [5/6] Starting Time Agent App (Port 5173)...
start "5. Time Agent (5173)" cmd /k "cd /d "%ROOT%apps\time-agent" && npm run dev -- --port 5173"

echo [6/6] Starting Review Console App (Port 5174)...
start "6. Review Console (5174)" cmd /k "cd /d "%ROOT%apps\review-console" && npm run dev -- --port 5174"

echo ============================================================
echo   ALL SERVICES ARE RUNNING!
echo   --------------------------------------------------------
echo   - Time Agent App:     http://localhost:5173
echo   - Review Console App: http://localhost:5174
echo   - Ingestion API:      http://localhost:8001/docs
echo   - Matching API:       http://localhost:8002/docs
echo   - Writeback API:      http://localhost:8003/docs
echo   - Analytics API:      http://localhost:8004/docs
echo ============================================================
echo NOTE: bridge.js is no longer used - the real Python writeback
echo service (SQLite-backed) now serves port 8003 directly, which
echo is what both frontend apps already expect.
echo ============================================================
echo Press any key to exit this launcher window (services will stay running).
pause > nul
