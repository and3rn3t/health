import { FALL_RISK_ANALYTICS_VERSION } from '@/lib/fallRiskConfig';
import { GAIT_ANALYTICS_VERSION } from '@/lib/gaitConfig';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useOnceToast } from './useOnceToast';

export interface AnalyticsVersionInfo {
  gait: { local: string; remote: string | null; inSync: boolean };
  fallRisk: { local: string; remote: string | null; inSync: boolean };
  lastChecked: Date | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export interface UseAnalyticsVersionMonitorOptions {
  /** Poll interval in ms (default 5 minutes). Set 0/undefined to disable auto polling. */
  intervalMs?: number;
  /** Custom fetch implementation (e.g., for tests). */
  fetchImpl?: typeof fetch;
  /** Path to metadata endpoint (default '/ws'). */
  path?: string;
  /** Max mismatch ingestion events per browser session (default 1). */
  maxIngestEventsPerSession?: number;
  /** Probability (0-1) of sending ingestion event when mismatch first detected (default 1). */
  ingestionSampleRate?: number;
}

export function useAnalyticsVersionMonitor(
  opts: UseAnalyticsVersionMonitorOptions = {}
): AnalyticsVersionInfo {
  const { showOnce } = useOnceToast();
  const {
    intervalMs = 300_000,
    fetchImpl = fetch,
    path = '/ws',
    maxIngestEventsPerSession = 1,
    ingestionSampleRate = 1,
  } = opts;
  const [gaitRemote, setGaitRemote] = useState<string | null>(null);
  const [fallRemote, setFallRemote] = useState<string | null>(null);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);
  const notifiedRef = useRef<boolean>(false);
  const ingestCountRef = useRef<number>(0);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Try /ws metadata first
      interface RemoteVersions {
        gait?: string;
        fallRisk?: string;
      }
      let av: RemoteVersions | null = null;
      // Will hold potentially overridden sample rate from diagnostics (defaults to provided ingestionSampleRate)
      let effectiveSampleRate = ingestionSampleRate;
      try {
        const res = await fetchImpl(path, { method: 'GET' });
        if (!res.ok) throw new Error(`ws status ${res.status}`);
        const data = (await res.json().catch(() => ({}))) as Record<
          string,
          unknown
        >;
        const raw =
          data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : {};
        const meta = raw['analyticsVersions'];
        if (meta && typeof meta === 'object') {
          const mv = meta as Record<string, unknown>;
          av = {
            gait: typeof mv.gait === 'string' ? (mv.gait as string) : undefined,
            fallRisk:
              typeof mv.fallRisk === 'string'
                ? (mv.fallRisk as string)
                : undefined,
          };
        }
      } catch {
        /* swallow and fallback */
      }

      // 2. Fallback to consolidated REST endpoint if needed
      if (!av) {
        try {
          const alt = await fetchImpl('/api/analytics-config-versions', {
            method: 'GET',
          });
          if (alt.ok) {
            const json = (await alt.json().catch(() => ({}))) as Record<
              string,
              unknown
            >;
            const gaitObj =
              json.gait && typeof json.gait === 'object'
                ? (json.gait as Record<string, unknown>)
                : undefined;
            const fallObj =
              json.fallRisk && typeof json.fallRisk === 'object'
                ? (json.fallRisk as Record<string, unknown>)
                : undefined;
            const gaitVersion =
              gaitObj && typeof gaitObj.version === 'string'
                ? (gaitObj.version as string)
                : undefined;
            const fallVersion =
              fallObj && typeof fallObj.version === 'string'
                ? (fallObj.version as string)
                : undefined;
            av = {
              gait: typeof gaitVersion === 'string' ? gaitVersion : undefined,
              fallRisk:
                typeof fallVersion === 'string' ? fallVersion : undefined,
            };
          }
        } catch {
          /* ignore */
        }
      }

