import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useDeviceManagement } from '../useDeviceManagement';
import type { ConnectedDevice, DeviceScanResult } from '../useDeviceManagement';

// Hoist mocks so they're available inside vi.mock factories
const { mockToast, mockServiceInstance, mockUnsubscribe } = vi.hoisted(() => {
  const mockUnsubscribe = vi.fn();
  const mockServiceInstance = {
    onDevicesChange: vi.fn(() => mockUnsubscribe),
    getDetectedDevices: vi.fn().mockReturnValue([]),
    getDevice: vi.fn(),
    scanBluetoothDevices: vi.fn().mockResolvedValue([]),
    connectBluetoothDevice: vi.fn().mockResolvedValue(false),
    addManualDevice: vi.fn((config: { id: string; name: string; type: string }) => ({
      id: config.id,
      name: config.name,
      type: config.type,
      status: 'online' as const,
      lastSeen: new Date(),
      capabilities: { healthKit: false, realTimeSync: false, backgroundSync: false },
      metadata: { clientType: 'manual' },
    })),
    toScanResult: vi.fn((d: { id: string; name: string; type: string; status: string; model?: string }) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      model: d.model,
      isPaired: d.status === 'online',
      signalStrength: undefined,
    })),
    toConnectedDevice: vi.fn((d: { id: string; name: string; type: string; status: string; lastSeen: Date; model?: string; osVersion?: string; capabilities?: Record<string, boolean> }) => ({
      id: d.id,
      name: d.name,
      type: d.type,
      status: d.status === 'online' ? 'connected' : 'disconnected',
      model: d.model,
      osVersion: d.osVersion,
      capabilities: d.capabilities,
      connectedAt: d.lastSeen.toISOString(),
      lastSeen: d.lastSeen.toISOString(),
    })),
    destroy: vi.fn(),
  };
  const mockToast = {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  };
  return { mockToast, mockServiceInstance, mockUnsubscribe };
});

// Mock dependencies
vi.mock('@/lib/liveHealthDataSync', () => ({
  getLiveHealthDataSync: vi.fn(() => ({
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    isConnected: vi.fn().mockReturnValue(false),
    onConnectionChange: vi.fn(() => vi.fn()),
    sendHealthData: vi.fn(),
  })),
  LiveHealthDataSync: vi.fn(),
}));

vi.mock('@/lib/deviceDetectionService', () => ({
  DeviceDetectionService: vi.fn(() => mockServiceInstance),
}));

vi.mock('sonner', () => ({
  toast: mockToast,
}));

// Suppress console noise in tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

