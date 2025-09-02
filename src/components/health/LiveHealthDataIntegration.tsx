import { useState, useEffect, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { useKV } from '@github/spark/hooks';
import {
  Wifi,
  WifiHigh,
  WifiOff,
  Activity,
  Heart,
  Clock,
  Phone,
  AlertTriangle,
  CheckCircle,
  Play,
  Pause,
  Zap,
  CloudUpload,
  Globe,
  Monitor,
  Bluetooth,
  BatteryFull,
  Radio,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  LiveHealthDataSync,
  LiveHealthMetric,
  ConnectionStatus,
  getLiveHealthDataSync,
} from '@/lib/liveHealthDataSync';

interface LiveDataStats {
  totalMetricsReceived: number;
  metricsPerMinute: number;
  lastUpdateTime: string;
  activeSubscriptions: number;
  dataQualityScore: number;
}

interface DeviceStatus {
  id: string;
  name: string;
  type: 'apple_watch' | 'iphone' | 'health_app';
  isConnected: boolean;
  lastSeen: string;
  batteryLevel?: number;
  signalStrength: number;
  dataRate: number;
}

export default function LiveHealthDataIntegration() {
  const [isConnected, setIsConnected] = useKV('live-data-connected', false);
  const [liveDataEnabled, setLiveDataEnabled] = useKV(
    'live-data-enabled',
    false
  );
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    lastHeartbeat: '',
    reconnectAttempts: 0,
    latency: 0,
    dataQuality: 'offline',
  });

  const [liveMetrics, setLiveMetrics] = useState<LiveHealthMetric[]>([]);
  const [dataStats, setDataStats] = useState<LiveDataStats>({
    totalMetricsReceived: 0,
    metricsPerMinute: 0,
    lastUpdateTime: '',
    activeSubscriptions: 0,
    dataQualityScore: 0,
  });

  const [devices, setDevices] = useState<DeviceStatus[]>([
    {
      id: 'apple-Watch-series-9',
      name: 'Apple Watch Series 9',
      type: 'apple_watch',
      isConnected: false,
      lastSeen: '',
      batteryLevel: 87,
      signalStrength: 95,
      dataRate: 0,
    },
    {
      id: 'iphone-15-pro',
      name: 'iPhone 15 Pro',
      type: 'iphone',
      isConnected: false,
      lastSeen: '',
      batteryLevel: 72,
      signalStrength: 88,
      dataRate: 0,
    },
    {
      id: 'health-app',
      name: 'Apple Health App',
      type: 'health_app',
      isConnected: false,
      lastSeen: '',
      signalStrength: 92,
      dataRate: 0,
    },
  ]);

  // Initialize live data sync
  const liveDataSync = getLiveHealthDataSync();

  // Handle connection status changes
  useEffect(() => {
    liveDataSync.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
      setIsConnected(status.connected);

      if (status.connected) {
        toast.success('Live health data connection established');
        setDevices((prev) =>
          prev.map((device) => ({
            ...device,
            isConnected: true,
            lastSeen: new Date().toISOString(),
          }))
        );
      } else {
        toast.error('Lost connection to live health data');
        setDevices((prev) =>
          prev.map((device) => ({
            ...device,
            isConnected: false,
          }))
        );
      }
    });

    // Handle incoming live data
    liveDataSync.onLiveDataReceived((data) => {
      setLiveMetrics((prev) => {
        const updated = [data, ...prev.slice(0, 49)]; // Keep last 50 metrics
        return updated;
      });

      // Update device status
      setDevices((prev) =>
        prev.map((device) => {
          if (device.id === data.deviceId) {
            return {
              ...device,
              lastSeen: data.timestamp,
              dataRate: device.dataRate + 1,
            };
          }
          return device;
        })
      );

      // Update stats
      setDataStats((prev) => ({
        ...prev,
        totalMetricsReceived: prev.totalMetricsReceived + 1,
        lastUpdateTime: data.timestamp,
        dataQualityScore: Math.min(100, prev.dataQualityScore + 0.1),
      }));
    });

    // Handle errors
    liveDataSync.onErrorOccurred((error) => {
      toast.error(`Live data error: ${error.message}`);
      console.error('Live data sync error:', error);
    });

    return () => {
      // Cleanup if needed
    };
  }, [liveDataSync]);

  // Calculate metrics per minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentMetrics = liveMetrics.filter(
          (metric) => new Date(metric.timestamp).getTime() > oneMinuteAgo
        );

        setDataStats((prev) => ({
          ...prev,
          metricsPerMinute: recentMetrics.length,
          activeSubscriptions: 3, // Simulated active subscription count
        }));
      }
    }, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [isConnected, liveMetrics]);

  const toggleLiveData = async () => {
    if (!liveDataEnabled) {
      setLiveDataEnabled(true);
      const connected = await liveDataSync.connect();
      if (connected) {
        // Subscribe to all metric types
        liveDataSync.subscribe({
          id: 'main-subscription',
          metricTypes: [
            'heart_rate',
            'steps',
            'walking_steadiness',
            'activity',
            'sleep',
          ],
          callback: (data) => {
            // Data is already handled by the global handler
          },
          filters: {
            minConfidence: 0.7,
          },
        });
      }
    } else {
      setLiveDataEnabled(false);
      liveDataSync.disconnect();
      liveDataSync.unsubscribe('main-subscription');
    }
  };

  const getConnectionIcon = () => {
    if (!isConnected) return <WifiOff className="h-5 w-5 text-red-500" />;
    if (connectionStatus.dataQuality === 'excellent')
      return <WifiHigh className="h-5 w-5 text-green-500" />;
    if (connectionStatus.dataQuality === 'good')
      return <Wifi className="h-5 w-5 text-yellow-500" />;
    return <WifiOff className="h-5 w-5 text-red-500" />;
  };

  const getDataQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent':
        return 'text-green-600';
      case 'good':
        return 'text-blue-600';
      case 'poor':
        return 'text-yellow-600';
      case 'offline':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

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
      case 'sleep':
        return <Clock className="h-4 w-4 text-purple-500" />;
      default:
        return <Monitor className="h-4 w-4 text-gray-500" />;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'apple_watch':
        return <Activity className="h-5 w-5" />;
      case 'iphone':
        return <Phone className="h-5 w-5" />;
      case 'health_app':
        return <Heart className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-foreground flex items-center gap-2 text-2xl font-bold">
            <CloudUpload className="h-6 w-6" />
            Live Apple Health Integration
          </h2>
          <p className="text-muted-foreground">
            Real-time health data streaming with WebSocket connections
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Live Data</span>
            <Switch
              checked={liveDataEnabled}
              onCheckedChange={toggleLiveData}
            />
          </div>
          {getConnectionIcon()}
        </div>
      </div>

      {/* Connection Status Alert */}
      {liveDataEnabled && !isConnected && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connecting to Apple Health live data stream... This may take a few
            moments.
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
                  Connection
                </p>
                <div className="mt-1 flex items-center gap-2">
                  {getConnectionIcon()}
                  <span
                    className={`font-semibold capitalize ${getDataQualityColor(connectionStatus.dataQuality)}`}
                  >
                    {connectionStatus.dataQuality}
                  </span>
                </div>
              </div>
              <Globe className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Data Rate
                </p>
                <p className="text-2xl font-bold">
                  {dataStats.metricsPerMinute}
                </p>
                <p className="text-muted-foreground text-xs">metrics/min</p>
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
                  Total Received
                </p>
                <p className="text-2xl font-bold">
                  {dataStats.totalMetricsReceived}
                </p>
                <p className="text-muted-foreground text-xs">this session</p>
              </div>
              <CloudUpload className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm font-medium">
                  Latency
                </p>
                <p className="text-2xl font-bold">
                  {Math.round(connectionStatus.latency)}ms
                </p>
                <p className="text-muted-foreground text-xs">avg response</p>
              </div>
              <Zap className="text-muted-foreground h-8 w-8" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Interface */}
      <Tabs defaultValue="live-data" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="live-data">Live Data</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="configuration">Configuration</TabsTrigger>
          <TabsTrigger value="technical">Technical</TabsTrigger>
        </TabsList>

        <TabsContent value="live-data" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* Real-time Metrics Stream */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Live Metrics Stream
                </CardTitle>
                <CardDescription>
                  Real-time health data from connected devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-80 space-y-3 overflow-y-auto">
                  {liveMetrics.length === 0 ? (
                    <div className="py-8 text-center">
                      <Activity className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                      <p className="text-muted-foreground text-sm">
                        {liveDataEnabled
                          ? 'Waiting for live data...'
                          : 'Enable live data to see metrics'}
                      </p>
                    </div>
                  ) : (
                    liveMetrics.slice(0, 10).map((metric, index) => (
                      <div
                        key={index}
                        className="bg-muted flex items-center justify-between rounded-lg p-3"
                      >
                        <div className="flex items-center gap-3">
                          {getMetricIcon(metric.metricType)}
                          <div>
                            <div className="text-sm font-medium">
                              {metric.metricType.replace('_', ' ')}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {new Date(metric.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {typeof metric.value === 'number'
                              ? metric.value.toFixed(1)
                              : metric.value.toString()}
                            {metric.unit && (
                              <span className="ml-1 text-xs">
                                {metric.unit}
                              </span>
                            )}
                          </div>
                          <div className="text-muted-foreground text-xs">
                            {Math.round(metric.confidence * 100)}% confidence
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Data Quality Monitor */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5" />
                  Data Quality Monitor
                </CardTitle>
                <CardDescription>
                  Real-time data stream health and reliability
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Overall Quality
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        {Math.round(dataStats.dataQualityScore)}%
                      </span>
                    </div>
                    <Progress
                      value={dataStats.dataQualityScore}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Connection Stability
                      </span>
                      <span className="text-sm font-semibold text-blue-600">
                        {isConnected ? '99.9%' : '0%'}
                      </span>
                    </div>
                    <Progress value={isConnected ? 99.9 : 0} className="h-2" />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Data Freshness
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        {dataStats.lastUpdateTime ? 'Live' : 'Stale'}
                      </span>
                    </div>
                    <Progress
                      value={dataStats.lastUpdateTime ? 100 : 0}
                      className="h-2"
                    />
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">
                          Last Update:
                        </span>
                        <div className="font-medium">
                          {dataStats.lastUpdateTime
                            ? new Date(
                                dataStats.lastUpdateTime
                              ).toLocaleTimeString()
                            : 'No data'}
                        </div>
                      </div>
                      <div>
                        <span className="text-muted-foreground">
                          Active Streams:
                        </span>
                        <div className="font-medium">
                          {dataStats.activeSubscriptions}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      {getDeviceIcon(device.type)}
                      <div>
                        <h4 className="text-sm font-semibold">{device.name}</h4>
                        <p className="text-muted-foreground text-xs capitalize">
                          {device.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${device.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
                    />
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <Badge
                        variant={device.isConnected ? 'default' : 'destructive'}
                      >
                        {device.isConnected ? 'Connected' : 'Offline'}
                      </Badge>
                    </div>

                    {device.batteryLevel && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Battery</span>
                        <div className="flex items-center gap-2">
                          <BatteryFull className="h-4 w-4" />
                          <span className="font-medium">
                            {device.batteryLevel}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span>Radio</span>
                      <div className="flex items-center gap-2">
                        <Progress
                          value={device.signalStrength}
                          className="h-1 w-16"
                        />
                        <span className="font-medium">
                          {device.signalStrength}%
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span>Data Rate</span>
                      <span className="font-medium">{device.dataRate}/min</span>
                    </div>

                    {device.lastSeen && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Last Seen</span>
                        <span className="text-muted-foreground">
                          {new Date(device.lastSeen).toLocaleTimeString()}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <CloudUpload className="h-4 w-4" />
            <AlertDescription>
              <strong>Live Data Configuration:</strong> These settings control
              how your Apple Health data is synchronized in real-time. Ensure
              you have granted proper permissions in the Apple Health app.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Data Synchronization</CardTitle>
                <CardDescription>
                  Configure which health metrics to sync
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { id: 'heart_rate', label: 'Heart Rate', enabled: true },
                    { id: 'steps', label: 'Steps & Movement', enabled: true },
                    {
                      id: 'walking_steadiness',
                      label: 'Walking Steadiness',
                      enabled: true,
                    },
                    { id: 'sleep', label: 'Sleep Analysis', enabled: false },
                    { id: 'activity', label: 'Workout Data', enabled: true },
                    {
                      id: 'blood_pressure',
                      label: 'Blood Pressure',
                      enabled: false,
                    },
                  ].map((metric) => (
                    <div
                      key={metric.id}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm font-medium">
                        {metric.label}
                      </span>
                      <Switch checked={metric.enabled} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Settings</CardTitle>
                <CardDescription>
                  WebSocket and connectivity options
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Auto-reconnect</span>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Background sync</span>
                    <Switch checked={true} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      High-frequency mode
                    </span>
                    <Switch checked={false} />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cellular data</span>
                    <Switch checked={true} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="technical" className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <CloudUpload className="h-4 w-4" />
            <AlertDescription>
              <strong>Technical Implementation:</strong> This shows the
              WebSocket-based architecture for real-time Apple Health data
              integration. In production, this connects to Apple's HealthKit
              APIs.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>WebSocket Connection</CardTitle>
                <CardDescription>
                  Real-time data streaming protocol
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span>Protocol</span>
                    <Badge variant="outline">WSS (Secure WebSocket)</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Endpoint</span>
                    <code className="bg-muted rounded px-2 py-1 text-xs">
                      wss://vitalsense-live.example.com/stream
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Heartbeat</span>
                    <span>30s intervals</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Reconnect</span>
                    <span>Exponential backoff</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Compression</span>
                    <Badge variant="outline">GZIP</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Data Pipeline</CardTitle>
                <CardDescription>Processing and analysis flow</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>1. Apple HealthKit</strong>
                    <p className="text-muted-foreground">
                      Real-time data from Apple Watch & iPhone
                    </p>
                  </div>
                  <div className="text-sm">
                    <strong>2. WebSocket Gateway</strong>
                    <p className="text-muted-foreground">
                      Secure data streaming infrastructure
                    </p>
                  </div>
                  <div className="text-sm">
                    <strong>3. Real-time Processing</strong>
                    <p className="text-muted-foreground">
                      Live analysis and fall risk assessment
                    </p>
                  </div>
                  <div className="text-sm">
                    <strong>4. Alert Generation</strong>
                    <p className="text-muted-foreground">
                      Immediate notifications and responses
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Implementation Requirements</CardTitle>
              <CardDescription>
                Production deployment considerations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h4 className="mb-3 font-semibold">Apple Integration</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• HealthKit framework integration</li>
                    <li>• Apple Developer Program enrollment</li>
                    <li>• Health data permissions</li>
                    <li>• Background app refresh</li>
                    <li>• Apple Watch connectivity</li>
                  </ul>
                </div>
                <div>
                  <h4 className="mb-3 font-semibold">Infrastructure</h4>
                  <ul className="space-y-2 text-sm">
                    <li>• WebSocket server (AWS/Firebase)</li>
                    <li>• Real-time database</li>
                    <li>• Authentication & authorization</li>
                    <li>• HIPAA compliance</li>
                    <li>• End-to-end encryption</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
