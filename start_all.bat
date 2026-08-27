@echo off
title Kadam Master Launcher - SIH 2026
cls
echo ============================================================
echo         KADAM SYSTEM - ONE-CLICK MASTER LAUNCHER            
echo ============================================================
echo [1/5] Starting Python Ingestion Service (Port 8001)...
start "1. Python Ingestion (8001)" cmd /k "set PYTHONPATH=services&& python -m uvicorn services.ingestion.app:app --port 8001"

echo [2/5] Starting Python Matching Engine (Port 8002)...
start "2. Python Matching (8002)" cmd /k "set PYTHONPATH=services&& python -m uvicorn services.matching.app:app --port 8002"

echo [3/5] Starting Bridge Queue Server (Port 8003)...
start "3. Bridge Queue (8003)" cmd /k "node bridge.js"

echo [4/5] Starting Time Agent App (Port 5173)...
start "4. Time Agent (5173)" cmd /k "cd apps\time-agent && npm run dev -- --port 5173"

echo [5/5] Starting Review Console App (Port 5174)...
start "5. Review Console (5174)" cmd /k "cd apps\review-console && npm run dev -- --port 5174"

echo ============================================================
echo   ALL SERVICES ARE RUNNING!
echo   --------------------------------------------------------
echo   - Time Agent App:     http://localhost:5173
echo   - Review Console App: http://localhost:5174
echo ============================================================
echo Press any key to exit this launcher window (services will stay running).
pause > nul
