/**
 * Apple Device Sync Service
 * Manages synchronization between Apple devices (iPhone, Apple Watch) and web app
 * Handles HealthKit data, device-dependent features, and real-time updates
 */

import { toast } from 'sonner';
import { DeviceDetectionService } from './deviceDetectionService';
import {
  LiveHealthDataSync,
  type LiveHealthMetric,
} from './liveHealthDataSync';

export interface AppleDevice {
  id: string;
  name: string;
  type: 'iphone' | 'apple_watch' | 'ipad';
  model?: string;
  osVersion?: string;
  capabilities: DeviceCapabilities;
  connectionStatus: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSync?: Date;
  batteryLevel?: number;
  isCharging?: boolean;
}

export interface DeviceCapabilities {
  healthKit: boolean;
  lidar: boolean;
  motionSensors: boolean;
  heartRate: boolean;
  fallDetection: boolean;
  backgroundSync: boolean;
  watchConnectivity: boolean;
  arKit: boolean;
}

export interface SyncConfiguration {
  syncInterval: number; // milliseconds
  realTimeSync: boolean;
  backgroundSync: boolean;
  syncMetrics: string[];
  deviceFilters?: string[];
  qualityThreshold: number; // 0-1
}

export interface SyncStatus {
  isActive: boolean;
  lastSyncTime?: Date;
  syncProgress: number; // 0-100
  metricsSynced: number;
  errors: SyncError[];
  currentDevice?: string;
}

export interface SyncError {
  id: string;
  timestamp: Date;
  deviceId: string;
  errorType: 'connection' | 'data' | 'permission' | 'network' | 'unknown';
  message: string;
  resolved: boolean;
}

export interface DeviceHealthData {
  deviceId: string;
  timestamp: Date;
  metrics: LiveHealthMetric[];
  deviceInfo: {
    batteryLevel?: number;
    temperature?: number;
    signalStrength?: number;
  };
}

export class AppleDeviceSyncService {
  private devices: Map<string, AppleDevice> = new Map();
  private syncStatus: SyncStatus;
  private syncConfig: SyncConfiguration;
  private liveSync: LiveHealthDataSync;
  private deviceDetection: DeviceDetectionService;
  private syncIntervalId: ReturnType<typeof setInterval> | null = null;
  private errorListeners: Set<(error: SyncError) => void> = new Set();
  private statusListeners: Set<(status: SyncStatus) => void> = new Set();
  private deviceListeners: Set<(devices: AppleDevice[]) => void> = new Set();

  constructor(userId: string, config?: Partial<SyncConfiguration>) {
    this.syncConfig = {
      syncInterval: config?.syncInterval || 30000, // 30 seconds default
      realTimeSync: config?.realTimeSync ?? true,
      backgroundSync: config?.backgroundSync ?? true,
      syncMetrics: config?.syncMetrics || [
        'heart_rate',
        'steps',
        'walking_steadiness',
        'gait_speed',
        'fall_detected',
      ],
      qualityThreshold: config?.qualityThreshold || 0.7,
    };

    this.syncStatus = {
      isActive: false,
      syncProgress: 0,
      metricsSynced: 0,
      errors: [],
    };

    // Initialize live sync service
    this.liveSync = new LiveHealthDataSync(userId, {
      url: this.getWebSocketUrl(),
      reconnectAttempts: 10,
      heartbeatInterval: 30000,
    });

    // Initialize device detection service
    this.deviceDetection = new DeviceDetectionService(this.liveSync);

    // Listen for device connections
    this.setupDeviceListeners();

    // Listen for detected devices from detection service
    this.setupDetectionListeners();
  }

  /**
   * Get WebSocket URL based on environment
   */
  private getWebSocketUrl(): string {
    if (typeof window === 'undefined') return '';

    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;

    // Check for custom WebSocket URL in environment
    const customUrl = import.meta.env.VITE_WS_URL;
    if (customUrl) return customUrl;

    return `${protocol}://${host}/ws`;
  }

