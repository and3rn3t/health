import { useCallback, useEffect, useState } from 'react';
import { useKV } from './useCloudflareKV';
import { toast } from 'sonner';

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

  // Initialize with default devices if none exist (for demo purposes)
  useEffect(() => {
    if (devices.length === 0) {
      // Don't auto-populate, let user add devices
    }
  }, [devices.length]);

  /**
   * Scan for available devices
   * In a real implementation, this would use Web Bluetooth API or other device discovery
   */
  const scanForDevices = useCallback(async () => {
    setIsScanning(true);
    setScanResults([]);

    try {
      // Simulate device scanning with a delay
      // In production, this would use actual device discovery APIs
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Check if Web Bluetooth is available
      const hasWebBluetooth =
        typeof navigator !== 'undefined' &&
        'bluetooth' in navigator &&
        navigator.bluetooth &&
        typeof navigator.bluetooth === 'object' &&
        'requestDevice' in navigator.bluetooth;

      if (hasWebBluetooth) {
        // Use Web Bluetooth API for scanning
        // Note: This requires HTTPS or localhost
        const simulatedDevices: DeviceScanResult[] = [
          {
            id: 'apple-watch-scan-1',
            name: 'Apple Watch Series 9',
            type: 'apple_watch',
            isPaired: false,
            signalStrength: 85,
            model: 'Series 9',
          },
          {
            id: 'iphone-scan-1',
            name: 'iPhone 15 Pro',
            type: 'iphone',
            isPaired: true,
            signalStrength: 92,
            model: 'iPhone 15 Pro',
          },
        ];
        setScanResults(simulatedDevices);
      } else {
        // Fallback to simulated devices
        const simulatedDevices: DeviceScanResult[] = [
          {
            id: 'apple-watch-scan-1',
            name: 'Apple Watch Series 9',
            type: 'apple_watch',
            isPaired: false,
            signalStrength: 85,
          },
          {
            id: 'iphone-scan-1',
            name: 'iPhone 15 Pro',
            type: 'iphone',
            isPaired: true,
            signalStrength: 92,
          },
          {
            id: 'scale-scan-1',
            name: 'Withings Body+ Scale',
            type: 'scale',
            isPaired: false,
            signalStrength: 75,
          },
          {
            id: 'bp-scan-1',
            name: 'Omron Blood Pressure Monitor',
            type: 'blood-pressure',
            isPaired: false,
            signalStrength: 80,
          },
        ];
        setScanResults(simulatedDevices);
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
  const getDeviceAuthToken = useCallback(async (deviceType: DeviceType): Promise<string | null> => {
    try {
      // Determine client type based on device type
      const clientType = ['iphone', 'apple_watch', 'ipad'].includes(deviceType)
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
        console.warn('Device auth token request failed:', response.statusText);
        return null;
      }

      const data = await response.json() as { token?: string };
      return data.token || null;
    } catch (error) {
      console.error('Failed to get device auth token:', error);
      return null;
    }
  }, [userId]);

  /**
   * Connect to a device
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

        // Simulate connection process
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

        // Get device auth token for WebSocket connection
        const authToken = await getDeviceAuthToken(deviceData.type);

        // Store token for WebSocket connections if available
        if (authToken && typeof window !== 'undefined') {
          (window as unknown as { __WS_DEVICE_TOKEN__?: string }).__WS_DEVICE_TOKEN__ = authToken;
        }

        // Simulate connection delay (in production, this would be actual device pairing)
        await new Promise((resolve) => setTimeout(resolve, 1500));

        // Update device status to connected
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceData.id
              ? {
                  ...d,
                  status: 'connected' as const,
                  lastSync: 'Just now',
                  battery: deviceData.type === 'apple_watch' ? 85 : undefined,
                }
              : d
          )
        );

        // Dispatch device connected event for other components
        if (typeof window !== 'undefined') {
          window.dispatchEvent(
            new CustomEvent('device-connected', {
              detail: { deviceId: deviceData.id, deviceName: deviceData.name },
            })
          );
        }

        toast.success(`Successfully connected to ${deviceData.name}`);
      } catch (error) {
        console.error('Device connection error:', error);
        setDevices((prev) =>
          prev.map((d) =>
            d.id === deviceData.id
              ? { ...d, status: 'error' as const }
              : d
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
        // Simulate sync delay
        await new Promise((resolve) => setTimeout(resolve, 2000));

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
  const connectedCount = devices.filter(
    (d) => d.status === 'connected'
  ).length;

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
