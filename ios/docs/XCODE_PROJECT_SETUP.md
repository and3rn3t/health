# Xcode Project Setup & Configuration Checklist

This document ensures all required configurations are in place for Xcode to properly build and run the VitalSense iOS app.

## ✅ Required Files & Configurations

### 1. Info.plist Configuration
**Location:** `ios/VitalSense/Resources/VitalSense-Info.plist`

**Required Keys:**
- ✅ HealthKit Usage Descriptions (`NSHealthShareUsageDescription`, `NSHealthUpdateUsageDescription`)
- ✅ Background Modes (`UIBackgroundModes`) - processing, fetch, remote-notification, healthkit
- ✅ Background Task Identifiers (`BGTaskSchedulerPermittedIdentifiers`)
- ✅ Location Usage Descriptions (for emergency features)
- ✅ Camera Usage Description (for LiDAR features)
- ✅ Motion Usage Description (for activity tracking)
- ✅ Notification Usage Description
- ✅ App Transport Security settings
- ✅ Supported Interface Orientations

### 2. Entitlements File
**Location:** `ios/VitalSense/VitalSense.entitlements`

**Required Capabilities:**
- ✅ HealthKit (`com.apple.developer.healthkit`)
- ✅ HealthKit Background Delivery (`com.apple.developer.healthkit.background-delivery`)
- ✅ App Groups (`com.apple.security.application-groups`)
  - Group: `group.dev.andernet.VitalSense.shared`

### 3. App Configuration
**Location:** `ios/VitalSense/Resources/Config.plist`

**Required Keys:**
- `userId` (optional, defaults to generated UUID)
- `apiBaseURL` (defaults to `https://health.andernet.dev/api`)
- `webSocketURL` (defaults to `wss://health.andernet.dev/ws`)
- Feature flags: `useMLGaitRiskScorer`, `useWatchCadenceFusion`

### 4. Swift Package Dependencies
**Location:** `ios/Package.swift`

**Dependencies:**
- ✅ swift-algorithms (>= 1.2.0)
- ✅ swift-collections (>= 1.0.0)

### 5. Project Structure

**Main App Target:**
```
ios/VitalSense/
├── VitalSenseApp.swift (main entry point)
├── VitalSense.entitlements
├── Configuration/
│   ├── AppConfig.swift
│   └── EnhancedAppConfig.swift
├── Core/
│   ├── Managers/ (HealthKit, WebSocket, Notifications, etc.)
│   └── Models/ (Health data models)
├── Features/ (Health features, LiDAR, etc.)
├── Views/ (SwiftUI views)
├── Resources/
│   ├── VitalSense-Info.plist
│   ├── Config.plist
│   └── Assets.xcassets/
└── Support/
```

## 🔧 Xcode Project Settings

### Build Settings to Verify

1. **Deployment Target:**
   - iOS 16.0+ (required for Swift Charts and modern SwiftUI features)
   - watchOS 9.0+ (for Watch app)

2. **Swift Language Version:**
   - Swift 5.9+

3. **Bundle Identifier:**
   - Main App: `dev.andernet.VitalSense` (or your custom identifier)
   - Widgets: `dev.andernet.VitalSense.VitalSenseWidgets`
   - Watch App: `dev.andernet.VitalSense.watchkitapp`

4. **Signing & Capabilities:**
   - ✅ HealthKit capability enabled
   - ✅ App Groups capability enabled
   - ✅ Background Modes enabled (Processing, Background fetch, Remote notifications, Background processing)
   - ✅ Push Notifications (if using remote notifications)

### Required Capabilities in Xcode

1. **HealthKit**
   - Capability: HealthKit
   - Background Delivery: Enabled
   - Health Records: Optional (if needed)

2. **App Groups**
   - Group: `group.dev.andernet.VitalSense.shared`
   - Used for sharing data between app, widgets, and watch app

3. **Background Modes**
   - ✅ Background processing
   - ✅ Background fetch
   - ✅ Remote notifications
   - ✅ HealthKit background delivery

4. **Push Notifications** (Optional)
   - For remote health alerts

## 📝 Background Task Identifiers

Register these identifiers in Info.plist:
- `com.healthkitbridge.healthsync` - Health data synchronization
- `com.healthkitbridge.analytics` - Analytics processing
- `com.healthkitbridge.gaitmonitoring` - Gait monitoring
- `health-data-sync` - Modern SwiftUI background task
- `vitalsense.health.sync` - HealthKit background sync

## 🔐 Required Permissions

All usage descriptions are now in Info.plist:
- HealthKit (read & write)
- Location (for emergency features)
- Camera (for LiDAR features)
- Motion & Fitness (for activity tracking)
- Notifications (for health alerts)

## ✅ Initialization Flow

The app follows this initialization sequence:

1. **App Launch** (`VitalSenseApp.swift`)
   - Load AppConfig from Config.plist
   - Initialize HealthKitManager
   - Initialize WebSocketManager
   - Request notification permissions
   - Register background tasks
   - Show onboarding if needed

2. **Manager Initialization**
   - AppConfig.shared.initialize()
   - HealthKitManager.shared.requestAuthorization()
   - WebSocketManager.shared.initialize()
   - SmartNotificationManager.shared.requestPermissions()

3. **Background Tasks**
   - Registered in BackgroundTaskManager
   - Scheduled via BGTaskScheduler
   - Modern SwiftUI background tasks via `.backgroundTask()` modifier

## 🚨 Common Issues & Solutions

### Issue: HealthKit not working
**Solution:**
- Verify HealthKit capability is enabled in Xcode
- Check entitlements file includes HealthKit keys
- Ensure Info.plist has usage descriptions
- Verify deployment target is iOS 13+ (HealthKit requires iOS 8+, but we target iOS 16+)

### Issue: Background tasks not executing
**Solution:**
- Verify `BGTaskSchedulerPermittedIdentifiers` in Info.plist
- Check Background Modes capability is enabled
- Ensure task identifiers match between registration and Info.plist
- Test on physical device (background tasks don't work in simulator reliably)

### Issue: Build errors about missing modules
**Solution:**
- Run `swift package resolve` in the ios directory
- In Xcode: File > Packages > Resolve Package Versions
- Clean build folder (Cmd+Shift+K) and rebuild

### Issue: Widgets not showing
**Solution:**
- Verify Widget Extension target exists
- Check App Groups are configured for both app and widget targets
- Ensure widget Info.plist has HealthKit usage descriptions
- Widgets require iOS 14+

## 📱 Testing Checklist

Before submitting to App Store:

- [ ] App launches successfully
- [ ] HealthKit authorization request appears
- [ ] Background tasks are registered (check logs)
- [ ] Notifications are received (with permissions)
- [ ] Widgets display correctly
- [ ] Watch app connects (if applicable)
- [ ] All features work on physical device
- [ ] No console errors or warnings
- [ ] Memory leaks checked with Instruments
- [ ] Privacy manifest is complete (iOS 17+)

## 🔄 Next Steps

1. Open project in Xcode: `ios/VitalSense.xcworkspace` or `ios/VitalSense.xcodeproj`
2. Select the VitalSense target
3. Go to Signing & Capabilities tab
4. Verify all capabilities are enabled
5. Build and run on device or simulator
6. Test all features to ensure initialization works correctly

## 📚 Additional Resources

- [Apple HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [Background Tasks Documentation](https://developer.apple.com/documentation/backgroundtasks)
- [App Groups Documentation](https://developer.apple.com/documentation/xcode/configuring-app-groups)