  /**
   * Setup listeners for device events
   */
  private setupDeviceListeners(): void {
    if (typeof window === 'undefined') return;

    // Listen for iOS device connection events
    window.addEventListener('apple-device-connected', ((
      event: CustomEvent<{
        deviceId: string;
        deviceName: string;
        deviceType: string;
        deviceInfo?: Record<string, unknown>;
      }>
    ) => {
      const detected = this.deviceDetection.getDevice(event.detail.deviceId);
      if (detected) {
        const appleDevice: AppleDevice = {
          id: detected.id,
          name: detected.name,
          type: detected.type as 'iphone' | 'apple_watch' | 'ipad',
          model: detected.model,
          osVersion: detected.osVersion,
          capabilities: this.mapCapabilities(detected.capabilities),
          connectionStatus:
            detected.status === 'online' ? 'connected' : 'disconnected',
          lastSync: detected.lastSeen,
        };
        this.handleDeviceConnected(appleDevice);
      }
    }) as EventListener);

    window.addEventListener('apple-device-disconnected', ((
      event: CustomEvent<{ deviceId: string }>
    ) => {
      this.handleDeviceDisconnected(event.detail.deviceId);
    }) as EventListener);

    window.addEventListener('apple-health-data', ((
      event: CustomEvent<DeviceHealthData>
    ) => {
      this.handleHealthData(event.detail);
    }) as EventListener);

    // Listen for WebSocket connection status
    this.liveSync.onConnectionChange((connected) => {
      if (connected) {
        // Auto-start sync if enabled
        if (this.syncConfig.realTimeSync && !this.syncStatus.isActive) {
          this.startSync();
        }
      } else {
        this.stopSync();
      }
    });
  }

  /**
   * Setup listeners for device detection service
   * Now supports iOS devices from any connection method
   */
  private setupDetectionListeners(): void {
    this.deviceDetection.onDevicesChange((detectedDevices) => {
      // Update our device map with detected devices
      // Include iOS devices regardless of connection method (iOS app, Bluetooth, manual)
      detectedDevices.forEach((detected) => {
        // Only process iOS devices (iphone, apple_watch, ipad)
        const isIOSDevice = ['iphone', 'apple_watch', 'ipad'].includes(detected.type);
        if (detected.status === 'online' && isIOSDevice) {
          const appleDevice: AppleDevice = {
            id: detected.id,
            name: detected.name,
            type: detected.type as 'iphone' | 'apple_watch' | 'ipad',
            model: detected.model,
            osVersion: detected.osVersion,
            capabilities: this.mapCapabilities(detected.capabilities),
            connectionStatus: 'connected',
            lastSync: detected.lastSeen,
          };
          this.devices.set(appleDevice.id, appleDevice);
        }
      });
      this.notifyDeviceListeners();
    });
  }

  /**
   * Map detected capabilities to AppleDevice capabilities
   */
  private mapCapabilities(capabilities?: {
    healthKit?: boolean;
    realTimeSync?: boolean;
    backgroundSync?: boolean;
  }): DeviceCapabilities {
    return {
      healthKit: capabilities?.healthKit ?? true,
      lidar: false, // Would need device info to determine
      motionSensors: true,
      heartRate: true,
      fallDetection: true,
      backgroundSync: capabilities?.backgroundSync ?? true,
      watchConnectivity: true,
      arKit: false, // Would need device info to determine
    };
  }

  /**
   * Handle device connection
   */
  private handleDeviceConnected(device: AppleDevice): void {
    this.devices.set(device.id, device);
    this.notifyDeviceListeners();

    toast.success(`${device.name} connected`);

    // Start syncing if not already active
    if (!this.syncStatus.isActive && this.syncConfig.realTimeSync) {
      this.startSync();
    }
  }

  /**
   * Handle device disconnection
   */
  private handleDeviceDisconnected(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (device) {
      device.connectionStatus = 'disconnected';
      this.devices.set(deviceId, device);
      this.notifyDeviceListeners();

      toast.info(`${device.name} disconnected`);
    }
  }