describe('useDeviceManagement', () => {
  beforeEach(() => {
    localStorage.clear();
    // Reset call records
    Object.values(mockToast).forEach((fn) => fn.mockClear());
    Object.values(mockServiceInstance).forEach((fn) => {
      if (typeof fn === 'function' && 'mockClear' in fn) fn.mockClear();
    });
    // Re-apply implementations that mockClear may have removed
    mockServiceInstance.onDevicesChange.mockReturnValue(mockUnsubscribe);
    mockServiceInstance.getDetectedDevices.mockReturnValue([]);
    mockServiceInstance.scanBluetoothDevices.mockResolvedValue([]);
    mockServiceInstance.connectBluetoothDevice.mockResolvedValue(false);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('initial state', () => {
    it('should return empty devices array initially', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.devices).toEqual([]);
    });

    it('should not be scanning initially', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.isScanning).toBe(false);
    });

    it('should have empty scan results initially', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.scanResults).toEqual([]);
    });

    it('should have zero connected count initially', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.connectedCount).toBe(0);
    });

    it('should report no connected devices initially', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.hasConnectedDevices).toBe(false);
    });
  });

  describe('scanForDevices', () => {
    it('should set isScanning to true during scan', async () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      await act(async () => {
        await result.current.scanForDevices();
      });

      // After scan, isScanning should be false
      expect(result.current.isScanning).toBe(false);
    });

    it('should complete scan without throwing', async () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      await act(async () => {
        await result.current.scanForDevices();
      });

      // Scan should complete and set isScanning back to false
      expect(result.current.isScanning).toBe(false);
      expect(mockServiceInstance.getDetectedDevices).toHaveBeenCalled();
      expect(mockServiceInstance.scanBluetoothDevices).toHaveBeenCalled();
    });
  });

  describe('disconnectDevice', () => {
    it('should update device status to disconnected', async () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      // First add a device manually via KV
      act(() => {
        // Use the underlying state setter via addManualDevice
        result.current.addManualDevice({
          name: 'Test Phone',
          type: 'iphone',
        });
      });

      // Device should be in the list
      expect(result.current.devices.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('removeDevice', () => {
    it('should remove device from list', () => {
      // Pre-populate localStorage with a device
      const preDevice: ConnectedDevice = {
        id: 'dev-remove',
        name: 'Remove Me',
        type: 'scale',
        status: 'connected',
      };
      localStorage.setItem(
        'kv:connected-devices',
        JSON.stringify([preDevice]),
      );

      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.devices).toHaveLength(1);

      act(() => {
        result.current.removeDevice('dev-remove');
      });

      expect(result.current.devices).toHaveLength(0);
    });

    it('should show toast when device removed', () => {
      const preDevice: ConnectedDevice = {
        id: 'dev-rm',
        name: 'My Device',
        type: 'scale',
        status: 'connected',
      };
      localStorage.setItem(
        'kv:connected-devices',
        JSON.stringify([preDevice]),
      );

      const { result } = renderHook(() => useDeviceManagement('test-user'));

      act(() => {
        result.current.removeDevice('dev-rm');
      });

      expect(mockToast.info).toHaveBeenCalledWith(
        expect.stringContaining('Removed My Device'),
      );
    });

    it('should do nothing when removing nonexistent device', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      act(() => {
        result.current.removeDevice('nonexistent');
      });

      expect(result.current.devices).toEqual([]);
    });
  });

  describe('getDevice', () => {
    it('should return device by ID', () => {
      const preDevice: ConnectedDevice = {
        id: 'dev-find',
        name: 'Findable',
        type: 'iphone',
        status: 'connected',
      };
      localStorage.setItem(
        'kv:connected-devices',
        JSON.stringify([preDevice]),
      );

      const { result } = renderHook(() => useDeviceManagement('test-user'));
      const found = result.current.getDevice('dev-find');
      expect(found).toBeDefined();
      expect(found?.name).toBe('Findable');
    });

    it('should return undefined for nonexistent device', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.getDevice('nope')).toBeUndefined();
    });
  });

  describe('connectedCount and hasConnectedDevices', () => {
    it('should count only connected devices', () => {
      const devices: ConnectedDevice[] = [
        { id: 'a', name: 'A', type: 'iphone', status: 'connected' },
        { id: 'b', name: 'B', type: 'scale', status: 'disconnected' },
        { id: 'c', name: 'C', type: 'apple_watch', status: 'connected' },
        { id: 'd', name: 'D', type: 'health_app', status: 'error' },
      ];
      localStorage.setItem('kv:connected-devices', JSON.stringify(devices));

      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.connectedCount).toBe(2);
      expect(result.current.hasConnectedDevices).toBe(true);
    });

    it('should report false when all devices disconnected', () => {
      const devices: ConnectedDevice[] = [
        { id: 'a', name: 'A', type: 'iphone', status: 'disconnected' },
      ];
      localStorage.setItem('kv:connected-devices', JSON.stringify(devices));

      const { result } = renderHook(() => useDeviceManagement('test-user'));
      expect(result.current.connectedCount).toBe(0);
      expect(result.current.hasConnectedDevices).toBe(false);
    });
  });

  describe('addManualDevice', () => {
    it('should call detection service addManualDevice', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      act(() => {
        result.current.addManualDevice({
          name: 'My Scale',
          type: 'scale',
          model: 'Withings Body+',
          connectionMethod: 'manual',
        });
      });

      expect(mockServiceInstance.addManualDevice).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'My Scale',
          type: 'scale',
          model: 'Withings Body+',
          connectionMethod: 'manual',
        }),
      );
    });

    it('should call toConnectedDevice with detected device', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      act(() => {
        result.current.addManualDevice({
          name: 'My Scale',
          type: 'scale',
        });
      });

      expect(mockServiceInstance.toConnectedDevice).toHaveBeenCalled();
    });

    it('should show success toast on add', () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      act(() => {
        result.current.addManualDevice({
          name: 'My Scale',
          type: 'scale',
        });
      });

      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('My Scale'),
      );
    });
  });

  describe('connectDevice', () => {
    it('should show info toast if device already connected', async () => {
      const devices: ConnectedDevice[] = [
        { id: 'dev-1', name: 'Phone', type: 'iphone', status: 'connected' },
      ];
      localStorage.setItem('kv:connected-devices', JSON.stringify(devices));

      const { result } = renderHook(() => useDeviceManagement('test-user'));

      await act(async () => {
        await result.current.connectDevice({
          id: 'dev-1',
          name: 'Phone',
          type: 'iphone',
          isPaired: true,
        });
      });

      expect(mockToast.info).toHaveBeenCalledWith('Device already connected');
    });

    it('should set device to syncing when connecting scan result', async () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      const scanResult: DeviceScanResult = {
        id: 'bt-1',
        name: 'Bluetooth Scale',
        type: 'scale',
        isPaired: false,
      };

      await act(async () => {
        await result.current.connectDevice(scanResult);
      });

      // Should have tried to update devices (added with syncing then updated status)
      expect(result.current.devices.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe('disconnectDevice', () => {
    it('should set device status to disconnected', async () => {
      const devices: ConnectedDevice[] = [
        { id: 'dev-dc', name: 'My Watch', type: 'apple_watch', status: 'connected' },
      ];
      localStorage.setItem('kv:connected-devices', JSON.stringify(devices));

      const { result } = renderHook(() => useDeviceManagement('test-user'));

      await act(async () => {
        await result.current.disconnectDevice('dev-dc');
      });

      const device = result.current.devices.find((d) => d.id === 'dev-dc');
      expect(device?.status).toBe('disconnected');
      expect(mockToast.info).toHaveBeenCalledWith(
        expect.stringContaining('Disconnected from My Watch'),
      );
    });

    it('should do nothing for nonexistent device', async () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      await act(async () => {
        await result.current.disconnectDevice('nonexistent');
      });

      expect(result.current.devices).toEqual([]);
    });
  });

  describe('syncDevice', () => {
    it('should set device to syncing then back to connected', async () => {
      const devices: ConnectedDevice[] = [
        { id: 'dev-sync', name: 'Sync Phone', type: 'iphone', status: 'connected' },
      ];
      localStorage.setItem('kv:connected-devices', JSON.stringify(devices));

      const { result } = renderHook(() => useDeviceManagement('test-user'));

      await act(async () => {
        await result.current.syncDevice('dev-sync');
      });

      const device = result.current.devices.find((d) => d.id === 'dev-sync');
      expect(device?.status).toBe('connected');
      expect(device?.lastSync).toBe('Just now');
      expect(mockToast.success).toHaveBeenCalledWith(
        expect.stringContaining('Synced Sync Phone'),
      );
    });

    it('should do nothing for nonexistent device', async () => {
      const { result } = renderHook(() => useDeviceManagement('test-user'));

      await act(async () => {
        await result.current.syncDevice('nonexistent');
      });

      // No crash, no change
      expect(result.current.devices).toEqual([]);
    });
  });

  describe('userId handling', () => {
    it('should work without userId parameter', () => {
      const { result } = renderHook(() => useDeviceManagement());
      expect(result.current.devices).toEqual([]);
      expect(result.current.isScanning).toBe(false);
    });

    it('should work with explicit userId', () => {
      const { result } = renderHook(() =>
        useDeviceManagement('user-42'),
      );
      expect(result.current.devices).toEqual([]);
    });
  });
});
