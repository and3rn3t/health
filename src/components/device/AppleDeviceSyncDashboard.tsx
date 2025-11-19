/**
 * Apple Device Sync Dashboard
 * UI for managing Apple device synchronization
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  Battery,
  Bluetooth,
  CheckCircle,
  Loader2,
  Settings,
  Smartphone,
  Watch,
  Wifi,
  WifiOff,
} from 'lucide-react';
import React, { useState } from 'react';
import { useAppleDeviceSync } from '@/hooks/useAppleDeviceSync';
import type { SyncConfiguration } from '@/lib/appleDeviceSync';

interface AppleDeviceSyncDashboardProps {
  userId: string;
}

export default function AppleDeviceSyncDashboard({
  userId,
}: AppleDeviceSyncDashboardProps) {
  const {
    devices,
    syncStatus,
    isConnected,
    startSync,
    stopSync,
    updateConfig,
    getConnectionStatus,
  } = useAppleDeviceSync({
    userId,
    autoStart: true,
  });

  const [activeTab, setActiveTab] = useState('devices');

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'apple_watch':
        return Watch;
      case 'iphone':
        return Smartphone;
      case 'ipad':
        return Smartphone;
      default:
        return Smartphone;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'disconnected':
        return 'text-red-600';
      case 'syncing':
        return 'text-yellow-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  const formatTime = (date?: Date) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const connectionStatus = getConnectionStatus();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bluetooth className="h-8 w-8" />
            Apple Device Sync
          </h1>
          <p className="text-gray-600 mt-1">
            Manage synchronization with your Apple devices
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Badge className="bg-green-100 text-green-800">
              <Wifi className="mr-1 h-3 w-3" />
              Connected
            </Badge>
          ) : (
            <Badge variant="destructive">
              <WifiOff className="mr-1 h-3 w-3" />
              Disconnected
            </Badge>
          )}
          {syncStatus.isActive ? (
            <Button variant="outline" size="sm" onClick={stopSync}>
              Stop Sync
            </Button>
          ) : (
            <Button size="sm" onClick={startSync}>
              Start Sync
            </Button>
          )}
        </div>
      </div>

      {/* Sync Status Card */}
      <Card>
        <CardHeader>
          <CardTitle>Sync Status</CardTitle>
          <CardDescription>
            Current synchronization status and progress
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Sync Progress</span>
              <span className="text-sm text-gray-600">
                {syncStatus.syncProgress}%
              </span>
            </div>
            <Progress value={syncStatus.syncProgress} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Status</div>
              <div className="font-semibold">
                {syncStatus.isActive ? (
                  <span className="text-green-600 flex items-center gap-1">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Active
                  </span>
                ) : (
                  <span className="text-gray-600">Inactive</span>
                )}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Last Sync</div>
              <div className="font-semibold">
                {formatTime(syncStatus.lastSyncTime)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Metrics Synced</div>
              <div className="font-semibold">{syncStatus.metricsSynced}</div>
            </div>
          </div>

          {connectionStatus && (
            <div className="rounded-lg border p-3 bg-gray-50">
              <div className="text-sm font-medium mb-2">Connection Details</div>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Latency:</span>{' '}
                  <span className="font-medium">
                    {connectionStatus.latency}ms
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Quality:</span>{' '}
                  <span className="font-medium capitalize">
                    {connectionStatus.dataQuality}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="devices">Devices</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* Devices Tab */}
        <TabsContent value="devices" className="space-y-4">
          {devices.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bluetooth className="text-gray-400 mx-auto mb-4 h-12 w-12" />
                <h3 className="text-lg font-semibold mb-2">No Devices Connected</h3>
                <p className="text-gray-600 mb-4">
                  Connect your Apple device to start syncing health data
                </p>
                <Button>Scan for Devices</Button>
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
                          <div className="bg-blue-100 rounded-lg p-2 text-blue-600">
                            <IconComponent className="h-5 w-5" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">{device.name}</CardTitle>
                            <CardDescription className="capitalize">
                              {device.type.replace('_', ' ')}
                              {device.model && ` • ${device.model}`}
                            </CardDescription>
                          </div>
                        </div>
                        <Badge
                          className={getStatusColor(device.connectionStatus)}
                        >
                          {device.connectionStatus}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <div className="text-sm text-gray-600">Last Sync</div>
                          <div className="font-medium">
                            {formatTime(device.lastSync)}
                          </div>
                        </div>
                        {device.batteryLevel !== undefined && (
                          <div>
                            <div className="text-sm text-gray-600">Battery</div>
                            <div className="font-medium flex items-center gap-1">
                              <Battery className="h-4 w-4" />
                              {device.batteryLevel}%
                              {device.isCharging && (
                                <span className="text-green-600">⚡</span>
                              )}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-sm text-gray-600">Capabilities</div>
                          <div className="flex gap-1 mt-1">
                            {device.capabilities.healthKit && (
                              <Badge variant="outline" className="text-xs">
                                HealthKit
                              </Badge>
                            )}
                            {device.capabilities.lidar && (
                              <Badge variant="outline" className="text-xs">
                                LiDAR
                              </Badge>
                            )}
                            {device.capabilities.fallDetection && (
                              <Badge variant="outline" className="text-xs">
                                Fall
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          {syncStatus.errors.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="text-green-500 mx-auto mb-4 h-12 w-12" />
                <h3 className="text-lg font-semibold mb-2">No Errors</h3>
                <p className="text-gray-600">
                  All sync operations are running smoothly
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {syncStatus.errors.map((error) => (
                <Card key={error.id} className="border-red-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <span className="font-medium">{error.errorType}</span>
                          <Badge variant="outline" className="text-xs">
                            {error.deviceId}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600">{error.message}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(error.timestamp)}
                        </p>
                      </div>
                      {!error.resolved && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            // Mark as resolved
                            const device = devices.find(
                              (d) => d.id === error.deviceId
                            );
                            if (device) {
                              // This would update the error in the service
                            }
                          }}
                        >
                          Dismiss
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings">
          <DeviceSyncSettings
            syncStatus={syncStatus}
            updateConfig={updateConfig}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface DeviceSyncSettingsProps {
  syncStatus: any;
  updateConfig: (config: Partial<SyncConfiguration>) => void;
}

function DeviceSyncSettings({
  syncStatus,
  updateConfig,
}: DeviceSyncSettingsProps) {
  const [config, setConfig] = useState<Partial<SyncConfiguration>>({
    syncInterval: 30000,
    realTimeSync: true,
    backgroundSync: true,
    syncMetrics: [
      'heart_rate',
      'steps',
      'walking_steadiness',
      'gait_speed',
      'fall_detected',
    ],
    qualityThreshold: 0.7,
  });

  const handleUpdate = (updates: Partial<SyncConfiguration>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    updateConfig(newConfig);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Sync Settings
        </CardTitle>
        <CardDescription>
          Configure synchronization behavior and preferences
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sync Interval</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="10000"
              max="300000"
              step="10000"
              value={config.syncInterval || 30000}
              onChange={(e) =>
                handleUpdate({ syncInterval: parseInt(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-20">
              {((config.syncInterval || 30000) / 1000).toFixed(0)}s
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Quality Threshold</label>
          <div className="flex items-center gap-4">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={config.qualityThreshold || 0.7}
              onChange={(e) =>
                handleUpdate({ qualityThreshold: parseFloat(e.target.value) })
              }
              className="flex-1"
            />
            <span className="text-sm text-gray-600 w-20">
              {(config.qualityThreshold || 0.7).toFixed(1)}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Real-time Sync</label>
              <p className="text-xs text-gray-600">
                Sync data as it becomes available
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.realTimeSync ?? true}
              onChange={(e) => handleUpdate({ realTimeSync: e.target.checked })}
              className="h-4 w-4"
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Background Sync</label>
              <p className="text-xs text-gray-600">
                Continue syncing when app is in background
              </p>
            </div>
            <input
              type="checkbox"
              checked={config.backgroundSync ?? true}
              onChange={(e) =>
                handleUpdate({ backgroundSync: e.target.checked })
              }
              className="h-4 w-4"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
