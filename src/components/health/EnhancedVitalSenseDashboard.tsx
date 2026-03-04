import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useLiveHealthData } from '@/hooks/useLiveHealthData';
import {
  Activity,
  Clock,
  Download,
  Heart,
  MapPin,
  Monitor,
  Settings,
  Shield,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface DeviceStatusProps {
  devices: Array<{
    id: string;
    name: string;
    type: 'ios_app' | 'web_app' | 'watch_app';
    status: 'online' | 'offline';
    lastSeen?: string;
    batteryLevel?: number;
  }>;
}

function DeviceStatus({ devices }: DeviceStatusProps) {
  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'ios_app':
        return <Smartphone className="w-5 h-5" />;
      case 'watch_app':
        return <Activity className="w-5 h-5" />;
      default:
        return <Monitor className="w-5 h-5" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Connected Devices</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {devices.length === 0 ? (
            <div className="py-8 text-center text-gray-500">
              <WifiOff className="mx-auto mb-2 h-8 w-8" />
              <p>No devices connected</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="p-3 bg-gray-50 flex items-center justify-between rounded-lg"
              >
                <div className="space-x-3 flex items-center">
                  <div
                    className={`rounded-lg p-2 ${
                      device.status === 'online'
                        ? 'bg-green-100 text-green-600'
                        : 'bg-gray-200 text-gray-400'
                    }`}
                  >
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{device.name}</div>
                    <div className="text-xs capitalize text-gray-500">
                      {device.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {device.batteryLevel && (
                    <div className="text-xs text-gray-500">
                      {device.batteryLevel}%
                    </div>
                  )}
                  <div
                    className={`h-2 w-2 rounded-full ${
                      device.status === 'online'
                        ? 'bg-green-500'
                        : 'bg-gray-400'
                    }`}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export function EnhancedVitalSenseDashboard() {
  const {
    connectionStatus,
    liveMetrics,
    latestMetrics,
    clientPresence,
    isIOSConnected,
  } = useLiveHealthData();

  const [selectedTab, setSelectedTab] = useState('overview');

  const getDeviceName = (clientType: string) => {
    if (clientType === 'ios_app') return 'iPhone';
    if (clientType === 'watch_app') return 'Apple Watch';
    return 'Web Browser';
  };

  const getMetricMultiplier = (metricKey: string) => {
    return metricKey === 'walking_steadiness' ? 100 : 1;
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return `${seconds}s ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  // Convert client presence to device format
  const connectedDevices = Object.values(clientPresence).map((presence) => ({
    id: `${presence.userId}-${presence.clientType}`,
    name: getDeviceName(presence.clientType),
    type: presence.clientType,
    status: presence.status,
    lastSeen: 'Just now',
  }));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Heart className="text-red-500 h-8 w-8" />
            <h1 className="text-2xl font-bold">
              VitalSense Enhanced Dashboard
            </h1>
          </div>
          <Badge variant={connectionStatus.connected ? 'default' : 'secondary'}>
            <div className="flex items-center space-x-1">
              {connectionStatus.connected ? (
                <Wifi className="w-3 h-3" />
              ) : (
                <WifiOff className="w-3 h-3" />
              )}
              <span>
                {connectionStatus.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </Badge>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
        </div>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Metrics</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Metrics Grid */}
          <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-4">
            {latestMetrics.heart_rate && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Heart Rate
                    </CardTitle>
                    <Heart className="text-red-500 h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(latestMetrics.heart_rate.value)}{' '}
                    <span className="text-sm font-normal">bpm</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(latestMetrics.heart_rate.timestamp)}
                  </p>
                </CardContent>
              </Card>
            )}

            {latestMetrics.walking_steadiness && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Walking Steadiness
                    </CardTitle>
                    <Activity className="text-green-500 h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(latestMetrics.walking_steadiness.value * 100)}{' '}
                    <span className="text-sm font-normal">%</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(latestMetrics.walking_steadiness.timestamp)}
                  </p>
                </CardContent>
              </Card>
            )}

            {latestMetrics.step_count && (
              <Card>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      Daily Steps
                    </CardTitle>
                    <MapPin className="text-blue-500 h-4 w-4" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.round(
                      latestMetrics.step_count.value
                    ).toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatTimeAgo(latestMetrics.step_count.timestamp)}
                  </p>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">
                    System Status
                  </CardTitle>
                  <Monitor className="text-purple-500 h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {connectionStatus.connected ? 'Online' : 'Offline'}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round(connectionStatus.latency)}ms latency
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Clock className="w-5 h-5" />
                  <span>Recent Activity</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {liveMetrics.slice(0, 5).map((metric) => (
                    <div
                      key={`${metric.metricType}-${metric.timestamp}`}
                      className="flex items-center justify-between border-b py-2 last:border-0"
                    >
                      <div className="space-x-3 flex items-center">
                        <div className="bg-green-500 h-2 w-2 rounded-full" />
                        <span className="text-sm capitalize">
                          {metric.metricType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {Math.round(metric.value)} {metric.unit}
                      </div>
                    </div>
                  ))}
                  {liveMetrics.length === 0 && (
                    <div className="text-muted-foreground py-8 text-center">
                      <Activity className="mx-auto mb-2 h-8 w-8" />
                      <p>No recent activity</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <DeviceStatus devices={connectedDevices} />
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Health Metrics Details</CardTitle>
                <CardDescription>Current health data summary</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(latestMetrics).map(([key, metric]) => {
                    const multiplier = getMetricMultiplier(key);
                    const displayValue =
                      typeof metric.value === 'number'
                        ? Math.round(metric.value * multiplier)
                        : metric.value;

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {key.replace('_', ' ')}
                        </span>
                        <span className="font-medium">
                          {displayValue} {metric.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Quality</span>
                    <Badge
                      variant={
                        connectionStatus.dataQuality === 'realtime'
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {connectionStatus.dataQuality}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Latency</span>
                    <span className="font-medium">
                      {Math.round(connectionStatus.latency)}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">iOS Connected</span>
                    <Badge variant={isIOSConnected() ? 'default' : 'secondary'}>
                      {isIOSConnected() ? 'Yes' : 'No'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <DeviceStatus devices={connectedDevices} />

            <Card>
              <CardHeader>
                <CardTitle>System Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Active Devices</span>
                    <span className="font-medium">
                      {connectedDevices.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Server Status</span>
                    <Badge
                      variant={
                        connectionStatus.connected ? 'default' : 'secondary'
                      }
                    >
                      {connectionStatus.connected ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Data Points/Min</span>
                    <span className="font-medium">
                      {Math.round(connectionStatus.latency)}
                    </span>
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
