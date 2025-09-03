# iOS WebSocket Connection Testing Guide

## 🧪 WebSocket Connection Test Results

### Current Status

- **Production Backend**: `wss://health.andernet.dev/ws` ❌ (Returns 426 - WebSocket not available on Worker)
- **Local Bridge Server**: `ws://localhost:3001` ✅ (Available for testing)

## 🔧 iOS App WebSocket Configuration

### For Local Testing (Development)

The iOS app can be configured to connect to a local WebSocket server for testing:

**Config.plist Settings for Local Testing:**

```xml
<key>WS_URL</key>
<string>ws://localhost:3001/ws</string>
<key>API_BASE_URL</key>
<string>http://localhost:3001/api</string>
```

### For Production (Current)

**Config.plist Settings for Production:**

```xml
<key>WS_URL</key>
<string>wss://health.andernet.dev/ws</string>
<key>API_BASE_URL</key>
<string>https://health.andernet.dev/api</string>
```

## 📱 Testing the iOS App WebSocket Connection

### Method 1: Using Xcode Simulator

1. **Open the iOS project:**

   ```bash
   cd ios/
   open HealthKitBridge.xcodeproj
   ```

2. **Build and run in simulator (⌘+R)**

3. **Watch the Xcode Console for WebSocket logs:**
   - `🔌 Connecting to WebSocket...` - Connection attempt
   - `✅ WebSocket connection opened` - Successful connection
   - `📤 Sending health data...` - Data transmission
   - `❌ WebSocket connection failed` - Connection issues

4. **Check the app UI:**
   - **Connection Status**: Green circle = connected, Red circle = disconnected
   - **Data Points/Min**: Shows real-time data transmission rate
   - **Debug Panel**: Expandable section with connection details

### Method 2: Using the App's Built-in Test Features

The iOS app includes several testing capabilities:

1. **Send Test Data Button**: Sends mock health data to test transmission
2. **Refresh Data Button**: Forces a data refresh and connection test
3. **Connection Quality Monitor**: Shows latency, packet loss, and reconnection attempts
4. **Mock Mode Fallback**: Automatically switches to mock mode if WebSocket fails

## 🔍 Expected WebSocket Behavior

### Connection Flow

1. **App Startup**: Attempts WebSocket connection to configured URL
2. **Authentication**: Sends test token for authentication
3. **Data Streaming**: Begins sending health data in real-time
4. **Connection Monitoring**: Continuously monitors connection quality
5. **Fallback**: Switches to mock mode if connection fails

### Data Transmission

The iOS app sends health data in this format:

```json
{
  "type": "heart_rate",
  "value": 72.5,
  "unit": "bpm",
  "timestamp": "2025-09-02T21:30:00.000Z",
  "deviceId": "production_user",
  "userId": "production_user"
}
```

## 🧪 Testing Scenarios

### Scenario 1: Local WebSocket Server

- **Setup**: Run local Node.js WebSocket server
- **Config**: Point iOS app to `ws://localhost:3001`
- **Expected**: Full WebSocket functionality with real-time data

### Scenario 2: Production Backend (Current)

- **Setup**: Use production backend
- **Config**: Point iOS app to `wss://health.andernet.dev/ws`
- **Expected**: 426 error, app falls back to mock mode

### Scenario 3: Mock Mode Testing

- **Setup**: Disconnect from all WebSocket servers
- **Expected**: App automatically uses mock data generation

## 📊 Connection Status Indicators

| Indicator        | Meaning                 | Action               |
| ---------------- | ----------------------- | -------------------- |
| 🟢 Green Circle  | Connected & Streaming   | Normal operation     |
| 🟡 Yellow Circle | Connecting/Reconnecting | Wait for connection  |
| 🔴 Red Circle    | Disconnected            | Check network/server |
| 📊 Data Rate     | Shows data points/min   | Higher = more active |
| 🧪 Mock Mode     | Using simulated data    | Check WebSocket URL  |

## 🎯 Next Steps for Full WebSocket Testing

1. **Start Local Server**: `cd server && npm start`
2. **Configure iOS App**: Update Config.plist to use localhost
3. **Run iOS App**: Test in Xcode simulator
4. **Monitor Logs**: Watch Xcode console for connection status
5. **Test Features**: Use app's built-in test buttons

## 🚀 Production WebSocket Implementation (Future)

To enable WebSocket on the production backend:

1. Implement WebSocket handling in Cloudflare Worker
2. Use Durable Objects for real-time connections
3. Update the 426 error handler to actual WebSocket upgrade
4. Deploy updated worker configuration

For now, the iOS app gracefully handles the lack of WebSocket support by falling back to mock mode, ensuring a smooth user experience regardless of backend capabilities.
