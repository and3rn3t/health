/**
 * Hook for fetching developer diagnostics from the Worker.
 * Only usable in non-production environments.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WorkerDiagnostics {
  ok: boolean;
  env: string;
  logSampleRate: string | null;
  logSampleRates: { ws: string | null; clientError: string | null };
  datasets: Record<string, boolean>;
  hasKV: boolean;
  hasR2: boolean;
  hasRateLimiter: boolean;
  now: string;
  endpoints: string[];
}

export interface HealthCheckResult {
  status: string;
  timestamp: string;
  environment: string;
  latencyMs: number;
}

export interface PingResult {
  ok: boolean;
  latencyMs: number;
}

export interface WebSocketProbe {
  reachable: boolean;
  latencyMs: number;
  error: string | null;
}

export interface DiagnosticsState {
  worker: WorkerDiagnostics | null;
  health: HealthCheckResult | null;
  ping: PingResult | null;
  wsProbe: WebSocketProbe | null;
  loading: boolean;
  error: string | null;
  lastRefresh: Date | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getBaseUrl(): string {
  // In dev, hit localhost Worker or production based on env
  if (
    globalThis.location?.hostname === 'localhost' ||
    globalThis.location?.hostname === '127.0.0.1'
  ) {
    return '';
  }
  return '';
}

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`);
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDiagnostics(): DiagnosticsState & {
  refresh: () => Promise<void>;
  pingWorker: () => Promise<PingResult>;
  probeWebSocket: () => Promise<WebSocketProbe>;
} {
  const [state, setState] = useState<DiagnosticsState>({
    worker: null,
    health: null,
    ping: null,
    wsProbe: null,
    loading: false,
    error: null,
    lastRefresh: null,
  });

  const abortRef = useRef<AbortController | null>(null);

  const pingWorker = useCallback(async (): Promise<PingResult> => {
    const base = getBaseUrl();
    const start = performance.now();
    try {
      await fetchJson(`${base}/api/_diagnostics/ping`);
      const latencyMs = Math.round(performance.now() - start);
      const result: PingResult = { ok: true, latencyMs };
      setState((prev) => ({ ...prev, ping: result }));
      return result;
    } catch {
      const latencyMs = Math.round(performance.now() - start);
      const result: PingResult = { ok: false, latencyMs };
      setState((prev) => ({ ...prev, ping: result }));
      return result;
    }
  }, []);

  const probeWebSocket = useCallback(async (): Promise<WebSocketProbe> => {
    const start = performance.now();
    try {
      const base = getBaseUrl();
      const res = await fetchJson<{ url?: string }>(
        `${base}/api/ws-url`
      );
      const latencyMs = Math.round(performance.now() - start);
      const result: WebSocketProbe = {
        reachable: Boolean(res.url),
        latencyMs,
        error: null,
      };
      setState((prev) => ({ ...prev, wsProbe: result }));
      return result;
    } catch (e) {
      const latencyMs = Math.round(performance.now() - start);
      const result: WebSocketProbe = {
        reachable: false,
        latencyMs,
        error: (e as Error).message,
      };
      setState((prev) => ({ ...prev, wsProbe: result }));
      return result;
    }
  }, []);

  const refresh = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    const base = getBaseUrl();

    try {
      // Fetch /health with latency measurement
      const healthStart = performance.now();
      const healthData = await fetchJson<{
        status: string;
        timestamp: string;
        environment: string;
      }>(`${base}/health`);
      const healthLatency = Math.round(performance.now() - healthStart);

      if (controller.signal.aborted) return;

      const health: HealthCheckResult = {
        ...healthData,
        latencyMs: healthLatency,
      };

      // Fetch diagnostics snapshot
      let worker: WorkerDiagnostics | null = null;
      try {
        worker = await fetchJson<WorkerDiagnostics>(
          `${base}/api/_diagnostics`
        );
      } catch {
        // diagnostics endpoint may not be available in prod
      }

      if (controller.signal.aborted) return;

      // Ping
      const ping = await pingWorker();

      if (controller.signal.aborted) return;

      // WebSocket probe
      const wsProbe = await probeWebSocket();

      if (controller.signal.aborted) return;

      setState({
        worker,
        health,
        ping,
        wsProbe,
        loading: false,
        error: null,
        lastRefresh: new Date(),
      });
    } catch (e) {
      if (!controller.signal.aborted) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: (e as Error).message,
        }));
      }
    }
  }, [pingWorker, probeWebSocket]);

  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return { ...state, refresh, pingWorker, probeWebSocket };
}
