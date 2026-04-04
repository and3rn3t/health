/**
 * Tests for Apple Device Sync Service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { AppleDeviceSyncService } from '../appleDeviceSync';
import type { AppleDevice, SyncConfiguration } from '../appleDeviceSync';

// Mock LiveHealthDataSync
vi.mock('../liveHealthDataSync', () => ({
  LiveHealthDataSync: vi.fn().mockImplementation(() => ({
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
  })),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));

describe('AppleDeviceSyncService', () => {
  let service: AppleDeviceSyncService;
  const userId = 'test-user';

  beforeEach(() => {
    service = new AppleDeviceSyncService(userId);
  });

  it('initializes with default configuration', () => {
    const config = service.getSyncConfig();
    expect(config.syncInterval).toBe(30000);
    expect(config.realTimeSync).toBe(true);
    expect(config.backgroundSync).toBe(true);
  });

  it('starts and stops sync', () => {
    expect(service.getSyncStatus().isActive).toBe(false);

    service.startSync();
    expect(service.getSyncStatus().isActive).toBe(true);

    service.stopSync();
    expect(service.getSyncStatus().isActive).toBe(false);
  });

  it('handles device connection', () => {
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

    // Simulate device connection event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('apple-device-connected', { detail: device })
      );
    }

    const devices = service.getDevices();
    expect(devices.length).toBeGreaterThan(0);
  });

  it('updates sync configuration', () => {
    const newConfig: Partial<SyncConfiguration> = {
      syncInterval: 60000,
      realTimeSync: false,
    };

    service.updateSyncConfig(newConfig);
    const config = service.getSyncConfig();
    expect(config.syncInterval).toBe(60000);
    expect(config.realTimeSync).toBe(false);
  });

  it('tracks sync errors', () => {
    const status = service.getSyncStatus();
    expect(status.errors.length).toBe(0);

    // Errors would be added through internal error handling
    // This tests the structure
    expect(Array.isArray(status.errors)).toBe(true);
  });

  it('notifies listeners on status change', () => {
    const statusListener = vi.fn();
    const unsubscribe = service.onStatusChange(statusListener);

    service.startSync();
    expect(statusListener).toHaveBeenCalled();

    unsubscribe();
  });

  it('notifies listeners on device change', () => {
    const deviceListener = vi.fn();
    const unsubscribe = service.onDevicesChange(deviceListener);

    const device: AppleDevice = {
      id: 'device-1',
      name: 'Test Device',
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

    expect(deviceListener).toHaveBeenCalled();
    unsubscribe();
  });

  it('cleans up on destroy', () => {
    service.startSync();
    expect(service.getSyncStatus().isActive).toBe(true);

    service.destroy();
    expect(service.getSyncStatus().isActive).toBe(false);
  });
});
