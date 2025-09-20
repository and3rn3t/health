import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WebSocketClient } from '@/lib/websocketClient';
import {
  Activity,
  AlertTriangle,
  Bug,
  CloudUpload,
  Copy,
  Cpu,
  Database,
  FileText,
  Gauge,
  Globe,
  Network,
  Shield,
  Terminal,
  Wifi,
  Wrench,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type Diagnostics = {
  ok: boolean;
  env: string;
  logSampleRate: string | null;
  logSampleRates?: {
    ws: string | null;
    clientError: string | null;
  };
  datasets: {
    ANALYTICS: boolean;
    HEALTH_ANALYTICS: boolean;
    PERFORMANCE_ANALYTICS: boolean;
    SECURITY_ANALYTICS: boolean;
  };
  hasKV: boolean;
  hasR2: boolean;
  hasRateLimiter: boolean;
  now: string;
  endpoints: string[];
  analyticsVersionMismatch?: {
    recentEventCount: number;
    maxStored: number;
    clientSampleRate: string;
  };
};

export default function DevDiagnostics() {
  const [diag, setDiag] = useState<Diagnostics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  type PingResult = {
    ok: boolean;
    dataset: string | null;
    correlationId?: string;
    env?: string;
    error?: string;
  };
  type ErrorProbe = { status: number; correlationId?: string; error?: string };
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [errorResult, setErrorResult] = useState<ErrorProbe | null>(null);
  const [healthStatus, setHealthStatus] = useState<{
    status: number;
    ok: boolean;
  } | null>(null);
  const [rateLimit, setRateLimit] = useState<{
    ok: boolean;
    remaining?: number | null;
    error?: string;
  } | null>(null);
  const [copied, setCopied] = useState<{
    ping?: boolean;
    error?: boolean;
    tailDev?: boolean;
    tailProd?: boolean;
    vmjson?: boolean;
  }>({});
  const [copiedEndpoint, setCopiedEndpoint] = useState<string | null>(null);
  // Version mismatch debug events
  type VersionMismatchEvent = {
    ts: string;
    gaitLocal: string | null;
    gaitRemote: string | null;
    fallLocal: string | null;
    fallRemote: string | null;
    sample?: number;
    seq?: number;
  };
  const [vmEvents, setVmEvents] = useState<VersionMismatchEvent[] | null>(null);
  const [vmLoading, setVmLoading] = useState(false);
  const [vmError, setVmError] = useState<string | null>(null);
  // Filter: all | gait | fall
  const [vmFilter, setVmFilter] = useState<'all' | 'gait' | 'fall'>('all');
  // Persist vmFilter in localStorage for convenience
  useEffect(() => {
    const stored = localStorage.getItem('vs_vmFilter');
    if (stored === 'all' || stored === 'gait' || stored === 'fall') {
      setVmFilter(stored);
    }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem('vs_vmFilter', vmFilter);
    } catch {
      /* ignore */
    }
  }, [vmFilter]);
  const filteredVmEvents = useMemo(() => {
    if (!vmEvents) return null;
    if (vmFilter === 'all') return vmEvents;
    return vmEvents.filter((e) => {
      if (vmFilter === 'gait') {
        return !!e.gaitLocal && !!e.gaitRemote && e.gaitLocal !== e.gaitRemote;
      }
      if (vmFilter === 'fall') {
        return !!e.fallLocal && !!e.fallRemote && e.fallLocal !== e.fallRemote;
      }
      return true;
    });
  }, [vmEvents, vmFilter]);
  const vmCounts = useMemo(() => {
    const base = { all: vmEvents?.length || 0, gait: 0, fall: 0 };
    if (!vmEvents) return base;
    for (const e of vmEvents) {
      if (e.gaitLocal && e.gaitRemote && e.gaitLocal !== e.gaitRemote)
        base.gait++;
      if (e.fallLocal && e.fallRemote && e.fallLocal !== e.fallRemote)
        base.fall++;
    }
    return base;
  }, [vmEvents]);
  // Lightweight sparkline data (counts per 2s bucket over the last 60s of filtered events)
  interface SparkBucket {
    total: number;
    gait: number;
    fall: number;
    both: number; // events that have both mismatches simultaneously
  }
  const vmSparklineBuckets = useMemo(() => {
    if (!filteredVmEvents) return [] as SparkBucket[];
    const now = Date.now();
    const windowMs = 60_000;
    const bucketMs = 2_000;
    const bucketCount = Math.ceil(windowMs / bucketMs);
    const buckets: SparkBucket[] = Array(bucketCount)
      .fill(0)
      .map(() => ({ total: 0, gait: 0, fall: 0, both: 0 }));
    for (const e of filteredVmEvents) {
      const age = now - Date.parse(e.ts);
      if (age < 0 || age > windowMs) continue;
      const idx = bucketCount - 1 - Math.floor(age / bucketMs);
      if (idx < 0 || idx >= bucketCount) continue;
      const gait = e.gaitLocal && e.gaitRemote && e.gaitLocal !== e.gaitRemote;
      const fall = e.fallLocal && e.fallRemote && e.fallLocal !== e.fallRemote;
      buckets[idx].total++;
      if (gait && fall) buckets[idx].both++;
      else if (gait) buckets[idx].gait++;
      else if (fall) buckets[idx].fall++;
    }
    return buckets;
  }, [filteredVmEvents]);
  const sparklineSvg = useMemo(() => {
    if (!vmSparklineBuckets.length) return null;
    const max = Math.max(...vmSparklineBuckets.map((b) => b.total), 1);
    const w = vmSparklineBuckets.length * 3; // 3px per bucket
    const h = 20;
    const title = vmSparklineBuckets
      .map((b, i) => {
        if (!b.total) return null;
        return `${i}: T${b.total}/G${b.gait}/F${b.fall}/B${b.both}`;
      })
      .filter(Boolean)
      .join(' | ');
    return (
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        className="ml-2 opacity-80"
        aria-label="Mismatch events sparkline"
        role="img"
      >
        <title>{`Last 60s buckets (oldest→newest). ${title}`}</title>
        {vmSparklineBuckets.map((b, i) => {
          if (!b.total) return null;
          const x = i * 3 + 0.5;
          // Stacked tiny bar: both at top, then gait, then fall
          let cursorY = h - 1;
          const segment = (count: number, cls: string) => {
            if (!count) return null;
            const segH = Math.max(1, Math.round((count / max) * (h - 2)));
            cursorY -= segH;
            return (
              <rect
                key={cls}
                x={x}
                y={cursorY}
                width={2}
                height={segH}
                className={cls}
                rx={0.5}
              />
            );
          };
          return (
            <g key={i}>
              {segment(b.fall, 'fill-rose-500')}
              {segment(b.gait, 'fill-sky-500')}
              {segment(b.both, 'fill-amber-500')}
            </g>
          );
        })}
        <rect
          x={0}
          y={0}
          width={w}
          height={h}
          className="stroke-border/30 pointer-events-none"
          fill="none"
        />
      </svg>
    );
  }, [vmSparklineBuckets]);
  const formatRelativeSec = (iso: string) => {
    const ageMs = Date.now() - Date.parse(iso);
    if (!isFinite(ageMs) || ageMs < 0) return '—';
    const s = Math.floor(ageMs / 1000);
    if (s < 60) return `${s}s ago`;
    const m = Math.floor(s / 60);
    if (m < 60) return `${m}m ${s % 60}s ago`;
    const h = Math.floor(m / 60);
    return `${h}h ${m % 60}m ago`;
  };
  const onFetchVmEvents = useCallback(async () => {
    setVmLoading(true);
    setVmError(null);
    try {
      const res = await fetch('/api/_debug/version-mismatch-events', {
        headers: { 'cache-control': 'no-store' },
      });
      type VmResponse = {
        ok: boolean;
        events?: VersionMismatchEvent[];
        error?: string;
      };
      const json = (await res
        .json()
        .catch(() => ({ ok: false, error: 'invalid_json' }))) as VmResponse;
      if (!res.ok || !json.ok) {
        throw new Error(json.error || `status_${res.status}`);
      }
      const events = json.events || [];
      setVmEvents(events);
    } catch (e) {
      setVmError((e as Error).message);
      setVmEvents(null);
    } finally {
      setVmLoading(false);
    }
  }, []);

  // WebSocket quick test state
  const wsRef = useRef<WebSocketClient | null>(null);
  const [wsStatus, setWsStatus] = useState<
    'idle' | 'connecting' | 'open' | 'retrying' | 'closed'
  >('idle');
  const [wsLastEvent, setWsLastEvent] = useState<string>('—');
  const [wsLastRtt, setWsLastRtt] = useState<number | null>(null);
  const wsLastPingAtRef = useRef<number | null>(null);
  const onWsConnect = useCallback(async () => {
    if (wsRef.current) wsRef.current.close(1000, 'reconnect');
    setWsStatus('connecting');
    const client = new WebSocketClient({
      onOpen: () => setWsStatus('open'),
      onClose: () => setWsStatus('closed'),
      onRetry: () => setWsStatus('retrying'),
      onError: () => setWsStatus('closed'),
      onPong: (rtt) => setWsLastRtt(rtt),
    });
    wsRef.current = client;
    await client.open().catch(() => setWsStatus('closed'));
    setWsLastEvent('connect_start');
  }, []);
  const onWsDisconnect = useCallback(() => {
    wsRef.current?.close(1000, 'user');
    setWsStatus('closed');
    setWsLastEvent('close');
  }, []);
  const onWsPing = useCallback(() => {
    wsLastPingAtRef.current = Date.now();
    const ok =
      wsRef.current?.send({ type: 'ping', data: { t: Date.now() } }) ?? false;
    if (!ok) setWsLastEvent('ping_failed');
  }, []);

  // WebSocket config fetch state (server-provided)
  const [wsInfo, setWsInfo] = useState<{
    url?: string;
    fallback?: string;
    live?: boolean;
    userId?: string;
    token?: string;
    error?: string;
  } | null>(null);
  const onFetchWsInfo = useCallback(async () => {
    try {
      const [u, e, sub, tok] = await Promise.all([
        fetch('/api/ws-url', { headers: { 'cache-control': 'no-store' } })
          .then((r) => r.json<{ url?: string; fallback?: string }>())
          .catch(() => ({ url: undefined, fallback: undefined })),
        fetch('/api/ws-live-enabled', {
          headers: { 'cache-control': 'no-store' },
        })
          .then((r) => r.json<{ enabled?: boolean }>())
          .catch(() => ({ enabled: undefined })),
        fetch('/api/ws-user-id', { headers: { 'cache-control': 'no-store' } })
          .then((r) => r.json<{ userId?: string }>())
          .catch(() => ({ userId: undefined })),
        fetch('/api/ws-device-token', {
          headers: { 'cache-control': 'no-store' },
        })
          .then((r) => r.json<{ token?: string }>())
          .catch(() => ({ token: undefined })),
      ]);
      const token = tok.token || undefined;
      const masked = token
        ? `${token.slice(0, 6)}…${token.slice(-4)}`
        : undefined;
      setWsInfo({
        url: u.url,
        fallback: u.fallback,
        live: e.enabled,
        userId: sub.userId,
        token: masked,
      });
    } catch (err) {
      setWsInfo({ error: (err as Error).message });
    }
  }, []);

  // Audit events state
  type AuditEvent = { key: string; line?: string };
  const [auditState, setAuditState] = useState<
    | { ok: true; count: number; events: AuditEvent[] }
    | { ok: false; error: string }
    | null
  >(null);
  const onFetchAudit = useCallback(async () => {
    try {
      const res = await fetch('/api/_audit?limit=10&withBodies=1', {
        headers: { 'cache-control': 'no-store' },
      });
      const json:
        | { ok: true; count: number; events: AuditEvent[] }
        | { ok: false; error: string } = await res.json();
      setAuditState(json);
    } catch (e) {
      setAuditState({ ok: false, error: (e as Error).message });
    }
  }, []);

  // Client error telemetry test
  const [clientErr, setClientErr] = useState<
    { ok: true; correlationId?: string } | { ok: false; error: string } | null
  >(null);
  const onSendClientError = useCallback(async () => {
    try {
      const body = {
        message: 'Synthetic test error from DevDiagnostics',
        source: 'console.error',
        route: location.pathname,
        ua: navigator.userAgent,
        stack: 'synthetic_stack',
        meta: { visibility: document.visibilityState },
      } as const;
      const res = await fetch('/api/client-error', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'cache-control': 'no-store',
        },
        body: JSON.stringify(body),
      });
      const json: { ok?: boolean; correlationId?: string; error?: string } =
        await res.json();
      if (json.ok) {
        setClientErr({ ok: true, correlationId: json.correlationId });
      } else if ('error' in json) {
        setClientErr({ ok: false, error: json.error || 'failed' });
      } else {
        setClientErr({ ok: false, error: 'failed' });
      }
    } catch (e) {
      setClientErr({ ok: false, error: (e as Error).message });
    }
  }, []);

  // Auth0 health checks
  const [auth0Health, setAuth0Health] = useState<{
    api?: number;
    route?: number;
    error?: string;
  } | null>(null);
  const onAuth0Health = useCallback(async () => {
    try {
      const [apiRes, routeRes] = await Promise.all([
        fetch('/api/auth0/health', { headers: { 'cache-control': 'no-store' } })
          .then((r) => r.status)
          .catch(() => 0),
        fetch('/auth0/health', { headers: { 'cache-control': 'no-store' } })
          .then((r) => r.status)
          .catch(() => 0),
      ]);
      setAuth0Health({ api: apiRes, route: routeRes });
    } catch (e) {
      setAuth0Health({ error: (e as Error).message });
    }
  }, []);

  // Browser & Network info (local-only)
  const browserInfo = useMemo(() => {
    type NetworkInformation = {
      effectiveType?: string;
      downlink?: number;
      rtt?: number;
      saveData?: boolean;
    };
    const n = navigator as Navigator & {
      connection?: NetworkInformation;
      mozConnection?: NetworkInformation;
      webkitConnection?: NetworkInformation;
    };
    const conn: NetworkInformation | undefined =
      n.connection || n.mozConnection || n.webkitConnection;
    const kvMode = (
      globalThis as { __VITALSENSE_KV_MODE?: 'local' | 'network' }
    ).__VITALSENSE_KV_MODE;
    const devMem = (navigator as Navigator & { deviceMemory?: number })
      .deviceMemory;
    const navUA = navigator as Navigator & {
      userAgentData?: { platform?: string };
      platform?: string;
    };
    const platform = navUA.userAgentData?.platform ?? navUA.platform ?? '—';
    return {
      ua: navigator.userAgent,
      lang: navigator.language,
      platform,
      hw: navigator.hardwareConcurrency,
      mem: devMem,
      tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
      conn: conn
        ? {
            type: conn.effectiveType,
            down: conn.downlink,
            rtt: conn.rtt,
            save: conn.saveData,
          }
        : undefined,
      kvMode,
    } as const;
  }, []);

  const loadDiagnostics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/_diagnostics', {
        headers: { 'cache-control': 'no-store' },
      });
      const json: unknown = await res.json();
      if (!res.ok)
        throw new Error(
          (json as { error?: string })?.error || 'diagnostics_failed'
        );
      setDiag(json as Diagnostics);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadDiagnostics();
  }, [loadDiagnostics]);

  const onPingAnalytics = useCallback(async () => {
    try {
      const res = await fetch('/api/_analytics_ping', {
        headers: { 'cache-control': 'no-store' },
      });
      const json: unknown = await res.json();
      const data = json as PingResult;
      setPingResult(data);
    } catch (e) {
      setPingResult({ ok: false, dataset: null, error: (e as Error).message });
    }
  }, []);

  const onTriggerError = useCallback(async () => {
    try {
      const res = await fetch('/api/_error');
      // In dev, this should be a 500 with JSON body from error handler
      const json: unknown = await res.json().catch(() => ({}));
      const data = json as { correlationId?: string; error?: string };
      setErrorResult({
        status: res.status,
        correlationId: data?.correlationId,
        error: data?.error,
      });
    } catch (e) {
      setErrorResult({ status: 0, error: (e as Error).message });
    }
  }, []);

  const onHealth = useCallback(async () => {
    try {
      const res = await fetch('/health', {
        headers: { 'cache-control': 'no-store' },
      });
      setHealthStatus({ status: res.status, ok: res.ok });
    } catch {
      setHealthStatus({ status: 0, ok: false });
    }
  }, []);

  const onRateLimitProbe = useCallback(async () => {
    try {
      const res = await fetch('/api/_ratelimit');
      const json: unknown = await res.json();
      const data = json as {
        ok: boolean;
        remaining?: number | null;
        error?: string;
      };
      setRateLimit(data);
    } catch (e) {
      setRateLimit({ ok: false, error: (e as Error).message });
    }
  }, []);

  const datasetBadges = useMemo(() => {
    if (!diag) return null;
    const entries = Object.entries(diag.datasets);
    return (
      <div className="flex flex-wrap gap-2">
        {entries.map(([k, v]) => (
          <Badge key={k} variant={v ? 'default' : 'secondary'}>
            {k}
            {v ? '' : ' (none)'}
          </Badge>
        ))}
      </div>
    );
  }, [diag]);

  const renderBool = (label: string, value?: boolean) => {
    if (loading) return '—';
    return value ? 'Yes' : 'No';
  };

  const doCopy = useCallback(async (text: string, key: keyof typeof copied) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          // Deprecated execCommand fallback removed; use Selection API
          const ok = document.getSelection()?.toString() === text;
          if (!ok) {
            console.warn('Clipboard fallback may not have copied as expected');
          }
        } finally {
          document.body.removeChild(ta);
        }
      }
      setCopied((s) => ({ ...s, [key]: true }));
      setTimeout(() => setCopied((s) => ({ ...s, [key]: false })), 1500);
    } catch {
      // best-effort
    }
  }, []);

  const copyEndpoint = useCallback(async (endpoint: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(endpoint);
      } else {
        const ta = document.createElement('textarea');
        ta.value = endpoint;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        try {
          // Deprecated execCommand fallback removed; use Selection API
          const ok = document.getSelection()?.toString() === endpoint;
          if (!ok) {
            console.warn('Clipboard fallback may not have copied as expected');
          }
        } finally {
          document.body.removeChild(ta);
        }
      }
      setCopiedEndpoint(endpoint);
      setTimeout(() => setCopiedEndpoint(null), 1500);
    } catch {
      // best-effort
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <Bug className="text-primary h-6 w-6" />
            Dev Diagnostics
          </h2>
          <p className="text-muted-foreground">
            Environment and observability checks for VitalSense (development
            only).
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadDiagnostics}>
            Refresh
          </Button>
        </div>
      </div>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Worker & Bindings
          </CardTitle>
          <CardDescription>
            Summary of environment and optional bindings.
          </CardDescription>
        </CardHeader>
        <CardContent className="md:grid-cols-2 grid gap-4">
          <div className="space-y-2">
            <div className="text-muted-foreground text-sm">Environment</div>
            <div className="text-foreground text-lg font-medium">
              {loading ? 'Loading…' : (diag?.env ?? '—')}
            </div>
            <div className="text-muted-foreground text-sm">Now</div>
            <div>{loading ? '—' : diag?.now}</div>
            <div className="text-muted-foreground text-sm">Log sample rate</div>
            <div>{loading ? '—' : (diag?.logSampleRate ?? '(default)')}</div>
            <div className="text-muted-foreground text-sm">
              Per-category sampling
            </div>
            <div className="text-xs text-muted-foreground">
              WS: {diag?.logSampleRates?.ws ?? '(default)'} • ClientError:{' '}
              {diag?.logSampleRates?.clientError ?? '(default)'}
            </div>
            <div className="text-muted-foreground text-sm">Datasets</div>
            {datasetBadges}
          </div>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4" /> KV:{' '}
              {renderBool('KV', diag?.hasKV)}
            </div>
            <div className="flex items-center gap-2">
              <CloudUpload className="h-4 w-4" /> R2:{' '}
              {renderBool('R2', diag?.hasR2)}
            </div>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" /> Rate Limiter:{' '}
              {renderBool('RL', diag?.hasRateLimiter)}
            </div>
            <div className="text-muted-foreground mt-4 text-sm">Endpoints</div>
            <ul className="pl-5 list-disc text-sm">
              {loading ? (
                <li>—</li>
              ) : (
                diag?.endpoints.map((e) => (
                  <li
                    key={e}
                    className="flex items-center justify-between gap-2"
                  >
                    <span className="truncate">{e}</span>
                    <span className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 px-2"
                        title={`Copy ${e}`}
                        aria-label={`Copy ${e}`}
                        onClick={() => copyEndpoint(e)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      {copiedEndpoint === e && (
                        <span className="text-xs text-muted-foreground">
                          Copied
                        </span>
                      )}
                    </span>
                  </li>
                ))
              )}
            </ul>
            {error && (
              <div className="text-red-500 mt-2 flex items-center gap-2 text-sm">
                <AlertTriangle className="h-4 w-4" /> {error}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wifi className="h-5 w-5" />
            WebSocket Config
          </CardTitle>
          <CardDescription>Server-provided connection details.</CardDescription>
        </CardHeader>
        <CardContent className="gap-3 grid">
          <div className="flex gap-2">
            <Button size="sm" onClick={onFetchWsInfo}>
              Refresh
            </Button>
          </div>
          <div className="grid gap-1 text-sm">
            <div>
              <span className="text-muted-foreground">URL:</span>{' '}
              {wsInfo?.url ?? '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Fallback:</span>{' '}
              {wsInfo?.fallback ?? '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Live enabled:</span>{' '}
              {wsInfo?.live == null ? '—' : String(wsInfo.live)}
            </div>
            <div>
              <span className="text-muted-foreground">User ID:</span>{' '}
              {wsInfo?.userId ?? '—'}
            </div>
            <div>
              <span className="text-muted-foreground">Device token:</span>{' '}
              {wsInfo?.token ?? '—'}
            </div>
            {wsInfo?.error && (
              <div className="text-red-500">Error: {wsInfo.error}</div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            Quick Probes
          </CardTitle>
          <CardDescription>
            Run common checks against dev-only endpoints.
          </CardDescription>
        </CardHeader>
        <CardContent className="md:grid-cols-3 grid gap-4">
          <div className="space-y-2">
            <div className="text-sm">Worker Health</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onHealth}>
                <Activity className="mr-1 h-4 w-4" /> Check /health
              </Button>
            </div>
            {healthStatus && (
              <div className="text-xs text-muted-foreground">
                Status: {healthStatus.status} • OK: {String(healthStatus.ok)}
              </div>
            )}

            <div className="mt-4 text-sm">Rate Limit (probe)</div>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={onRateLimitProbe}>
                <Shield className="mr-1 h-4 w-4" /> Probe /api/_ratelimit
              </Button>
            </div>
            {rateLimit && (
              <div className="text-xs text-muted-foreground">
                {rateLimit.ok
                  ? `Remaining: ${rateLimit.remaining ?? 'n/a'}`
                  : `Error: ${rateLimit.error}`}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm">Analytics Engine</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onPingAnalytics}>
                <Terminal className="mr-1 h-4 w-4" /> Ping /api/_analytics_ping
              </Button>
            </div>
            {pingResult && (
              <div className="text-xs text-muted-foreground break-all">
                {pingResult.ok ? (
                  <>
                    Dataset: {pingResult.dataset ?? '(none)'} • Env:{' '}
                    {pingResult.env ?? '—'}
                    <br />
                    CorrelationId: {pingResult.correlationId ?? '—'}
                    {pingResult.correlationId && (
                      <>
                        {' '}
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() =>
                            doCopy(pingResult.correlationId!, 'ping')
                          }
                        >
                          Copy
                        </Button>
                        {copied.ping && <span className="ml-2">Copied</span>}
                      </>
                    )}
                  </>
                ) : (
                  <>
                    Error: {pingResult.error ?? 'unknown'} • Dataset:{' '}
                    {pingResult.dataset ?? '(none)'}{' '}
                  </>
                )}
              </div>
            )}

            <div className="mt-4 text-sm">Centralized Error</div>
            <div className="flex gap-2">
              <Button size="sm" variant="destructive" onClick={onTriggerError}>
                <Bug className="mr-1 h-4 w-4" /> Trigger /api/_error
              </Button>
            </div>
            {errorResult && (
              <div className="text-xs text-muted-foreground break-all">
                Status: {errorResult.status} • CorrelationId:{' '}
                {errorResult.correlationId ?? '—'}
                {errorResult.correlationId && (
                  <>
                    {' '}
                    <Button
                      variant="outline"
                      size="sm"
                      className="ml-2"
                      onClick={() =>
                        doCopy(errorResult.correlationId!, 'error')
                      }
                    >
                      Copy
                    </Button>
                    {copied.error && <span className="ml-2">Copied</span>}
                  </>
                )}{' '}
                • Error: {errorResult.error ?? '—'}
              </div>
            )}
          </div>
          <div className="space-y-2">
            <div className="text-sm">WebSocket Quick Test</div>
            <div className="flex gap-2">
              <Button size="sm" onClick={onWsConnect}>
                Connect
              </Button>
              <Button size="sm" variant="secondary" onClick={onWsDisconnect}>
                Disconnect
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={onWsPing}
                disabled={wsStatus !== 'open'}
              >
                Ping
              </Button>
            </div>
            <div className="text-xs text-muted-foreground">
              Status: {wsStatus} • Last: {wsLastEvent}
            </div>
            <div className="text-xs text-muted-foreground">
              Telemetry is submitted to /api/ws-telemetry
            </div>
            {typeof wsLastRtt === 'number' && (
              <div className="text-xs text-muted-foreground">
                Last RTT: {wsLastRtt} ms
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gauge className="h-5 w-5" />
            Analytics Version Mismatch (Debug)
          </CardTitle>
          <CardDescription>
            Recent client-reported analytics config mismatches (non-production
            only).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="gap-3 flex flex-wrap items-center">
            <Button size="sm" onClick={onFetchVmEvents} disabled={vmLoading}>
              {vmLoading ? 'Loading…' : 'Fetch Events'}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={loadDiagnostics}
              disabled={loading}
            >
              Refresh Diagnostics
            </Button>
            {vmEvents && vmEvents.length > 0 && (
              <div className="flex items-center gap-1">
                <Button
                  size="sm"
                  variant={vmFilter === 'all' ? 'default' : 'outline'}
                  onClick={() => setVmFilter('all')}
                >
                  All ({vmCounts.all})
                </Button>
                <Button
                  size="sm"
                  variant={vmFilter === 'gait' ? 'default' : 'outline'}
                  onClick={() => setVmFilter('gait')}
                >
                  Gait ({vmCounts.gait})
                </Button>
                <Button
                  size="sm"
                  variant={vmFilter === 'fall' ? 'default' : 'outline'}
                  onClick={() => setVmFilter('fall')}
                >
                  Fall ({vmCounts.fall})
                </Button>
              </div>
            )}
            {filteredVmEvents && filteredVmEvents.length > 0 && (
              <div className="gap-3 flex items-center">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() =>
                      doCopy(
                        JSON.stringify(filteredVmEvents, null, 2),
                        'vmjson'
                      )
                    }
                  >
                    Copy JSON
                  </Button>
                  {copied.vmjson && (
                    <span className="text-xs text-muted-foreground">
                      Copied
                    </span>
                  )}
                </div>
                <div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const headers = [
                        'timestamp',
                        'relAgeSeconds',
                        'gaitLocal',
                        'gaitRemote',
                        'fallLocal',
                        'fallRemote',
                        'sample',
                        'seq',
                      ];
                      const now = Date.now();
                      const rows = filteredVmEvents.map((e) => [
                        e.ts,
                        ((now - Date.parse(e.ts)) / 1000).toFixed(2),
                        e.gaitLocal ?? '',
                        e.gaitRemote ?? '',
                        e.fallLocal ?? '',
                        e.fallRemote ?? '',
                        e.sample ?? '',
                        e.seq ?? '',
                      ]);
                      const csv = [headers, ...rows]
                        .map((r) =>
                          r
                            .map((c) => `"${String(c).replace(/"/g, '""')}"`)
                            .join(',')
                        )
                        .join('\n');
                      const blob = new Blob([csv], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = 'version-mismatch-events.csv';
                      document.body.appendChild(a);
                      a.click();
                      a.remove();
                      URL.revokeObjectURL(url);
                    }}
                  >
                    Download CSV
                  </Button>
                </div>
              </div>
            )}
            {diag?.analyticsVersionMismatch && (
              <div className="text-xs text-muted-foreground">
                Stored: {diag.analyticsVersionMismatch.recentEventCount}/
                {diag.analyticsVersionMismatch.maxStored} • Suggested sample:{' '}
                {diag.analyticsVersionMismatch.clientSampleRate}
                {typeof diag.analyticsVersionMismatch.oldestEventAgeMs ===
                  'number' && (
                  <>
                    {' '}
                    • Oldest:{' '}
                    {(() => {
                      const age =
                        diag.analyticsVersionMismatch.oldestEventAgeMs;
                      if (age <= 0) return '0s';
                      const secs = Math.floor(age / 1000);
                      if (secs < 60) return `${secs}s`;
                      const mins = Math.floor(secs / 60);
                      if (mins < 60) return `${mins}m`;
                      const hrs = Math.floor(mins / 60);
                      return `${hrs}h`;
                    })()}
                  </>
                )}
                {sparklineSvg}
                {vmSparklineBuckets.length > 0 && (
                  <span className="text-muted-foreground ml-2 inline-flex items-center gap-1 text-[10px]">
                    <span className="gap-0.5 inline-flex items-center">
                      <span className="bg-sky-500 h-2 w-2 rounded-sm" />
                      Gait
                    </span>
                    <span className="gap-0.5 inline-flex items-center">
                      <span className="bg-rose-500 h-2 w-2 rounded-sm" />
                      Fall
                    </span>
                    <span className="gap-0.5 inline-flex items-center">
                      <span className="bg-amber-500 h-2 w-2 rounded-sm" />
                      Both
                    </span>
                  </span>
                )}
              </div>
            )}
          </div>
          {vmError && (
            <div className="text-red-500 text-xs flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" /> {vmError}
            </div>
          )}
          {!vmError && vmEvents && vmEvents.length === 0 && !vmLoading && (
            <div className="text-muted-foreground text-xs">
              No events captured.
            </div>
          )}
          {!vmError && filteredVmEvents && filteredVmEvents.length > 0 && (
            <VirtualizedMismatchTable
              events={filteredVmEvents}
              formatRelativeSec={formatRelativeSec}
            />
          )}
        </CardContent>
      </Card>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Local Tips
          </CardTitle>
          <CardDescription>
            Use VS Code tasks for tails and analytics fetches.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-muted-foreground space-y-2 text-sm">
          <div>
            • Tail logs (dev): wrangler-tail-dev
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() =>
                doCopy(
                  'wrangler tail --env development --format pretty',
                  'tailDev'
                )
              }
            >
              Copy
            </Button>
            {copied.tailDev && <span className="ml-2">Copied</span>}
          </div>
          <div>
            • Tail logs (prod): wrangler-tail-prod
            <Button
              variant="outline"
              size="sm"
              className="ml-2"
              onClick={() =>
                doCopy(
                  'wrangler tail --env production --format pretty',
                  'tailProd'
                )
              }
            >
              Copy
            </Button>
            {copied.tailProd && <span className="ml-2">Copied</span>}
          </div>
          <div>• Probe error: probe-error-endpoint-8789</div>
          <div>
            • Analytics sample fetch: analytics-sample-fetch (requires CF env
            vars)
          </div>
        </CardContent>
      </Card>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Audit Events
          </CardTitle>
          <CardDescription>Recent audit entries (latest 10).</CardDescription>
        </CardHeader>
        <CardContent className="gap-3 grid">
          <div className="flex gap-2">
            <Button size="sm" onClick={onFetchAudit}>
              Fetch
            </Button>
          </div>
          {auditState && auditState.ok && (
            <div className="text-xs text-muted-foreground">
              Count: {auditState.count}
              <ul className="pl-5 mt-2 list-disc break-all">
                {auditState.events.map((e) => (
                  <li key={e.key}>
                    <span className="text-foreground">{e.key}</span>
                    {e.line ? ` — ${e.line}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {auditState && !auditState.ok && (
            <div className="text-red-500 text-sm">
              Error: {auditState.error}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="h-5 w-5" />
            Client Error Telemetry
          </CardTitle>
          <CardDescription>
            Send a synthetic client error event.
          </CardDescription>
        </CardHeader>
        <CardContent className="gap-3 grid">
          <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={onSendClientError}>
              Send Test Error
            </Button>
          </div>
          {clientErr && clientErr.ok && (
            <div className="text-xs text-muted-foreground break-all">
              Sent • CorrelationId: {clientErr.correlationId ?? '—'}
            </div>
          )}
          {clientErr && !clientErr.ok && (
            <div className="text-red-500 text-sm">Error: {clientErr.error}</div>
          )}
        </CardContent>
      </Card>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Auth0 Health
          </CardTitle>
          <CardDescription>Check dev Auth0 endpoints.</CardDescription>
        </CardHeader>
        <CardContent className="gap-3 grid">
          <div className="flex gap-2">
            <Button size="sm" onClick={onAuth0Health}>
              Check
            </Button>
          </div>
          {auth0Health && (
            <div className="text-xs text-muted-foreground">
              /api/auth0/health: {auth0Health.api ?? 0} • /auth0/health:{' '}
              {auth0Health.route ?? 0}
              {auth0Health.error && (
                <div className="text-red-500">Error: {auth0Health.error}</div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="ios-26-surface-elevated backdrop-blur-md border-white/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Browser & Network
          </CardTitle>
          <CardDescription>Local environment snapshot.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm">
          <div>
            <span className="text-muted-foreground">User Agent:</span>{' '}
            {browserInfo.ua}
          </div>
          <div>
            <span className="text-muted-foreground">Language:</span>{' '}
            {browserInfo.lang}
          </div>
          <div>
            <span className="text-muted-foreground">Platform:</span>{' '}
            {browserInfo.platform}
          </div>
          <div>
            <span className="text-muted-foreground">Hardware Concurrency:</span>{' '}
            {browserInfo.hw ?? '—'}
          </div>
          <div>
            <span className="text-muted-foreground">Device Memory:</span>{' '}
            {browserInfo.mem ?? '—'} GB
          </div>
          <div>
            <span className="text-muted-foreground">Time Zone:</span>{' '}
            {browserInfo.tz}
          </div>
          <div>
            <span className="text-muted-foreground">Network:</span>{' '}
            {browserInfo.conn
              ? `${browserInfo.conn.type} • ${browserInfo.conn.down ?? '—'} Mbps • RTT ${browserInfo.conn.rtt ?? '—'} ms • save=${String(
                  browserInfo.conn.save
                )}`
              : '—'}
          </div>
          <div>
            <span className="text-muted-foreground">KV Mode:</span>{' '}
            {browserInfo.kvMode ?? '—'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------- Virtualized Mismatch Table (extracted) ----------------
interface VersionMismatchEventRow {
  ts: string;
  gaitLocal?: string | null;
  gaitRemote?: string | null;
  fallLocal?: string | null;
  fallRemote?: string | null;
  sample?: number;
  seq?: number;
}

interface VirtualizedMismatchTableProps {
  events: VersionMismatchEventRow[];
  formatRelativeSec: (iso: string) => string;
}

function VirtualizedMismatchTable({
  events,
  formatRelativeSec,
}: VirtualizedMismatchTableProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ROW_HEIGHT = 26;
  const OVERSCAN = 8;
  const ordered = useMemo(() => events.slice().reverse(), [events]);
  const [viewport, setViewport] = useState({
    start: 0,
    end: 50,
    height: 0,
    scrollTop: 0,
  });
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const onScroll = () => {
      const height = el.clientHeight;
      const scrollTop = el.scrollTop;
      const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
      const visibleCount = Math.ceil(height / ROW_HEIGHT) + OVERSCAN * 2;
      const end = start + visibleCount;
      setViewport({ start, end, height, scrollTop });
    };
    onScroll();
    el.addEventListener('scroll', onScroll, { passive: true });
    const ro = new ResizeObserver(onScroll);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', onScroll);
      ro.disconnect();
    };
  }, [ordered.length]);
  useEffect(() => {
    setViewport((v) => ({ ...v, start: 0, end: 50, scrollTop: 0 }));
    if (containerRef.current) containerRef.current.scrollTop = 0;
  }, [ordered.length]);
  const slice = ordered.slice(viewport.start, viewport.end);
  return (
    <div
      ref={containerRef}
      className="border-border/40 max-h-64 relative overflow-auto rounded border [contain:strict]"
    >
      <table className="text-xs w-full border-separate border-spacing-0">
        <thead className="sticky top-0 z-10">
          <tr className="bg-muted/50 backdrop-blur supports-[backdrop-filter]:bg-muted/40 text-left">
            <th className="p-2 font-medium">Time</th>
            <th className="p-2 font-medium">Δ</th>
            <th className="p-2 font-medium">Gait</th>
            <th className="p-2 font-medium">Fall Risk</th>
            <th className="p-2 font-medium">Sample</th>
            <th className="p-2 font-medium">Seq</th>
          </tr>
        </thead>
        <tbody>
          {slice.map((e) => {
            const gait =
              e.gaitLocal && e.gaitRemote && e.gaitLocal !== e.gaitRemote
                ? `${e.gaitLocal} → ${e.gaitRemote}`
                : '—';
            const fall =
              e.fallLocal && e.fallRemote && e.fallLocal !== e.fallRemote
                ? `${e.fallLocal} → ${e.fallRemote}`
                : '—';
            const type =
              gait !== '—' && fall !== '—'
                ? 'both'
                : gait !== '—'
                  ? 'gait'
                  : fall !== '—'
                    ? 'fall'
                    : '—';
            return (
              <tr
                key={`${e.ts}-${e.seq ?? 0}`}
                className="even:bg-muted/10 h-[26px]"
              >
                <td className="whitespace-nowrap p-2 align-top">
                  {formatRelativeSec(e.ts)}
                </td>
                <td className="p-2 align-top">
                  {type === 'both' && (
                    <Badge variant="outline" className="text-[10px]">
                      B
                    </Badge>
                  )}
                  {type === 'gait' && (
                    <Badge variant="outline" className="text-[10px]">
                      G
                    </Badge>
                  )}
                  {type === 'fall' && (
                    <Badge variant="outline" className="text-[10px]">
                      F
                    </Badge>
                  )}
                  {type === '—' && '—'}
                </td>
                <td className="p-2 align-top font-mono">{gait}</td>
                <td className="p-2 align-top font-mono">{fall}</td>
                <td className="p-2 align-top">{e.sample ?? '—'}</td>
                <td className="p-2 align-top">{e.seq ?? '—'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
