import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  useDeviceManagement,
  type ConnectedDevice,
  type DeviceType,
} from '@/hooks/useDeviceManagement';
import { formatDistanceToNow } from 'date-fns';
import {
  AlertTriangle,
  Battery,
  Bluetooth,
  Loader2,
  MoreVertical,
  Plus,
  Radio,
  Settings,
  Smartphone,
  Trash2,
  Watch,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { DeviceSetupWizard } from './DeviceSetupWizard';

export function ConnectedDevices() {
  const {
    devices,
    connectDevice,
    disconnectDevice,
    removeDevice,
    syncDevice,
    hasConnectedDevices,
  } = useDeviceManagement();

  // Check if we should auto-open the setup wizard (from Setup button)
  const [showSetupWizard, setShowSetupWizard] = useState(() => {
    // Check for URL parameter or session storage flag
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get('setup') === 'true') {
        // Clear the URL parameter
        const newUrl = new URL(window.location.href);
        newUrl.searchParams.delete('setup');
        window.history.replaceState({}, '', newUrl.toString());
        return true;
      }
      // Check session storage for setup flag
      const shouldSetup =
        sessionStorage.getItem('open-device-setup') === 'true';
      if (shouldSetup) {
        sessionStorage.removeItem('open-device-setup');
        return true;
      }
    }
    return false;
  });

  const getDeviceIcon = (type: DeviceType) => {
    switch (type) {
      case 'apple_watch':
      case 'watch':
        return Watch;
      case 'iphone':
      case 'phone':
      case 'ipad':
        return Smartphone;
      default:
        return Bluetooth;
    }
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-500';
    if (battery > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: ConnectedDevice['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'syncing':
        return 'bg-yellow-500';
      case 'error':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: ConnectedDevice['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      case 'syncing':
        return (
          <Badge className="flex items-center gap-1 bg-yellow-100 text-yellow-800">
            <Loader2 className="h-3 w-3 animate-spin" />
            Syncing
          </Badge>
        );
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const formatLastSync = (lastSync?: string, lastSeen?: string) => {
    if (lastSync && lastSync !== 'Just now') {
      try {
        if (lastSync.includes('ago')) return lastSync;
        const date = new Date(lastSync);
        return formatDistanceToNow(date, { addSuffix: true });
      } catch {
        return lastSync;
      }
    }
    if (lastSeen) {
      try {
        const date = new Date(lastSeen);
        return formatDistanceToNow(date, { addSuffix: true });
      } catch {
        return 'Unknown';
      }
    }
    return 'Never';
  };

  const handleReconnect = async (device: ConnectedDevice) => {
    await connectDevice(device);
  };

  const handleSync = async (deviceId: string) => {
    await syncDevice(deviceId);
  };

  const handleDisconnect = async (deviceId: string) => {
    await disconnectDevice(deviceId);
  };

  const handleRemove = (deviceId: string) => {
    removeDevice(deviceId);
  };

  if (showSetupWizard) {
    return (
      <DeviceSetupWizard
        onComplete={() => setShowSetupWizard(false)}
        onCancel={() => setShowSetupWizard(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Connected Devices</h1>
          <p className="mt-2 text-muted-foreground">
            Manage and monitor your health monitoring devices and data
            synchronization.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // Set flag to show connection options
              if (typeof window !== 'undefined') {
                sessionStorage.setItem('show-connection-options', 'true');
              }
              setShowSetupWizard(true);
            }}
          >
            <Bluetooth className="mr-2 h-4 w-4" />
            Connect Device
          </Button>
          <Button onClick={() => setShowSetupWizard(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Device
          </Button>
        </div>
      </div>

      {devices.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-muted-foreground" />
              No Devices Connected
            </CardTitle>
            <CardDescription>
              Get started by connecting your first health monitoring device
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                className="w-full"
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('show-connection-options', 'true');
                  }
                  setShowSetupWizard(true);
                }}
                size="lg"
                variant="outline"
              >
                <Radio className="mr-2 h-4 w-4" />
                Connect via Bluetooth
              </Button>
              <Button
                className="w-full"
                onClick={() => setShowSetupWizard(true)}
                size="lg"
              >
                <Smartphone className="mr-2 h-4 w-4" />
                Connect iOS App
              </Button>
            </div>
            <Button
              className="w-full"
              onClick={() => setShowSetupWizard(true)}
              size="lg"
              variant="outline"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Device Manually
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Connect devices directly via Bluetooth, sync with iOS app, or add
              manually
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {devices.map((device) => {
            const IconComponent = getDeviceIcon(device.type);
            return (
              <Card key={device.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-vitalsense-primary/10 p-2 text-vitalsense-primary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{device.name}</CardTitle>
                        <CardDescription className="capitalize">
                          {device.type.replace('-', ' ').replace('_', ' ')}{' '}
                          device
                          {device.model && ` • ${device.model}`}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {getStatusBadge(device.status)}
                      <div
                        className={`h-3 w-3 rounded-full ${getStatusColor(device.status)}`}
                      />
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleSync(device.id)}
                            disabled={device.status === 'syncing'}
                          >
                            <Bluetooth className="mr-2 h-4 w-4" />
                            Sync Now
                          </DropdownMenuItem>
                          <DropdownMenuItem disabled>
                            <Settings className="mr-2 h-4 w-4" />
                            Device Settings
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {device.status === 'connected' ? (
                            <DropdownMenuItem
                              onClick={() => handleDisconnect(device.id)}
                            >
                              <WifiOff className="mr-2 h-4 w-4" />
                              Disconnect
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleReconnect(device)}
                            >
                              <Wifi className="mr-2 h-4 w-4" />
                              Reconnect
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleRemove(device.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Remove Device
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 sm:grid-cols-3">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Wifi className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Connection:
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {device.status === 'connected' ? (
                          <Wifi className="h-4 w-4 text-green-500" />
                        ) : (
                          <WifiOff className="h-4 w-4 text-red-500" />
                        )}
                        <span className="font-medium capitalize">
                          {device.status}
                        </span>
                      </div>
                    </div>

                    {device.battery !== undefined && (
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Battery className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            Battery:
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Battery
                            className={`h-4 w-4 ${getBatteryColor(device.battery)}`}
                          />
                          <span className="font-medium">{device.battery}%</span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Bluetooth className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          Last sync:
                        </span>
                      </div>
                      <div className="font-medium">
                        {formatLastSync(device.lastSync, device.lastSeen)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {device.status === 'disconnected' ? (
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleReconnect(device)}
                      >
                        <Wifi className="mr-2 h-4 w-4" />
                        Reconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => handleSync(device.id)}
                        disabled={device.status === 'syncing'}
                      >
                        {device.status === 'syncing' ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <Bluetooth className="mr-2 h-4 w-4" />
                            Sync Now
                          </>
                        )}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" disabled>
                      <Settings className="mr-2 h-4 w-4" />
                      Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-vitalsense-primary" />
            Add New Device
          </CardTitle>
          <CardDescription>
            Connect additional health monitoring devices to improve data
            accuracy
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Button
              className="w-full"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem(
                    'show-connection-options',
                    'bluetooth'
                  );
                }
                setShowSetupWizard(true);
              }}
              variant="outline"
            >
              <Radio className="mr-2 h-4 w-4" />
              Bluetooth Device
            </Button>
            <Button
              className="w-full"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  sessionStorage.setItem('show-connection-options', 'ios');
                }
                setShowSetupWizard(true);
              }}
              variant="outline"
            >
              <Smartphone className="mr-2 h-4 w-4" />
              iOS App
            </Button>
          </div>
          <Button
            className="w-full"
            onClick={() => setShowSetupWizard(true)}
            variant="outline"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Manually
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConnectedDevices;
