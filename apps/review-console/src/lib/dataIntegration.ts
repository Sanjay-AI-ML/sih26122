// ============================================================
// Real-time Data Integration Layer
// Manages live data fetching and updates for all dashboards
// ============================================================

import React from 'react';
import { getAnalyticsStats, getSCurve, getAuditHistory, getPendingQueue } from './api';

export interface AnalyticsData {
  stats: any;
  sCurve: any[];
  auditHistory: any[];
  pendingQueue: any[];
  lastUpdated: Date;
  error: string | null;
}

export interface DisciplineMetrics {
  discipline: string;
  totalEvents: number;
  averageDelay: number;
  completionRate: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface ProjectMetrics {
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

class DataIntegrationService {
  private subscribers: Set<(data: AnalyticsData) => void> = new Set();
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastData: AnalyticsData | null = null;
  private pollingDelay = 5000; // 5 seconds for demo, adjust for production

  async fetchAllAnalytics(): Promise<AnalyticsData> {
    try {
      const [stats, sCurve, auditHistory, pendingQueue] = await Promise.all([
        getAnalyticsStats().catch(e => {
          console.error('Stats fetch failed:', e);
          return { total_events: 0, approved: 0, rejected: 0, ambiguous: 0, discipline_breakdown: {} };
        }),
        getSCurve().catch(e => {
          console.error('S-Curve fetch failed:', e);
          return [];
        }),
        getAuditHistory().catch(e => {
          console.error('Audit history fetch failed:', e);
          return [];
        }),
        getPendingQueue().catch(e => {
          console.error('Pending queue fetch failed:', e);
          return [];
        })
      ]);

      const data: AnalyticsData = {
        stats,
        sCurve,
        auditHistory,
        pendingQueue,
        lastUpdated: new Date(),
        error: null
      };

      this.lastData = data;
      return data;
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      return {
        stats: { total_events: 0, approved: 0, rejected: 0, ambiguous: 0 },
        sCurve: [],
        auditHistory: [],
        pendingQueue: [],
        lastUpdated: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  computeProjectMetrics(data: AnalyticsData): ProjectMetrics {
    const stats = data.stats || {};
    const totalEvents = stats.total_events || 0;
    const approvedEvents = stats.approved || 0;
    const rejectedEvents = stats.rejected || 0;
    const ambiguousEvents = stats.ambiguous || 0;

    // Calculate discipline metrics
    const disciplineBreakdown = stats.discipline_breakdown || {};
    const disciplineMetrics: DisciplineMetrics[] = Object.entries(disciplineBreakdown).map(
      ([discipline, count]: [string, any]) => ({
        discipline,
        totalEvents: count.total || count,
        averageDelay: count.avg_delay || 0,
        completionRate: count.completion_rate || 0,
        riskLevel: getRiskLevel(count.avg_delay || 0)
      })
    );

    // Calculate overall metrics
    const overallConfidence = totalEvents > 0
      ? Math.round((approvedEvents / totalEvents) * 100)
      : 0;

    // Calculate schedule variance from S-Curve
    const sCurve = data.sCurve || [];
    const scheduleVariance = sCurve.length > 0
      ? Math.round((sCurve[sCurve.length - 1]?.actual || 0) - (sCurve[sCurve.length - 1]?.planned || 0))
      : 0;

    // Critical path delay calculation
    const criticalPathDelay = Math.max(
      0,
      ...disciplineMetrics.map(d => d.averageDelay)
    );

    // Completion percentage
    const completionPercentage = totalEvents > 0
      ? Math.round(((approvedEvents + rejectedEvents) / totalEvents) * 100)
      : 0;

    return {
      totalEvents,
      approvedEvents,
      rejectedEvents,
      ambiguousEvents,
      overallConfidence,
      scheduleVariance,
      disciplineMetrics,
      criticalPathDelay,
      completionPercentage
    };
  }

  subscribe(callback: (data: AnalyticsData) => void): () => void {
    this.subscribers.add(callback);
    // Send current data if available
    if (this.lastData) {
      callback(this.lastData);
    }
    return () => this.subscribers.delete(callback);
  }

  startPolling(): void {
    if (this.pollingInterval) return;

    console.log('Starting data polling...');
    this.pollingInterval = setInterval(async () => {
      const data = await this.fetchAllAnalytics();
      this.notifySubscribers(data);
    }, this.pollingDelay);

    // Initial fetch
    this.fetchAllAnalytics().then(data => this.notifySubscribers(data));
  }

  stopPolling(): void {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      console.log('Stopped data polling');
    }
  }

  private notifySubscribers(data: AnalyticsData): void {
    this.subscribers.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in subscriber:', error);
      }
    });
  }

  setPollingInterval(ms: number): void {
    this.pollingDelay = ms;
    if (this.pollingInterval) {
      this.stopPolling();
      this.startPolling();
    }
  }
}

function getRiskLevel(delayDays: number): 'LOW' | 'MEDIUM' | 'HIGH' {
  if (delayDays <= 2) return 'LOW';
  if (delayDays <= 7) return 'MEDIUM';
  return 'HIGH';
}

// Singleton instance
export const dataIntegration = new DataIntegrationService();

// React hook for real-time data
export function useAnalyticsData() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    setIsLoading(true);
    const unsubscribe = dataIntegration.subscribe(data => {
      setData(data);
      setIsLoading(false);
    });

    return unsubscribe;
  }, []);

  return { data, isLoading };
}

// React hook for project metrics
export function useProjectMetrics() {
  const { data, isLoading } = useAnalyticsData();
  const [metrics, setMetrics] = React.useState<ProjectMetrics | null>(null);

  React.useEffect(() => {
    if (data) {
      const computed = dataIntegration.computeProjectMetrics(data);
      setMetrics(computed);
    }
  }, [data]);

  return { metrics, isLoading };
}
