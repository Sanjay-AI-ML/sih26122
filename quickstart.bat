@echo off
REM SAMANWAY Quick Start Script for Windows
REM Run this to set up and test the entire system in 2 minutes

setlocal enabledelayedexpansion

echo =========================================
echo SAMANWAY Quick Start (Windows)
echo =========================================
echo.

REM Check prerequisites
echo [1/5] Checking prerequisites...

where docker >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Docker not found. Please install Docker Desktop.
    exit /b 1
)

where python >nul 2>nul
if %errorlevel% neq 0 (
    echo ERROR: Python not found. Please install Python 3.11+.
    exit /b 1
)

echo OK: Prerequisites found
echo.

REM Start services
echo [2/5] Starting Docker containers...
docker-compose down --remove-orphans >nul 2>&1
docker-compose up -d

echo OK: Containers started. Waiting for services...
echo.

REM Wait for services
echo [3/5] Waiting for services to become healthy (30-45 seconds)...

setlocal enabledelayedexpansion
set WAIT_COUNT=0
set MAX_WAIT=90

:wait_loop
if !WAIT_COUNT! geq !MAX_WAIT! (
    echo ERROR: Services took too long to start
    docker-compose logs --tail=20
    exit /b 1
)

set HEALTH=0

curl -s http://localhost:8001/health >nul 2>&1
if !errorlevel! equ 0 (
    set /a HEALTH=!HEALTH!+1
)

curl -s http://localhost:8002/health >nul 2>&1
if !errorlevel! equ 0 (
    set /a HEALTH=!HEALTH!+1
)

curl -s http://localhost:8003/health >nul 2>&1
if !errorlevel! equ 0 (
    set /a HEALTH=!HEALTH!+1
)

curl -s http://localhost:8004/health >nul 2>&1
if !errorlevel! equ 0 (
    set /a HEALTH=!HEALTH!+1
)

if !HEALTH! equ 4 (
    echo OK: All services healthy
    goto services_ok
)

echo   Waiting: !HEALTH!/4 services ready... (!WAIT_COUNT!/%MAX_WAIT% seconds)
timeout /t 2 /nobreak >nul
set /a WAIT_COUNT=!WAIT_COUNT!+2
goto wait_loop

:services_ok
echo.

REM Load sample schedule
echo [4/5] Loading sample L6 schedule...
if exist shared\sample-data\l6_schedule.csv (
    curl -X POST http://localhost:8002/schedule/load -F "file=@shared\sample-data\l6_schedule.csv" >nul 2>&1
    echo OK: Schedule loaded
) else (
    echo WARN: Schedule file not found, skipping
)
echo.

REM Run tests
echo [5/5] Running end-to-end tests...
python test_e2e.py
set TEST_RESULT=%errorlevel%

echo.
echo =========================================

if %TEST_RESULT% equ 0 (
    echo OK: SETUP COMPLETE - System is ready!
    echo =========================================
    echo.
    echo Service Endpoints:
    echo   - Ingestion:  http://localhost:8001
    echo   - Matching:   http://localhost:8002
    echo   - Writeback:  http://localhost:8003
    echo   - Analytics:  http://localhost:8004
    echo.
    echo API Docs (Swagger UI):
    echo   - http://localhost:8001/docs
    echo.
    echo Next Steps:
    echo   1. Try sample requests (see SETUP.md)
    echo   2. Start React UI: cd apps/review-console ^&^& npm run dev
    echo   3. Check logs: docker-compose logs -f
    echo   4. View API docs: http://localhost:8001/docs
    echo.
    exit /b 0
) else (
    echo ERROR: SETUP FAILED - Tests did not pass
    echo =========================================
    echo.
    echo Troubleshooting:
    echo   1. Check Docker logs: docker-compose logs
    echo   2. Verify containers: docker-compose ps
    echo   3. See SETUP.md for detailed help
    exit /b 1
)
