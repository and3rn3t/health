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
  AlertTriangle,
  Battery,
  Bluetooth,
  Smartphone,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { useState } from 'react';

interface Device {
  id: string;
  name: string;
  type: 'watch' | 'phone' | 'scale' | 'blood-pressure' | 'glucose';
  status: 'connected' | 'disconnected' | 'syncing';
  battery?: number;
  lastSync?: string;
}

export function ConnectedDevices() {
  const [devices] = useState<Device[]>([
    {
      id: 'apple-watch',
      name: 'Apple Watch Series 9',
      type: 'watch',
      status: 'connected',
      battery: 85,
      lastSync: '2 minutes ago',
    },
    {
      id: 'iphone',
      name: 'iPhone 15 Pro',
      type: 'phone',
      status: 'connected',
      battery: 92,
      lastSync: 'Just now',
    },
    {
      id: 'withings-scale',
      name: 'Withings Body+ Scale',
      type: 'scale',
      status: 'disconnected',
      lastSync: '3 days ago',
    },
    {
      id: 'omron-bp',
      name: 'Omron Blood Pressure Monitor',
      type: 'blood-pressure',
      status: 'syncing',
      lastSync: '1 hour ago',
    },
  ]);

  const getDeviceIcon = (_type: Device['type']) => {
    // All devices use the same icon for now, but could be extended
    return Smartphone;
  };

  const getBatteryColor = (battery: number) => {
    if (battery > 50) return 'text-green-500';
    if (battery > 20) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getStatusColor = (status: Device['status']) => {
    switch (status) {
      case 'connected':
        return 'bg-green-500';
      case 'disconnected':
        return 'bg-red-500';
      case 'syncing':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusBadge = (status: Device['status']) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-100 text-green-800">Connected</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Disconnected</Badge>;
      case 'syncing':
        return <Badge className="bg-yellow-100 text-yellow-800">Syncing</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Connected Devices</h1>
        <p className="text-muted-foreground mt-2">
          Manage and monitor your health monitoring devices and data
          synchronization.
        </p>
      </div>

      <div className="grid gap-4">
        {devices.map((device) => {
          const IconComponent = getDeviceIcon(device.type);
          return (
            <Card key={device.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-vitalsense-primary/10 rounded-lg p-2 text-vitalsense-primary">
                      <IconComponent className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{device.name}</CardTitle>
                      <CardDescription className="capitalize">
                        {device.type.replace('-', ' ')} device
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(device.status)}
                    <div
                      className={`h-3 w-3 rounded-full ${getStatusColor(device.status)}`}
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-3">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Wifi className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">Connection:</span>
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

                  {device.battery && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm">
                        <Battery className="text-muted-foreground h-4 w-4" />
                        <span className="text-muted-foreground">Battery:</span>
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
                      <Bluetooth className="text-muted-foreground h-4 w-4" />
                      <span className="text-muted-foreground">Last sync:</span>
                    </div>
                    <div className="font-medium">{device.lastSync}</div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  {device.status === 'disconnected' ? (
                    <Button size="sm" className="flex-1">
                      <Wifi className="mr-2 h-4 w-4" />
                      Reconnect
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" className="flex-1">
                      Sync Now
                    </Button>
                  )}
                  <Button size="sm" variant="outline">
                    Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

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
        <CardContent>
          <Button className="w-full">
            <Bluetooth className="mr-2 h-4 w-4" />
            Scan for Devices
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default ConnectedDevices;
