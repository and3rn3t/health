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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLiveHealthData } from '@/hooks/useLiveHealthData';
import { ProcessedHealthData } from '@/types';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle,
  CloudUpload,
  Globe,
  Heart,
  Monitor,
  Pause,
  Phone,
  Play,
  Shield,
  Users,
  Wifi,
  WifiOff,
  X,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface MonitoringStatus {
  isActive: boolean;
  lastUpdate: string;
  connectionQuality: 'excellent' | 'good' | 'poor' | 'disconnected';
  devicesConnected: number;
  alertsToday: number;
  uptime: string;
}

interface AlertEvent {
  id: string;
  timestamp: string;
  type:
    | 'fall_detected'
    | 'heart_rate_anomaly'
    | 'movement_pattern'
    | 'device_offline'
    | 'manual_alert';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  resolved: boolean;
  responseTime?: string;
}

interface ConnectedDevice {
  id: string;
  name: string;
  type: 'apple_watch' | 'iphone' | 'smart_home' | 'sensor';
  status: 'online' | 'offline' | 'warning';
  lastSeen: string;
  batteryLevel?: number;
}

interface RealTimeMonitoringHubProps {
  healthData: ProcessedHealthData;
}

// Simplified shape of the connection status needed by subcomponents
interface ConnectionStatusLike {
  connected: boolean;
  latency: number;
  dataQuality: 'realtime' | 'delayed' | 'offline';
}