  /**
   * Handle health data from device
   */
  private handleHealthData(data: DeviceHealthData): void {
    const device = this.devices.get(data.deviceId);
    if (!device) {
      this.addError({
        deviceId: data.deviceId,
        errorType: 'data',
        message: 'Received data from unknown device',
      });
      return;
    }

    // Update device last sync time
    device.lastSync = new Date();
    device.connectionStatus = 'connected';
    this.devices.set(data.deviceId, device);

    // Process and sync metrics
    this.processHealthData(data.metrics, device);

    // Update sync status
    this.syncStatus.metricsSynced += data.metrics.length;
    this.syncStatus.lastSyncTime = new Date();
    this.notifyStatusListeners();
  }

  /**
   * Process health data metrics
   */
  private processHealthData(
    metrics: LiveHealthMetric[],
    device: AppleDevice
  ): void {
    const filteredMetrics = metrics.filter((metric) => {
      // Filter by configured metrics
      if (!this.syncConfig.syncMetrics.includes(metric.metricType)) {
        return false;
      }

      // Filter by device if specified
      if (
        this.syncConfig.deviceFilters &&
        !this.syncConfig.deviceFilters.includes(device.id)
      ) {
        return false;
      }

      // Quality threshold check
      if (metric.confidence < this.syncConfig.qualityThreshold) {
        return false;
      }

      return true;
    });

    // Send to live sync service
    filteredMetrics.forEach((metric) => {
      this.liveSync.sendHealthData(metric);
    });
  }

  /**
   * Start synchronization
   */
  startSync(): void {
    if (this.syncStatus.isActive) return;

    this.syncStatus.isActive = true;
    this.syncStatus.syncProgress = 0;
    this.notifyStatusListeners();

    // Connect to WebSocket if not connected
    if (!this.liveSync.isConnected()) {
      this.liveSync.connect();
    }

    // Start periodic sync if enabled
    if (this.syncConfig.backgroundSync && this.syncIntervalId === null) {
      this.syncIntervalId = setInterval(() => {
        this.performSync();
      }, this.syncConfig.syncInterval);
    }

    toast.success('Device sync started');
  }

  /**
   * Stop synchronization
   */
  stopSync(): void {
    if (!this.syncStatus.isActive) return;

    this.syncStatus.isActive = false;
    this.syncStatus.syncProgress = 0;

    if (this.syncIntervalId) {
      clearInterval(this.syncIntervalId);
      this.syncIntervalId = null;
    }

    this.notifyStatusListeners();
    toast.info('Device sync stopped');
  }

  /**
   * Resolve an error
   */
  resolveError(errorId: string): void {
    const error = this.syncStatus.errors.find((e) => e.id === errorId);
    if (error) {
      error.resolved = true;
      this.notifyStatusListeners();
    }
  }

  /**
   * Clear all resolved errors
   */
  clearResolvedErrors(): void {
    this.syncStatus.errors = this.syncStatus.errors.filter((e) => !e.resolved);
    this.notifyStatusListeners();
  }

  /**
   * Perform synchronization cycle
   */
  private async performSync(): Promise<void> {
    if (!this.syncStatus.isActive) return;

    const connectedDevices = Array.from(this.devices.values()).filter(
      (d) => d.connectionStatus === 'connected'
    );

    if (connectedDevices.length === 0) {
      this.addError({
        deviceId: 'system',
        errorType: 'connection',
        message: 'No devices connected',
      });
      return;
    }

    this.syncStatus.syncProgress = 0;
    this.notifyStatusListeners();

    try {
      // Request data from each device
      for (let i = 0; i < connectedDevices.length; i++) {
        const device = connectedDevices[i];
        this.syncStatus.currentDevice = device.id;
        this.syncStatus.syncProgress = Math.round(
          ((i + 1) / connectedDevices.length) * 100
        );
        this.notifyStatusListeners();

        // Trigger device sync (this would be handled by iOS app)
        this.requestDeviceSync(device.id);
      }

      this.syncStatus.syncProgress = 100;
      this.syncStatus.currentDevice = undefined;
      this.notifyStatusListeners();
    } catch (error) {
      this.addError({
        deviceId: 'system',
        errorType: 'unknown',
        message: `Sync failed: ${(error as Error).message}`,
      });
    }
  }

