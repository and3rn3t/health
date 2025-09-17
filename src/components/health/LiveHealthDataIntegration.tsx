import { MobilityScoreCard } from '@/components/health/MobilityScoreCard';
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
import { useLiveInsights } from '@/hooks/useLiveInsights';
import {
  ConnectionStatus,
  getLiveHealthDataSync,
  LiveHealthMetric,
} from '@/lib/liveHealthDataSync';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  BatteryFull,
  CheckCircle,
  Clock,
  CloudUpload,
  Globe,
  Heart,
  Monitor,
  Phone,
  Radio,
  Wifi,
  WifiOff,
  Zap,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState } from 'react';

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
  // Persist as strings for KV compatibility
  const [isConnected, setIsConnected] = useKV<string>(
    'live-data-connected',
    'false'
  );
  const [liveDataEnabled, setLiveDataEnabled] = useKV<string>(
    'live-data-enabled',
    'false'
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
  const liveDataSync = getLiveHealthDataSync('default-user');

  const updateDevicesConnection = useCallback((connected: boolean) => {
    setDevices((prev) =>
      prev.map((device) => ({
        ...device,
        isConnected: connected,
        lastSeen: connected ? new Date().toISOString() : device.lastSeen,
      }))
    );
  }, []);

  const handleMetric = useCallback((data: LiveHealthMetric) => {
    setLiveMetrics((prev) => [data, ...prev.slice(0, 49)]);
    setDevices((prev) =>
      prev.map((device) =>
        device.id === data.deviceId
          ? {
              ...device,
              lastSeen: data.timestamp,
              dataRate: device.dataRate + 1,
            }
          : device
      )
    );
    setDataStats((prev) => ({
      ...prev,
      totalMetricsReceived: prev.totalMetricsReceived + 1,
      lastUpdateTime: data.timestamp,
      dataQualityScore: Math.min(100, prev.dataQualityScore + 0.1),
    }));
  }, []);
  // Compute insights from live metrics (with persisted config inside)
  const { insights, composite } = useLiveInsights(liveMetrics);

  const insightTone = (level: 'info' | 'warning' | 'critical') => {
    if (level === 'critical') return 'border-red-300 bg-red-50';
    if (level === 'warning') return 'border-amber-300 bg-amber-50';
    return 'border-blue-200 bg-blue-50';
  };

  // Poll connection status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const status = liveDataSync.getConnectionStatus();
      setConnectionStatus(status);
      const connectedStr = status.connected ? 'true' : 'false';
      setIsConnected(connectedStr);
      updateDevicesConnection(status.connected);
    }, 2000);
    return () => clearInterval(interval);
  }, [liveDataSync, setIsConnected, updateDevicesConnection]);

  // Calculate metrics per minute
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected === 'true') {
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

  const toggleLiveData = async (_checked?: boolean) => {
    if (liveDataEnabled !== 'true') {
      setLiveDataEnabled('true');
      const connected = await liveDataSync.connect();
      if (connected) {
        // Subscribe to all metric types
        liveDataSync.subscribe({
          id: 'main-subscription',
          metricTypes: [
            'heart_rate',
            'steps',
            'walking_steadiness',
            'gait_speed',
            'cadence',
            'stride_length',
            'step_asymmetry',
            'double_support_time',
            'posture_angle',
            'stability_index',
            'sway_balance',
            'activity',
            'sleep',
          ],
          callback: (data) => {
            handleMetric(data);
          },
          filters: {
            minConfidence: 0.7,
          },
        });
      }
    } else {
      setLiveDataEnabled('false');
      liveDataSync.disconnect();
      liveDataSync.unsubscribe('main-subscription');
    }
  };

  const getConnectionIcon = () => {
    if (isConnected !== 'true') {
      return <WifiOff className="h-5 w-5 text-red-500" />;
    }
    if (connectionStatus.dataQuality === 'excellent') {
      return <Wifi className="h-5 w-5 text-green-500" />;
    } else if (connectionStatus.dataQuality === 'good') {
      return <Wifi className="h-5 w-5 text-yellow-500" />;
    }
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
        return <Heart className="text-red-500 h-4 w-4" />;
      case 'steps':
        return <Activity className="text-blue-500 h-4 w-4" />;
      case 'walking_steadiness':
        return <Radio className="text-green-500 h-4 w-4" />;
      case 'gait_speed':
        return <Activity className="text-emerald-500 h-4 w-4" />;
      case 'cadence':
        return <Activity className="text-cyan-500 h-4 w-4" />;
      case 'stride_length':
        return <Activity className="text-teal-500 h-4 w-4" />;
      case 'step_asymmetry':
        return <AlertTriangle className="text-amber-500 h-4 w-4" />;
      case 'double_support_time':
        return <Clock className="text-indigo-500 h-4 w-4" />;
      case 'posture_angle':
        return <Monitor className="text-fuchsia-500 h-4 w-4" />;
      case 'stability_index':
        return <CheckCircle className="text-lime-600 h-4 w-4" />;
      case 'sway_balance':
        return <Radio className="text-rose-500 h-4 w-4" />;
      case 'activity':
        return <Zap className="text-yellow-500 h-4 w-4" />;
      case 'sleep':
        return <Clock className="text-purple-500 h-4 w-4" />;
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

  // Helpers to extract latest metric by type
  const getLatestByType = useCallback(
    (type: string) => liveMetrics.find((m) => m.metricType === type),
    [liveMetrics]
  );

  const formatValue = (m?: LiveHealthMetric) => {
    if (!m) return '—';
    const v = typeof m.value === 'number' ? m.value : Number(m.value);
    const rounded = Number.isFinite(v) ? v.toFixed(2) : String(m.value);
    const unitSuffix = m.unit ? ' ' + m.unit : '';
    return rounded + unitSuffix;
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
        <div className="gap-3 flex items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Live Data</span>
            <Switch
              checked={liveDataEnabled === 'true'}
              onCheckedChange={toggleLiveData}
            />
          </div>
          {getConnectionIcon()}
        </div>
      </div>

      {/* Connection Status Alert */}
      {liveDataEnabled === 'true' && isConnected !== 'true' && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Connecting to Apple Health live data stream... This may take a few
            moments.
          </AlertDescription>
        </Alert>
      )}

      {/* Main Stats */}
      <div className="md:grid-cols-4 grid grid-cols-1 gap-4">
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
          {/* Composite Mobility / Fall Risk */}
          <MobilityScoreCard
            mobilityScore={composite.mobilityScore}
            riskPercent={composite.risk * 100}
            topFactors={Object.entries(composite.components)
              .sort((a, b) => b[1] - a[1])
              .slice(0, 3)
              .map(([k, v]) => ({
                label: k.replace(/_/g, ' '),
                percent: v * 100,
              }))}
          />
          {/* AI/ML Insights */}
          <Card>
            <CardHeader>
              <CardTitle>Live Insights</CardTitle>
              <CardDescription>
                Quick, on-device assessments from gait, posture, and stability
              </CardDescription>
            </CardHeader>
            <CardContent>
              {insights.length === 0 ? (
                <div className="text-muted-foreground text-sm">
                  No insights yet. Start moving to generate insights from your
                  gait and balance.
                </div>
              ) : (
                <div className="gap-3 md:grid-cols-2 grid grid-cols-1">
                  {insights.map((ins) => (
                    <div
                      key={ins.id}
                      className={`p-3 rounded-lg border ${insightTone(ins.level)}`}
                    >
                      <div className="text-xs text-muted-foreground mb-1 uppercase tracking-wide">
                        {ins.metricType.replace(/_/g, ' ')} • {ins.level}
                      </div>
                      <div className="font-semibold">{ins.title}</div>
                      <div className="text-muted-foreground text-sm">
                        {ins.message}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Gait, Posture & Stability Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Gait, Posture & Stability</CardTitle>
              <CardDescription>
                Real-time indicators that influence fall risk and mobility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="md:grid-cols-3 grid grid-cols-1 gap-4 lg:grid-cols-4">
                <div className="bg-muted p-3 rounded-lg">
                  <div className="mb-2 flex items-center gap-2">
                    {getMetricIcon('gait_speed')}
                    <span className="text-sm font-medium">Gait Speed</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatValue(getLatestByType('gait_speed'))}
                  </div>
                  <div className="text-muted-foreground text-xs">m/s</div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="mb-2 flex items-center gap-2">
                    {getMetricIcon('cadence')}
                    <span className="text-sm font-medium">Cadence</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatValue(getLatestByType('cadence'))}
                  </div>
                  <div className="text-muted-foreground text-xs">steps/min</div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="mb-2 flex items-center gap-2">
                    {getMetricIcon('stride_length')}
                    <span className="text-sm font-medium">Stride Length</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatValue(getLatestByType('stride_length'))}
                  </div>
                  <div className="text-muted-foreground text-xs">meters</div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="mb-2 flex items-center gap-2">
                    {getMetricIcon('step_asymmetry')}
                    <span className="text-sm font-medium">Step Asymmetry</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatValue(getLatestByType('step_asymmetry'))}
                  </div>
                  <div className="text-muted-foreground text-xs">percent</div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="mb-2 flex items-center gap-2">
                    {getMetricIcon('double_support_time')}
                    <span className="text-sm font-medium">Double Support</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatValue(getLatestByType('double_support_time'))}
                  </div>
                  <div className="text-muted-foreground text-xs">percent</div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="mb-2 flex items-center gap-2">
                    {getMetricIcon('posture_angle')}
                    <span className="text-sm font-medium">Posture Angle</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatValue(getLatestByType('posture_angle'))}
                  </div>
                  <div className="text-muted-foreground text-xs">degrees</div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="mb-2 flex items-center gap-2">
                    {getMetricIcon('stability_index')}
                    <span className="text-sm font-medium">Stability Index</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatValue(getLatestByType('stability_index'))}
                  </div>
                  <div className="text-muted-foreground text-xs">0–100</div>
                </div>

                <div className="bg-muted p-3 rounded-lg">
                  <div className="mb-2 flex items-center gap-2">
                    {getMetricIcon('sway_balance')}
                    <span className="text-sm font-medium">Sway / Balance</span>
                  </div>
                  <div className="text-xl font-bold">
                    {formatValue(getLatestByType('sway_balance'))}
                  </div>
                  <div className="text-muted-foreground text-xs">cm</div>
                </div>
              </div>
            </CardContent>
          </Card>
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
                      <Activity className="text-muted-foreground h-12 w-12 mx-auto mb-4" />
                      <p className="text-muted-foreground text-sm">
                        {liveDataEnabled === 'true'
                          ? 'Waiting for live data...'
                          : 'Enable live data to see metrics'}
                      </p>
                    </div>
                  ) : (
                    liveMetrics.slice(0, 10).map((metric) => (
                      <div
                        key={`${metric.deviceId ?? ''}-${metric.timestamp}`}
                        className="bg-muted p-3 flex items-center justify-between rounded-lg"
                      >
                        <div className="gap-3 flex items-center">
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
                              <span className="text-xs ml-1">
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
                      <span className="text-green-600 text-sm font-semibold">
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
                      <span className="text-blue-600 text-sm font-semibold">
                        {isConnected === 'true' ? '99.9%' : '0%'}
                      </span>
                    </div>
                    <Progress
                      value={isConnected === 'true' ? 99.9 : 0}
                      className="h-2"
                    />
                  </div>

                  <div>
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-sm font-medium">
                        Data Freshness
                      </span>
                      <span className="text-green-600 text-sm font-semibold">
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
          <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-3">
            {devices.map((device) => (
              <Card key={device.id}>
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="gap-3 flex items-center">
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
                          className="w-16 h-1"
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

          <div className="md:grid-cols-2 grid grid-cols-1 gap-6">
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

            <ThresholdsConfigCard />
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

          <div className="md:grid-cols-2 grid grid-cols-1 gap-6">
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
                    <code className="bg-muted text-xs rounded px-2 py-1">
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
              <div className="md:grid-cols-2 grid grid-cols-1 gap-6">
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

function ThresholdsConfigCard() {
  const [thresholdsKV, setThresholdsKV] = useKV<string>(
    'insights-thresholds',
    ''
  );
  const [weightsKV, setWeightsKV] = useKV<string>('insights-weights', '');
  const [thresholdsText, setThresholdsText] = useState<string>(
    thresholdsKV ?? ''
  );
  const [weightsText, setWeightsText] = useState<string>(weightsKV ?? '');
  const [status, setStatus] = useState<string>('');

  useEffect(() => setThresholdsText(thresholdsKV ?? ''), [thresholdsKV]);
  useEffect(() => setWeightsText(weightsKV ?? ''), [weightsKV]);

  const pretty = useCallback((txt: string) => {
    try {
      if (!txt) return '';
      return JSON.stringify(JSON.parse(txt), null, 2);
    } catch {
      return txt; // keep as-is if not valid JSON yet
    }
  }, []);

  const isValidJson = useCallback((txt: string) => {
    if (!txt) return true;
    try {
      JSON.parse(txt);
      return true;
    } catch {
      return false;
    }
  }, []);

  const onSave = useCallback(() => {
    const valid = isValidJson(thresholdsText) && isValidJson(weightsText);
    if (!valid) {
      setStatus('Invalid JSON');
      setTimeout(() => setStatus(''), 2000);
      return;
    }
    setThresholdsKV(pretty(thresholdsText));
    setWeightsKV(pretty(weightsText));
    setStatus('Saved');
    setTimeout(() => setStatus(''), 1500);
  }, [
    thresholdsText,
    weightsText,
    setThresholdsKV,
    setWeightsKV,
    pretty,
    isValidJson,
  ]);

  const examples = useMemo(
    () => `{
  "gait_speed": { "warn": 1.0, "critical": 0.8, "direction": "low-is-bad" },
  "stability_index": { "warn": 60, "critical": 40, "direction": "low-is-bad" },
  "double_support_time": { "warn": 30, "critical": 40, "direction": "high-is-bad" },
  "step_asymmetry": { "warn": 4, "critical": 10, "direction": "high-is-bad" },
  "sway_balance": { "warn": 1.5, "critical": 2.5, "direction": "high-is-bad" }
}`,
    []
  );

  const weightsExample = useMemo(
    () => `{
  "gait_speed": 0.4,
  "stability_index": 0.3,
  "double_support_time": 0.2,
  "step_asymmetry": 0.1
}`,
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights Configuration</CardTitle>
        <CardDescription>
          Customize thresholds and weights for insights and composite score
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="md:grid-cols-2 grid grid-cols-1 gap-4">
          <div>
            <div className="mb-2 text-sm font-medium">Thresholds (JSON)</div>
            <textarea
              className="h-44 text-xs w-full rounded-md border p-2 font-mono"
              value={thresholdsText}
              onChange={(e) => setThresholdsText(e.target.value)}
              placeholder={examples}
            />
          </div>
          <div>
            <div className="mb-2 text-sm font-medium">Weights (JSON)</div>
            <textarea
              className="h-44 text-xs w-full rounded-md border p-2 font-mono"
              value={weightsText}
              onChange={(e) => setWeightsText(e.target.value)}
              placeholder={weightsExample}
            />
          </div>
        </div>
        <div className="gap-3 mt-4 flex items-center">
          <Button onClick={onSave}>Save</Button>
          {status && (
            <span className="text-xs text-muted-foreground">{status}</span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
