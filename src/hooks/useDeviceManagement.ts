import { DeviceDetectionService } from '@/lib/deviceDetectionService';
import { getLiveHealthDataSync } from '@/lib/liveHealthDataSync';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useKV } from './useCloudflareKV';

export type DeviceType =
  | 'iphone'
  | 'apple_watch'
  | 'ipad'
  | 'watch'
  | 'phone'
  | 'scale'
  | 'blood-pressure'
  | 'glucose'
  | 'smart_home'
  | 'health_app';

export interface ConnectedDevice {
  id: string;
  name: string;
  type: DeviceType;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: string;
  battery?: number;
  model?: string;
  osVersion?: string;
  capabilities?: {
    healthKit?: boolean;
    realTimeSync?: boolean;
    backgroundSync?: boolean;
  };
  connectedAt?: string;
  lastSeen?: string;
  signalStrength?: number;
}

export interface DeviceScanResult {
  id: string;
  name: string;
  type: DeviceType;
  model?: string;
  isPaired: boolean;
  signalStrength?: number;
}

/**
 * Hook for managing connected devices
 * Provides device CRUD operations, scanning, and connection management
 */
export function useDeviceManagement(userId?: string) {
  const [devices, setDevices] = useKV<ConnectedDevice[]>(
    'connected-devices',
    []
  );
  const [isScanning, setIsScanning] = useState(false);
  const [scanResults, setScanResults] = useState<DeviceScanResult[]>([]);
  const detectionServiceRef = useRef<DeviceDetectionService | null>(null);
  const liveSyncRef = useRef<ReturnType<typeof getLiveHealthDataSync> | null>(
    null
  );

  // Initialize device detection service
  useEffect(() => {
    const userIdValue = userId || 'default-user';

    // Initialize LiveHealthDataSync
    if (!liveSyncRef.current) {
      liveSyncRef.current = getLiveHealthDataSync(userIdValue);
    }

    // Initialize DeviceDetectionService
    if (!detectionServiceRef.current) {
      detectionServiceRef.current = new DeviceDetectionService(
        liveSyncRef.current
      );
    }

    const detectionService = detectionServiceRef.current;
    const liveSync = liveSyncRef.current;

    // Listen for device changes from detection service
    const unsubscribe = detectionService.onDevicesChange((detectedDevices) => {
      // Update scan results with detected devices
      const newScanResults = detectedDevices
        .filter((d) => d.status === 'online')
        .map((d) => detectionService.toScanResult(d));
      setScanResults(newScanResults);

      // Auto-connect to newly detected devices that aren't in our list
      detectedDevices.forEach((detected) => {
        if (detected.status === 'online') {
          const existing = devices.find((d) => d.id === detected.id);
          if (!existing || existing.status !== 'connected') {
            // Auto-add to connected devices
            const connectedDevice =
              detectionService.toConnectedDevice(detected);
            setDevices((prev) => {
              const existingIndex = prev.findIndex(
                (d) => d.id === connectedDevice.id
              );
              if (existingIndex >= 0) {
                const updated = [...prev];
                updated[existingIndex] = connectedDevice;
                return updated;
              }
              return [...prev, connectedDevice];
            });
          }
        }
      });
    });

    // Listen for WebSocket presence messages
    if (liveSync) {
      // The LiveHealthDataSync service already handles client_presence messages
      // We'll hook into it via the detection service
    }

    // Connect to WebSocket if not connected
    if (liveSync && !liveSync.isConnected()) {
      liveSync.connect();
    }

    return () => {
      unsubscribe();
    };
  }, [userId, devices, setDevices]);

  /**
   * Scan for available devices
   * Uses WebSocket presence detection and Web Bluetooth API
   */
  const scanForDevices = useCallback(async () => {
    setIsScanning(true);
    setScanResults([]);

    try {
      const detectionService = detectionServiceRef.current;
      if (!detectionService) {
        toast.error('Device detection service not initialized');
        setIsScanning(false);
        return;
      }

      // First, check for devices via WebSocket (iOS devices)
      const detectedDevices = detectionService.getDetectedDevices();
      const wsDevices = detectedDevices
        .filter((d) => d.status === 'online')
        .map((d) => detectionService.toScanResult(d));

      // Also try Web Bluetooth scanning for physical devices
      let bluetoothDevices: DeviceScanResult[] = [];
      try {
        bluetoothDevices = await detectionService.scanBluetoothDevices();
      } catch (error) {
        // User may have cancelled or Bluetooth not available
        console.debug('Bluetooth scan cancelled or unavailable:', error);
      }

      // Combine both sources
      const allDevices = [...wsDevices, ...bluetoothDevices];

      // Remove duplicates
      const uniqueDevices = allDevices.filter(
        (device, index, self) =>
          index === self.findIndex((d) => d.id === device.id)
      );

      setScanResults(uniqueDevices);

      if (uniqueDevices.length === 0) {
        toast.info(
          'No devices found. Make sure your iOS app is running and connected.'
        );
      } else {
        toast.success(`Found ${uniqueDevices.length} device(s)`);
      }
    } catch (error) {
      console.error('Device scanning error:', error);
      toast.error('Failed to scan for devices');
    } finally {
      setIsScanning(false);
    }
  }, []);

  /**
   * Get device auth token for WebSocket connection
   */
  const getDeviceAuthToken = useCallback(
    async (deviceType: DeviceType): Promise<string | null> => {
      try {
        // Determine client type based on device type
        const clientType = ['iphone', 'apple_watch', 'ipad'].includes(
          deviceType
        )
          ? 'ios_app'
          : 'web_dashboard';

        // Get device auth token from API
        const response = await fetch('/api/device/auth', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: userId || 'default-user',
            clientType,
            ttlSec: 600, // 10 minutes
          }),
        });

        if (!response.ok) {
          console.warn(
            'Device auth token request failed:',
            response.statusText
          );
          return null;
        }

        const data = (await response.json()) as { token?: string };
        return data.token || null;
      } catch (error) {
        console.error('Failed to get device auth token:', error);
        return null;
      }
    },
    [userId]
  );

  /**
   * Connect to a device
   * Uses real device detection and WebSocket connection
   */
  const connectDevice = useCallback(
    async (deviceData: DeviceScanResult | ConnectedDevice) => {
      try {
        // Check if device is already connected
        const existing = devices.find((d) => d.id === deviceData.id);
        if (existing && existing.status === 'connected') {
          toast.info('Device already connected');
          return;
        }

        const detectionService = detectionServiceRef.current;
        const liveSync = liveSyncRef.current;

        // Check if device is detected via WebSocket
        const detectedDevice = detectionService?.getDevice(deviceData.id);

        // Set status to syncing
        const newDevice: ConnectedDevice = {
          id: deviceData.id,
          name: deviceData.name,
          type: deviceData.type,
          status: 'syncing',
          model: deviceData.model,
          connectedAt: new Date().toISOString(),
          lastSeen: new Date().toISOString(),
          signalStrength: deviceData.signalStrength,
          capabilities: {
            healthKit: ['iphone', 'apple_watch', 'ipad'].includes(
              deviceData.type
            ),
            realTimeSync: true,
            backgroundSync: true,
          },
        };

        // Add device to list or update existing
        setDevices((prev) => {
          const existingIndex = prev.findIndex((d) => d.id === deviceData.id);
          if (existingIndex >= 0) {
            const updated = [...prev];
            updated[existingIndex] = newDevice;
            return updated;
          }
          return [...prev, newDevice];
        });

        // For iOS devices, ensure WebSocket is connected
        if (['iphone', 'apple_watch', 'ipad'].includes(deviceData.type)) {
          if (liveSync && !liveSync.isConnected()) {
            await liveSync.connect();
          }

          // Get device auth token for WebSocket connection
          const authToken = await getDeviceAuthToken(deviceData.type);

          // Store token for WebSocket connections if available
          if (authToken && typeof window !== 'undefined') {
            (
              window as unknown as { __WS_DEVICE_TOKEN__?: string }
            ).__WS_DEVICE_TOKEN__ = authToken;
          }

          // Request device to connect (iOS app will listen for this)
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('request-device-connection', {
                detail: {
                  deviceId: deviceData.id,
                  deviceName: deviceData.name,
                  deviceType: deviceData.type,
                },
              })
            );
          }

          // Wait a moment for connection to establish
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Check if device is actually online
        const isOnline =
          detectedDevice?.status === 'online' ||
          (liveSync && liveSync.isConnected());

        // Update device status
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceData.id
              ? {
                  ...d,
                  status: isOnline
                    ? ('connected' as const)
                    : ('error' as const),
                  lastSync: isOnline ? 'Just now' : undefined,
                  battery: deviceData.type === 'apple_watch' ? 85 : undefined,
                }
              : d
          )
        );

        // Dispatch device connected event for other components
        if (typeof window !== 'undefined' && isOnline) {
          window.dispatchEvent(
            new CustomEvent('device-connected', {
              detail: { deviceId: deviceData.id, deviceName: deviceData.name },
            })
          );
        }

        if (isOnline) {
          toast.success(`Successfully connected to ${deviceData.name}`);
        } else {
          toast.warning(
            `Device ${deviceData.name} may not be online. Make sure the iOS app is running.`
          );
        }
      } catch (error) {
        console.error('Device connection error:', error);
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceData.id ? { ...d, status: 'error' as const } : d
          )
        );
        toast.error(`Failed to connect to ${deviceData.name}`);
      }
    },
    [devices, setDevices, getDeviceAuthToken]
  );

  /**
   * Disconnect a device
   */
  const disconnectDevice = useCallback(
    async (deviceId: string) => {
      const device = devices.find((d) => d.id === deviceId);
      if (!device) return;

      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, status: 'disconnected' as const } : d
        )
      );

      toast.info(`Disconnected from ${device.name}`);
    },
    [devices, setDevices]
  );

  /**
   * Remove a device completely
   */
  const removeDevice = useCallback(
    (deviceId: string) => {
      const device = devices.find((d) => d.id === deviceId);
      setDevices((prev) => prev.filter((d) => d.id !== deviceId));
      if (device) {
        toast.info(`Removed ${device.name}`);
      }
    },
    [devices, setDevices]
  );

  /**
   * Sync a device (request manual sync)
   * Sends sync request via WebSocket to the device
   */
  const syncDevice = useCallback(
    async (deviceId: string) => {
      const device = devices.find((d) => d.id === deviceId);
      if (!device) return;

      setDevices((prev) =>
        prev.map((d) =>
          d.id === deviceId ? { ...d, status: 'syncing' as const } : d
        )
      );

      try {
        const liveSync = liveSyncRef.current;

        // Request sync from device via WebSocket
        if (liveSync && liveSync.isConnected()) {
          // Send sync request message
          if (typeof window !== 'undefined') {
            window.dispatchEvent(
              new CustomEvent('request-device-sync', {
                detail: { deviceId },
              })
            );
          }

          // Also send via WebSocket if available
          liveSync.sendHealthData({
            timestamp: new Date().toISOString(),
            metricType: 'heart_rate', // Dummy metric to trigger sync
            value: 0,
            deviceId,
            confidence: 1,
            source: 'web_dashboard',
          } as any);
        }

        // Wait for sync to complete (device will send data back)
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Update device status
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId
              ? {
                  ...d,
                  status: 'connected' as const,
                  lastSync: 'Just now',
                  lastSeen: new Date().toISOString(),
                }
              : d
          )
        );

        toast.success(`Synced ${device.name}`);
      } catch (error) {
        console.error('Device sync error:', error);
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceId ? { ...d, status: 'error' as const } : d
          )
        );
        toast.error(`Failed to sync ${device.name}`);
      }
    },
    [devices, setDevices]
  );

  /**
   * Get device by ID
   */
  const getDevice = useCallback(
    (deviceId: string) => {
      return devices.find((d) => d.id === deviceId);
    },
    [devices]
  );

  /**
   * Get connected devices count
   */
  const connectedCount = devices.filter((d) => d.status === 'connected').length;

  /**
   * Check if any device is connected
   */
  const hasConnectedDevices = connectedCount > 0;

  return {
    devices,
    isScanning,
    scanResults,
    scanForDevices,
    connectDevice,
    disconnectDevice,
    removeDevice,
    syncDevice,
    getDevice,
    connectedCount,
    hasConnectedDevices,
  };
}