  /**
   * Request sync from specific device
   * Sends actual sync request via WebSocket
   */
  private requestDeviceSync(deviceId: string): void {
    const device = this.devices.get(deviceId);
    if (!device) {
      this.addError({
        deviceId,
        errorType: 'connection',
        message: 'Device not found',
      });
      return;
    }

    // Send sync request via WebSocket if connected
    if (this.liveSync.isConnected()) {
      this.liveSync.sendHealthData({
        timestamp: new Date().toISOString(),
        metricType: 'heart_rate', // Sync request trigger
        value: 0,
        deviceId,
        confidence: 1,
        source: device.type === 'apple_watch' ? 'apple_watch' : 'iphone',
      } as LiveHealthMetric);
    }

    // Also dispatch event that iOS app can listen to
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('request-device-sync', {
          detail: {
            deviceId,
            metrics: this.syncConfig.syncMetrics,
            syncInterval: this.syncConfig.syncInterval,
          },
        })
      );
    }
  }

  /**
   * Add sync error
   */
  private addError(
    error: Omit<SyncError, 'id' | 'timestamp' | 'resolved'>
  ): void {
    // Use crypto.randomUUID() for secure ID generation
    const syncError: SyncError = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `error-${Date.now()}-${Array.from(crypto.getRandomValues(new Uint8Array(8)), (b) => b.toString(36)).join('')}`,
      timestamp: new Date(),
      resolved: false,
      ...error,
    };

    this.syncStatus.errors.unshift(syncError);
    // Keep last 50 errors
    if (this.syncStatus.errors.length > 50) {
      this.syncStatus.errors = this.syncStatus.errors.slice(0, 50);
    }

    this.notifyErrorListeners(syncError);
    this.notifyStatusListeners();
  }

  /**
   * Get all devices
   */
  getDevices(): AppleDevice[] {
    return Array.from(this.devices.values());
  }

  /**
   * Get device by ID
   */
  getDevice(deviceId: string): AppleDevice | undefined {
    return this.devices.get(deviceId);
  }

  /**
   * Get sync status
   */
  getSyncStatus(): SyncStatus {
    return { ...this.syncStatus };
  }

  /**
   * Get sync configuration
   */
  getSyncConfig(): SyncConfiguration {
    return { ...this.syncConfig };
  }

  /**
   * Update sync configuration
   */
  updateSyncConfig(config: Partial<SyncConfiguration>): void {
    this.syncConfig = { ...this.syncConfig, ...config };

    // Restart sync if interval changed
    if (config.syncInterval && this.syncIntervalId) {
      this.stopSync();
      this.startSync();
    }
  }

  /**
   * Register error listener
   */
  onError(callback: (error: SyncError) => void): () => void {
    this.errorListeners.add(callback);
    return () => this.errorListeners.delete(callback);
  }

  /**
   * Register status listener
   */
  onStatusChange(callback: (status: SyncStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => this.statusListeners.delete(callback);
  }

  /**
   * Register device listener
   */
  onDevicesChange(callback: (devices: AppleDevice[]) => void): () => void {
    this.deviceListeners.add(callback);
    return () => this.deviceListeners.delete(callback);
  }

  /**
   * Notify error listeners
   */
  private notifyErrorListeners(error: SyncError): void {
    this.errorListeners.forEach((listener) => listener(error));
  }

  /**
   * Notify status listeners
   */
  private notifyStatusListeners(): void {
    this.statusListeners.forEach((listener) => listener(this.syncStatus));
  }

  /**
   * Notify device listeners
   */
  private notifyDeviceListeners(): void {
    this.deviceListeners.forEach((listener) => listener(this.getDevices()));
  }

  /**
   * Check if live sync is connected
   */
  isConnected(): boolean {
    return this.liveSync.isConnected();
  }

  /**
   * Get connection status from live sync
   */
  getConnectionStatus() {
    return this.liveSync.getConnectionStatus();
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.stopSync();
    this.liveSync.disconnect();
    this.errorListeners.clear();
    this.statusListeners.clear();
    this.deviceListeners.clear();
  }
}
