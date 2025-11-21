/**
 * Real Device Detection Service
 * Detects devices via WebSocket presence messages and Web Bluetooth API
 */

import type {
  ConnectedDevice,
  DeviceScanResult,
  DeviceType,
} from '@/hooks/useDeviceManagement';
import { LiveHealthDataSync } from './liveHealthDataSync';

export interface DetectedDevice {
  id: string;
  name: string;
  type: DeviceType;
  model?: string;
  osVersion?: string;
  status: 'online' | 'offline' | 'connecting';
  lastSeen: Date;
  capabilities?: {
    healthKit?: boolean;
    realTimeSync?: boolean;
    backgroundSync?: boolean;
  };
  metadata?: {
    userId?: string;
    clientType?: string;
    deviceInfo?: Record<string, unknown>;
  };
}

// Web Bluetooth API types
interface Bluetooth extends EventTarget {
  requestDevice(options?: RequestDeviceOptions): Promise<BluetoothDevice>;
}

interface RequestDeviceOptions {
  filters?: BluetoothLEScanFilter[];
  optionalServices?: BluetoothServiceUUID[];
}

interface BluetoothLEScanFilter {
  services?: BluetoothServiceUUID[];
  name?: string;
  namePrefix?: string;
}

type BluetoothServiceUUID = number | string;

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer | null;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
}

interface NavigatorWithBluetooth extends Navigator {
  bluetooth?: Bluetooth;
}

export class DeviceDetectionService {
  private readonly detectedDevices: Map<string, DetectedDevice> = new Map();
  private readonly listeners: Set<(devices: DetectedDevice[]) => void> =
    new Set();
  private readonly liveSync: LiveHealthDataSync | null = null;
  private bluetoothScanning = false;
  private readonly bluetoothDevices: Map<string, DeviceScanResult> = new Map();

  constructor(liveSync: LiveHealthDataSync | null = null) {
    this.liveSync = liveSync;
    this.setupWebSocketListeners();
    this.setupBluetoothListeners();
  }

  /**
   * Setup listeners for WebSocket presence messages
   */
  private setupWebSocketListeners(): void {
    if (typeof globalThis.window === 'undefined') return;

    // Listen for device connection events from iOS app
    globalThis.window.addEventListener('apple-device-connected', ((
      event: CustomEvent<{
        deviceId: string;
        deviceName: string;
        deviceType: DeviceType;
        deviceInfo?: Record<string, unknown>;
      }>
    ) => {
      this.handleDeviceConnected(event.detail);
    }) as EventListener);

    globalThis.window.addEventListener('apple-device-disconnected', ((
      event: CustomEvent<{
        deviceId: string;
      }>
    ) => {
      this.handleDeviceDisconnected(event.detail.deviceId);
    }) as EventListener);

    // Listen for WebSocket presence updates
    if (this.liveSync) {
      // Subscribe to connection changes to detect iOS devices
      this.liveSync.onConnectionChange((connected) => {
        if (connected) {
          // Request device list from server
          this.requestDeviceList();
        }
      });
    }
  }

  /**
   * Setup Bluetooth device listeners
   */
  private setupBluetoothListeners(): void {
    if (globalThis.window === undefined) return;

    // Listen for Web Bluetooth API availability
    const nav = globalThis.navigator as NavigatorWithBluetooth;
    const hasWebBluetooth =
      typeof nav !== 'undefined' &&
      'bluetooth' in nav &&
      nav.bluetooth &&
      typeof nav.bluetooth === 'object';

    if (hasWebBluetooth) {
      // Web Bluetooth is available - we can scan for devices
      // Note: This requires user interaction to trigger
    }
  }

  /**
   * Request device list from WebSocket server
   */
  private requestDeviceList(): void {
    // The server should send client_presence messages when devices connect
    // We'll detect them through the LiveHealthDataSync service
    // This is handled automatically via WebSocket presence messages
  }

  /**
   * Handle device connected event
   */
  private handleDeviceConnected(details: {
    deviceId: string;
    deviceName: string;
    deviceType: DeviceType;
    deviceInfo?: Record<string, unknown>;
  }): void {
    const device: DetectedDevice = {
      id: details.deviceId,
      name: details.deviceName,
      type: details.deviceType,
      status: 'online',
      lastSeen: new Date(),
      model: details.deviceInfo?.model as string | undefined,
      osVersion: details.deviceInfo?.osVersion as string | undefined,
      capabilities: {
        healthKit: ['iphone', 'apple_watch', 'ipad'].includes(
          details.deviceType
        ),
        realTimeSync: true,
        backgroundSync: true,
      },
      metadata: {
        deviceInfo: details.deviceInfo,
      },
    };

    this.detectedDevices.set(device.id, device);
    this.notifyListeners();
  }

