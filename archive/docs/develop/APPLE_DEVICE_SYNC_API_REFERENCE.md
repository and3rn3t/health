# Apple Device Sync - API Reference

## AppleDeviceSyncService

Main service class for managing device synchronization.

### Constructor

```typescript
new AppleDeviceSyncService(userId: string, config?: Partial<SyncConfiguration>)
```

**Parameters:**
- `userId` (string): User identifier
- `config` (Partial<SyncConfiguration>, optional): Sync configuration

### Methods

#### `startSync(): void`

Starts the synchronization process.

```typescript
service.startSync();
```

#### `stopSync(): void`

Stops the synchronization process.

```typescript
service.stopSync();
```

#### `getDevices(): AppleDevice[]`

Returns all connected devices.

```typescript
const devices = service.getDevices();
```

#### `getDevice(deviceId: string): AppleDevice | undefined`

Gets a specific device by ID.

```typescript
const device = service.getDevice('device-123');
```

#### `getSyncStatus(): SyncStatus`

Returns current sync status.

```typescript
const status = service.getSyncStatus();
// {
//   isActive: boolean,
//   lastSyncTime?: Date,
//   syncProgress: number,
//   metricsSynced: number,
//   errors: SyncError[],
//   currentDevice?: string
// }
```

#### `getSyncConfig(): SyncConfiguration`

Returns current sync configuration.

```typescript
const config = service.getSyncConfig();
```

#### `updateSyncConfig(config: Partial<SyncConfiguration>): void`

Updates sync configuration.

```typescript
service.updateSyncConfig({
  syncInterval: 60000,
  qualityThreshold: 0.8,
});
```

#### `onError(callback: (error: SyncError) => void): () => void`

Registers error listener. Returns unsubscribe function.

```typescript
const unsubscribe = service.onError((error) => {
  console.error('Sync error:', error);
});
```

#### `onStatusChange(callback: (status: SyncStatus) => void): () => void`

Registers status change listener.

```typescript
const unsubscribe = service.onStatusChange((status) => {
  console.log('Sync status:', status);
});
```

#### `onDevicesChange(callback: (devices: AppleDevice[]) => void): () => void`

Registers device change listener.

```typescript
const unsubscribe = service.onDevicesChange((devices) => {
  console.log('Devices:', devices);
});
```

#### `isConnected(): boolean`

Checks if WebSocket is connected.

```typescript
if (service.isConnected()) {
  // Connected
}
```

#### `getConnectionStatus(): ConnectionStatus`

Returns WebSocket connection status.

```typescript
const status = service.getConnectionStatus();
```

#### `destroy(): void`

Cleans up service and stops all operations.

```typescript
service.destroy();
```

## useAppleDeviceSync Hook

React hook for device synchronization.

### Usage

```typescript
const {
  devices,
  syncStatus,
  isConnected,
  startSync,
  stopSync,
  updateConfig,
  getDevice,
  getConnectionStatus,
  service,
} = useAppleDeviceSync({
  userId: 'user-123',
  autoStart: true,
  config: {
    syncInterval: 30000,
    realTimeSync: true,
  },
});
```

### Return Values

- `devices` (AppleDevice[]): List of connected devices
- `syncStatus` (SyncStatus): Current sync status
- `isConnected` (boolean): WebSocket connection status
- `startSync` (() => void): Start synchronization
- `stopSync` (() => void): Stop synchronization
- `updateConfig` ((config: Partial<SyncConfiguration>) => void): Update configuration
- `getDevice` ((deviceId: string) => AppleDevice | undefined): Get device by ID
- `getConnectionStatus` (() => ConnectionStatus): Get connection status
- `service` (AppleDeviceSyncService | null): Service instance

## Types

### AppleDevice

```typescript
interface AppleDevice {
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
```

### DeviceCapabilities

```typescript
interface DeviceCapabilities {
  healthKit: boolean;
  lidar: boolean;
  motionSensors: boolean;
  heartRate: boolean;
  fallDetection: boolean;
  backgroundSync: boolean;
  watchConnectivity: boolean;
  arKit: boolean;
}
```

### SyncConfiguration

```typescript
interface SyncConfiguration {
  syncInterval: number; // milliseconds
  realTimeSync: boolean;
  backgroundSync: boolean;
  syncMetrics: string[];
  deviceFilters?: string[];
  qualityThreshold: number; // 0-1
}
```

### SyncStatus

```typescript
interface SyncStatus {
  isActive: boolean;
  lastSyncTime?: Date;
  syncProgress: number; // 0-100
  metricsSynced: number;
  errors: SyncError[];
  currentDevice?: string;
}
```

### SyncError

```typescript
interface SyncError {
  id: string;
  timestamp: Date;
  deviceId: string;
  errorType: 'connection' | 'data' | 'permission' | 'network' | 'unknown';
  message: string;
  resolved: boolean;
}
```

## Events

### iOS App Events

The iOS app should dispatch these events:

#### `apple-device-connected`

```typescript
window.dispatchEvent(new CustomEvent('apple-device-connected', {
  detail: {
    id: 'device-123',
    name: 'iPhone 15 Pro',
    type: 'iphone',
    capabilities: { ... },
    connectionStatus: 'connected',
    // ... other device properties
  }
}));
```

#### `apple-device-disconnected`

```typescript
window.dispatchEvent(new CustomEvent('apple-device-disconnected', {
  detail: {
    deviceId: 'device-123'
  }
}));
```

#### `apple-health-data`

```typescript
window.dispatchEvent(new CustomEvent('apple-health-data', {
  detail: {
    deviceId: 'device-123',
    timestamp: new Date(),
    metrics: [
      {
        metricType: 'heart_rate',
        value: 72,
        unit: 'bpm',
        timestamp: new Date().toISOString(),
        deviceId: 'device-123',
        confidence: 0.95,
        source: 'apple_watch',
      }
    ],
    deviceInfo: {
      batteryLevel: 85,
    }
  }
}));
```

## Device Capability Detection

### detectDeviceCapabilities()

Detects device capabilities from user agent.

```typescript
import { detectDeviceCapabilities } from '@/lib/deviceCapabilityDetection';

const deviceInfo = detectDeviceCapabilities();
// {
//   type: 'iphone' | 'ipad' | 'apple_watch' | 'unknown',
//   model?: string,
//   osVersion?: string,
//   capabilities: DeviceCapabilities
// }
```

### hasCapability()

Checks if device has specific capability.

```typescript
import { hasCapability } from '@/lib/deviceCapabilityDetection';

if (hasCapability(deviceInfo.capabilities, 'lidar')) {
  // LiDAR available
}
```

### requestMotionPermissions()

Requests motion sensor permissions.

```typescript
import { requestMotionPermissions } from '@/lib/deviceCapabilityDetection';

const granted = await requestMotionPermissions();
if (granted) {
  // Permissions granted
}
```

---

*Last Updated: January 2024*
