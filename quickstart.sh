#!/bin/bash
# SAMANWAY Quick Start Script
# Run this to set up and test the entire system in 2 minutes

set -e

echo "========================================="
echo "SAMANWAY Quick Start"
echo "========================================="
echo ""

# Check prerequisites
echo "[1/5] Checking prerequisites..."
if ! command -v docker &> /dev/null; then
    echo "❌ Docker not found. Please install Docker."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose not found. Please install Docker Compose."
    exit 1
fi

if ! command -v python &> /dev/null; then
    echo "❌ Python not found. Please install Python 3.11+."
    exit 1
fi

echo "✓ Prerequisites OK"
echo ""

# Start services
echo "[2/5] Starting Docker containers..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose up -d

echo "✓ Containers started. Waiting for services to be healthy..."
echo ""

# Wait for services
echo "[3/5] Waiting for services to become healthy (30-45 seconds)..."
WAIT_COUNT=0
MAX_WAIT=90

while [ $WAIT_COUNT -lt $MAX_WAIT ]; do
    HEALTH=0
    
    if curl -s http://localhost:8001/health > /dev/null 2>&1; then
        HEALTH=$((HEALTH + 1))
    fi
    if curl -s http://localhost:8002/health > /dev/null 2>&1; then
        HEALTH=$((HEALTH + 1))
    fi
    if curl -s http://localhost:8003/health > /dev/null 2>&1; then
        HEALTH=$((HEALTH + 1))
    fi
    if curl -s http://localhost:8004/health > /dev/null 2>&1; then
        HEALTH=$((HEALTH + 1))
    fi
    
    if [ $HEALTH -eq 4 ]; then
        echo "✓ All services healthy"
        break
    fi
    
    echo "  ⏳ $HEALTH/4 services ready... ($WAIT_COUNT/$MAX_WAIT seconds)"
    sleep 2
    WAIT_COUNT=$((WAIT_COUNT + 2))
done

if [ $WAIT_COUNT -ge $MAX_WAIT ]; then
    echo "❌ Services took too long to start. Checking logs..."
    docker-compose logs --tail=20
    exit 1
fi

echo ""

# Load sample schedule
echo "[4/5] Loading sample L6 schedule..."
if [ -f "shared/sample-data/l6_schedule.csv" ]; then
    curl -s -X POST http://localhost:8002/schedule/load \
        -F "file=@shared/sample-data/l6_schedule.csv" > /dev/null
    echo "✓ Schedule loaded"
else
    echo "⚠ Schedule file not found, skipping"
fi

echo ""

# Run tests
echo "[5/5] Running end-to-end tests..."
python test_e2e.py
TEST_RESULT=$?

echo ""
echo "========================================="

if [ $TEST_RESULT -eq 0 ]; then
    echo "✅ SETUP COMPLETE - System is ready!"
    echo "========================================="
    echo ""
    echo "📍 Service Endpoints:"
    echo "  • Ingestion:  http://localhost:8001"
    echo "  • Matching:   http://localhost:8002"
    echo "  • Writeback:  http://localhost:8003"
    echo "  • Analytics:  http://localhost:8004"
    echo ""
    echo "📚 API Docs (Swagger UI):"
    echo "  • http://localhost:8001/docs"
    echo ""
    echo "🚀 Next Steps:"
    echo "  1. Try sample requests (see SETUP.md)"
    echo "  2. Start React UI: cd apps/review-console && npm run dev"
    echo "  3. Check logs: docker-compose logs -f"
    echo "  4. View API docs: http://localhost:8001/docs"
    echo ""
    echo "📖 Full documentation: SETUP.md"
    exit 0
else
    echo "❌ SETUP FAILED - Tests did not pass"
    echo "========================================="
    echo ""
    echo "🔍 Troubleshooting:"
    echo "  1. Check Docker logs: docker-compose logs"
    echo "  2. Verify all containers are running: docker-compose ps"
    echo "  3. Test individual endpoints with curl"
    echo "  4. See SETUP.md for detailed troubleshooting"
    exit 1
fi