      // 3. (Best-effort) discover environment suggested sampling rate via diagnostics
      if (effectiveSampleRate === 1) {
        try {
          const diag = await fetchImpl('/api/_diagnostics', { method: 'GET' });
          if (diag.ok) {
            const dj = (await diag.json().catch(() => ({}))) as Record<
              string,
              unknown
            >;
            const avm =
              dj && typeof dj === 'object'
                ? (dj as Record<string, unknown>)['analyticsVersionMismatch']
                : undefined;
            if (avm && typeof avm === 'object') {
              const rate = (avm as Record<string, unknown>).clientSampleRate;
              if (typeof rate === 'string') {
                const parsed = parseFloat(rate);
                if (!Number.isNaN(parsed) && parsed > 0 && parsed <= 1) {
                  effectiveSampleRate = parsed;
                }
              }
            }
          }
        } catch {
          /* ignore diagnostics sampling errors */
        }
      }

      setGaitRemote(typeof av?.gait === 'string' ? av.gait : null);
      setFallRemote(typeof av?.fallRisk === 'string' ? av.fallRisk : null);
      setLastChecked(new Date());
      // Expose in global for instrumentation
      try {
        (window as unknown as Record<string, unknown>).__ANALYTICS_VERSIONS__ =
          {
            gait: { local: GAIT_ANALYTICS_VERSION, remote: av?.gait || null },
            fallRisk: {
              local: FALL_RISK_ANALYTICS_VERSION,
              remote: av?.fallRisk || null,
            },
            fetchedAt: Date.now(),
            source: av
              ? av.gait || av.fallRisk
                ? 'ws_or_fallback'
                : 'none'
              : 'none',
          };
      } catch {
        /* ignore */
      }
      const mismatch = Boolean(
        av &&
          ((av.gait && av.gait !== GAIT_ANALYTICS_VERSION) ||
            (av.fallRisk && av.fallRisk !== FALL_RISK_ANALYTICS_VERSION))
      );
      if (mismatch) {
        // Double-guard: instance ref + global once guard to avoid any loop
        if (!notifiedRef.current) {
          notifiedRef.current = true;
          showOnce(
            'analytics-config-mismatch',
            'warning',
            'Analytics config mismatch detected. Refresh recommended.'
          );
        }
        // Sampling + cap logic
        if (
          ingestCountRef.current < maxIngestEventsPerSession &&
          (crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) < effectiveSampleRate
        ) {
          ingestCountRef.current += 1;
          try {
            const payload = {
              gaitLocal: GAIT_ANALYTICS_VERSION,
              gaitRemote: av?.gait || null,
              fallLocal: FALL_RISK_ANALYTICS_VERSION,
              fallRemote: av?.fallRisk || null,
              ts: new Date().toISOString(),
              sample: effectiveSampleRate,
              seq: ingestCountRef.current,
            };
            fetch('/api/client-analytics/version-mismatch', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(payload),
            }).catch(() => void 0);
          } catch {
            /* ignore */
          }
        }
      }
      if (!av) {
        throw new Error('metadata unavailable');
      }
    } catch (e) {
      setError((e as Error).message);
      setGaitRemote(null);
      setFallRemote(null);
    } finally {
      setLoading(false);
    }
  }, [fetchImpl, path, ingestionSampleRate, maxIngestEventsPerSession]);

  useEffect(() => {
    // initial fetch
    refresh();
    if (intervalMs && intervalMs > 0) {
      timerRef.current = window.setInterval(refresh, intervalMs);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [intervalMs, refresh]);

  return {
    gait: {
      local: GAIT_ANALYTICS_VERSION,
      remote: gaitRemote,
      inSync:
        gaitRemote === null ? true : gaitRemote === GAIT_ANALYTICS_VERSION,
    },
    fallRisk: {
      local: FALL_RISK_ANALYTICS_VERSION,
      remote: fallRemote,
      inSync:
        fallRemote === null ? true : fallRemote === FALL_RISK_ANALYTICS_VERSION,
    },
    lastChecked,
    loading,
    error,
    refresh,
  };
}

export default useAnalyticsVersionMonitor;
