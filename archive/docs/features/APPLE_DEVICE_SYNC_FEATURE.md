# Apple Device Sync Feature - User Guide

## Overview

The Apple Device Sync feature enables seamless synchronization between your Apple devices (iPhone, Apple Watch, iPad) and the VitalSense web application. This feature provides real-time health data streaming, device-dependent feature detection, and comprehensive sync management.

## Key Features

### 1. **Real-Time Health Data Sync**

- **Live Streaming**: Health data streams from your Apple devices in real-time
- **WebSocket Connection**: Low-latency bidirectional communication
- **Automatic Reconnection**: Handles connection drops gracefully
- **Data Quality Monitoring**: Tracks connection quality and latency

### 2. **Device Management**

- **Multi-Device Support**: Connect and manage multiple Apple devices
- **Device Detection**: Automatic detection of connected devices
- **Capability Detection**: Identifies device-specific features
- **Battery Monitoring**: Track device battery levels
- **Connection Status**: Real-time connection status for each device

### 3. **Device-Dependent Features**

The sync system automatically detects and enables device-specific features:

- **HealthKit**: Access to Apple Health data
- **LiDAR**: 3D scanning and depth sensing (iPhone Pro, iPad Pro)
- **Motion Sensors**: Accelerometer, gyroscope, and motion tracking
- **Heart Rate**: Real-time heart rate monitoring
- **Fall Detection**: Automatic fall detection and alerts
- **Background Sync**: Continuous syncing when app is in background
- **Watch Connectivity**: Apple Watch integration
- **ARKit**: Augmented reality capabilities

### 4. **Sync Configuration**

Customize synchronization behavior:

- **Sync Interval**: Configure how often data syncs (10s - 5min)
- **Real-Time Sync**: Enable/disable real-time data streaming
- **Background Sync**: Continue syncing when app is in background
- **Quality Threshold**: Filter data by confidence level (0-1)
- **Metric Selection**: Choose which metrics to sync

### 5. **Error Handling & Monitoring**

- **Error Tracking**: Comprehensive error logging and tracking
- **Sync Status**: Real-time sync progress and status
- **Connection Monitoring**: Latency and quality metrics
- **Error Resolution**: Tools to resolve sync issues

## How to Use

### Connecting Your Device

1. **Open Device Sync Dashboard**
   - Navigate to **Settings** → **Device Sync**
   - Or access via **Apple Device Sync** in the main menu

2. **Enable Device Connection**
   - On your iPhone/iPad: Open VitalSense app
   - Grant HealthKit permissions when prompted
   - The device will automatically appear in the dashboard

3. **Verify Connection**
   - Check device status (should show "Connected")
   - Verify battery level and last sync time
   - Confirm device capabilities are detected

### Configuring Sync Settings

1. **Access Settings Tab**
   - Click **Settings** tab in Device Sync Dashboard

2. **Adjust Sync Interval**
   - Use slider to set sync frequency (10s - 5min)
   - Lower intervals = more frequent updates, higher battery usage

3. **Configure Quality Threshold**
   - Set minimum confidence level for synced data (0-1)
   - Higher threshold = better quality, fewer data points

4. **Enable/Disable Features**
   - Toggle **Real-time Sync** for immediate updates
   - Toggle **Background Sync** for continuous syncing

### Monitoring Sync Status

1. **View Sync Progress**
   - Check progress bar in Sync Status card
   - Monitor metrics synced count
   - View last sync time

2. **Check Connection Quality**
   - View latency (lower is better)
   - Check data quality indicator (excellent/good/poor/offline)
   - Monitor connection stability

3. **Review Errors**
   - Navigate to **Errors** tab
   - Review error messages and timestamps
   - Dismiss resolved errors

## Device Capabilities

### iPhone

- ✅ HealthKit
- ✅ Motion Sensors
- ✅ Heart Rate (with Apple Watch)
- ✅ Fall Detection
- ✅ Background Sync
- ✅ Watch Connectivity
- ✅ ARKit
- ⚠️ LiDAR (Pro models only)

### Apple Watch

- ✅ HealthKit
- ✅ Motion Sensors
- ✅ Heart Rate
- ✅ Fall Detection
- ✅ Background Sync
- ❌ LiDAR
- ❌ ARKit

### iPad

- ✅ HealthKit
- ✅ Motion Sensors
- ✅ ARKit
- ⚠️ LiDAR (Pro models only)
- ❌ Heart Rate (requires Apple Watch)
- ❌ Fall Detection (requires Apple Watch)

## Troubleshooting

### Device Not Connecting

1. **Check Device Status**
   - Ensure device is powered on
   - Verify Bluetooth/WiFi is enabled
   - Check device battery level

2. **Verify Permissions**
   - Ensure HealthKit permissions are granted
   - Check motion sensor permissions
   - Verify location permissions (if needed)

3. **Restart Connection**
   - Click **Stop Sync** then **Start Sync**
   - Restart the iOS app
   - Check for app updates

### Sync Errors

1. **Review Error Messages**
   - Navigate to **Errors** tab
   - Read error descriptions
   - Note error timestamps

2. **Common Issues**
   - **Connection Error**: Check network connectivity
   - **Permission Error**: Grant required permissions
   - **Data Error**: Verify data quality threshold
   - **Network Error**: Check internet connection

3. **Resolve Errors**
   - Follow error-specific resolution steps
   - Restart sync if needed
   - Contact support if issues persist

### Poor Data Quality

1. **Check Connection**
   - Verify WebSocket connection is stable
   - Check latency (should be < 100ms)
   - Ensure no network interference

2. **Adjust Quality Threshold**
   - Lower threshold to include more data
   - Higher threshold for better quality
   - Balance based on your needs

3. **Device-Specific Issues**
   - Ensure device sensors are functioning
   - Check for device updates
   - Verify device is not in low power mode

## Best Practices

1. **Battery Management**
   - Use appropriate sync intervals
   - Disable background sync if not needed
   - Monitor device battery levels

2. **Data Quality**
   - Set appropriate quality thresholds
   - Monitor sync errors regularly
   - Review connection quality metrics

3. **Privacy & Security**
   - Only sync necessary metrics
   - Review device permissions regularly
   - Use secure network connections

4. **Performance**
   - Limit number of active devices
   - Adjust sync frequency based on needs
   - Monitor system resources

## Privacy & Security

- **Local Processing**: Data processed locally when possible
- **Encrypted Transmission**: All data encrypted in transit
- **Permission-Based**: Only syncs data you've authorized
- **User Control**: You control what data is synced
- **No Cloud Storage**: Data not stored in cloud by default

## Getting Help

For additional support:
- Review sync status and errors
- Check device connection status
- Verify permissions are granted
- Contact support with error details

---

*Last Updated: January 2024*
