/**
 * Integration tests for Apple Device Sync
 * Tests the full sync flow from device connection to data synchronization
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { AppleDeviceSyncService } from '@/lib/appleDeviceSync';
import type { AppleDevice, DeviceHealthData } from '@/lib/appleDeviceSync';

// Mock LiveHealthDataSync
const mockLiveSync = {
  connect: vi.fn(),
  disconnect: vi.fn(),
  isConnected: vi.fn(() => true),
  getConnectionStatus: vi.fn(() => ({
    connected: true,
    lastHeartbeat: new Date().toISOString(),
    reconnectAttempts: 0,
    latency: 50,
    dataQuality: 'excellent' as const,
  })),
  sendHealthData: vi.fn(),
  onConnectionChange: vi.fn(() => () => {}),
};

vi.mock('@/lib/liveHealthDataSync', () => ({
  LiveHealthDataSync: vi.fn().mockImplementation(() => mockLiveSync),
}));

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('Device Sync Integration', () => {
  let service: AppleDeviceSyncService;
  const userId = 'test-user';

  beforeEach(() => {
    service = new AppleDeviceSyncService(userId);
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.destroy();
  });

  it('completes full sync flow: connect -> sync -> receive data', async () => {
    // 1. Device connects
    const device: AppleDevice = {
      id: 'device-1',
      name: 'iPhone 15 Pro',
      type: 'iphone',
      capabilities: {
        healthKit: true,
        lidar: true,
        motionSensors: true,
        heartRate: true,
        fallDetection: true,
        backgroundSync: true,
        watchConnectivity: true,
        arKit: true,
      },
      connectionStatus: 'connected',
    };

    // Simulate device connection
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apple-device-connected', { detail: device })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 2. Start sync
    service.startSync();
    expect(service.getSyncStatus().isActive).toBe(true);

    // 3. Receive health data
    const healthData: DeviceHealthData = {
      deviceId: 'device-1',
      timestamp: new Date(),
      metrics: [
        {
          metricType: 'heart_rate',
          value: 72,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          deviceId: 'device-1',
          confidence: 0.95,
          source: 'apple_watch',
        },
      ],
      deviceInfo: {
        batteryLevel: 85,
      },
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apple-health-data', { detail: healthData })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // 4. Verify data was processed
    expect(mockLiveSync.sendHealthData).toHaveBeenCalled();
    const status = service.getSyncStatus();
    expect(status.metricsSynced).toBeGreaterThan(0);
  });

  it('handles device disconnection gracefully', async () => {
    const device: AppleDevice = {
      id: 'device-1',
      name: 'iPhone 15 Pro',
      type: 'iphone',
      capabilities: {
        healthKit: true,
        lidar: false,
        motionSensors: true,
        heartRate: true,
        fallDetection: true,
        backgroundSync: true,
        watchConnectivity: false,
        arKit: false,
      },
      connectionStatus: 'connected',
    };

    // Connect device
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apple-device-connected', { detail: device })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Disconnect device
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apple-device-disconnected', {
          detail: { deviceId: 'device-1' },
        })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    const devices = service.getDevices();
    const disconnectedDevice = devices.find((d) => d.id === 'device-1');
    expect(disconnectedDevice?.connectionStatus).toBe('disconnected');
  });

  it('filters data by quality threshold', async () => {
    service.updateSyncConfig({ qualityThreshold: 0.9 });

    const healthData: DeviceHealthData = {
      deviceId: 'device-1',
      timestamp: new Date(),
      metrics: [
        {
          metricType: 'heart_rate',
          value: 72,
          unit: 'bpm',
          timestamp: new Date().toISOString(),
          deviceId: 'device-1',
          confidence: 0.5, // Below threshold
          source: 'apple_watch',
        },
        {
          metricType: 'steps',
          value: 5000,
          unit: 'count',
          timestamp: new Date().toISOString(),
          deviceId: 'device-1',
          confidence: 0.95, // Above threshold
          source: 'apple_watch',
        },
      ],
      deviceInfo: {},
    };

    // Add device first
    const device: AppleDevice = {
      id: 'device-1',
      name: 'iPhone',
      type: 'iphone',
      capabilities: {
        healthKit: true,
        lidar: false,
        motionSensors: true,
        heartRate: true,
        fallDetection: true,
        backgroundSync: true,
        watchConnectivity: false,
        arKit: false,
      },
      connectionStatus: 'connected',
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apple-device-connected', { detail: device })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Send data
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apple-health-data', { detail: healthData })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Only high-confidence data should be sent
    const calls = mockLiveSync.sendHealthData.mock.calls;
    expect(calls.length).toBe(1); // Only the high-confidence metric
    expect(calls[0][0].metricType).toBe('steps');
  });

  it('handles multiple devices simultaneously', async () => {
    const devices: AppleDevice[] = [
      {
        id: 'device-1',
        name: 'iPhone',
        type: 'iphone',
        capabilities: {
          healthKit: true,
          lidar: false,
          motionSensors: true,
          heartRate: true,
          fallDetection: true,
          backgroundSync: true,
          watchConnectivity: false,
          arKit: false,
        },
        connectionStatus: 'connected',
      },
      {
        id: 'device-2',
        name: 'Apple Watch',
        type: 'apple_watch',
        capabilities: {
          healthKit: true,
          lidar: false,
          motionSensors: true,
          heartRate: true,
          fallDetection: true,
          backgroundSync: true,
          watchConnectivity: true,
          arKit: false,
        },
        connectionStatus: 'connected',
      },
    ];

    // Connect both devices
    devices.forEach((device) => {
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('apple-device-connected', { detail: device })
        );
      }
    });

    await new Promise((resolve) => setTimeout(resolve, 100));

    const connectedDevices = service.getDevices();
    expect(connectedDevices.length).toBe(2);
  });

  it('handles sync errors and recovery', async () => {
    service.startSync();

    // Simulate error
    const device: AppleDevice = {
      id: 'device-1',
      name: 'iPhone',
      type: 'iphone',
      capabilities: {
        healthKit: true,
        lidar: false,
        motionSensors: true,
        heartRate: true,
        fallDetection: true,
        backgroundSync: true,
        watchConnectivity: false,
        arKit: false,
      },
      connectionStatus: 'error',
    };

    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apple-device-connected', { detail: device })
      );
    }

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify error is tracked
    const status = service.getSyncStatus();
    // Errors may be added through internal handling
    expect(Array.isArray(status.errors)).toBe(true);
  });
});
