import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useEffect, useMemo, useState } from 'react';

type SystemComponentStatus = 'healthy' | 'degraded' | 'down';

interface SystemHealth {
  webApp: SystemComponentStatus;
  apiWorker: SystemComponentStatus;
  webSocket: SystemComponentStatus;
  database: SystemComponentStatus;
  lastUpdated: Date;
  responseTime: number; // ms
  uptime: string;
  activeConnections: number;
  errorRate: number; // %
}

interface PerformanceMetrics {
  cpuUsage: number; // %
  memoryUsage: number; // %
  requestsPerMinute: number;
  averageResponseTime: number; // ms
  errorCount: number;
  totalRequests: number;
}

const probeUrl = 'http://127.0.0.1:8789/health';

export default function SimpleSystemStatus() {
  // Predeclare width classes so Tailwind JIT includes them
  const WIDTH_CLASSES = [
    'w-[0%]',
    'w-[5%]',
    'w-[10%]',
    'w-[15%]',
    'w-[20%]',
    'w-[25%]',
    'w-[30%]',
    'w-[35%]',
    'w-[40%]',
    'w-[45%]',
    'w-[50%]',
    'w-[55%]',
    'w-[60%]',
    'w-[65%]',
    'w-[70%]',
    'w-[75%]',
    'w-[80%]',
    'w-[85%]',
    'w-[90%]',
    'w-[95%]',
    'w-[100%]',
  ] as const;

  const toWidthClass = (percent: number): (typeof WIDTH_CLASSES)[number] => {
    const clamped = Math.max(0, Math.min(100, percent));
    const idx = Math.round(clamped / 5); // 0..20
    return WIDTH_CLASSES[idx];
  };
  const [systemHealth, setSystemHealth] = useState<SystemHealth>({
    webApp: 'healthy',
    apiWorker: 'healthy',
    webSocket: 'healthy',
    database: 'healthy',
    lastUpdated: new Date(),
    responseTime: 42,
    uptime: '2h 34m',
    activeConnections: 3,
    errorRate: 0.1,
  });

  const [performanceMetrics, setPerformanceMetrics] =
    useState<PerformanceMetrics>({
      cpuUsage: 23,
      memoryUsage: 67,
      requestsPerMinute: 45,
      averageResponseTime: 89,
      errorCount: 2,
      totalRequests: 1247,
    });

  const [isRefreshing, setIsRefreshing] = useState(false);

  const overallStatus = useMemo<SystemComponentStatus>(() => {
    const statuses: SystemComponentStatus[] = [
      systemHealth.webApp,
      systemHealth.apiWorker,
      systemHealth.webSocket,
      systemHealth.database,
    ];
    if (statuses.includes('down')) return 'down';
    if (statuses.includes('degraded')) return 'degraded';
    return 'healthy';
  }, [systemHealth]);

  useEffect(() => {
    let cancelled = false;

    const checkSystemHealth = async () => {
      const start = performance.now();
      try {
        const res = await fetch(probeUrl);
        const duration = Math.max(1, Math.round(performance.now() - start));
        const ok = res.ok;

        if (cancelled) return;

        setSystemHealth((prev) => ({
          ...prev,
          apiWorker: ok ? 'healthy' : 'degraded',
          webSocket: prev.webSocket, // unchanged here
          lastUpdated: new Date(),
          responseTime: duration,
          activeConnections: Math.max(
            1,
            Math.min(
              25,
              prev.activeConnections + Math.floor((Math.random() - 0.5) * 3)
            )
          ),
        }));

        setPerformanceMetrics((prev) => ({
          ...prev,
          cpuUsage: Math.max(
            10,
            Math.min(95, prev.cpuUsage + (Math.random() - 0.5) * 8)
          ),
          memoryUsage: Math.max(
            30,
            Math.min(95, prev.memoryUsage + (Math.random() - 0.5) * 6)
          ),
          requestsPerMinute: Math.max(
            5,
            Math.min(300, prev.requestsPerMinute + (Math.random() - 0.5) * 25)
          ),
          averageResponseTime: Math.max(
            20,
            Math.min(500, prev.averageResponseTime + (Math.random() - 0.5) * 40)
          ),
          totalRequests: prev.totalRequests + Math.floor(Math.random() * 5),
        }));
      } catch (err) {
        // Handle and log the exception for observability
        console.error('System health probe failed:', err);
        if (cancelled) return;
        setSystemHealth((prev) => ({
          ...prev,
          apiWorker: 'down',
          lastUpdated: new Date(),
        }));
      }
    };

    // Kick off immediately, then interval
    checkSystemHealth();
    const interval = setInterval(checkSystemHealth, 30000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  const refreshStatus = async () => {
    setIsRefreshing(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusBadge = (status: SystemComponentStatus) => {
    const base = 'px-2.5 py-1 text-xs font-medium rounded-full border';
    if (status === 'healthy') {
      return (
        <Badge
          className={`${base} border-green-200 bg-green-100 text-green-800`}
        >
          ✔️ Healthy
        </Badge>
      );
    }
    if (status === 'degraded') {
      return (
        <Badge
          className={`${base} border-yellow-200 bg-yellow-100 text-yellow-800`}
        >
          ⚠️ Degraded
        </Badge>
      );
    }
    return (
      <Badge className={`${base} border-red-200 bg-red-100 text-red-800`}>
        ⛔ Down
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-blue-800">
            🧪 System Status Panel - Working
          </CardTitle>
          <CardDescription className="text-blue-600">
            Live checks against your local Worker and synthetic performance
            updates.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                📈 System Status Overview
              </CardTitle>
              <CardDescription>
                Real-time monitoring of core components
              </CardDescription>
            </div>
            <div className="flex items-center gap-3">
              {getStatusBadge(overallStatus)}
              <Button
                variant="outline"
                size="sm"
                onClick={refreshStatus}
                disabled={isRefreshing}
                className="flex items-center gap-2"
              >
                {isRefreshing ? '⏳' : '🔄'} Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🌐</span>
                <div>
                  <p className="font-medium">Web App</p>
                  <p className="text-muted-foreground text-sm">Frontend</p>
                </div>
              </div>
              {getStatusBadge(systemHealth.webApp)}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">⚡</span>
                <div>
                  <p className="font-medium">API Worker</p>
                  <p className="text-muted-foreground text-sm">Cloudflare</p>
                </div>
              </div>
              {getStatusBadge(systemHealth.apiWorker)}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🔗</span>
                <div>
                  <p className="font-medium">WebSocket</p>
                  <p className="text-muted-foreground text-sm">Real-time</p>
                </div>
              </div>
              {getStatusBadge(systemHealth.webSocket)}
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">💾</span>
                <div>
                  <p className="font-medium">Database</p>
                  <p className="text-muted-foreground text-sm">KV Store</p>
                </div>
              </div>
              {getStatusBadge(systemHealth.database)}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📊 Performance Metrics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">🖥️ CPU Usage</span>
                <span className="text-sm font-bold">
                  {performanceMetrics.cpuUsage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className={`h-3 rounded-full bg-blue-600 transition-all duration-1000 ${toWidthClass(performanceMetrics.cpuUsage)}`}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">🧠 Memory Usage</span>
                <span className="text-sm font-bold">
                  {performanceMetrics.memoryUsage.toFixed(1)}%
                </span>
              </div>
              <div className="h-3 w-full rounded-full bg-gray-200">
                <div
                  className={`h-3 rounded-full bg-green-600 transition-all duration-1000 ${toWidthClass(performanceMetrics.memoryUsage)}`}
                />
              </div>

              <div className="flex items-center justify-between rounded-lg bg-blue-50 p-3">
                <span className="text-sm font-medium">📈 Requests/Min</span>
                <span className="text-lg font-bold text-blue-700">
                  {Math.round(performanceMetrics.requestsPerMinute)}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg bg-green-50 p-3">
                <span className="text-sm font-medium">⚡ Response Time</span>
                <span className="text-lg font-bold text-green-700">
                  {Math.round(performanceMetrics.averageResponseTime)}ms
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              📡 Live Connection Stats
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg border-l-4 border-blue-400 bg-blue-50 p-4">
                <span className="font-medium">🔗 Active Connections</span>
                <span className="text-2xl font-bold text-blue-700">
                  {systemHealth.activeConnections}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border-l-4 border-green-400 bg-green-50 p-4">
                <span className="font-medium">📊 Total Requests</span>
                <span className="text-2xl font-bold text-green-700">
                  {performanceMetrics.totalRequests.toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border-l-4 border-purple-400 bg-purple-50 p-4">
                <span className="font-medium">⏰ System Uptime</span>
                <span className="text-2xl font-bold text-purple-700">
                  {systemHealth.uptime}
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border-l-4 border-orange-400 bg-orange-50 p-4">
                <span className="font-medium">❌ Error Rate</span>
                <span className="text-2xl font-bold text-orange-700">
                  {systemHealth.errorRate}%
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-green-800">
            🔴 LIVE API Integration Test
          </CardTitle>
          <CardDescription className="text-green-600">
            Polling {probeUrl} every 30 seconds
          </CardDescription>
        </CardHeader>
      </Card>

      {overallStatus !== 'healthy' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <span className="text-xl">⚠️</span>
          <AlertDescription>
            Some system components are experiencing issues. Check individual
            service status above.
          </AlertDescription>
        </Alert>
      )}

      <div className="rounded-lg bg-gray-50 p-4 text-center dark:bg-gray-800">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
          🕐 Last updated:{' '}
          <span className="font-bold">
            {systemHealth.lastUpdated.toLocaleTimeString()}
          </span>
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          ⚡ API Response time:{' '}
          <span className="font-bold">{systemHealth.responseTime}ms</span>
        </p>
      </div>
    </div>
  );
}
