/**
 * Device Status Card Component
 * Displays device connection status and quick actions
 * Can be embedded in dashboards and other pages
 */

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
  useDeviceManagement,
  type ConnectedDevice,
} from '@/hooks/useDeviceManagement';
import {
  Battery,
  Bluetooth,
  Plus,
  Radio,
  Smartphone,
  Watch,
  WifiOff,
} from 'lucide-react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DeviceSetupWizard } from './DeviceSetupWizard';

interface DeviceStatusCardProps {
  compact?: boolean;
  showQuickActions?: boolean;
  onDeviceClick?: (deviceId: string) => void;
}

export function DeviceStatusCard({
  compact = false,
  showQuickActions = true,
  onDeviceClick,
}: DeviceStatusCardProps) {
  const { devices, hasConnectedDevices, connectedCount, syncDevice } =
    useDeviceManagement();
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const navigate = useNavigate();

  const getDeviceIcon = (type: string) => {
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

  const handleQuickConnect = () => {
    if (globalThis.window !== undefined) {
      globalThis.window.sessionStorage.setItem('open-device-setup', 'true');
    }
    navigate('/device-sync');
  };

  if (compact) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Devices</CardTitle>
            {showQuickActions && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSetupWizard(true)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasConnectedDevices ? (
            <div className="space-y-2">
              {devices.slice(0, 3).map((device) => {
                const IconComponent = getDeviceIcon(device.type);
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between rounded-lg border p-2"
                  >
                    <div className="flex items-center gap-2">
                      <IconComponent className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{device.name}</span>
                      <div
                        className={`h-2 w-2 rounded-full ${getStatusColor(device.status)}`}
                      />
                    </div>
                    {device.battery !== undefined && (
                      <Badge variant="outline" className="text-xs">
                        {device.battery}%
                      </Badge>
                    )}
                  </div>
                );
              })}
              {devices.length > 3 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full"
                  onClick={() => navigate('/device-sync')}
                >
                  View all {devices.length} devices
                </Button>
              )}
            </div>
          ) : (
            <div className="py-4 text-center">
              <WifiOff className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
              <p className="mb-2 text-sm text-muted-foreground">
                No devices connected
              </p>
              {showQuickActions && (
                <Button size="sm" onClick={handleQuickConnect}>
                  Connect Device
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Bluetooth className="h-5 w-5" />
                Connected Devices
              </CardTitle>
              <CardDescription>
                {hasConnectedDevices
                  ? `${connectedCount} device${connectedCount !== 1 ? 's' : ''} connected`
                  : 'No devices connected'}
              </CardDescription>
            </div>
            {showQuickActions && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSetupWizard(true)}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Device
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {hasConnectedDevices ? (
            <div className="space-y-3">
              {devices.map((device) => {
                const IconComponent = getDeviceIcon(device.type);
                const isConnected = device.status === 'connected';
                return (
                  <div
                    key={device.id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center justify-between rounded-lg border p-3 transition-colors"
                    onClick={() => {
                      if (onDeviceClick) {
                        onDeviceClick(device.id);
                      } else {
                        navigate('/device-sync');
                      }
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/10 rounded-lg p-2 text-primary">
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-medium">{device.name}</div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <div
                            className={`h-2 w-2 rounded-full ${getStatusColor(device.status)}`}
                          />
                          <span className="capitalize">{device.status}</span>
                          {device.model && ` • ${device.model}`}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {device.battery !== undefined && (
                        <div className="flex items-center gap-1 text-sm">
                          <Battery className="h-4 w-4" />
                          <span>{device.battery}%</span>
                        </div>
                      )}
                      {isConnected && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            syncDevice(device.id);
                          }}
                        >
                          <Radio className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <WifiOff className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <h3 className="mb-2 font-semibold">No Devices Connected</h3>
              <p className="mb-4 text-sm text-muted-foreground">
                Connect your health monitoring devices to start tracking
              </p>
              {showQuickActions && (
                <div className="flex justify-center gap-2">
                  <Button onClick={handleQuickConnect}>
                    <Bluetooth className="mr-2 h-4 w-4" />
                    Connect Device
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => navigate('/device-sync')}
                  >
                    Manage Devices
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {showSetupWizard && (
        <DeviceSetupWizard
          onComplete={() => setShowSetupWizard(false)}
          onCancel={() => setShowSetupWizard(false)}
        />
      )}
    </>
  );
}