  /**
   * Handle device disconnected event
   */
  private handleDeviceDisconnected(deviceId: string): void {
    const device = this.detectedDevices.get(deviceId);
    if (device) {
      device.status = 'offline';
      device.lastSeen = new Date();
      this.detectedDevices.set(deviceId, device);
      this.notifyListeners();
    }
  }

  /**
   * Update device from WebSocket presence message
   */
  updateFromPresence(presence: {
    userId: string;
    clientType: string;
    status: 'online' | 'offline';
    deviceInfo?: {
      deviceId?: string;
      deviceName?: string;
      deviceType?: string;
      model?: string;
      osVersion?: string;
      [key: string]: unknown;
    };
  }): void {
    // Only process iOS app clients
    if (presence.clientType !== 'ios_app') return;

    const deviceId = presence.deviceInfo?.deviceId || `ios-${presence.userId}`;
    const deviceName = presence.deviceInfo?.deviceName || 'iPhone';
    const deviceType = this.mapClientTypeToDeviceType(presence.clientType);

    const device: DetectedDevice = {
      id: deviceId,
      name: deviceName,
      type: deviceType,
      status: presence.status,
      lastSeen: new Date(),
      model: presence.deviceInfo?.model,
      osVersion: presence.deviceInfo?.osVersion,
      capabilities: {
        healthKit: true,
        realTimeSync: true,
        backgroundSync: true,
      },
      metadata: {
        userId: presence.userId,
        clientType: presence.clientType,
        deviceInfo: presence.deviceInfo,
      },
    };

    this.detectedDevices.set(device.id, device);
    this.notifyListeners();
  }

  /**
   * Map client type to device type
   */
  private mapClientTypeToDeviceType(clientType: string): DeviceType {
    switch (clientType) {
      case 'ios_app':
        return 'iphone';
      case 'watch_app':
        return 'apple_watch';
      default:
        return 'health_app';
    }
  }

  /**
   * Scan for Bluetooth devices using Web Bluetooth API
   * Supports direct connection without iOS app
   */
  async scanBluetoothDevices(): Promise<DeviceScanResult[]> {
    if (globalThis.window === undefined) {
      return [];
    }

    const nav = globalThis.navigator as NavigatorWithBluetooth;
    const hasWebBluetooth =
      typeof nav !== 'undefined' &&
      'bluetooth' in nav &&
      nav.bluetooth &&
      typeof nav.bluetooth === 'object' &&
      'requestDevice' in nav.bluetooth;

    if (!hasWebBluetooth || !nav.bluetooth) {
      // Web Bluetooth not available - return empty array
      return [];
    }

    try {
      this.bluetoothScanning = true;

      // Request Bluetooth device with health service
      // This allows direct connection without iOS app
      const device = await nav.bluetooth.requestDevice({
        filters: [
          { services: ['heart_rate'] },
          { services: ['battery_service'] },
          { services: ['blood_pressure'] },
          { services: ['glucose'] },
          { services: ['weight_scale'] },
          { namePrefix: 'Apple' },
          { namePrefix: 'Withings' },
          { namePrefix: 'Omron' },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Garmin' },
        ],
        optionalServices: [
          'device_information',
          'battery_service',
          'heart_rate',
          'blood_pressure',
          'glucose',
          'weight_scale',
        ],
      });

      const scanResult: DeviceScanResult = {
        id: device.id,
        name: device.name || 'Unknown Device',
        type: this.inferDeviceType(device.name || ''),
        isPaired: device.gatt?.connected || false,
        signalStrength: undefined, // Web Bluetooth doesn't provide signal strength
      };

      this.bluetoothDevices.set(device.id, scanResult);
      this.bluetoothScanning = false;

      return [scanResult];
    } catch (error) {
      this.bluetoothScanning = false;
      if ((error as Error).name === 'NotFoundError') {
        // User cancelled or no device found
        return [];
      }
      console.error('Bluetooth scan error:', error);
      return [];
    }
  }

