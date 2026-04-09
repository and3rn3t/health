import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  DeviceDetectionService,
  type DetectedDevice,
} from '../deviceDetectionService';

// Mock liveHealthDataSync module
vi.mock('../liveHealthDataSync', () => ({
  LiveHealthDataSync: vi.fn(),
  getLiveHealthDataSync: vi.fn(),
}));

// Suppress console.error in tests
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'debug').mockImplementation(() => {});

describe('DeviceDetectionService', () => {
  let service: DeviceDetectionService;

  beforeEach(() => {
    service = new DeviceDetectionService(null);
  });

  afterEach(() => {
    service.destroy();
    vi.restoreAllMocks();
  });

  describe('constructor and initial state', () => {
    it('should start with no devices', () => {
      expect(service.getDetectedDevices()).toEqual([]);
    });

    it('should not be scanning initially', () => {
      expect(service.isScanning()).toBe(false);
    });
  });

  describe('updateFromPresence', () => {
    it('should add device from iOS app presence', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: {
          deviceId: 'iphone-123',
          deviceName: 'My iPhone',
          deviceType: 'iphone',
          model: 'iPhone 15 Pro',
          osVersion: '17.0',
        },
      });

      const devices = service.getDetectedDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0]).toMatchObject({
        id: 'iphone-123',
        name: 'My iPhone',
        type: 'iphone',
        status: 'online',
        model: 'iPhone 15 Pro',
        osVersion: '17.0',
      });
    });

    it('should set HealthKit capability for iOS devices', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: {
          deviceId: 'iphone-1',
          deviceType: 'iphone',
        },
      });

      const device = service.getDevice('iphone-1');
      expect(device?.capabilities?.healthKit).toBe(true);
      expect(device?.capabilities?.realTimeSync).toBe(true);
    });

    it('should set backgroundSync true for ios_app client type', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: { deviceId: 'dev-1', deviceType: 'iphone' },
      });

      const device = service.getDevice('dev-1');
      expect(device?.capabilities?.backgroundSync).toBe(true);
    });

    it('should set backgroundSync false for non-ios_app client types', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'web_dashboard',
        status: 'online',
        deviceInfo: { deviceId: 'dev-1', deviceType: 'iphone' },
      });

      const device = service.getDevice('dev-1');
      expect(device?.capabilities?.backgroundSync).toBe(false);
    });

    it('should not set HealthKit for non-iOS devices', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'web_dashboard',
        status: 'online',
        deviceInfo: {
          deviceId: 'scale-1',
          deviceType: 'scale',
        },
      });

      const device = service.getDevice('scale-1');
      expect(device?.capabilities?.healthKit).toBe(false);
    });

    it('should generate device ID from clientType and userId when deviceId missing', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
      });

      const devices = service.getDetectedDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0]!.id).toBe('ios_app-user-1');
    });

    it('should generate device name from deviceType when deviceName missing', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: {
          deviceType: 'apple_watch',
        },
      });

      const device = service.getDetectedDevices()[0]!;
      expect(device.name).toBe('Apple watch');
    });

    it('should use fallback name "Device" when no deviceInfo', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'web_dashboard',
        status: 'online',
      });

      const device = service.getDetectedDevices()[0]!;
      expect(device.name).toBe('Device');
    });

    it('should map ios_app clientType to iphone device type', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
      });

      expect(service.getDetectedDevices()[0]!.type).toBe('iphone');
    });

    it('should map watch_app clientType to apple_watch device type', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'watch_app',
        status: 'online',
      });

      expect(service.getDetectedDevices()[0]!.type).toBe('apple_watch');
    });

    it('should map unknown clientType to health_app device type', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'unknown_client',
        status: 'online',
      });

      expect(service.getDetectedDevices()[0]!.type).toBe('health_app');
    });

    it('should prefer deviceInfo.deviceType over clientType mapping', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: { deviceType: 'apple_watch' },
      });

      expect(service.getDetectedDevices()[0]!.type).toBe('apple_watch');
    });

    it('should update existing device when same ID seen again', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: { deviceId: 'dev-1', deviceName: 'First Name' },
      });

      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'offline',
        deviceInfo: { deviceId: 'dev-1', deviceName: 'Updated Name' },
      });

      const devices = service.getDetectedDevices();
      expect(devices).toHaveLength(1);
      expect(devices[0]!.status).toBe('offline');
      expect(devices[0]!.name).toBe('Updated Name');
    });

    it('should store metadata with userId and clientType', () => {
      service.updateFromPresence({
        userId: 'user-42',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: { deviceId: 'dev-1' },
      });

      const device = service.getDevice('dev-1');
      expect(device?.metadata?.userId).toBe('user-42');
      expect(device?.metadata?.clientType).toBe('ios_app');
    });

    it('should set HealthKit for apple_watch devices', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'watch_app',
        status: 'online',
        deviceInfo: { deviceId: 'watch-1', deviceType: 'apple_watch' },
      });

      expect(service.getDevice('watch-1')?.capabilities?.healthKit).toBe(true);
    });

    it('should set HealthKit for iPad devices', () => {
      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: { deviceId: 'ipad-1', deviceType: 'ipad' },
      });

      expect(service.getDevice('ipad-1')?.capabilities?.healthKit).toBe(true);
    });
  });

  describe('addManualDevice', () => {
    it('should add a manual device with correct properties', () => {
      const device = service.addManualDevice({
        id: 'manual-1',
        name: 'My Scale',
        type: 'scale',
        model: 'Withings Body+',
        connectionMethod: 'manual',
      });

      expect(device).toMatchObject({
        id: 'manual-1',
        name: 'My Scale',
        type: 'scale',
        status: 'online',
        model: 'Withings Body+',
      });
    });

    it('should not set HealthKit for non-iOS manual devices', () => {
      const device = service.addManualDevice({
        id: 'manual-1',
        name: 'Scale',
        type: 'scale',
        connectionMethod: 'manual',
      });

      expect(device.capabilities?.healthKit).toBe(false);
    });

    it('should set HealthKit for iOS manual devices', () => {
      const device = service.addManualDevice({
        id: 'manual-iphone',
        name: 'My iPhone',
        type: 'iphone',
        connectionMethod: 'manual',
      });

      expect(device.capabilities?.healthKit).toBe(true);
    });

    it('should set realTimeSync based on connection method', () => {
      const apiDevice = service.addManualDevice({
        id: 'api-1',
        name: 'API Device',
        type: 'health_app',
        connectionMethod: 'api',
      });
      expect(apiDevice.capabilities?.realTimeSync).toBe(true);

      const manualDevice = service.addManualDevice({
        id: 'manual-2',
        name: 'Manual Scale',
        type: 'scale',
        connectionMethod: 'manual',
      });
      expect(manualDevice.capabilities?.realTimeSync).toBe(false);
    });

    it('should set realTimeSync true for iOS devices regardless of connection method', () => {
      const device = service.addManualDevice({
        id: 'manual-ipad',
        name: 'iPad',
        type: 'ipad',
        connectionMethod: 'manual',
      });

      expect(device.capabilities?.realTimeSync).toBe(true);
    });

    it('should store connectionMethod in metadata', () => {
      const device = service.addManualDevice({
        id: 'bt-1',
        name: 'BT Device',
        type: 'health_app',
        connectionMethod: 'bluetooth',
      });

      expect(device.metadata?.clientType).toBe('bluetooth');
      expect(device.metadata?.deviceInfo).toEqual({
        connectionMethod: 'bluetooth',
      });
    });

    it('should be retrievable by getDevice', () => {
      service.addManualDevice({
        id: 'dev-x',
        name: 'Test Device',
        type: 'health_app',
        connectionMethod: 'manual',
      });

      const retrieved = service.getDevice('dev-x');
      expect(retrieved).toBeDefined();
      expect(retrieved?.name).toBe('Test Device');
    });
  });

  describe('getDetectedDevices / getDevice', () => {
    it('should return empty array when no devices exist', () => {
      expect(service.getDetectedDevices()).toEqual([]);
    });

    it('should return undefined for nonexistent device ID', () => {
      expect(service.getDevice('nonexistent')).toBeUndefined();
    });

    it('should return all added devices', () => {
      service.addManualDevice({
        id: 'a',
        name: 'A',
        type: 'scale',
        connectionMethod: 'manual',
      });
      service.addManualDevice({
        id: 'b',
        name: 'B',
        type: 'health_app',
        connectionMethod: 'api',
      });

      expect(service.getDetectedDevices()).toHaveLength(2);
    });
  });

  describe('toConnectedDevice', () => {
    it('should convert online device to connected status', () => {
      const detected: DetectedDevice = {
        id: 'dev-1',
        name: 'iPhone',
        type: 'iphone',
        status: 'online',
        lastSeen: new Date('2026-01-01T00:00:00Z'),
        model: 'iPhone 15',
        osVersion: '17.0',
        capabilities: { healthKit: true, realTimeSync: true },
      };

      const connected = service.toConnectedDevice(detected);
      expect(connected).toMatchObject({
        id: 'dev-1',
        name: 'iPhone',
        type: 'iphone',
        status: 'connected',
        model: 'iPhone 15',
        osVersion: '17.0',
      });
      expect(connected.connectedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(connected.lastSeen).toBe('2026-01-01T00:00:00.000Z');
    });

    it('should convert offline device to disconnected status', () => {
      const detected: DetectedDevice = {
        id: 'dev-2',
        name: 'Scale',
        type: 'scale',
        status: 'offline',
        lastSeen: new Date(),
      };

      const connected = service.toConnectedDevice(detected);
      expect(connected.status).toBe('disconnected');
    });

    it('should convert connecting device to disconnected status', () => {
      const detected: DetectedDevice = {
        id: 'dev-3',
        name: 'Watch',
        type: 'apple_watch',
        status: 'connecting',
        lastSeen: new Date(),
      };

      const connected = service.toConnectedDevice(detected);
      expect(connected.status).toBe('disconnected');
    });
  });

  describe('toScanResult', () => {
    it('should convert online device to paired scan result', () => {
      const detected: DetectedDevice = {
        id: 'dev-1',
        name: 'iPhone',
        type: 'iphone',
        status: 'online',
        lastSeen: new Date(),
        model: 'iPhone 15',
      };

      const result = service.toScanResult(detected);
      expect(result).toMatchObject({
        id: 'dev-1',
        name: 'iPhone',
        type: 'iphone',
        model: 'iPhone 15',
        isPaired: true,
      });
      expect(result.signalStrength).toBeUndefined();
    });

    it('should convert offline device to unpaired scan result', () => {
      const detected: DetectedDevice = {
        id: 'dev-2',
        name: 'Scale',
        type: 'scale',
        status: 'offline',
        lastSeen: new Date(),
      };

      const result = service.toScanResult(detected);
      expect(result.isPaired).toBe(false);
    });
  });

  describe('onDevicesChange', () => {
    it('should notify listeners when device added via updateFromPresence', () => {
      const listener = vi.fn();
      service.onDevicesChange(listener);

      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: { deviceId: 'dev-1' },
      });

      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ id: 'dev-1' }),
        ]),
      );
    });

    it('should notify listeners when manual device added', () => {
      const listener = vi.fn();
      service.onDevicesChange(listener);

      service.addManualDevice({
        id: 'man-1',
        name: 'Device',
        type: 'scale',
        connectionMethod: 'manual',
      });

      expect(listener).toHaveBeenCalledTimes(1);
    });

    it('should stop notifying after unsubscribe', () => {
      const listener = vi.fn();
      const unsubscribe = service.onDevicesChange(listener);

      unsubscribe();

      service.addManualDevice({
        id: 'man-1',
        name: 'Device',
        type: 'scale',
        connectionMethod: 'manual',
      });

      expect(listener).not.toHaveBeenCalled();
    });

    it('should support multiple listeners', () => {
      const listener1 = vi.fn();
      const listener2 = vi.fn();
      service.onDevicesChange(listener1);
      service.onDevicesChange(listener2);

      service.updateFromPresence({
        userId: 'user-1',
        clientType: 'ios_app',
        status: 'online',
        deviceInfo: { deviceId: 'dev-1' },
      });

      expect(listener1).toHaveBeenCalledTimes(1);
      expect(listener2).toHaveBeenCalledTimes(1);
    });
  });

  describe('scanBluetoothDevices', () => {
    it('should return empty array when window is undefined', async () => {
      const originalWindow = globalThis.window;
      // @ts-expect-error — testing no-window environment
      delete globalThis.window;

      const localService = new DeviceDetectionService(null);
      const results = await localService.scanBluetoothDevices();
      expect(results).toEqual([]);

      globalThis.window = originalWindow;
      localService.destroy();
    });

    it('should return empty array when Web Bluetooth is not available', async () => {
      const results = await service.scanBluetoothDevices();
      expect(results).toEqual([]);
    });
  });

  describe('connectBluetoothDevice', () => {
    it('should return false for unknown device ID', async () => {
      const result = await service.connectBluetoothDevice('unknown-id');
      expect(result).toBe(false);
    });
  });

  describe('destroy', () => {
    it('should clear all devices', () => {
      service.addManualDevice({
        id: 'dev-1',
        name: 'Device',
        type: 'scale',
        connectionMethod: 'manual',
      });

      expect(service.getDetectedDevices()).toHaveLength(1);

      service.destroy();

      expect(service.getDetectedDevices()).toEqual([]);
    });

    it('should clear all listeners', () => {
      const listener = vi.fn();
      service.onDevicesChange(listener);

      service.destroy();

      // Add a device after destroy — listener should NOT be called
      // We need to re-add since destroy clears the device map too
      service.addManualDevice({
        id: 'dev-1',
        name: 'Device',
        type: 'scale',
        connectionMethod: 'manual',
      });

      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe('isScanning', () => {
    it('should return false when not scanning', () => {
      expect(service.isScanning()).toBe(false);
    });
  });
});
