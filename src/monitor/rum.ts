/*
 Lightweight Real User Monitoring (RUM) bootstrap
 Captures: LCP, TTFB, hydration, (optional) WebSocket connect latency
 Sends a single payload to /api/_perf_ingest using sendBeacon (fallback fetch)
 Keeps footprint <1KB minified aim; avoid heavy dependencies.
 Allowed metric keys (must match worker ingestion allow‑list): lcp, ttfb, hydration, wsConnect
 */

interface RumMetrics {
  lcp?: number; // ms
  ttfb?: number; // ms
  hydration?: number; // ms
  wsConnect?: number; // ms
  cls?: number; // cumulative layout shift (0-?)
  inp?: number; // interaction to next paint (ms)
}

declare global {
  interface Window {
    __vitalsenseRUM?: boolean;
    __rumHydration?: () => void;
    __APP_VERSION__?: string;
    __RUM_SAMPLE_RATE__?: string;
  }
  // Build-time injected globals via Vite define
  const __APP_VERSION__: string | undefined;
  const __RUM_SAMPLE_RATE__: string | undefined;
}

// Guard against multiple injections
if (!window.__vitalsenseRUM) {
  window.__vitalsenseRUM = true;
  // Sampling
  const sampleRateStr =
    window.__RUM_SAMPLE_RATE__ ||
    (typeof __RUM_SAMPLE_RATE__ !== 'undefined' ? __RUM_SAMPLE_RATE__ : '1');
  let sampleRate = parseFloat(sampleRateStr || '1');
  if (!Number.isFinite(sampleRate) || sampleRate <= 0) sampleRate = 0;
  else if (sampleRate > 1) sampleRate = 1;
  if (Math.random() > sampleRate) {
    window.__vitalsenseRUM = true; // mark to avoid re-init; but abort instrumentation
  } else {
    window.__vitalsenseRUM = true;

    const metrics: RumMetrics = {};
    (async () => {
      try {
        const load = () =>
          import(/* @vite-ignore */ 'web-vitals')
            .then((mod) => {
              try {
                mod.onCLS((v: { value: number }) => {
                  if (v && typeof v.value === 'number')
                    metrics.cls = +v.value.toFixed(4);
                });
              } catch {
                /* ignore CLS */
              }
              try {
                mod.onINP((v: { value: number }) => {
                  if (v && typeof v.value === 'number')
                    metrics.inp = Math.round(v.value);
                });
              } catch {
                /* ignore INP */
              }
            })
            .catch(() => void 0);
        if ('requestIdleCallback' in window) {
          (
            window as unknown as {
              requestIdleCallback?: (cb: () => void) => void;
            }
          ).requestIdleCallback?.(load);
        } else {
          setTimeout(load, 3000);
        }
      } catch {
        /* noop outer */
      }
    })();
    const startTime = performance.now();
    let flushed = false;
    let lcpObserver: PerformanceObserver | undefined;
    let wsTimer: number | undefined;

    function debugLog(..._args: unknown[]) {
      // Uncomment for local debugging
      // console.debug('[RUM]', ..._args);
    }

    // Capture TTFB from navigation timing (only once, early)
    try {
      const nav = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      if (nav && nav.responseStart > 0) {
        metrics.ttfb = Math.round(nav.responseStart - nav.requestStart);
        debugLog('TTFB', metrics.ttfb);
      }
    } catch {
      /* noop */
    }

    // Largest Contentful Paint (LCP)
    try {
      if ('PerformanceObserver' in window) {
        lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const last = entries[entries.length - 1] as PerformanceEntry & {
            startTime?: number;
          };
          if (last && typeof last.startTime === 'number') {
            metrics.lcp = Math.round(last.startTime);
            debugLog('LCP', metrics.lcp);
          }
        });
        // buffered to catch pre-observer LCP if any
        lcpObserver.observe({
          type: 'largest-contentful-paint',
          buffered: true,
        });
        document.addEventListener('visibilitychange', () => {
          if (document.visibilityState === 'hidden') {
            try {
              lcpObserver?.disconnect();
            } catch {
              /* noop */
            }
          }
        });
      }
    } catch {
      /* noop */
    }

    // Hydration marker (called from main.tsx after initial React render frames)
    window.__rumHydration = () => {
      if (metrics.hydration != null) return;
      // Two rAFs to approximate post-paint stable time (very cheap)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          metrics.hydration = Math.round(performance.now() - startTime);
          debugLog('Hydration', metrics.hydration);
        });
      });
    };

    // Optional WebSocket connect latency probe (fire & measure if inexpensive)
    // Skips on non-secure contexts (except localhost) to avoid mixed content issues.
    try {
      const loc = window.location;
      const shouldProbe =
        loc.protocol.startsWith('http') &&
        (loc.hostname === 'localhost' || loc.protocol === 'https:');
      if (shouldProbe && 'WebSocket' in window) {
        const wsUrl =
          (loc.protocol === 'https:' ? 'wss://' : 'ws://') + loc.host + '/ws';
        const wsStart = performance.now();
        let done = false;
        const ws = new WebSocket(wsUrl);
        ws.addEventListener('open', () => {
          if (done) return;
          done = true;
          metrics.wsConnect = Math.round(performance.now() - wsStart);
          debugLog('wsConnect', metrics.wsConnect);
          try {
            ws.close();
          } catch {
            /* noop */
          }
        });
        ws.addEventListener('error', () => {
          if (done) return;
          done = true;
          // Do not record a metric on error (avoid biasing distribution); silently ignore
          try {
            ws.close();
          } catch {
            /* noop */
          }
        });
        // Timeout after 4s
        wsTimer = window.setTimeout(() => {
          if (done) return;
          done = true;
          try {
            ws.close();
          } catch {
            /* noop */
          }
        }, 4000);
      }
    } catch {
      /* noop */
    }

    function flush() {
      if (flushed) return;
      flushed = true;
      try {
        lcpObserver?.disconnect();
      } catch {
        /* noop */
      }
      if (wsTimer) window.clearTimeout(wsTimer);
      // Only send if we collected at least one metric
      if (!Object.keys(metrics).length) return;
      const payload: Record<string, unknown> = {
        v: 1,
        // Attempt to propagate app version if exposed globally (optional)
        appVersion: window.__APP_VERSION__ || undefined,
        metrics: { ...metrics },
      };
      const body = JSON.stringify(payload);
      const url = '/api/_perf_ingest';
      let sent = false;
      try {
        if ('sendBeacon' in navigator) {
          sent = navigator.sendBeacon(url, body);
        }
      } catch {
        /* noop */
      }
      if (!sent) {
        try {
          fetch(url, {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body,
            keepalive: true,
          }).catch(() => void 0);
        } catch {
          /* noop */
        }
      }
    }

    // Flush heuristics: pagehide/visibility, fallback timeout
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') flush();
    });
    // Absolute latest flush (10s) to ensure we report even on long sessions
    setTimeout(flush, 10000);
  }
}

export {}; // Treat as a module
