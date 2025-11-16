import { MicroCoachToasts } from '@/components/coaching/MicroCoachToasts';
import {
  loadStreakState,
  updateDailyMetrics,
  type StreakState,
} from '@/lib/coaching/streaks';
import { WebSocketClient } from '@/lib/websocketClient';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppWsContext, type AppWsContextValue } from './AppWebSocketContext';

const COACHING_KEY = 'vs_coaching_enabled_v1';

function usePersistedCoaching(): [boolean, (v: boolean) => void] {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem(COACHING_KEY);
      if (raw === '0') return false;
      if (raw === '1') return true;
    } catch {
      /* noop */
    }
    return true;
  });
  const update = useCallback((v: boolean) => {
    setEnabled(v);
    try {
      localStorage.setItem(COACHING_KEY, v ? '1' : '0');
    } catch {
      /* noop */
    }
  }, []);
  return [enabled, update];
}

export const AppWebSocketProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [coachingEnabled, setCoachingEnabled] = usePersistedCoaching();
  const [streaks, setStreaks] = useState<StreakState>(() => loadStreakState());
  const metricsRef = useRef<Record<string, number>>({});
  // metricsRef drives derived state; no forced re-render currently needed

  // Establish a single resilient WS connection lazily after first mount (or visibility)
  useEffect(() => {
    let cancelled = false;
    const connect = async () => {
      const cfg =
        (typeof window !== 'undefined'
          ? (window as any).__VITALSENSE_CONFIG__
          : null) || null;
      const wsUrl: string | undefined =
        (cfg && typeof cfg.wsBaseUrl === 'string' && cfg.wsBaseUrl) || undefined;

      const c = new WebSocketClient({
        url: wsUrl, // Fallback to /api/ws-url if undefined
        onOpen: () => {
          /* noop */
        },
        onClose: () => {
          /* noop */
        },
        onPong: () => {
          /* noop */
        },
      });
      setClient(c);
      await c.open().catch(() => void 0);
      // Grab underlying internal socket (private) – acceptable internal access; fallback to message subscription if fails
      try {
        const raw = (c as any).ws as WebSocket | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
        if (!cancelled && raw) setSocket(raw);
        const lidarEnabled = (() => {
          try {
            const ls = localStorage.getItem('vs_lidar_enabled');
            if (ls === '0') return false;
          } catch {
            /* noop */
          }
          // Vite env exposure
          if (import.meta.env && import.meta.env.VITE_ENABLE_LIDAR === 'false')
            return false;
          return true;
        })();

        function handleMetricLike(obj: any) {
          // eslint-disable-line @typescript-eslint/no-explicit-any
          if (
            obj &&
            typeof obj.metric === 'string' &&
            typeof obj.value === 'number'
          ) {
            metricsRef.current[obj.metric] = obj.value;
          }
        }
        function handleHealthBatch(obj: any) {
          // eslint-disable-line @typescript-eslint/no-explicit-any
          if (Array.isArray(obj.items)) {
            for (const it of obj.items) handleMetricLike(it);
          }
        }
        function handleLidar(obj: any) {
          // eslint-disable-line @typescript-eslint/no-explicit-any
          if (!lidarEnabled) return;
          const copyKeys = [
            'obstacle_distance_min',
            'lateral_deviation_mean',
            'surface_roughness',
            'stride_length_var',
            'elevation_change_rate',
          ];
          for (const k of copyKeys) {
            const v = obj[k];
            if (typeof v === 'number') metricsRef.current[k] = v;
          }
        }
        if (raw) {
          raw.addEventListener('message', (ev) => {
            let data: any; // eslint-disable-line @typescript-eslint/no-explicit-any
            try {
              data = JSON.parse(ev.data);
            } catch {
              return;
            }
            if (!data || typeof data !== 'object') return;
            if (data.metric) handleMetricLike(data);
            else if (data.type === 'health_batch') handleHealthBatch(data);
            else if (data.type === 'lidar_metrics') handleLidar(data);
          });
        }
      } catch {
        /* noop */
      }
    };
    void connect();
    return () => {
      cancelled = true;
    };
  }, []);

  // Daily streak update trigger (simple heuristic using last metrics snapshot at first load or date rollover)
  useEffect(() => {
    const applyDaily = () => {
      const postureAngle = metricsRef.current['posture_angle'];
      const instabilityIndex = metricsRef.current['instability_index'];
      const postureOk =
        typeof postureAngle === 'number' ? postureAngle < 8 : false; // under warn threshold
      const instabilityOk =
        typeof instabilityIndex === 'number' ? instabilityIndex < 1.5 : false;
      const updated = updateDailyMetrics({ postureOk, instabilityOk });
      setStreaks(updated);
    };
    // Run once shortly after mount
    const t = setTimeout(applyDaily, 4000);
    // Midnight rollover check
    const interval = setInterval(() => {
      const today = new Date().toISOString().slice(0, 10);
      if (streaks.lastUpdated !== today) applyDaily();
    }, 60_000 * 15); // every 15 minutes
    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, [streaks.lastUpdated]);

  const refreshStreaks = useCallback(() => {
    setStreaks(loadStreakState());
  }, []);

  const value: AppWsContextValue = useMemo(
    () => ({
      client,
      socket,
      coachingEnabled,
      setCoachingEnabled,
      lastMetrics: metricsRef.current,
      streaks,
      refreshStreaks,
    }),
    [
      client,
      socket,
      coachingEnabled,
      setCoachingEnabled,
      streaks,
      refreshStreaks,
    ]
  );

  return (
    <AppWsContext.Provider value={value}>
      {children}
      {coachingEnabled && socket && <MicroCoachToasts ws={socket} />}
    </AppWsContext.Provider>
  );
};

// Hook moved to separate file to satisfy fast-refresh rules.
