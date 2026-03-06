# Apple Device Sync - Developer Guide

## Architecture Overview

The Apple Device Sync system consists of:

```
src/
├── lib/
│   ├── appleDeviceSync.ts          # Main sync service
│   ├── deviceCapabilityDetection.ts # Device feature detection
│   └── liveHealthDataSync.ts        # WebSocket integration
├── hooks/
│   └── useAppleDeviceSync.ts       # React hook
└── components/
    └── device/
        └── AppleDeviceSyncDashboard.tsx # UI component
```

## Core Components

### AppleDeviceSyncService

**Purpose**: Main service for managing device synchronization

**Key Methods**:
- `startSync()`: Start synchronization
- `stopSync()`: Stop synchronization
- `updateSyncConfig()`: Update sync configuration
- `getDevices()`: Get all connected devices
- `getSyncStatus()`: Get current sync status

**Event Listeners**:
- `onError()`: Listen for sync errors
- `onStatusChange()`: Listen for status changes
- `onDevicesChange()`: Listen for device changes

### Device Capability Detection

**Purpose**: Detect device-specific features

**Features Detected**:
- HealthKit availability
- LiDAR capability
- Motion sensors
- Heart rate monitoring
- Fall detection
- Background sync
- Watch connectivity
- ARKit support

### LiveHealthDataSync Integration

**Purpose**: WebSocket-based real-time data streaming

**Integration Points**:
- Health data transmission
- Connection management
- Error handling
- Reconnection logic

## Data Flow

```
iOS Device → HealthKit → WebSocket → LiveHealthDataSync → AppleDeviceSyncService → UI
```

1. **Device Connection**
   - iOS app connects via WebSocket
   - Device capabilities detected
   - Device registered in sync service

2. **Data Collection**
   - HealthKit data collected on device
   - Data formatted and validated
   - Sent via WebSocket

3. **Data Processing**
   - Received by LiveHealthDataSync
   - Filtered by quality threshold
   - Processed by AppleDeviceSyncService
   - Distributed to subscribers

4. **UI Updates**
   - React hook receives updates
   - UI components re-render
   - User sees real-time data

## Integration Guide

### Basic Usage

```typescript
import { useAppleDeviceSync } from '@/hooks/useAppleDeviceSync';

function MyComponent() {
  const {
    devices,
    syncStatus,
    isConnected,
    startSync,
    stopSync,
  } = useAppleDeviceSync({
    userId: 'user-123',
    autoStart: true,
  });

  return (
    <div>
      {devices.map(device => (
        <div key={device.id}>{device.name}</div>
      ))}
    </div>
  );
}
```

### Advanced Configuration

```typescript
const { updateConfig } = useAppleDeviceSync({
  userId: 'user-123',
  config: {
    syncInterval: 60000, // 1 minute
    realTimeSync: true,
    backgroundSync: false,
    qualityThreshold: 0.8,
    syncMetrics: ['heart_rate', 'steps'],
  },
});

// Update configuration
updateConfig({
  syncInterval: 30000,
  qualityThreshold: 0.9,
});
```

### Device Capability Detection

```typescript
import { detectDeviceCapabilities, hasCapability } from '@/lib/deviceCapabilityDetection';

const deviceInfo = detectDeviceCapabilities();

if (hasCapability(deviceInfo.capabilities, 'lidar')) {
  // Enable LiDAR features
}

if (hasCapability(deviceInfo.capabilities, 'fallDetection')) {
  // Enable fall detection
}
```

## iOS Integration

### Device Connection Event

iOS app should dispatch events when connecting:

```swift
// Swift code
let deviceInfo: [String: Any] = [
    "id": deviceId,
    "name": deviceName,
    "type": "iphone",
    "capabilities": [
        "healthKit": true,
        "lidar": hasLiDAR,
        // ...
    ]
]

// Dispatch to web
webView.evaluateJavaScript("""
    window.dispatchEvent(new CustomEvent('apple-device-connected', {
        detail: \(deviceInfo)
    }));
""")
```

### Health Data Event

Send health data from iOS:

```swift
let healthData: [String: Any] = [
    "deviceId": deviceId,
    "timestamp": Date().iso8601,
    "metrics": [
        [
            "metricType": "heart_rate",
            "value": 72,
            "unit": "bpm",
            "confidence": 0.95
        ]
    ]
]

webView.evaluateJavaScript("""
    window.dispatchEvent(new CustomEvent('apple-health-data', {
        detail: \(healthData)
    }));
""")
```

## Testing

### Unit Tests

```typescript
import { AppleDeviceSyncService } from '@/lib/appleDeviceSync';

describe('AppleDeviceSyncService', () => {
  it('starts and stops sync', () => {
    const service = new AppleDeviceSyncService('user-123');
    service.startSync();
    expect(service.getSyncStatus().isActive).toBe(true);
    service.stopSync();
    expect(service.getSyncStatus().isActive).toBe(false);
  });
});
```

### Integration Tests

```typescript
import { render, screen } from '@testing-library/react';
import AppleDeviceSyncDashboard from '@/components/device/AppleDeviceSyncDashboard';

it('displays connected devices', () => {
  render(<AppleDeviceSyncDashboard userId="user-123" />);
  // Test device display
});
```

## Error Handling

### Sync Errors

```typescript
const { service } = useAppleDeviceSync({ userId: 'user-123' });

service?.onError((error) => {
  console.error('Sync error:', error);
  // Handle error
});
```

### Connection Errors

```typescript
const connectionStatus = getConnectionStatus();

if (connectionStatus.dataQuality === 'offline') {
  // Handle offline state
}
```

## Performance Optimization

1. **Sync Interval**: Adjust based on needs
   - Real-time: 10-30 seconds
   - Standard: 30-60 seconds
   - Battery saving: 2-5 minutes

2. **Quality Threshold**: Balance quality vs quantity
   - High quality: 0.8-1.0
   - Standard: 0.6-0.8
   - Include all: 0.0-0.6

3. **Metric Selection**: Only sync needed metrics
   - Reduces bandwidth
   - Improves performance
   - Saves battery

## Security Considerations

1. **Data Encryption**: All data encrypted in transit
2. **Permission Checks**: Verify permissions before syncing
3. **User Consent**: Require explicit consent for data sharing
4. **Error Logging**: Don't log sensitive health data
5. **Network Security**: Use secure WebSocket (WSS) in production

## Production Deployment

### Environment Variables

```env
VITE_WS_URL=wss://api.vitalsense.com/ws
VITE_SYNC_INTERVAL=30000
VITE_QUALITY_THRESHOLD=0.7
```

### WebSocket Configuration

- Use WSS (secure WebSocket) in production
- Implement authentication
- Add rate limiting
- Monitor connection health

### iOS App Configuration

- Configure HealthKit entitlements
- Set up background modes
- Request necessary permissions
- Implement error handling

## Troubleshooting

### Common Issues

1. **Devices Not Connecting**
   - Check WebSocket URL
   - Verify iOS app is running
   - Check network connectivity

2. **Data Not Syncing**
   - Verify sync is active
   - Check quality threshold
   - Review error logs

3. **High Latency**
   - Check network connection
   - Reduce sync frequency
   - Optimize data payload

## Future Enhancements

1. **Cloud Sync**: Sync across devices via cloud
2. **Offline Support**: Queue data when offline
3. **Compression**: Compress data for efficiency
4. **Batch Processing**: Batch multiple metrics
5. **Predictive Sync**: Sync based on usage patterns

---

*Last Updated: January 2024*
