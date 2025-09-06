# Apple Watch Integration Setup Guide

## Required Manual Integration Steps

The following integration steps need to be completed manually in Xcode to fully wire the new gait analysis features:

### 1. Add Apple Watch Target

1. Open `HealthKitBridge.xcodeproj` in Xcode
2. In the project navigator, select the project root
3. Click the `+` button at the bottom of the targets list
4. Choose `watchOS` → `Watch App`
5. Name it `HealthKitBridge Watch App`
6. Select `Include Notification Scene`
7. Click `Finish`

### 2. Configure Watch App Target

1. Select the Watch App target
2. In **General** tab:
   - Set **Deployment Target** to `watchOS 9.0+`
   - Set **Bundle Identifier** to `com.healthkitbridge.watchapp`

3. In **Signing & Capabilities** tab:
   - Add **HealthKit** capability
   - Add **Background Modes** with:
     - Background App Refresh
     - Background Processing
   - Add **Core Motion** capability

### 3. Add Watch App Files

Copy the following files to the Watch App target:

- `WatchApp.swift` → `HealthKitBridge Watch App/`
- `AppleWatchGaitMonitor.swift` → `HealthKitBridge Watch App/` (shared)

### 4. Update Watch App Info.plist

Add to `HealthKitBridge Watch App/Info.plist`:

```xml
<key>NSHealthShareUsageDescription</key>
<string>Apple Watch gait monitoring requires access to motion and health data for fall risk analysis.</string>
<key>NSHealthUpdateUsageDescription</key>
<string>Apple Watch may write gait analysis data for health monitoring.</string>
<key>NSMotionUsageDescription</key>
<string>Motion data is required for real-time gait analysis and stability monitoring.</string>
<key>WKWatchOnly</key>
<true/>
<key>BGTaskSchedulerPermittedIdentifiers</key>
<array>
    <string>com.healthkitbridge.watchapp.gaitmonitoring</string>
</array>
```

### 5. Add Shared Framework (Optional)

For better code organization:

1. Create a new **Framework** target named `HealthKitBridgeShared`
2. Move shared models to this framework:
   - `GaitAnalysisModels.swift`
   - `RealtimeGaitMetrics.swift`
3. Link this framework to both iOS app and Watch app targets

### 6. Update Build Phases

1. In the iOS app target **Build Phases**:
   - Add `iPhoneWatchBridge.swift` to **Compile Sources**
   - Ensure `FallRiskGaitManager.swift` is included
   - Ensure `FallRiskGaitDashboardView.swift` is included

2. In the Watch app target **Build Phases**:
   - Add `WatchApp.swift` to **Compile Sources**
   - Add shared model files if not using framework

### 7. Test Watch Connectivity

1. Build and install both apps
2. Verify Watch Connectivity works:

   ```swift
   // Test in iOS Simulator paired with Watch Simulator
   iPhoneWatchBridge.shared.startWatchGaitMonitoring()
   ```

### 8. Entitlements Configuration

Update `HealthKitBridge.entitlements`:

```xml
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.developer.healthkit.access</key>
<array>
    <string>health-records</string>
</array>
<key>com.apple.security.application-groups</key>
<array>
    <string>group.com.healthkitbridge.data</string>
</array>
```

Create `HealthKitBridge Watch App.entitlements`:

```xml
<key>com.apple.developer.healthkit</key>
<true/>
<key>com.apple.security.application-groups</key>
<array>
    <string>group.com.healthkitbridge.data</string>
</array>
```

## Already Integrated Components ✅

The following components are already integrated and working:

### Main iOS App

- ✅ `FallRiskGaitManager` added to app initialization
- ✅ `iPhoneWatchBridge` integrated with environment objects
- ✅ `FallRiskGaitDashboardView` accessible from ContentView
- ✅ Background task scheduling for gait monitoring
- ✅ WebSocket integration for data transmission
- ✅ HealthKit gait data types and permissions

### Data Models

- ✅ `GaitAnalysisModels` with complete data structures
- ✅ WebSocket payload types for transmission
- ✅ Fall risk assessment algorithms
- ✅ Balance assessment scoring

### Background Processing

- ✅ Background task identifiers added to Info.plist
- ✅ Gait monitoring background task handler
- ✅ Automated data collection and assessment

### UI Integration

- ✅ Navigation from main dashboard to detailed gait view
- ✅ Real-time gait metrics display
- ✅ Fall risk assessment visualization
- ✅ Data transmission status monitoring

## Testing Integration

After completing the manual steps, test with:

```bash
# Build iOS app
xcodebuild -project HealthKitBridge.xcodeproj -scheme HealthKitBridge -configuration Debug

# Build Watch app (if target created)
xcodebuild -project HealthKitBridge.xcodeproj -scheme "HealthKitBridge Watch App" -configuration Debug

# Run tests
xcodebuild test -project HealthKitBridge.xcodeproj -scheme HealthKitBridge -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

## Troubleshooting Common Issues

### Watch App Not Installing

- Ensure Watch Simulator is paired with iPhone Simulator
- Check that bundle identifiers are correct
- Verify watchOS deployment target compatibility

### HealthKit Permission Issues

- Confirm all required data types are in entitlements
- Check that privacy usage descriptions are added
- Verify authorization requests are made properly

### Watch Connectivity Issues

- Ensure both apps have WCSession properly configured
- Check that message handlers are implemented
- Verify session activation occurs on app launch

### Background Task Issues

- Confirm background task identifiers match Info.plist
- Check that background app refresh is enabled
- Verify task registration happens during app launch

## Next Steps

Once manual integration is complete:

1. Test gait monitoring on device
2. Verify data transmission to external systems
3. Test Apple Watch real-time monitoring
4. Validate fall risk assessment algorithms
5. Deploy to TestFlight for beta testing
