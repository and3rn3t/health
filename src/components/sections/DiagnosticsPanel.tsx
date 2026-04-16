/**
 * Developer Diagnostics Panel — VitalSense
 *
 * Comprehensive developer-facing diagnostics dashboard showing:
 * - API / Worker health checks with latency
 * - Auth status (JWT, Auth0 config)
 * - Environment info (build, feature flags, browser)
 * - KV / R2 / Durable Object binding status
 * - WebSocket connectivity
 * - Performance metrics
 *
 * Gated to dev environments only.
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import {
  useDiagnostics,
  type HealthCheckResult,
  type PingResult,
  type WebSocketProbe,
  type WorkerDiagnostics,
} from '@/hooks/useDiagnostics';
import { useWebSocket, type ConnectionState } from '@/hooks/useWebSocket';
import { isDev } from '@/lib/env';
import {
  Activity,
  CheckCircle,
  Clock,
  Database,
  Globe,
  Loader2,
  Lock,
  Monitor,
  RefreshCw,
  Shield,
  Signal,
  Wifi,
  WifiOff,
  XCircle,
  Zap,
} from '@/lib/icons';
import { useCallback, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function StatusDot({ ok }: { readonly ok: boolean }) {
  return (
    <span
      className={`inline-block h-2.5 w-2.5 rounded-full ${ok ? 'bg-green-500' : 'bg-red-500'}`}
      aria-label={ok ? 'Healthy' : 'Unhealthy'}
    />
  );
}

function LatencyBadge({ ms }: { readonly ms: number }) {
  const color =
    ms < 100
      ? 'border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-300'
      : ms < 300
        ? 'border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-950 dark:text-yellow-300'
        : 'border-red-200 bg-red-50 text-red-700 dark:border-red-800 dark:bg-red-950 dark:text-red-300';
  return (
    <Badge variant="outline" className={color}>
      {ms}ms
    </Badge>
  );
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  readonly title: string;
  readonly icon: React.ElementType;
  readonly children: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Icon className="h-4 w-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">{children}</CardContent>
    </Card>
  );
}

function Row({
  label,
  children,
}: {
  readonly label: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono text-foreground">{children}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Section: API Health
// ---------------------------------------------------------------------------

function ApiHealthSection({
  health,
  ping,
  onPing,
}: {
  readonly health: HealthCheckResult | null;
  readonly ping: PingResult | null;
  readonly onPing: () => void;
}) {
  return (
    <SectionCard title="API / Worker Health" icon={Activity}>
      {health ? (
        <>
          <Row label="Status">
            <span className="flex items-center gap-2">
              <StatusDot ok={health.status === 'healthy'} />
              {health.status}
            </span>
          </Row>
          <Row label="Environment">
            <Badge variant="secondary">{health.environment}</Badge>
          </Row>
          <Row label="Health Latency">
            <LatencyBadge ms={health.latencyMs} />
          </Row>
          <Row label="Server Time">{health.timestamp}</Row>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Not yet fetched</p>
      )}
      <div className="border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Ping</span>
          <div className="flex items-center gap-2">
            {ping && (
              <>
                <StatusDot ok={ping.ok} />
                <LatencyBadge ms={ping.latencyMs} />
              </>
            )}
            <Button variant="outline" size="sm" onClick={onPing}>
              <Zap className="mr-1 h-3 w-3" />
              Ping
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Auth Status
// ---------------------------------------------------------------------------

function AuthSection() {
  const auth = useAuth();
  const [tokenPreview, setTokenPreview] = useState<string | null>(null);

  const inspectToken = useCallback(async () => {
    const token = await auth.getAccessToken();
    if (token) {
      // Show first 20 chars + expiry from JWT payload (no secrets logged)
      const parts = token.split('.');
      if (parts.length === 3) {
        try {
          const payload = JSON.parse(atob(parts[1]!));
          const exp = payload.exp
            ? new Date(payload.exp * 1000).toISOString()
            : 'unknown';
          setTokenPreview(`...${token.slice(-12)} | exp: ${exp}`);
        } catch {
          setTokenPreview(`...${token.slice(-12)}`);
        }
      }
    } else {
      setTokenPreview('No token available');
    }
  }, [auth]);

  return (
    <SectionCard title="Authentication" icon={Lock}>
      <Row label="Authenticated">
        <span className="flex items-center gap-2">
          <StatusDot ok={auth.isAuthenticated} />
          {auth.isAuthenticated ? 'Yes' : 'No'}
        </span>
      </Row>
      <Row label="Loading">{auth.isLoading ? 'Yes' : 'No'}</Row>
      <Row label="User">
        {auth.user?.name ?? auth.user?.email ?? 'None'}
      </Row>
      {tokenPreview && (
        <Row label="Token">
          <code className="max-w-[220px] truncate text-xs">
            {tokenPreview}
          </code>
        </Row>
      )}
      <div className="border-t pt-3">
        <Button variant="outline" size="sm" onClick={inspectToken}>
          <Shield className="mr-1 h-3 w-3" />
          Inspect Token
        </Button>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Environment
// ---------------------------------------------------------------------------

function EnvironmentSection() {
  type VSConfig = {
    environment?: string;
    version?: string;
    features?: Record<string, boolean>;
    api?: Record<string, unknown>;
    auth0?: Record<string, unknown>;
  };
  const config = (
    globalThis as unknown as { __VITALSENSE_CONFIG__?: VSConfig }
  ).__VITALSENSE_CONFIG__;

  const userAgent = globalThis.navigator?.userAgent ?? 'unknown';
  const screenRes = globalThis.screen
    ? `${globalThis.screen.width}×${globalThis.screen.height} @${globalThis.devicePixelRatio ?? 1}x`
    : 'unknown';

  return (
    <SectionCard title="Environment" icon={Monitor}>
      <Row label="App Version">
        {config?.version ?? 'unknown'}
      </Row>
      <Row label="Environment">
        <Badge variant="secondary">
          {config?.environment ?? 'unknown'}
        </Badge>
      </Row>
      <Row label="isDev()">{isDev() ? 'true' : 'false'}</Row>
      <Row label="Screen">{screenRes}</Row>
      <Row label="User Agent">
        <span className="max-w-[280px] truncate text-xs" title={userAgent}>
          {userAgent.slice(0, 60)}…
        </span>
      </Row>

      {config?.features && (
        <div className="border-t pt-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            Feature Flags
          </p>
          <div className="flex flex-wrap gap-2">
            {Object.entries(config.features).map(([key, enabled]) => (
              <Badge
                key={key}
                variant={enabled ? 'default' : 'outline'}
                className="text-xs"
              >
                {enabled ? (
                  <CheckCircle className="mr-1 h-3 w-3" />
                ) : (
                  <XCircle className="mr-1 h-3 w-3" />
                )}
                {key}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Bindings
// ---------------------------------------------------------------------------

function BindingsSection({
  worker,
}: {
  readonly worker: WorkerDiagnostics | null;
}) {
  if (!worker) {
    return (
      <SectionCard title="Worker Bindings" icon={Database}>
        <p className="text-sm text-muted-foreground">
          Diagnostics endpoint not reachable (may be production)
        </p>
      </SectionCard>
    );
  }
  return (
    <SectionCard title="Worker Bindings" icon={Database}>
      <Row label="KV (HEALTH_KV)">
        <StatusDot ok={worker.hasKV} />
      </Row>
      <Row label="R2 (HEALTH_STORAGE)">
        <StatusDot ok={worker.hasR2} />
      </Row>
      <Row label="Rate Limiter DO">
        <StatusDot ok={worker.hasRateLimiter} />
      </Row>
      <div className="border-t pt-3">
        <p className="mb-2 text-xs font-medium text-muted-foreground">
          Analytics Datasets
        </p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(worker.datasets).map(([name, bound]) => (
            <Badge
              key={name}
              variant={bound ? 'default' : 'outline'}
              className="text-xs"
            >
              <StatusDot ok={bound} />
              <span className="ml-1">{name}</span>
            </Badge>
          ))}
        </div>
      </div>
      <div className="border-t pt-3">
        <Row label="Log Sample Rate">
          {worker.logSampleRate ?? 'default'}
        </Row>
        <Row label="WS Sample Rate">
          {worker.logSampleRates.ws ?? 'default'}
        </Row>
        <Row label="Client Error Rate">
          {worker.logSampleRates.clientError ?? 'default'}
        </Row>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section: WebSocket
// ---------------------------------------------------------------------------

function WebSocketSection({
  wsProbe,
  onProbe,
}: {
  readonly wsProbe: WebSocketProbe | null;
  readonly onProbe: () => void;
}) {
  const wsReturn = useWebSocket(
    { url: '', enableInDevelopment: false },
    {}
  );
  const connState: ConnectionState = wsReturn.connectionState;

  return (
    <SectionCard title="WebSocket" icon={Wifi}>
      <Row label="Connection">
        <span className="flex items-center gap-2">
          {connState.isConnected ? (
            <Wifi className="h-3.5 w-3.5 text-green-500" />
          ) : (
            <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />
          )}
          {connState.isConnected
            ? 'Connected'
            : connState.isConnecting
              ? 'Connecting…'
              : 'Disconnected'}
        </span>
      </Row>
      <Row label="Reconnect Attempts">{connState.reconnectAttempts}</Row>
      {connState.error && (
        <Row label="Error">
          <span className="text-red-500">{connState.error}</span>
        </Row>
      )}

      <div className="border-t pt-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">URL Probe</span>
          <div className="flex items-center gap-2">
            {wsProbe && (
              <>
                <StatusDot ok={wsProbe.reachable} />
                <LatencyBadge ms={wsProbe.latencyMs} />
              </>
            )}
            <Button variant="outline" size="sm" onClick={onProbe}>
              <Signal className="mr-1 h-3 w-3" />
              Probe
            </Button>
          </div>
        </div>
        {wsProbe?.error && (
          <p className="mt-1 text-xs text-red-500">{wsProbe.error}</p>
        )}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Performance
// ---------------------------------------------------------------------------

function PerformanceSection() {
  const [metrics, setMetrics] = useState<{
    domContentLoaded: number;
    loadComplete: number;
    jsHeapMB: number | null;
    entryCount: number;
  } | null>(null);

  const measure = useCallback(() => {
    const nav = performance.getEntriesByType(
      'navigation'
    )[0] as PerformanceNavigationTiming | undefined;
    type MemoryInfo = { usedJSHeapSize?: number };
    const mem = (performance as unknown as { memory?: MemoryInfo }).memory;

    setMetrics({
      domContentLoaded: Math.round(nav?.domContentLoadedEventEnd ?? 0),
      loadComplete: Math.round(nav?.loadEventEnd ?? 0),
      jsHeapMB: mem?.usedJSHeapSize
        ? Math.round(mem.usedJSHeapSize / 1024 / 1024)
        : null,
      entryCount: performance.getEntries().length,
    });
  }, []);

  useEffect(() => {
    // Measure after page load settles
    const id = setTimeout(measure, 100);
    return () => clearTimeout(id);
  }, [measure]);

  return (
    <SectionCard title="Performance" icon={Zap}>
      {metrics ? (
        <>
          <Row label="DOM Content Loaded">
            <LatencyBadge ms={metrics.domContentLoaded} />
          </Row>
          <Row label="Page Load">
            <LatencyBadge ms={metrics.loadComplete} />
          </Row>
          {metrics.jsHeapMB !== null && (
            <Row label="JS Heap">{metrics.jsHeapMB} MB</Row>
          )}
          <Row label="Performance Entries">{metrics.entryCount}</Row>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Measuring…</p>
      )}
      <div className="border-t pt-3">
        <Button variant="outline" size="sm" onClick={measure}>
          <RefreshCw className="mr-1 h-3 w-3" />
          Re-measure
        </Button>
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Section: Endpoints
// ---------------------------------------------------------------------------

function EndpointsSection({
  worker,
}: {
  readonly worker: WorkerDiagnostics | null;
}) {
  if (!worker?.endpoints?.length) return null;
  return (
    <SectionCard title="Available Endpoints" icon={Globe}>
      <div className="max-h-48 space-y-1 overflow-y-auto">
        {worker.endpoints.map((ep) => (
          <div
            key={ep}
            className="flex items-center gap-2 rounded-md bg-muted/50 px-2 py-1 font-mono text-xs"
          >
            <span className="text-muted-foreground">GET</span>
            <span className="text-foreground">{ep}</span>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function DiagnosticsPanel() {
  const diag = useDiagnostics();

  useEffect(() => {
    void diag.refresh();
    // Run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      {/* Header controls */}
      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={diag.refresh}
          disabled={diag.loading}
          className="min-h-[44px]"
        >
          {diag.loading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="mr-2 h-4 w-4" />
          )}
          {diag.loading ? 'Refreshing…' : 'Refresh All'}
        </Button>
        {diag.lastRefresh && (
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            Last: {diag.lastRefresh.toLocaleTimeString()}
          </span>
        )}
        {diag.error && (
          <Badge variant="destructive">Error: {diag.error}</Badge>
        )}
      </div>

      {/* Grid of diagnostic sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        <ApiHealthSection
          health={diag.health}
          ping={diag.ping}
          onPing={diag.pingWorker}
        />
        <AuthSection />
        <EnvironmentSection />
        <BindingsSection worker={diag.worker} />
        <WebSocketSection
          wsProbe={diag.wsProbe}
          onProbe={diag.probeWebSocket}
        />
        <PerformanceSection />
      </div>

      {/* Endpoints list (full width) */}
      <EndpointsSection worker={diag.worker} />
    </div>
  );
}
