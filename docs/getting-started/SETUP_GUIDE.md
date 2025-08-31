# iOS Project Setup Instructions

## Prerequisites

- **Mac with Xcode 15+** (required for iOS development)
- **iOS Device or Simulator** (iOS 16+ recommended)
- **Apple Developer Account** (free tier works for development)

## Step-by-Step Setup

### 1. Create New iOS Project in Xcode

1. Open Xcode
2. Create a new project: **iOS > App**
3. Configure project:
   - **Product Name**: `HealthKitBridge` (or your preferred name)
   - **Bundle Identifier**: `com.yourname.healthkitbridge`
   - **Language**: Swift
   - **Interface**: SwiftUI
   - **iOS Deployment Target**: 16.0+

### 2. Add HealthKit Capability

1. In Xcode project navigator, select your project
2. Go to **Signing & Capabilities** tab
3. Click **+ Capability** and add:
   - **HealthKit**
4. In the HealthKit section, check:
   - **Background Delivery** ✅
   - **Clinical Health Records** (optional)

### 3. Configure Info.plist

Add these keys to your `Info.plist`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>This app reads your health data to provide fall risk monitoring and emergency response.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>This app may write health data for comprehensive health monitoring.</string>
<key>UIBackgroundModes</key>
<array>
    <string>background-processing</string>
    <string>health-kit</string>
</array>
```

### 4. Add Swift Files to Project

Copy these files from the `/ios` folder to your Xcode project:

- `HealthKitManager.swift`
- `WebSocketManager.swift`
- `ApiClient.swift`
- `AppConfig.swift`
- `Config.plist`

**Important**: When adding files to Xcode, make sure to:

1. Add them to your app target ✅
2. Choose "Copy items if needed" ✅

### 5. Update Main App File

Replace your main app file content with the structure from `HealthApp.swift`:

```swift
import SwiftUI
import HealthKit

@main
struct HealthKitBridgeApp: App {
    @StateObject private var healthManager = HealthKitManager()
    @StateObject private var webSocketManager = WebSocketManager()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(healthManager)
                .environmentObject(webSocketManager)
                .onAppear {
                    setupHealthMonitoring()
                }
        }
    }

    private func setupHealthMonitoring() {
        Task {
            await healthManager.requestAuthorization()
            await webSocketManager.connect()
        }
    }
}
```

### 6. Test the Integration

1. **Build and run** the app on a device (HealthKit doesn't work in simulator)
2. **Grant HealthKit permissions** when prompted
3. **Check the console** for connection logs
4. **Monitor your web dashboard** at `http://127.0.0.1:8789` for incoming data

## Current Server Status

✅ **Cloudflare Worker**: Running on `http://127.0.0.1:8789`
✅ **WebSocket Server**: Running on `ws://localhost:3001`
✅ **Configuration**: Updated in `Config.plist`

## Testing Commands

Run these from your main project directory to test the pipeline:

```powershell
# Test API health
curl http://127.0.0.1:8789/health

# Test device authentication
curl -X POST http://127.0.0.1:8789/api/device/auth -H "Content-Type: application/json" -d '{"userId":"demo-user","deviceType":"ios_app"}'

# Full integration test
npm run test:integration
```

## Next Steps After iOS Setup

1. **Test real HealthKit data** flowing to your web dashboard
2. **Implement Apple Watch companion app** for enhanced monitoring
3. **Add fall detection algorithms** using real sensor data
4. **Set up emergency response** with real contact integration
5. **Deploy to production** with Cloudflare Workers

## Troubleshooting

- **HealthKit not working**: Ensure you're testing on a physical device (not simulator)
- **WebSocket connection fails**: Check that both servers are running
- **Permission denied**: Verify HealthKit capabilities are properly configured
- **Build errors**: Ensure all Swift files are added to the app target

---

**Ready to start!** Your backend infrastructure is running and configured. The iOS app will bridge real Apple HealthKit data to your sophisticated web dashboard.
