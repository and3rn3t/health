import { WebSocketClient } from '@/lib/websocketClient';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { AppWsContext, type AppWsContextValue } from './AppWebSocketContext';

export const AppWebSocketProvider: React.FC<React.PropsWithChildren> = ({
  children,
}) => {
  const [client, setClient] = useState<WebSocketClient | null>(null);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [coachingEnabled, setCoachingEnabled] = useState(false);
  const metricsRef = useRef<Record<string, number>>({});
  // metricsRef drives derived state; no forced re-render currently needed

  // Establish a single resilient WS connection lazily after first mount (or visibility)
  useEffect(() => {
    let cancelled = false;
    const connect = async () => {
      // Check if WebSocket is disabled via window flags
      if (
        typeof window !== 'undefined' &&
        ((window as any).VITALSENSE_DISABLE_WEBSOCKET ||
          (window as any).VITALSENSE_LIVE_DISABLED)
      ) {
        return; // Skip WebSocket connection
      }

      const cfg =
        (typeof window !== 'undefined'
          ? (window as any).__VITALSENSE_CONFIG__
          : null) || null;
      const wsUrl: string | undefined =
        (cfg && typeof cfg.wsBaseUrl === 'string' && cfg.wsBaseUrl) || undefined;

      // Check if auth is required but not enabled
      const authRequired =
        cfg?.features?.enableAuth !== false &&
        cfg?.auth0?.domain &&
        cfg.auth0.domain !== 'vitalsense-health.auth0.com' &&
        cfg.auth0.clientId &&
        cfg.auth0.clientId !== 'your-client-id';

      // If auth is required, check if we're authenticated
      // For now, we'll still try to connect but the retry limit will prevent infinite loops
      const c = new WebSocketClient({
        url: wsUrl, // Fallback to /api/ws-url if undefined
        maxBackoffMs: 30000, // Cap backoff at 30 seconds
        baseBackoffMs: 2000, // Start with 2 second backoff
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

  const value: AppWsContextValue = useMemo(
    () => ({
      client,
      socket,
      lastMetrics: metricsRef.current,
    }),
    [
      client,
      socket,
      coachingEnabled,
      setCoachingEnabled,
    ]
  );

  return (
    <AppWsContext.Provider value={value}>
      {children}
    </AppWsContext.Provider>
  );
};

// Hook moved to separate file to satisfy fast-refresh rules.
