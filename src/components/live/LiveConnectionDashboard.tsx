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
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useWebSocket } from '@/hooks/useWebSocket';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Globe,
  Heart,
  Monitor,
  Radio,
  RefreshCw,
  Signal,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface LiveMetric {
  id: string;
  type: 'heart_rate' | 'steps' | 'walking_steadiness' | 'activity' | 'sleep';
  value: number;
  unit: string;
  timestamp: string;
  deviceId: string;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

interface ConnectionMetrics {
  totalMessages: number;
  messagesPerSecond: number;
  bytesTransferred: number;
  uptime: number;
  lastHeartbeat: string | null;
  reconnections: number;
  avgLatency: number;
}

export default function LiveConnectionDashboard() {
  const [isEnabled, setIsEnabled] = useKV<boolean>(
    'live-connection-enabled',
    false
  );
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[]>([]);
  const [connectionMetrics, setConnectionMetrics] = useState<ConnectionMetrics>(
    {
      totalMessages: 0,
      messagesPerSecond: 0,
      bytesTransferred: 0,
      uptime: 0,
      lastHeartbeat: null,
      reconnections: 0,
      avgLatency: 0,
    }
  );

  // Get WebSocket URL from window globals or use default
  const getWebSocketUrl = () => {
    if (typeof window !== 'undefined') {
      const customUrl = (window as any).__WS_URL__;
      if (customUrl) return customUrl;
    }
    return 'ws://localhost:3001';
  };

  // WebSocket message handlers
  const messageHandlers = {
    connection_established: (data: any) => {
      console.log('Connected to VitalSense WebSocket:', data);
      setConnectionMetrics((prev) => ({
        ...prev,
        lastHeartbeat: new Date().toISOString(),
      }));
    },

    live_health_update: (data: any) => {
      console.log('Live health update received:', data);
      if (data.metrics && Array.isArray(data.metrics)) {
        const newMetrics = data.metrics.map((metric: any) => ({
          id: `${metric.type}-${Date.now()}-${Math.random()}`,
          type: metric.type,
          value: metric.value,
          unit: metric.unit || '',
          timestamp: metric.timestamp || new Date().toISOString(),
          deviceId: data.deviceId || 'unknown',
          quality: determineDataQuality(metric.value, metric.type),
        }));

        setLiveMetrics((prev) => [...newMetrics, ...prev.slice(0, 99)]); // Keep last 100

        setConnectionMetrics((prev) => ({
          ...prev,
          totalMessages: prev.totalMessages + newMetrics.length,
          bytesTransferred: prev.bytesTransferred + JSON.stringify(data).length,
          lastHeartbeat: new Date().toISOString(),
        }));
      }
    },

    historical_data_update: (data: any) => {
      console.log('Historical data update:', data);
      // Handle historical data updates if needed
    },

    emergency_alert: (data: any) => {
      console.log('Emergency alert:', data);
      // Handle emergency alerts
    },

    error: (data: any) => {
      console.error('WebSocket error:', data);
    },

    pong: () => {
      setConnectionMetrics((prev) => ({
        ...prev,
        lastHeartbeat: new Date().toISOString(),
      }));
    },
  };

  // Initialize WebSocket connection
  const { connectionState, sendMessage, connect, disconnect } = useWebSocket(
    {
      url: getWebSocketUrl(),
      enableInDevelopment: true,
      reconnectAttempts: 10,
      reconnectDelay: 1000,
      pingInterval: 30000,
      onConnect: () => {
        console.log('Live connection established');
        // Send client identification
        sendMessage({
          type: 'client_identification',
          data: {
            clientType: 'web_dashboard',
            userId: 'demo-user',
            version: '1.0.0',
          },
          timestamp: new Date().toISOString(),
        });
      },
      onDisconnect: () => {
        console.log('Live connection lost');
        setConnectionMetrics((prev) => ({
          ...prev,
          reconnections: prev.reconnections + 1,
        }));
      },
      onError: (error) => {
        console.error('WebSocket error:', error);
      },
    },
    messageHandlers
  );

  // Determine data quality based on metric type and value
  const determineDataQuality = (
    value: number,
    type: string
  ): LiveMetric['quality'] => {
    switch (type) {
      case 'heart_rate':
        if (value >= 60 && value <= 100) return 'excellent';
        if (value >= 50 && value <= 120) return 'good';
        if (value >= 40 && value <= 140) return 'fair';
        return 'poor';
      case 'walking_steadiness':
        if (value >= 80) return 'excellent';
        if (value >= 60) return 'good';
        if (value >= 40) return 'fair';
        return 'poor';
      default:
        return 'good';
    }
  };

  // Toggle live connection
  const toggleConnection = useCallback(async () => {
    if (isEnabled) {
      disconnect();
      setIsEnabled(false);
      setLiveMetrics([]);
      setConnectionMetrics({
        totalMessages: 0,
        messagesPerSecond: 0,
        bytesTransferred: 0,
        uptime: 0,
        lastHeartbeat: null,
        reconnections: 0,
        avgLatency: 0,
      });
    } else {
      setIsEnabled(true);
      connect();
    }
  }, [isEnabled, connect, disconnect, setIsEnabled]);

  // Calculate messages per second
  useEffect(() => {
    if (!connectionState.isConnected) return;

    const interval = setInterval(() => {
      const now = Date.now();
      const oneSecondAgo = now - 1000;
      const recentMetrics = liveMetrics.filter(
        (metric) => new Date(metric.timestamp).getTime() > oneSecondAgo
      );

      setConnectionMetrics((prev) => ({
        ...prev,
        messagesPerSecond: recentMetrics.length,
        uptime: prev.uptime + 1,
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [connectionState.isConnected, liveMetrics]);

  // Get connection status icon
  const getConnectionIcon = () => {
    if (connectionState.isConnecting) {
      return <RefreshCw className="h-5 w-5 animate-spin text-yellow-500" />;
    }
    if (connectionState.isConnected) {
      return <Wifi className="h-5 w-5 text-green-500" />;
    }
    return <WifiOff className="h-5 w-5 text-red-500" />;
  };

  // Get metric icon
  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'heart_rate':
        return <Heart className="h-4 w-4 text-red-500" />;
      case 'steps':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'walking_steadiness':
        return <Radio className="h-4 w-4 text-green-500" />;
      case 'activity':
        return <Zap className="h-4 w-4 text-yellow-500" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  // Get quality color
  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'fair':
        return 'text-yellow-600';
      case 'poor':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  // Format bytes
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Format uptime
  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Globe className="h-6 w-6" />
            Live Connection Dashboard
          </h2>
          <p className="text-muted-foreground">
            Real-time WebSocket connection to VitalSense health data streams
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Live Connection</span>
            <Switch checked={isEnabled} onCheckedChange={toggleConnection} />
          </div>
          {getConnectionIcon()}
        </div>
      </div>

      {/* Connection Status Alert */}
      {isEnabled && connectionState.error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connection error: {connectionState.error}
            {connectionState.reconnectAttempts > 0 && (
              <span className="ml-2">
                (Reconnect attempt {connectionState.reconnectAttempts})
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isEnabled && connectionState.isConnecting && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            Connecting to VitalSense WebSocket server...
          </AlertDescription>
        </Alert>
      )}

      {isEnabled && connectionState.isConnected && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Connected to VitalSense WebSocket server. Receiving live health
            data.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Connection Status
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {getConnectionIcon()}
                  <span className="font-semibold">
                    {connectionState.isConnected
                      ? 'Connected'
                      : connectionState.isConnecting
                        ? 'Connecting'
                        : 'Disconnected'}
                  </span>
                </div>
              </div>
              <Signal className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Message Rate
                </p>
                <p className="text-2xl font-bold">
                  {connectionMetrics.messagesPerSecond}
                </p>
                <p className="text-muted-foreground text-xs">per second</p>
              </div>
              <Activity className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Total Messages
                </p>
                <p className="text-2xl font-bold">
                  {connectionMetrics.totalMessages}
                </p>
                <p className="text-muted-foreground text-xs">this session</p>
              </div>
              <Monitor className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Uptime
                </p>
                <p className="text-2xl font-bold">
                  {formatUptime(connectionMetrics.uptime)}
                </p>
                <p className="text-muted-foreground text-xs">
                  {connectionMetrics.reconnections > 0 &&
                    `${connectionMetrics.reconnections} reconnects`}
                </p>
              </div>
              <Zap className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="live-stream" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="live-stream">Live Stream</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="live-stream" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                Live Health Metrics Stream
              </CardTitle>
              <CardDescription>
                Real-time health data as it arrives from connected devices
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveMetrics.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  {isEnabled && connectionState.isConnected ? (
                    <>
                      <Monitor className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>Waiting for live health data...</p>
                      <p className="text-sm">
                        Make sure your devices are connected and sending data.
                      </p>
                    </>
                  ) : (
                    <>
                      <WifiOff className="mx-auto mb-4 h-12 w-12 opacity-50" />
                      <p>Live connection is disabled</p>
                      <p className="text-sm">
                        Enable the live connection to see real-time health data.
                      </p>
                    </>
                  )}
                </div>
              ) : (
                <div className="max-h-96 space-y-2 overflow-y-auto">
                  {liveMetrics.slice(0, 20).map((metric) => (
                    <div
                      key={metric.id}
                      className="bg-muted/50 flex items-center justify-between rounded-lg p-3"
                    >
                      <div className="flex items-center gap-3">
                        {getMetricIcon(metric.type)}
                        <div>
                          <p className="font-medium capitalize">
                            {metric.type.replace('_', ' ')}
                          </p>
                          <p className="text-muted-foreground text-sm">
                            {metric.deviceId}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">
                          {metric.value} {metric.unit}
                        </p>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={getQualityColor(metric.quality)}
                          >
                            {metric.quality}
                          </Badge>
                          <span className="text-muted-foreground text-xs">
                            {new Date(metric.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Connection Performance</CardTitle>
                <CardDescription>
                  Real-time connection metrics and performance stats
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Data Transferred</span>
                  <span className="font-mono">
                    {formatBytes(connectionMetrics.bytesTransferred)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Average Latency</span>
                  <span className="font-mono">
                    {connectionMetrics.avgLatency}ms
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Reconnections</span>
                  <span className="font-mono">
                    {connectionMetrics.reconnections}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Last Heartbeat</span>
                  <span className="font-mono text-sm">
                    {connectionMetrics.lastHeartbeat
                      ? new Date(
                          connectionMetrics.lastHeartbeat
                        ).toLocaleTimeString()
                      : 'Never'}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Quality</CardTitle>
                <CardDescription>
                  Analysis of incoming health data quality
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {['excellent', 'good', 'fair', 'poor'].map((quality) => {
                  const count = liveMetrics.filter(
                    (m) => m.quality === quality
                  ).length;
                  const percentage =
                    liveMetrics.length > 0
                      ? (count / liveMetrics.length) * 100
                      : 0;

                  return (
                    <div key={quality} className="space-y-2">
                      <div className="flex justify-between">
                        <span
                          className={`capitalize ${getQualityColor(quality)}`}
                        >
                          {quality}
                        </span>
                        <span>
                          {count} ({percentage.toFixed(1)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Technical Details</CardTitle>
              <CardDescription>
                WebSocket connection configuration and debugging information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">WebSocket URL</label>
                  <p className="bg-muted rounded p-2 font-mono text-sm">
                    {getWebSocketUrl()}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium">Ready State</label>
                  <p className="bg-muted rounded p-2 font-mono text-sm">
                    {connectionState.isConnected
                      ? 'OPEN (1)'
                      : connectionState.isConnecting
                        ? 'CONNECTING (0)'
                        : 'CLOSED (3)'}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <Button
                  onClick={() => {
                    sendMessage({
                      type: 'ping',
                      data: { timestamp: Date.now() },
                      timestamp: new Date().toISOString(),
                    });
                  }}
                  disabled={!connectionState.isConnected}
                  variant="outline"
                  size="sm"
                >
                  Send Ping
                </Button>

                <Button
                  onClick={() => {
                    sendMessage({
                      type: 'subscribe_health_updates',
                      data: {
                        metrics: ['heart_rate', 'steps', 'walking_steadiness'],
                        userId: 'demo-user',
                      },
                      timestamp: new Date().toISOString(),
                    });
                  }}
                  disabled={!connectionState.isConnected}
                  variant="outline"
                  size="sm"
                >
                  Subscribe to Health Updates
                </Button>
              </div>

              {connectionState.error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Error:</strong> {connectionState.error}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
