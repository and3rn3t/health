import {
  TelemetryEvent,
  getNormalizationStats,
  getTelemetryBuffer,
  subscribeTelemetry,
} from '@/lib/telemetry';
import { useEffect, useRef, useState } from 'react';

export interface UseTelemetryOptions {
  filter?: string; // event name filter
  limit?: number; // max events kept in state
  includeNormalizationStats?: boolean;
  refreshIntervalMs?: number; // polling for stats (since stats not push-driven)
}

interface TelemetryState {
  events: TelemetryEvent[];
  normalizationStats?: ReturnType<typeof getNormalizationStats> | null;
}

export function useTelemetry(
  options: UseTelemetryOptions = {}
): TelemetryState {
  const {
    filter,
    limit = 50,
    includeNormalizationStats,
    refreshIntervalMs = 5000,
  } = options;
  const [state, setState] = useState<TelemetryState>(() => ({
    events: prune(getTelemetryBuffer(filter), limit),
    normalizationStats: includeNormalizationStats
      ? getNormalizationStats()
      : undefined,
  }));
  const filterRef = useRef(filter);
  filterRef.current = filter;

  useEffect(() => {
    const unsubscribe = subscribeTelemetry((evt) => {
      if (filterRef.current && evt.name !== filterRef.current) return;
      setState((prev) => {
        const events = prune([...prev.events, evt], limit);
        return { ...prev, events };
      });
    });
    return unsubscribe;
  }, [limit]);

  useEffect(() => {
    if (!includeNormalizationStats) return;
    const interval = setInterval(() => {
      setState((prev) => ({
        ...prev,
        normalizationStats: getNormalizationStats(),
      }));
    }, refreshIntervalMs);
    return () => clearInterval(interval);
  }, [includeNormalizationStats, refreshIntervalMs]);

  // Re-seed events list when filter changes
  useEffect(() => {
    setState((prev) => ({
      ...prev,
      events: prune(getTelemetryBuffer(filter), limit),
    }));
  }, [filter, limit]);

  return state;
}

function prune(events: TelemetryEvent[], limit: number): TelemetryEvent[] {
  if (events.length <= limit) return events;
  return events.slice(events.length - limit);
}

export function useNormalizationCacheStats(intervalMs = 5000) {
  const [stats, setStats] = useState(() => getNormalizationStats());
  useEffect(() => {
    const id = setInterval(() => {
      setStats(getNormalizationStats());
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return stats;
}