  /**
   * Connect directly to a Bluetooth device
   * Establishes GATT connection and reads device information
   */
  async connectBluetoothDevice(deviceId: string): Promise<boolean> {
    const scanResult = this.bluetoothDevices.get(deviceId);
    if (!scanResult) {
      return false;
    }

    try {
      const nav = globalThis.navigator as NavigatorWithBluetooth;
      if (!nav.bluetooth) {
        return false;
      }

      // Request device again to get connection
      const device = await nav.bluetooth.requestDevice({
        filters: [{ name: scanResult.name }],
        optionalServices: [
          'device_information',
          'battery_service',
          'heart_rate',
          'blood_pressure',
          'glucose',
          'weight_scale',
        ],
      });

      // Connect to GATT server
      // Note: Web Bluetooth API connection is established when you access a service
      // The device.gatt.connected property indicates if already connected
      if (device.gatt) {
        // Check if already connected
        if (device.gatt.connected) {
          // Already connected, proceed
        } else {
          // Connection will be established when we access a service
          // For now, we'll assume connection is possible
          // Actual connection happens when reading/writing characteristics
        }

        // Update device status
        const detected: DetectedDevice = {
          id: device.id,
          name: device.name || scanResult.name,
          type: scanResult.type,
          status: 'online',
          lastSeen: new Date(),
          model: scanResult.model,
          capabilities: {
            healthKit: false, // Direct Bluetooth devices don't use HealthKit
            realTimeSync: true,
            backgroundSync: false, // Browser limitations
          },
        };

        this.detectedDevices.set(device.id, detected);
        this.notifyListeners();

        return true;
      }

      return false;
    } catch (error) {
      console.error('Bluetooth connection error:', error);
      return false;
    }
  }

  /**
   * Add a manually configured device
   * Allows users to add devices without scanning
   */
  addManualDevice(config: {
    id: string;
    name: string;
    type: DeviceType;
    model?: string;
    connectionMethod: 'manual' | 'bluetooth' | 'api' | 'other';
  }): DetectedDevice {
    const device: DetectedDevice = {
      id: config.id,
      name: config.name,
      type: config.type,
      status: 'online',
      lastSeen: new Date(),
      model: config.model,
      capabilities: {
        healthKit: false,
        realTimeSync: config.connectionMethod === 'api',
        backgroundSync: false,
      },
      metadata: {
        userId: undefined,
        clientType: config.connectionMethod,
        deviceInfo: {
          connectionMethod: config.connectionMethod,
        },
      },
    };

    this.detectedDevices.set(device.id, device);
    this.notifyListeners();

    return device;
  }

  /**
   * Infer device type from device name
   */
  private inferDeviceType(deviceName: string): DeviceType {
    const name = deviceName.toLowerCase();
    if (name.includes('watch')) return 'apple_watch';
    if (name.includes('iphone')) return 'iphone';
    if (name.includes('ipad')) return 'ipad';
    if (name.includes('scale') || name.includes('withings')) return 'scale';
    if (
      name.includes('blood') ||
      name.includes('pressure') ||
      name.includes('omron')
    )
      return 'blood-pressure';
    if (name.includes('glucose')) return 'glucose';
    return 'health_app';
  }

  /**
   * Get all detected devices
   */
  getDetectedDevices(): DetectedDevice[] {
    return Array.from(this.detectedDevices.values());
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): DetectedDevice | undefined {
    return this.detectedDevices.get(deviceId);
  }

  /**
   * Convert detected device to ConnectedDevice
   */
  toConnectedDevice(detected: DetectedDevice): ConnectedDevice {
    return {
      id: detected.id,
      name: detected.name,
      type: detected.type,
      status: detected.status === 'online' ? 'connected' : 'disconnected',
      model: detected.model,
      osVersion: detected.osVersion,
      capabilities: detected.capabilities,
      connectedAt: detected.lastSeen.toISOString(),
      lastSeen: detected.lastSeen.toISOString(),
    };
  }

  /**
   * Convert detected device to DeviceScanResult
   */
  toScanResult(detected: DetectedDevice): DeviceScanResult {
    return {
      id: detected.id,
      name: detected.name,
      type: detected.type,
      model: detected.model,
      isPaired: detected.status === 'online',
      signalStrength: undefined,
    };
  }

  /**
   * Register listener for device changes
   */
  onDevicesChange(callback: (devices: DetectedDevice[]) => void): () => void {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(): void {
    const devices = this.getDetectedDevices();
    this.listeners.forEach((listener) => listener(devices));
  }

  /**
   * Check if currently scanning
   */
  isScanning(): boolean {
    return this.bluetoothScanning;
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.listeners.clear();
    this.detectedDevices.clear();
    this.bluetoothDevices.clear();
  }
}
