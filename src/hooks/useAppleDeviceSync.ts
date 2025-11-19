/**
 * React hook for Apple Device Sync
 * Provides easy access to device sync functionality
 */

import { useEffect, useState, useCallback, useRef } from 'react';
import { AppleDeviceSyncService, type AppleDevice, type SyncStatus, type SyncConfiguration, type SyncError } from '@/lib/appleDeviceSync';

export interface UseAppleDeviceSyncOptions {
  userId: string;
  autoStart?: boolean;
  config?: Partial<SyncConfiguration>;
}

export function useAppleDeviceSync({
  userId,
  autoStart = true,
  config,
}: UseAppleDeviceSyncOptions) {
  const [devices, setDevices] = useState<AppleDevice[]>([]);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isActive: false,
    syncProgress: 0,
    metricsSynced: 0,
    errors: [],
  });
  const [isConnected, setIsConnected] = useState(false);
  const serviceRef = useRef<AppleDeviceSyncService | null>(null);

  // Initialize service
  useEffect(() => {
    if (!serviceRef.current) {
      serviceRef.current = new AppleDeviceSyncService(userId, config);
    }

    const service = serviceRef.current;

    // Setup listeners
    const unsubscribeDevices = service.onDevicesChange((updatedDevices) => {
      setDevices(updatedDevices);
    });

    const unsubscribeStatus = service.onStatusChange((status) => {
      setSyncStatus(status);
      setIsConnected(service.isConnected());
    });

    const unsubscribeErrors = service.onError((error) => {
      console.error('Device sync error:', error);
    });

    // Auto-start if enabled
    if (autoStart) {
      service.startSync();
    }

    // Cleanup
    return () => {
      unsubscribeDevices();
      unsubscribeStatus();
      unsubscribeErrors();
      service.destroy();
      serviceRef.current = null;
    };
  }, [userId, autoStart, config]);

  const startSync = useCallback(() => {
    serviceRef.current?.startSync();
  }, []);

  const stopSync = useCallback(() => {
    serviceRef.current?.stopSync();
  }, []);

  const updateConfig = useCallback((newConfig: Partial<SyncConfiguration>) => {
    serviceRef.current?.updateSyncConfig(newConfig);
  }, []);

  const getDevice = useCallback((deviceId: string) => {
    return serviceRef.current?.getDevice(deviceId);
  }, []);

  const getConnectionStatus = useCallback(() => {
    return serviceRef.current?.getConnectionStatus();
  }, []);

  return {
    devices,
    syncStatus,
    isConnected,
    startSync,
    stopSync,
    updateConfig,
    getDevice,
    getConnectionStatus,
    service: serviceRef.current,
  };
}
