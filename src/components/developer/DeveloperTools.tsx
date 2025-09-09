import TelemetryPanel from '@/components/dev/TelemetryPanel';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useKV } from '@/hooks/useCloudflareKV';
import {
  Activity,
  AlertCircle,
  CheckCircle,
  Code,
  Copy,
  Database,
  Globe,
  HardDrive,
  Info,
  Monitor,
  Play,
  RefreshCw,
  Server,
  Settings,
  Shield,
  Terminal,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ServerStatus {
  webApp: {
    running: boolean;
    url: string;
    port: number;
    status: 'online' | 'offline' | 'error';
  };
  webSocket: {
    running: boolean;
    url: string;
    port: number;
    status: 'online' | 'offline' | 'error';
    connections: number;
  };
  worker: {
    running: boolean;
    url: string;
    port: number;
    status: 'online' | 'offline' | 'error';
  };
}

interface EnvironmentInfo {
  nodeVersion: string;
  buildTool: string;
  environment: 'development' | 'production' | 'staging';
  lastBuild: string;
  gitBranch?: string;
  gitCommit?: string;
}

export default function DeveloperTools() {
  const [servers, setServers] = useState<ServerStatus>({
    webApp: {
      running: true,
      url: 'http://localhost:5173',
      port: 5173,
      status: 'online',
    },
    webSocket: {
      running: false,
      url: 'ws://localhost:3001',
      port: 3001,
      status: 'offline',
      connections: 0,
    },
    worker: {
      running: false,
      url: 'http://localhost:8787',
      port: 8787,
      status: 'offline',
    },
  });

  const [environment, setEnvironment] = useState<EnvironmentInfo>({
    nodeVersion: 'v22.x.x',
    buildTool: 'ESBuild + Vite',
    environment: 'development',
    lastBuild: new Date().toLocaleString(),
    gitBranch: 'test-optimized-workflows',
  });

  const [testData, setTestData] = useState('');
  const [apiResponse, setApiResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [kvData, setKvData] = useKV('dev-tools-data', '{}');

  // Telemetry panel state (moved from main App)
  const [showTelemetry, setShowTelemetry] = useKV<boolean>(
    'dev-telemetry-open',
    false
  );

  // WebSocket connection monitoring (moved from WSHealthPanel)
  const [wsConnection, setWsConnection] = useState<{
    connected: boolean;
    url: string;
    lastHeartbeat?: string;
  }>({ connected: false, url: '' });

  useEffect(() => {
    // Check server status periodically
    const checkServers = async () => {
      try {
        // Check web app
        const _webAppResponse = await fetch(servers.webApp.url, {
          method: 'HEAD',
          mode: 'no-cors',
        });

        // Update status based on responses
        setServers((prev) => ({
          ...prev,
          webApp: { ...prev.webApp, status: 'online' },
        }));
      } catch (_error) {
        console.log('Server check completed');
      }
    };

    // WebSocket connection monitoring (moved from WSHealthPanel)
    const checkWebSocketConnection = () => {
      try {
        const w = window as unknown as {
          __WS_URL__?: string;
          __WS_CONNECTION__?: { connected: boolean; lastHeartbeat?: string };
        };

        const effectiveUrl = w.__WS_URL__ || servers.webSocket.url;
        const connection = w.__WS_CONNECTION__ || { connected: false };

        setWsConnection({
          connected: connection.connected,
          url: effectiveUrl,
          lastHeartbeat: connection.lastHeartbeat,
        });

        // Update WebSocket server status based on connection
        setServers((prev) => ({
          ...prev,
          webSocket: {
            ...prev.webSocket,
            status: connection.connected ? 'online' : 'offline',
          },
        }));
      } catch (_error) {
        console.log('WebSocket check completed');
      }
    };

    checkServers();
    checkWebSocketConnection();

    const serverInterval = setInterval(checkServers, 30000);
    const wsInterval = setInterval(checkWebSocketConnection, 3000);

    return () => {
      clearInterval(serverInterval);
      clearInterval(wsInterval);
    };
  }, [servers.webApp.url, servers.webSocket.url]);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy to clipboard');
    }
  };

  const testApiEndpoint = async (endpoint: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(endpoint);
      const data = await response.json();
      setApiResponse(JSON.stringify(data, null, 2));
      toast.success('API request successful');
    } catch (_error) {
      setApiResponse(`Error: ${_error}`);
      toast.error('API request failed');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: 'online' | 'offline' | 'error') => {
    switch (status) {
      case 'online':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="h-4 w-4 text-gray-400" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getStatusBadge = (status: 'online' | 'offline' | 'error') => {
    const variants = {
      online: 'bg-green-100 text-green-800 border-green-200',
      offline: 'bg-gray-100 text-gray-600 border-gray-200',
      error: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
      <Badge className={variants[status]} variant="outline">
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 p-6">
      <div className="text-center">
        <div className="mb-4">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg">
            <Code className="h-6 w-6 text-white" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">
            Developer Tools
          </h1>
          <p className="text-gray-600">
            Development server status, API testing, and debugging utilities
          </p>
        </div>
      </div>

      <Tabs defaultValue="servers" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="servers">Servers</TabsTrigger>
          <TabsTrigger value="api-testing">API Testing</TabsTrigger>
          <TabsTrigger value="websocket">WebSocket</TabsTrigger>
          <TabsTrigger value="environment">Environment</TabsTrigger>
          <TabsTrigger value="debug-tools">Debug Tools</TabsTrigger>
        </TabsList>

        <TabsContent value="servers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5" />
                Development Servers
              </CardTitle>
              <CardDescription>
                Monitor the status of all development services
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Web App Server */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(servers.webApp.status)}
                  <div>
                    <h4 className="font-medium">VitalSense Web App</h4>
                    <p className="text-sm text-gray-500">
                      Main React application (ESBuild)
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(servers.webApp.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(servers.webApp.url)}
                    className="max-w-48 justify-start"
                  >
                    <Copy className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{servers.webApp.url}</span>
                  </Button>
                </div>
              </div>

              {/* WebSocket Server */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(servers.webSocket.status)}
                  <div>
                    <h4 className="font-medium">WebSocket Server</h4>
                    <p className="text-sm text-gray-500">
                      Real-time health data streaming
                      {wsConnection.connected && wsConnection.lastHeartbeat && (
                        <span className="ml-2 text-xs text-green-600">
                          Last ping: {wsConnection.lastHeartbeat}
                        </span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(servers.webSocket.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard(wsConnection.url || servers.webSocket.url)
                    }
                    className="max-w-48 justify-start"
                  >
                    <Copy className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">
                      {wsConnection.url || servers.webSocket.url}
                    </span>
                  </Button>
                </div>
              </div>

              {/* Cloudflare Worker */}
              <div className="flex items-center justify-between rounded-lg border p-4">
                <div className="flex items-center gap-3">
                  {getStatusIcon(servers.worker.status)}
                  <div>
                    <h4 className="font-medium">Cloudflare Worker</h4>
                    <p className="text-sm text-gray-500">
                      API endpoints and static assets
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {getStatusBadge(servers.worker.status)}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(servers.worker.url)}
                    className="max-w-48 justify-start"
                  >
                    <Copy className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">{servers.worker.url}</span>
                  </Button>
                </div>
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div>
                      <strong>WebSocket Setup:</strong> Run{' '}
                      <code className="rounded bg-gray-100 px-1 py-0.5 dark:bg-gray-800 dark:text-gray-200">
                        node server/websocket-server.js
                      </code>{' '}
                      to start the WebSocket server for real-time features.
                    </div>
                    {wsConnection.connected ? (
                      <div className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        <span>WebSocket is currently connected and active</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-amber-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>
                          WebSocket connection not detected - some real-time
                          features may be limited
                        </span>
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api-testing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                API Testing
              </CardTitle>
              <CardDescription>
                Test API endpoints and debug responses
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Button
                  variant="outline"
                  onClick={() => testApiEndpoint('http://localhost:5173')}
                  disabled={isLoading}
                  className="h-10 justify-start px-4"
                >
                  <Play className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Test Web App</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testApiEndpoint('/api/health')}
                  disabled={isLoading}
                  className="h-10 justify-start px-4"
                >
                  <Activity className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Health Check</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testApiEndpoint('/api/health-data')}
                  disabled={isLoading}
                  className="h-10 justify-start px-4"
                >
                  <Database className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Health Data API</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={() => testApiEndpoint('/api/device-auth')}
                  disabled={isLoading}
                  className="h-10 justify-start px-4"
                >
                  <Shield className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">Device Auth</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="custom-endpoint">Custom Endpoint</Label>
                <div className="flex gap-2">
                  <Input
                    id="custom-endpoint"
                    placeholder="Enter API endpoint..."
                    value={testData}
                    onChange={(e) => setTestData(e.target.value)}
                  />
                  <Button
                    onClick={() => testApiEndpoint(testData)}
                    disabled={isLoading || !testData}
                  >
                    Test
                  </Button>
                </div>
              </div>

              {apiResponse && (
                <div className="space-y-2">
                  <Label>Response</Label>
                  <Textarea
                    value={apiResponse}
                    readOnly
                    className="font-mono text-sm"
                    rows={10}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="websocket" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                WebSocket Configuration
              </CardTitle>
              <CardDescription>
                Manage WebSocket connection settings and tokens
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Connection Status</h4>
                    <p className="text-sm text-gray-500">
                      Current WebSocket connection state
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {wsConnection.connected ? (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <Badge className="border-green-200 bg-green-100 text-green-800">
                          Connected
                        </Badge>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-red-500" />
                        <Badge className="border-red-200 bg-red-100 text-red-800">
                          Disconnected
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                {wsConnection.url && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">
                      Connection URL
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        value={wsConnection.url}
                        readOnly
                        className="font-mono text-sm"
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(wsConnection.url)}
                        className="px-3"
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                )}

                {wsConnection.lastHeartbeat && (
                  <div className="mt-3 text-xs text-gray-500">
                    Last heartbeat: {wsConnection.lastHeartbeat}
                  </div>
                )}
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <strong>WebSocket Token Settings:</strong> Use the "WebSocket
                  Settings" menu item in the navigation to configure
                  authentication tokens and connection parameters. This provides
                  more detailed configuration options than this monitoring view.
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Quick WebSocket Commands
                </Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard('node server/websocket-server.js')
                    }
                    className="h-9 justify-start px-3"
                  >
                    <Terminal className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Start Server</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('npm run ws:dev')}
                    className="h-9 justify-start px-3"
                  >
                    <Play className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Dev Mode</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="environment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment Information
              </CardTitle>
              <CardDescription>
                Current development environment details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Node.js Version</Label>
                  <p className="rounded bg-gray-50 px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
                    {environment.nodeVersion}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Build Tool</Label>
                  <p className="rounded bg-gray-50 px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
                    {environment.buildTool}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Environment</Label>
                  <p className="rounded bg-gray-50 px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
                    {environment.environment}
                  </p>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Last Build</Label>
                  <p className="rounded bg-gray-50 px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
                    {environment.lastBuild}
                  </p>
                </div>
                {environment.gitBranch && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Git Branch</Label>
                    <p className="rounded bg-gray-50 px-3 py-2 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
                      {environment.gitBranch}
                    </p>
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Commands</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('npm run dev')}
                    className="h-9 justify-start px-3"
                  >
                    <Terminal className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">npm run dev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('npm run build')}
                    className="h-9 justify-start px-3"
                  >
                    <HardDrive className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">npm run build</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard('wrangler dev --port 8787')}
                    className="h-9 justify-start px-3"
                  >
                    <Globe className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">wrangler dev</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      copyToClipboard('node server/websocket-server.js')
                    }
                    className="h-9 justify-start px-3"
                  >
                    <Wifi className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">WebSocket server</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="debug-tools" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="h-5 w-5" />
                Debug Tools
              </CardTitle>
              <CardDescription>
                Debugging utilities and telemetry monitoring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Telemetry Panel</Label>
                <div className="mb-3 flex items-center gap-2">
                  <Button
                    variant={showTelemetry ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setShowTelemetry(!showTelemetry)}
                  >
                    <Activity className="mr-2 h-4 w-4" />
                    {showTelemetry ? 'Hide Telemetry' : 'Show Telemetry'}
                  </Button>
                  <span className="text-sm text-gray-500">
                    Monitor app performance and user interactions
                  </span>
                </div>

                {showTelemetry && (
                  <div className="max-h-96 overflow-y-auto rounded-lg border bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800">
                    <TelemetryPanel showNormalizationStats limit={120} />
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Local Storage Data
                </Label>
                <Button
                  variant="outline"
                  onClick={() => {
                    const data = Object.entries(localStorage).reduce(
                      (acc, [key, value]) => {
                        acc[key] = value;
                        return acc;
                      },
                      {} as Record<string, string>
                    );
                    setApiResponse(JSON.stringify(data, null, 2));
                  }}
                  className="h-9 justify-start px-3"
                >
                  <Database className="mr-2 h-4 w-4 flex-shrink-0" />
                  <span className="truncate">View Local Storage</span>
                </Button>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Console Commands</Label>
                <div className="space-y-1 rounded bg-gray-50 p-3 font-mono text-sm dark:bg-gray-800 dark:text-gray-200">
                  <div>
                    <strong>Debug health data:</strong>{' '}
                    <code>console.log(window.__VITALSENSE_DEBUG__)</code>
                  </div>
                  <div>
                    <strong>Clear storage:</strong>{' '}
                    <code>localStorage.clear()</code>
                  </div>
                  <div>
                    <strong>WebSocket status:</strong>{' '}
                    <code>console.log(window.__WS_CONNECTION__)</code>
                  </div>
                  <div>
                    <strong>Network requests:</strong>{' '}
                    <code>Performance → Network tab</code>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Actions</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      localStorage.clear();
                      toast.success('Local storage cleared');
                    }}
                    className="h-9 justify-start px-3"
                  >
                    <Database className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Clear Storage</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      window.location.reload();
                    }}
                    className="h-9 justify-start px-3"
                  >
                    <RefreshCw className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Reload App</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const debugInfo = {
                        connection: wsConnection,
                        servers: servers,
                        environment: environment,
                        localStorage: Object.entries(localStorage),
                        timestamp: new Date().toISOString(),
                      };
                      setApiResponse(JSON.stringify(debugInfo, null, 2));
                    }}
                    className="h-9 justify-start px-3 sm:col-span-2 lg:col-span-1"
                  >
                    <Monitor className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Generate Debug Report</span>
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Performance</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      performance.mark('debug-start');
                      toast.success('Performance mark set');
                    }}
                    className="h-9 justify-start px-3"
                  >
                    <Activity className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">Set Mark</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const entries =
                        performance.getEntriesByType('navigation');
                      setApiResponse(JSON.stringify(entries, null, 2));
                    }}
                    className="h-9 justify-start px-3"
                  >
                    <Monitor className="mr-2 h-3 w-3 flex-shrink-0" />
                    <span className="truncate">View Timing</span>
                  </Button>
                </div>
              </div>

              {apiResponse && (
                <div className="space-y-2">
                  <Label>Debug Output</Label>
                  <Textarea
                    value={apiResponse}
                    readOnly
                    className="font-mono text-sm"
                    rows={10}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
