# HealthKit Bridge

A Swift iOS application that bridges HealthKit data to external systems via WebSocket connections.

## Features

- **HealthKit Integration**: Reads health data including heart rate, step count, walking distance, and energy expenditure
- **Real-time Data Streaming**: WebSocket-based real-time data transmission
- **Connection Quality Monitoring**: Tracks latency, packet loss, and connection stability
- **Fallback Mock Mode**: Graceful degradation when WebSocket server is unavailable
- **Privacy-First Design**: Respects user permissions and HealthKit privacy requirements

## Prerequisites

- iOS 14.0+
- Xcode 15.0+
- Swift 5.9+
- HealthKit-enabled device (iPhone/Apple Watch)

## Setup

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd HealthKitBridge
   ```

2. **Run the setup script:**
   ```bash
   ./setup-enhanced-dev-env.sh
   ```

3. **Configure the app:**
   - Edit `HealthKitBridge/Config.plist` to set your API endpoints
   - Update `USER_ID`, `API_BASE_URL`, and `WS_URL` as needed

4. **Open in Xcode:**
   ```bash
   open HealthKitBridge.xcodeproj
   ```

## Configuration

The app uses `Config.plist` for configuration:

```xml
<dict>
    <key>USER_ID</key>
    <string>your-user-id</string>
    <key>API_BASE_URL</key>
    <string>https://your-api-server.com</string>
    <key>WS_URL</key>
    <string>wss://your-websocket-server.com/ws</string>
</dict>
```

## Health Data Types

The app requests permission for:
- Heart Rate
- Step Count
- Walking/Running Distance
- Active Energy Burned
- Basal Energy Burned

## Architecture

- **HealthKitManager**: Handles HealthKit authorization and data queries
- **WebSocketManager**: Manages WebSocket connections with automatic reconnection
- **AppConfig**: Centralized configuration management
- **ConnectionQualityMonitor**: Tracks connection performance metrics

## Building and Running

### Using Xcode
1. Open `HealthKitBridge.xcodeproj`
2. Select your target device
3. Build and run (⌘+R)

### Using Scripts
```bash
# Build and run on device
./scripts/build-and-run.sh

# Deploy to specific device
./deploy-to-device.sh
```

## Testing

The app includes comprehensive test coverage:

```bash
# Run unit tests
xcodebuild test -scheme HealthKitBridge -destination 'platform=iOS Simulator,name=iPhone 15'

# Run UI tests
xcodebuild test -scheme HealthKitBridgeUITests -destination 'platform=iOS Simulator,name=iPhone 15'
```

## WebSocket Protocol

The app communicates using JSON messages:

```json
{
  "type": "health_data",
  "data": {
    "type": "heart_rate",
    "value": 72.0,
    "unit": "count/min",
    "timestamp": "2025-08-31T12:00:00Z",
    "deviceId": "device-uuid",
    "userId": "user-id"
  }
}
```

## Privacy & Permissions

This app:
- Requests minimal necessary HealthKit permissions
- Only accesses data when actively monitoring
- Respects user privacy settings
- Provides clear permission dialogs

## Development Tools

- **SwiftLint**: Code style and quality enforcement
- **Build Scripts**: Automated building and deployment
- **Xcode Optimizations**: Performance tuning for faster builds

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and SwiftLint
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Check the documentation in the `docs/` folder
- Review the code comments for implementation details