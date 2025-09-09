# VitalSense Live Connection Quick Start

This guide helps you set up and use the VitalSense live WebSocket connection for real-time health data streaming.

## 🚀 Quick Setup

### 1. Start the WebSocket Server

In your terminal, run:

```bash
node server/vitalsense-websocket-server.js
```

You should see:

```text
🚀 VitalSense WebSocket Server starting on ws://localhost:3001
🎯 VitalSense WebSocket server ready and waiting for connections...
```

### 2. Start the Development Server

In another terminal, run:

```bash
npm run dev
```

### 3. Enable Live Connection

1. Open your browser to the VitalSense app
2. Navigate to the Live Connection Dashboard
3. Toggle the "Live Connection" switch to ON
4. You should see "Connected" status and start receiving live health data

## 🎛️ Components Available

### LiveConnectionDashboard

A comprehensive dashboard showing:

- Real-time connection status
- Live health metrics stream
- Performance metrics
- Data quality analysis
- Technical debugging tools

**Usage:**

```tsx
import LiveConnectionDashboard from '@/components/live/LiveConnectionDashboard';

function App() {
  return <LiveConnectionDashboard />;
}
```

### LiveConnectionStatus

A compact status widget that can be embedded anywhere:

- Shows connection status at a glance
- Popover with detailed information
- Manual connect/disconnect controls
- Ping testing

**Usage:**

```tsx
import { LiveConnectionStatus } from '@/components/live/LiveConnectionStatus';

function Header() {
  return (
    <div className="flex items-center gap-4">
      <h1>VitalSense</h1>
      <LiveConnectionStatus />
    </div>
  );
}
```

## 📡 WebSocket Messages

The VitalSense WebSocket server supports these message types:

### Incoming Messages (Client → Server)

#### Client Identification

```json
{
  "type": "client_identification",
  "data": {
    "clientType": "web_dashboard",
    "userId": "demo-user",
    "version": "1.0.0"
  },
  "timestamp": "2025-01-08T19:30:00.000Z"
}
```

#### Ping

```json
{
  "type": "ping",
  "data": { "timestamp": 1641674200000 },
  "timestamp": "2025-01-08T19:30:00.000Z"
}
```

#### Subscribe to Health Updates

```json
{
  "type": "subscribe_health_updates",
  "data": {
    "metrics": ["heart_rate", "steps", "walking_steadiness"],
    "userId": "demo-user"
  },
  "timestamp": "2025-01-08T19:30:00.000Z"
}
```

### Outgoing Messages (Server → Client)

#### Connection Established

```json
{
  "type": "connection_established",
  "data": {
    "clientId": "client-1641674200-abc123",
    "message": "Connected to VitalSense WebSocket server",
    "serverTime": "2025-01-08T19:30:00.000Z"
  },
  "timestamp": "2025-01-08T19:30:00.000Z"
}
```

#### Live Health Update

```json
{
  "type": "live_health_update",
  "data": {
    "metrics": [
      {
        "type": "heart_rate",
        "value": 72,
        "unit": "bpm",
        "timestamp": "2025-01-08T19:30:00.000Z"
      },
      {
        "type": "steps",
        "value": 45,
        "unit": "steps",
        "timestamp": "2025-01-08T19:30:00.000Z"
      }
    ],
    "deviceId": "device-1",
    "userId": "demo-user"
  },
  "timestamp": "2025-01-08T19:30:00.000Z"
}
```

#### Emergency Alert

```json
{
  "type": "emergency_alert",
  "data": {
    "alert": {
      "kind": "fall_detected",
      "severity": "high",
      "message": "Possible fall detected - immediate attention recommended"
    },
    "userId": "demo-user",
    "timestamp": "2025-01-08T19:30:00.000Z"
  },
  "timestamp": "2025-01-08T19:30:00.000Z"
}
```

#### Pong

```json
{
  "type": "pong",
  "data": {
    "timestamp": "2025-01-08T19:30:00.000Z",
    "receivedAt": "2025-01-08T19:29:58.000Z"
  },
  "timestamp": "2025-01-08T19:30:00.000Z"
}
```

## 🔧 Configuration

### Custom WebSocket URL

You can override the default WebSocket URL by setting a global variable:

```javascript
// In browser console or app initialization
window.__WS_URL__ = 'ws://your-custom-server:3001';
```

### Development Mode

The WebSocket connections are enabled in development mode when `enableInDevelopment: true` is set in the useWebSocket hook configuration.

## 📊 Features

### Real-time Health Data

- Heart rate monitoring
- Step counting
- Walking steadiness analysis
- Activity tracking
- Sleep data (when available)

### Connection Management

- Automatic reconnection with exponential backoff
- Heartbeat/ping-pong for connection health
- Connection quality monitoring
- Performance metrics tracking

### Data Quality Analysis

- Real-time quality scoring
- Data validation and filtering
- Quality distribution analysis
- Error detection and reporting

### Emergency Alerts

- Fall detection notifications
- Heart rate anomaly alerts
- Walking steadiness warnings
- Customizable alert thresholds

## 🐛 Troubleshooting

### Connection Issues

1. **"Connection refused"**
   - Make sure the WebSocket server is running on port 3001
   - Check if another service is using the port
   - Verify firewall settings

2. **"WebSocket disabled in development mode"**
   - Make sure `enableInDevelopment: true` is set in the useWebSocket config
   - Check if `VITALSENSE_DISABLE_WEBSOCKET` is set to true

3. **Frequent reconnections**
   - Check server logs for errors
   - Verify network stability
   - Monitor browser console for WebSocket errors

### Data Issues

1. **No health data appearing**
   - Check if the server is generating test data
   - Verify message handlers are properly configured
   - Look for parsing errors in browser console

2. **Poor data quality**
   - Check the quality analysis in the dashboard
   - Verify data validation logic
   - Monitor for network packet loss

### Performance Issues

1. **High memory usage**
   - Live metrics are limited to 100 recent entries
   - Check for memory leaks in message handlers
   - Monitor connection cleanup on disconnect

2. **Slow updates**
   - Check network latency in technical panel
   - Verify server broadcasting intervals
   - Monitor for message queue backups

## 📈 Monitoring

Use the Live Connection Dashboard to monitor:

- **Connection Status**: Real-time connection health
- **Message Rate**: Messages per second
- **Data Quality**: Quality distribution analysis
- **Performance**: Latency, uptime, reconnections
- **Technical Details**: WebSocket state, debugging tools

## 🔗 Integration with Existing Components

The live connection system integrates seamlessly with existing VitalSense components:

- **Health Dashboard**: Real-time updates to health metrics
- **Fall Risk Monitoring**: Live fall detection alerts
- **Activity Tracking**: Real-time step and activity data
- **Emergency Response**: Immediate alert notifications

## 🎯 Next Steps

1. **iOS Integration**: Connect real iOS devices for actual health data
2. **Alert Customization**: Configure personalized alert thresholds
3. **Data Persistence**: Store live data for historical analysis
4. **Multi-user Support**: Handle multiple user connections
5. **Advanced Analytics**: Implement trend analysis and predictions
