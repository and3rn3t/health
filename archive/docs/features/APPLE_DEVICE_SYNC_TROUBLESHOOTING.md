# Apple Device Sync - Troubleshooting Guide

## Common Issues and Solutions

### Device Connection Issues

#### Device Not Appearing in Dashboard

**Symptoms:**
- Device doesn't show in device list
- "No Devices Connected" message persists

**Solutions:**
1. **Check iOS App Status**
   - Ensure iOS app is running
   - Verify app has network connectivity
   - Check if app is in background (may need foreground)

2. **Verify WebSocket Connection**
   - Check browser console for WebSocket errors
   - Verify WebSocket URL is correct
   - Ensure server is running and accessible

3. **Check Device Registration**
   - Verify device registration event is dispatched
   - Check browser console for event errors
   - Ensure device info is properly formatted

4. **Browser Compatibility**
   - Use modern browser (Chrome, Safari, Firefox)
   - Check if WebSocket is supported
   - Verify JavaScript is enabled

#### Device Shows as Disconnected

**Symptoms:**
- Device appears but status is "disconnected"
- Last sync time is old or missing

**Solutions:**
1. **Restart Sync**
   - Click "Stop Sync" then "Start Sync"
   - Restart iOS app
   - Check connection status

2. **Check Network**
   - Verify device has internet connection
   - Check firewall settings
   - Test WebSocket connection manually

3. **Verify Permissions**
   - Ensure HealthKit permissions are granted
   - Check motion sensor permissions
   - Verify location permissions (if needed)

### Sync Issues

#### Data Not Syncing

**Symptoms:**
- Metrics synced count not increasing
- No data appearing in dashboard
- Last sync time not updating

**Solutions:**
1. **Check Sync Status**
   - Verify sync is active (green indicator)
   - Check sync progress bar
   - Review error messages

2. **Quality Threshold**
   - Lower quality threshold in settings
   - Check if data confidence is too low
   - Verify data is being collected

3. **Metric Selection**
   - Verify metrics are selected in config
   - Check if metric types match
   - Ensure metrics are enabled

4. **Device Filters**
   - Check if device is filtered out
   - Verify device ID matches
   - Review sync configuration

#### Slow Sync Performance

**Symptoms:**
- High latency
- Slow progress updates
- Delayed data appearance

**Solutions:**
1. **Network Optimization**
   - Check internet connection speed
   - Reduce network latency
   - Use wired connection if possible

2. **Sync Interval**
   - Increase sync interval (less frequent)
   - Reduce data batch size
   - Optimize data payload

3. **Device Performance**
   - Check device battery level
   - Close unnecessary apps
   - Restart device if needed

### Error Messages

#### "Connection Error"

**Symptoms:**
- Error appears in errors tab
- WebSocket connection fails
- Sync cannot start

**Solutions:**
1. **Check WebSocket URL**
   - Verify URL is correct
   - Check protocol (ws:// vs wss://)
   - Ensure port is accessible

2. **Network Issues**
   - Check firewall settings
   - Verify proxy configuration
   - Test connection manually

3. **Server Status**
   - Verify server is running
   - Check server logs
   - Test server endpoint

#### "Permission Error"

**Symptoms:**
- Error about permissions
- Health data not accessible
- Device capabilities missing

**Solutions:**
1. **Grant Permissions**
   - Open iOS Settings
   - Navigate to Privacy & Security
   - Enable HealthKit permissions
   - Grant motion sensor permissions

2. **App Permissions**
   - Re-request permissions in app
   - Check permission status
   - Verify permission types

#### "Data Error"

**Symptoms:**
- Invalid data format
- Missing required fields
- Data validation failures

**Solutions:**
1. **Data Format**
   - Verify data structure matches schema
   - Check required fields are present
   - Validate data types

2. **Data Quality**
   - Check confidence values
   - Verify metric values are valid
   - Ensure timestamps are correct

### Performance Issues

#### High Battery Usage

**Symptoms:**
- Device battery drains quickly
- Device gets hot
- Background sync consuming resources

**Solutions:**
1. **Sync Frequency**
   - Increase sync interval
   - Disable background sync
   - Reduce real-time updates

2. **Data Collection**
   - Reduce data collection frequency
   - Optimize HealthKit queries
   - Limit background processing

3. **Device Settings**
   - Enable low power mode
   - Close unnecessary apps
   - Reduce screen brightness

#### Memory Issues

**Symptoms:**
- App crashes
- Slow performance
- High memory usage

**Solutions:**
1. **Data Management**
   - Limit stored data
   - Clear old sync history
   - Reduce error log size

2. **Connection Management**
   - Limit concurrent connections
   - Close unused connections
   - Optimize WebSocket usage

### Feature-Specific Issues

#### LiDAR Not Detected

**Symptoms:**
- LiDAR capability shows as false
- LiDAR features unavailable

**Solutions:**
1. **Device Support**
   - Verify device has LiDAR (iPhone Pro, iPad Pro)
   - Check iOS version (iOS 14+)
   - Ensure ARKit is available

2. **Permissions**
   - Grant camera permissions (required for LiDAR)
   - Check ARKit permissions
   - Verify app capabilities

#### Fall Detection Not Working

**Symptoms:**
- Fall detection disabled
- No fall alerts

**Solutions:**
1. **Device Support**
   - Verify device supports fall detection
   - Check iOS version
   - Ensure Apple Watch is paired (if needed)

2. **Settings**
   - Enable fall detection in Health app
   - Configure emergency contacts
   - Verify fall detection is active

## Diagnostic Steps

### 1. Check Connection Status

```typescript
const status = service.getConnectionStatus();
console.log('Connected:', status.connected);
console.log('Latency:', status.latency);
console.log('Quality:', status.dataQuality);
```

### 2. Review Sync Status

```typescript
const syncStatus = service.getSyncStatus();
console.log('Active:', syncStatus.isActive);
console.log('Progress:', syncStatus.syncProgress);
console.log('Errors:', syncStatus.errors);
```

### 3. Verify Device Info

```typescript
const devices = service.getDevices();
devices.forEach(device => {
  console.log('Device:', device.name);
  console.log('Status:', device.connectionStatus);
  console.log('Capabilities:', device.capabilities);
});
```

### 4. Test WebSocket Connection

Open browser console and test:

```javascript
const ws = new WebSocket('ws://localhost:3001/ws');
ws.onopen = () => console.log('Connected');
ws.onerror = (error) => console.error('Error:', error);
```

## Getting Help

If issues persist:

1. **Collect Information**
   - Error messages
   - Device information
   - Sync status
   - Network details

2. **Check Logs**
   - Browser console logs
   - iOS app logs
   - Server logs

3. **Contact Support**
   - Provide error details
   - Include device information
   - Share relevant logs

---

*Last Updated: January 2024*
