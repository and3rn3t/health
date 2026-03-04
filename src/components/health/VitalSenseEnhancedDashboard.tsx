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
import { useDeviceManagement } from '@/hooks/useDeviceManagement';
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
import { DeviceAttributionBadge } from './DeviceAttributionBadge';
import { DeviceStatusCard } from './DeviceStatusCard';

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
        return <Smartphone className="h-5 w-5" />;
      case 'watch_app':
        return <Activity className="h-5 w-5" />;
      default:
        return <Monitor className="h-5 w-5" />;
    }
  };

  return (
    <Card className="rounded-md border border-border">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center space-x-2 text-lg">
          <Shield className="h-5 w-5" />
          <span>Connected Devices</span>
        </CardTitle>
        <CardDescription className="text-base">
          Active health monitoring devices
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="space-y-4">
          {devices.length === 0 ? (
            <div className="text-vitalsense-gray py-8 text-center">
              <WifiOff className="mx-auto mb-2 h-8 w-8" />
              <p>No devices connected</p>
            </div>
          ) : (
            devices.map((device) => (
              <div
                key={device.id}
                className="flex items-center justify-between rounded-lg border border-vitalsense-secondary/10 bg-vitalsense-secondary/5 p-3"
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`rounded-lg p-2 ${
                      device.status === 'online'
                        ? 'bg-vitalsense-success/10 text-vitalsense-success'
                        : 'bg-vitalsense-gray/10 text-vitalsense-gray'
                    }`}
                  >
                    {getDeviceIcon(device.type)}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{device.name}</div>
                    <div className="text-vitalsense-gray text-xs capitalize">
                      {device.type.replace('_', ' ')}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {device.batteryLevel && (
                    <div className="text-vitalsense-gray text-xs">
                      {device.batteryLevel}%
                    </div>
                  )}
                  <div
                    className={`h-2 w-2 rounded-full ${
                      device.status === 'online'
                        ? 'bg-vitalsense-success'
                        : 'bg-vitalsense-gray'
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

export function VitalSenseEnhancedDashboard() {
  const {
    connectionStatus,
    liveMetrics,
    latestMetrics,
    clientPresence,
    isIOSConnected,
  } = useLiveHealthData();

  const { devices, hasConnectedDevices } = useDeviceManagement();

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
    <div className="space-y-4 md:space-y-5">
      {/* Header Section - VitalSense Branded */}
      <div className="py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <Heart className="h-8 w-8 text-vitalsense-primary" />
              <h1 className="text-3xl font-bold text-vitalsense-primary">
                VitalSense Live
              </h1>
            </div>
            <Badge
              variant={connectionStatus.connected ? 'default' : 'secondary'}
            >
              <div className="flex items-center space-x-1">
                {connectionStatus.connected ? (
                  <Wifi className="h-3 w-3" />
                ) : (
                  <WifiOff className="h-3 w-3" />
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
        <p className="text-vitalsense-gray mx-auto max-w-4xl text-lg leading-relaxed">
          Real-time health monitoring with live Apple HealthKit integration
        </p>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="metrics">Live Metrics</TabsTrigger>
          <TabsTrigger value="devices">Devices</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Health Metrics Grid - VitalSense Style */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 md:gap-6">
            {latestMetrics.heart_rate && (
              <Card
                className="rounded-md border border-border border-vitalsense-primary/20 bg-gradient-to-br from-vitalsense-primary/5 to-vitalsense-primary/10 cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
                onClick={() => {
                  // Navigate to analytics or detailed heart rate view
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { feature: 'analytics', metric: 'heartRate' } }));
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { feature: 'analytics', metric: 'heartRate' } }));
                    }
                  }
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium">
                    Heart Rate
                  </CardTitle>
                  <Heart className="h-5 w-5 text-vitalsense-primary" />
                </CardHeader>
                <CardContent className="pb-5 pt-0">
                  <div className="mb-2 text-3xl font-bold text-vitalsense-primary">
                    {Math.round(latestMetrics.heart_rate.value)}
                  </div>
                  <p className="text-vitalsense-gray text-xs">
                    {formatTimeAgo(latestMetrics.heart_rate.timestamp)} • bpm
                  </p>
                </CardContent>
              </Card>
            )}

            {latestMetrics.walking_steadiness && (
              <Card
                className="rounded-md border border-border border-vitalsense-secondary/20 bg-gradient-to-br from-vitalsense-secondary/5 to-vitalsense-secondary/10 cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
                onClick={() => {
                  // Navigate to fall risk or gait analysis
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { feature: 'fall-detection', metric: 'walkingSteadiness' } }));
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { feature: 'fall-detection', metric: 'walkingSteadiness' } }));
                    }
                  }
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium">
                    Walking Steadiness
                  </CardTitle>
                  <Activity className="h-5 w-5 text-vitalsense-secondary" />
                </CardHeader>
                <CardContent className="pb-5 pt-0">
                  <div className="mb-2 text-3xl font-bold text-vitalsense-secondary">
                    {Math.round(latestMetrics.walking_steadiness.value * 100)}
                  </div>
                  <p className="text-vitalsense-gray text-xs">
                    {formatTimeAgo(latestMetrics.walking_steadiness.timestamp)}{' '}
                    • percent
                  </p>
                </CardContent>
              </Card>
            )}

            {latestMetrics.step_count && (
              <Card
                className="from-vitalsense-accent/5 to-vitalsense-accent/10 border-vitalsense-accent/20 rounded-md border border-border bg-gradient-to-br cursor-pointer transition-shadow hover:shadow-md active:scale-[0.98]"
                onClick={() => {
                  // Navigate to analytics
                  if (typeof window !== 'undefined') {
                    window.dispatchEvent(new CustomEvent('navigate', { detail: { feature: 'analytics', metric: 'steps' } }));
                  }
                }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new CustomEvent('navigate', { detail: { feature: 'analytics', metric: 'steps' } }));
                    }
                  }
                }}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium">
                    Daily Steps
                  </CardTitle>
                  <MapPin className="text-vitalsense-accent h-5 w-5" />
                </CardHeader>
                <CardContent className="pb-5 pt-0">
                  <div className="text-vitalsense-accent mb-2 text-3xl font-bold">
                    {Math.round(
                      latestMetrics.step_count.value
                    ).toLocaleString()}
                  </div>
                  <p className="text-vitalsense-gray text-xs">
                    {formatTimeAgo(latestMetrics.step_count.timestamp)} • steps
                  </p>
                </CardContent>
              </Card>
            )}

            <Card className="rounded-md border border-border border-vitalsense-success/20 bg-gradient-to-br from-vitalsense-success/5 to-vitalsense-success/10">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-medium">
                  System Status
                </CardTitle>
                <Monitor className="h-5 w-5 text-vitalsense-success" />
              </CardHeader>
              <CardContent className="pb-5 pt-0">
                <div className="mb-2 text-3xl font-bold text-vitalsense-success">
                  {connectionStatus.connected ? 'Online' : 'Offline'}
                </div>
                <p className="text-vitalsense-gray text-xs">
                  {Math.round(connectionStatus.latency)}ms latency
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Device Status & Recent Activity Section */}
          <div className="grid gap-6 md:grid-cols-2">
            <DeviceStatusCard compact={false} showQuickActions={true} />

            <Card className="rounded-md border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Clock className="h-5 w-5" />
                  <span>Recent Activity</span>
                </CardTitle>
                <CardDescription className="text-base">
                  Live health data updates
                  {hasConnectedDevices && (
                    <span className="ml-2 text-xs">
                      from {devices.length} device{devices.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-6">
                  {liveMetrics.slice(0, 5).map((metric) => (
                    <div
                      key={`${metric.metricType}-${metric.timestamp}`}
                      className="flex items-center justify-between border-b border-border pb-4"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="h-2 w-2 rounded-full bg-vitalsense-success" />
                        <span className="text-sm font-medium capitalize">
                          {metric.metricType.replace('_', ' ')}
                        </span>
                      </div>
                      <div className="text-sm font-medium">
                        {Math.round(metric.value)} {metric.unit}
                      </div>
                    </div>
                  ))}
                  {liveMetrics.length === 0 && (
                    <div className="text-vitalsense-gray py-8 text-center">
                      <Activity className="mx-auto mb-2 h-8 w-8" />
                      <p>Waiting for live health data...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <DeviceStatus devices={connectedDevices} />
          </div>
        </TabsContent>

        <TabsContent value="metrics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card className="rounded-md border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Live Health Metrics</CardTitle>
                <CardDescription className="text-base">
                  Current health data values
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-6">
                  {Object.entries(latestMetrics).map(([key, metric]) => {
                    const multiplier = getMetricMultiplier(key);
                    const displayValue =
                      typeof metric.value === 'number'
                        ? Math.round(metric.value * multiplier)
                        : metric.value;

                    return (
                      <div
                        key={key}
                        className="flex items-center justify-between border-b border-border pb-4"
                      >
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-medium capitalize">
                            {key.replace('_', ' ')}
                          </span>
                          {metric.deviceId && (
                            <DeviceAttributionBadge
                              deviceId={metric.deviceId}
                              source={metric.source}
                              compact
                            />
                          )}
                        </div>
                        <span className="text-sm font-medium">
                          {displayValue} {metric.unit}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-md border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Performance</CardTitle>
                <CardDescription className="text-base">
                  Real-time monitoring stats
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-sm font-medium">Data Quality</span>
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
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-sm font-medium">Response Time</span>
                    <span className="text-sm font-medium">
                      {Math.round(connectionStatus.latency)}ms
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-sm font-medium">iOS Device</span>
                    <Badge variant={isIOSConnected() ? 'default' : 'secondary'}>
                      {isIOSConnected() ? 'Connected' : 'Disconnected'}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="devices" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <DeviceStatus devices={connectedDevices} />

            <Card className="rounded-md border border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">System Information</CardTitle>
                <CardDescription className="text-base">
                  Connected devices and server status
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-3">
                <div className="space-y-6">
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-sm font-medium">Active Devices</span>
                    <span className="text-sm font-medium">
                      {connectedDevices.length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-sm font-medium">Server Status</span>
                    <Badge
                      variant={
                        connectionStatus.connected ? 'default' : 'secondary'
                      }
                    >
                      {connectionStatus.connected ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between border-b border-border pb-4">
                    <span className="text-sm font-medium">Enhanced Server</span>
                    <Badge variant="default">Running on :3001</Badge>
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
