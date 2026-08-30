// Real-time data hook for components
import { useEffect, useRef } from 'react';
import { dataIntegration } from '../lib/dataIntegration';

export function useRealTimeDataPolling(enabled = true) {
  const pollingStartedRef = useRef(false);

  useEffect(() => {
    if (!enabled || pollingStartedRef.current) return;

    pollingStartedRef.current = true;
    dataIntegration.startPolling();

    return () => {
      // Don't stop polling on unmount - keep it running for other components
    };
  }, [enabled]);
}

export function useDataRefresh(intervalMs = 5000) {
  useEffect(() => {
    dataIntegration.setPollingInterval(intervalMs);
  }, [intervalMs]);
}