function SystemPerformanceCard({
  status,
}: Readonly<{ status: ConnectionStatusLike }>) {
  const qualityColor = (() => {
    switch (status.dataQuality) {
      case 'realtime':
        return 'text-green-600';
      case 'delayed':
        return 'text-blue-600';
      default:
        return 'text-red-600';
    }
  })();
  const qualityProgress = (() => {
    switch (status.dataQuality) {
      case 'realtime':
        return 100;
      case 'delayed':
        return 60;
      default:
        return 0;
    }
  })();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          System Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Live Data Connection</span>
              <span
                className={`text-sm font-semibold ${status.connected ? 'text-green-600' : 'text-red-600'}`}
              >
                {status.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            <Progress value={status.connected ? 100 : 0} className="h-2" />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Response Time</span>
              <span className="text-sm font-semibold text-blue-600">
                {Math.round(status.latency)}ms
              </span>
            </div>
            <Progress
              value={Math.max(0, 100 - status.latency / 2)}
              className="h-2"
            />
          </div>
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="text-sm font-medium">Data Quality</span>
              <span className={`text-sm font-semibold ${qualityColor}`}>
                {status.dataQuality}
              </span>
            </div>
            <Progress value={qualityProgress} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatusCards({
  monitoringActive,
  status,
  metricsPerMin,
  unreadAlerts,
}: Readonly<{
  monitoringActive: boolean;
  status: ConnectionStatusLike;
  metricsPerMin: number;
  unreadAlerts: number;
}>) {
  const connectionIcon = status.connected ? (
    <Wifi
      className={`h-5 w-5 ${status.dataQuality === 'realtime' ? 'text-green-500' : 'text-yellow-500'}`}
    />
  ) : (
    <WifiOff className="h-5 w-5 text-red-500" />
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Status
              </p>
              <div className="mt-1 flex items-center gap-2">
                {monitoringActive ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <X className="h-4 w-4 text-red-500" />
                )}
                <span className="font-semibold">
                  {monitoringActive ? 'Active' : 'Inactive'}
                </span>
              </div>
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
                Connection
              </p>
              <div className="mt-1 flex items-center gap-2">
                {connectionIcon}
                <span
                  className={`font-semibold capitalize ${status.connected ? 'text-green-600' : 'text-red-600'}`}
                >
                  {status.connected ? status.dataQuality : 'offline'}
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
              <p className="text-2xl font-bold">{metricsPerMin}</p>
              <p className="text-muted-foreground text-xs">metrics/min</p>
            </div>
            <Zap className="text-muted-foreground h-8 w-8" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">
                Unread Alerts
              </p>
              <p className="text-2xl font-bold text-orange-600">
                {unreadAlerts}
              </p>
            </div>
            <Bell className="text-muted-foreground h-8 w-8" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LiveMetricsCard({
  heartRate,
  steps,
  walkingSteadiness,
  isConnected,
  lastUpdate,
  totalMetrics,
}: Readonly<{
  heartRate: number | undefined;
  steps: number | undefined;
  walkingSteadiness: number | undefined;
  isConnected: boolean;
  lastUpdate: string;
  totalMetrics: number;
}>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5" />
          Live Health Metrics
        </CardTitle>
        <CardDescription>Real-time data from connected devices</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm">Heart Rate</span>
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${heartRate ? 'animate-pulse bg-green-500' : 'bg-gray-300'}`}
              />
              <span className="font-semibold">
                {typeof heartRate === 'number'
                  ? `${Math.round(heartRate)} BPM`
                  : '--'}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Daily Steps</span>
            <div className="flex items-center gap-2">
              <Progress
                value={
                  typeof steps === 'number' ? Math.min(steps / 100, 100) : 0
                }
                className="h-2 w-20"
              />
              <span className="font-semibold">
                {typeof steps === 'number' ? Math.round(steps) : 0}
              </span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Walking Steadiness</span>
            <Badge
              variant="outline"
              className={
                walkingSteadiness && walkingSteadiness > 0.8
                  ? 'border-green-200 text-green-700'
                  : 'border-yellow-200 text-yellow-700'
              }
            >
              {walkingSteadiness && walkingSteadiness > 0.8
                ? 'Good'
                : 'Monitoring'}
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Last Update</span>
            <span className="text-muted-foreground text-sm">
              {isConnected ? 'Live' : lastUpdate}
            </span>
          </div>
          {isConnected && (
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Metrics</span>
              <span className="text-sm font-medium">{totalMetrics}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function EmergencyResponseCard({
  emergencyContactsCount,
}: Readonly<{ emergencyContactsCount: number }>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Phone className="h-5 w-5" />
          Emergency Response
        </CardTitle>
        <CardDescription>Quick access to emergency features</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <Button variant="destructive" className="w-full" size="lg">
            <Phone className="mr-2 h-4 w-4" />
            Emergency Alert
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm">
              <Users className="mr-2 h-4 w-4" />
              Call Family
            </Button>
            <Button variant="outline" size="sm">
              <Shield className="mr-2 h-4 w-4" />
              Medical ID
            </Button>
          </div>
          <div className="text-muted-foreground text-sm">
            {emergencyContactsCount} emergency contacts configured
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function RealTimeMonitoringHub({
  healthData: _healthData,
}: Readonly<RealTimeMonitoringHubProps>) {
  const [monitoringActive, setMonitoringActive] = useKV<string>(
    'monitoring-active',
    'false'
  );
  const [alerts, setAlerts] = useKV<AlertEvent[]>('realtime-alerts', []);
  const [devices, setDevices] = useKV<ConnectedDevice[]>(
    'connected-devices',
    []
  );
  const [emergencyContacts] = useKV<string[]>('emergency-contacts', []);

  // Live data hook API
  const live = useLiveHealthData();

  const [currentStatus, setCurrentStatus] = useState<MonitoringStatus>({
    isActive: monitoringActive === 'true',
    lastUpdate: new Date().toLocaleTimeString(),
    connectionQuality: 'disconnected',
    devicesConnected: 3,
    alertsToday: 2,
    uptime: '99.8%',
  });

  // Update status based on live data connection
  useEffect(() => {
    const qualityMap: Record<string, MonitoringStatus['connectionQuality']> = {
      realtime: 'excellent',
      delayed: 'good',
      offline: 'disconnected',
    };
    setCurrentStatus((prev) => ({
      ...prev,
      isActive: monitoringActive === 'true' && live.connectionStatus.connected,
      lastUpdate: live.connectionStatus.lastHeartbeat || prev.lastUpdate,
      connectionQuality: qualityMap[live.connectionStatus.dataQuality],
      devicesConnected: live.connectionStatus.connected ? 3 : 0,
    }));
  }, [monitoringActive, live.connectionStatus]);

  // Real-time updates when live data is active
  useEffect(() => {
    if (monitoringActive === 'true' && live.connectionStatus.connected) {
      const interval = setInterval(() => {
        setCurrentStatus((prev) => ({
          ...prev,
          lastUpdate: new Date().toLocaleTimeString(),
        }));
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [monitoringActive, live.connectionStatus.connected]);

  // Initialize default devices if none exist
  useEffect(() => {
    if ((devices ?? []).length === 0) {
      const defaultDevices: ConnectedDevice[] = [
        {
          id: 'apple-Watch-1',
          name: 'Apple Watch Series 9',
          type: 'apple_watch',
          status: 'online',
          lastSeen: new Date().toISOString(),
          batteryLevel: 87,
        },
        {
          id: 'iphone-1',
          name: 'iPhone 15 Pro',
          type: 'iphone',
          status: 'online',
          lastSeen: new Date().toISOString(),
          batteryLevel: 92,
        },
        {
          id: 'home-sensor-1',
          name: 'Living Room Motion Sensor',
          type: 'smart_home',
          status: 'online',
          lastSeen: new Date().toISOString(),
        },
      ];
      setDevices(defaultDevices);
    }
  }, [devices, setDevices]);

  const toggleMonitoring = async () => {
    const newStatus = monitoringActive === 'true' ? 'false' : 'true';
    setMonitoringActive(newStatus);

    if (newStatus === 'true') {
      await live.connectToHealthData();
      toast.success('Real-time monitoring activated');
    } else {
      live.disconnectFromHealthData();
      toast.info('Real-time monitoring paused');
    }
  };

  const simulateAlert = () => {
    const newAlert: AlertEvent = {
      id: `alert-${Date.now()}`,
      timestamp: new Date().toISOString(),
      type: 'movement_pattern',
      severity: 'medium',
      description:
        'Unusual movement pattern detected - possible increased fall risk',
      resolved: false,
    };

    setAlerts((currentAlerts = []) => [newAlert, ...currentAlerts]);
    toast.warning('New alert generated for testing');
  };

  const resolveAlert = (alertId: string) => {
    setAlerts((currentAlerts = []) =>
      currentAlerts.map((alert) =>
        alert.id === alertId
          ? { ...alert, resolved: true, responseTime: '2m 15s' }
          : alert
      )
    );
    toast.success('Alert resolved');
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'apple_watch':
        return <Activity className="h-4 w-4" />;
      case 'iphone':
        return <Phone className="h-4 w-4" />;
      case 'smart_home':
        return <Monitor className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getDeviceStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'text-green-500';
      case 'warning':
        return 'text-yellow-500';
      case 'offline':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'border-blue-200 bg-blue-50';
      case 'medium':
        return 'border-yellow-200 bg-yellow-50';
      case 'high':
        return 'border-orange-200 bg-orange-50';
      case 'critical':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const unreadAlerts = (alerts ?? []).filter((alert) => !alert.resolved).length;

  // Get current metrics from live data
  const currentHeartRate = live.latestMetrics.heart_rate;
  const currentSteps = live.latestMetrics.step_count;
  const currentWalkingSteadiness = live.latestMetrics.walking_steadiness;
  const heartRateVal = currentHeartRate
    ? Number(currentHeartRate.value)
    : undefined;
  const stepsVal = currentSteps ? Number(currentSteps.value) : undefined;
  const walkingVal = currentWalkingSteadiness
    ? Number(currentWalkingSteadiness.value)
    : undefined;

  // (Performance card now computes its own derived UI values)

  return (
    <div className="space-y-6">
      {/* Header Status */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <Monitor className="h-6 w-6" />
            Real-Time Monitoring Hub
          </h2>
          <p className="text-muted-foreground">
            24/7 health monitoring and emergency response system
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleMonitoring}
            variant={monitoringActive ? 'destructive' : 'default'}
            className="flex items-center gap-2"
          >
            {monitoringActive ? (
              <Pause className="h-4 w-4" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            {monitoringActive ? 'Pause Monitoring' : 'Start Monitoring'}
          </Button>
          <Button onClick={simulateAlert} variant="outline" size="sm">
            Test Alert
          </Button>
        </div>
      </div>

      {/* System Status Cards */}
      <StatusCards
        monitoringActive={monitoringActive === 'true'}
        status={{
          connected: live.connectionStatus.connected,
          latency: live.connectionStatus.latency,
          dataQuality: live.connectionStatus.dataQuality,
        }}
        metricsPerMin={Math.max(0, Math.min(120, live.liveMetrics.length))}
        unreadAlerts={unreadAlerts}
      />

      {/* Main Monitoring Interface */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="alerts" className="relative">
            Alerts
            {unreadAlerts > 0 && (
              <Badge
                variant="destructive"
                className="ml-2 h-5 w-5 rounded-full p-0 text-xs"
              >
                {unreadAlerts}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <LiveMetricsCard
              heartRate={heartRateVal}
              steps={stepsVal}
              walkingSteadiness={walkingVal}
              isConnected={live.connectionStatus.connected}
              lastUpdate={currentStatus.lastUpdate}
              totalMetrics={live.liveMetrics.length}
            />
            <EmergencyResponseCard
              emergencyContactsCount={(emergencyContacts ?? []).length}
            />
          </div>

          {/* System Performance */}
          <SystemPerformanceCard
            status={{
              connected: live.connectionStatus.connected,
              latency: live.connectionStatus.latency,
              dataQuality: live.connectionStatus.dataQuality,
            }}
          />
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Recent Alerts</h3>
            <Badge variant="outline">
              {(alerts ?? []).length} total alerts
            </Badge>
          </div>

          <div className="space-y-3">
            {(alerts ?? []).length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center">
                  <CheckCircle className="mx-auto mb-4 h-12 w-12 text-green-500" />
                  <h3 className="mb-2 font-semibold">No Active Alerts</h3>
                  <p className="text-muted-foreground text-sm">
                    All systems operating normally
                  </p>
                </CardContent>
              </Card>
            ) : (
              (alerts ?? []).map((alert) => (
                <Card
                  key={alert.id}
                  className={getSeverityColor(alert.severity)}
                >
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          <Badge variant="outline" className="text-xs">
                            {alert.type.replace('_', ' ')}
                          </Badge>
                          <Badge
                            variant={
                              alert.severity === 'critical'
                                ? 'destructive'
                                : 'secondary'
                            }
                            className="text-xs"
                          >
                            {alert.severity}
                          </Badge>
                          {alert.resolved && (
                            <Badge
                              variant="default"
                              className="bg-green-100 text-xs text-green-800"
                            >
                              Resolved
                            </Badge>
                          )}
                        </div>
                        <p className="mb-1 text-sm font-medium">
                          {alert.description}
                        </p>
                        <div className="text-muted-foreground flex items-center gap-4 text-xs">
                          <span>
                            {new Date(alert.timestamp).toLocaleString()}
                          </span>
                          {alert.responseTime && (
                            <span>Resolved in {alert.responseTime}</span>
                          )}
                        </div>
                      </div>
                      {!alert.resolved && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resolveAlert(alert.id)}
                        >
                          Resolve
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(devices ?? []).map((device) => (
              <Card key={device.id}>
                <CardContent className="pt-4">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getDeviceIcon(device.type)}
                      <div>
                        <h4 className="text-sm font-semibold">{device.name}</h4>
                        <p className="text-muted-foreground text-xs capitalize">
                          {device.type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`h-2 w-2 rounded-full ${getDeviceStatusColor(device.status)}`}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span>Status</span>
                      <span
                        className={`font-medium capitalize ${getDeviceStatusColor(device.status)}`}
                      >
                        {device.status}
                      </span>
                    </div>

                    {typeof device.batteryLevel === 'number' && (
                      <div className="flex items-center justify-between text-sm">
                        <span>Battery</span>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={device.batteryLevel}
                            className="h-1 w-16"
                          />
                          <span className="font-medium">
                            {device.batteryLevel}%
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-sm">
                      <span>Last Seen</span>
                      <span className="text-muted-foreground">
                        {new Date(device.lastSeen).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="infrastructure" className="space-y-6">
          <Alert className="border-blue-200 bg-blue-50">
            <CloudUpload className="h-4 w-4" />
            <AlertDescription>
              <strong>Infrastructure Status:</strong> This represents the
              planned cloud-based monitoring infrastructure for Phase 5. Current
              implementation shows simulated data for development and testing
              purposes.
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cloud Infrastructure</CardTitle>
                <CardDescription>
                  Monitoring platform architecture
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Load Balancer</span>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">API Gateway</span>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Real-time Database</span>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      Online
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">WebSocket Service</span>
                    <Badge
                      variant="outline"
                      className="border-green-200 text-green-700"
                    >
                      Online
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Required Services</CardTitle>
                <CardDescription>Phase 5 implementation needs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm">
                    <strong>Cloud Platform:</strong> AWS/Firebase for
                    scalability
                  </div>
                  <div className="text-sm">
                    <strong>Real-time Database:</strong> Firebase Realtime
                    Database or AWS DynamoDB
                  </div>
                  <div className="text-sm">
                    <strong>Push Notifications:</strong> FCM/APNs integration
                  </div>
                  <div className="text-sm">
                    <strong>API Gateway:</strong> Rate limiting and
                    authentication
                  </div>
                  <div className="text-sm">
                    <strong>Monitoring:</strong> Health checks and alerting
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
