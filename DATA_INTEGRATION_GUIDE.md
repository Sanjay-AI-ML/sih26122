# Real-Time Data Integration Layer

## Overview

This guide documents the new real-time data integration system that connects the review console dashboard to live analytics from backend services.

## What Changed

### 1. **New Data Integration Service** (`apps/review-console/src/lib/dataIntegration.ts`)

A singleton service that manages all real-time data fetching and updates.

**Key Features:**
- Fetches data from all 4 backend services (Ingestion, Matching, Writeback, Analytics)
- Polls every 5 seconds (configurable)
- Subscriber pattern for efficient component updates
- Error handling and fallback to demo mode
- Computes project metrics from raw analytics data

**Main Methods:**
```typescript
// Start/stop polling
dataIntegration.startPolling();
dataIntegration.stopPolling();

// Change polling interval (milliseconds)
dataIntegration.setPollingInterval(10000);

// Subscribe to data updates
const unsubscribe = dataIntegration.subscribe((data) => {
  console.log('Data updated:', data);
});
```

### 2. **React Hooks** (`apps/review-console/src/hooks/useRealTimeData.ts` & `dataIntegration.ts`)

**useAnalyticsData()**: Subscribe to raw analytics data
```typescript
const { data, isLoading } = useAnalyticsData();
// data contains: stats, sCurve, auditHistory, pendingQueue, lastUpdated, error
```

**useProjectMetrics()**: Get computed project metrics
```typescript
const { metrics, isLoading } = useProjectMetrics();
// metrics contains: totalEvents, approvedEvents, disciplineMetrics, scheduleVariance, etc.
```

**useRealTimeDataPolling(enabled)**: Enable/disable polling in a component
```typescript
useRealTimeDataPolling(true); // Start polling
useRealTimeDataPolling(false); // Stop polling
```

### 3. **Enhanced Dashboard** (`apps/review-console/src/components/DelayRiskDashboard.tsx`)

The dashboard now:
- Fetches real analytics data from backend services
- Displays live KPIs (schedule variance, bottlenecks, risk level, confidence)
- Shows real discipline-wise delays
- Updates every 5 seconds automatically
- Gracefully falls back to demo mode if backend unavailable

**Data Display:**
- ✅ Schedule Variance (Days)
- ✅ Active Bottlenecks (Count)
- ✅ Predicted Risk Level (LOW/MEDIUM/HIGH)
- ✅ AI Match Confidence (%)
- ✅ Delay by Discipline (Bar Chart)
- ✅ Top Reported Bottlenecks (List)
- ✅ Critical Path Risk Analysis (Table)

### 4. **Enhanced Analytics Backend**

New endpoints in `services/analytics/app.py`:

**GET /analytics/stats** - Enhanced with:
- `delay_analysis`: Delays grouped by discipline
- `confidence_metrics`: Confidence score distribution

**GET /analytics/delays** - New endpoint
- Returns delay analysis by discipline

**GET /analytics/confidence** - New endpoint
- Returns confidence score metrics

### 5. **Metrics Computation**

The `ProjectMetrics` interface provides:
```typescript
interface ProjectMetrics {
  totalEvents: number;
  approvedEvents: number;
  rejectedEvents: number;
  ambiguousEvents: number;
  overallConfidence: number;
  scheduleVariance: number;
  disciplineMetrics: DisciplineMetrics[];
  criticalPathDelay: number;
  completionPercentage: number;
}
```

## How to Use

### In Your Components

```typescript
import { useProjectMetrics } from '../lib/dataIntegration';
import { useRealTimeDataPolling } from '../hooks/useRealTimeData';

function MyDashboard() {
  const { metrics, isLoading } = useProjectMetrics();
  useRealTimeDataPolling(true);

  if (isLoading) return <div>Loading analytics...</div>;

  return (
    <div>
      <p>Total Events: {metrics?.totalEvents}</p>
      <p>Confidence: {metrics?.overallConfidence}%</p>
    </div>
  );
}
```

### Configuring Polling

```typescript
import { dataIntegration } from '../lib/dataIntegration';

// Change polling interval to 10 seconds
dataIntegration.setPollingInterval(10000);

// Start polling
dataIntegration.startPolling();

// Subscribe to updates
const unsubscribe = dataIntegration.subscribe((data) => {
  console.log('Data updated:', data);
});

// Cleanup
unsubscribe();
dataIntegration.stopPolling();
```

## Running Locally

### 1. Start Backend Services (in separate terminals)

```bash
# Ingestion Service (port 8001)
cd services/ingestion
python -m uvicorn app:app --reload --port 8001

# Matching Service (port 8002)
cd services/matching
python -m uvicorn app:app --reload --port 8002

# Writeback Service (port 8003)
cd services/writeback
python -m uvicorn app:app --reload --port 8003

# Analytics Service (port 8004)
cd services/analytics
python -m uvicorn app:app --reload --port 8004
```

### 2. Start Frontend

```bash
cd apps/review-console
npm install
npm run dev
```

### 3. Access Dashboard

1. Navigate to analytics page in the console
2. Watch the status indicator change from "Demo Mode" → "Loading" → "Live Data"
3. Data refreshes every 5 seconds automatically

## Debug Mode

Check browser console for polling logs:
```
Starting data polling...
Fetching analytics data...
Data updated successfully
```

## Error Handling

If backend services are unavailable:
1. Dashboard shows "DEMO MODE" indicator
2. Uses fallback data structures
3. Continues polling to detect when services come back online
4. No errors thrown - graceful degradation

## Performance

- Polling interval: 5 seconds (default, configurable)
- Parallel fetching: All 4 services queried simultaneously
- Memory: Subscriber pattern avoids unnecessary re-renders
- Cache: Last successful data retained across failures

## Future Enhancements

- [ ] WebSocket support for sub-second updates
- [ ] Differential updates (only changed fields)
- [ ] Caching strategy for offline mode
- [ ] Real-time alerts based on metrics thresholds
- [ ] Export analytics to PDF/CSV with live data
- [ ] Multi-user synchronization
