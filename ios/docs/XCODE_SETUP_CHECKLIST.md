# Xcode Project Setup Checklist

This checklist ensures your VitalSense iOS project is properly configured for Xcode.

## ✅ Completed Configurations

### 1. Info.plist ✅
**File:** `ios/VitalSense/Resources/VitalSense-Info.plist`

✅ All required usage descriptions added:
- HealthKit (read & write)
- Location (for emergency features)
- Camera & LiDAR (for advanced gait analysis)
- Motion & Fitness (for activity tracking)
- Notifications (for health alerts)

✅ Background modes configured:
- Processing
- Background fetch
- Remote notifications
- HealthKit background delivery

✅ Background task identifiers registered:
- `com.healthkitbridge.healthsync`
- `com.healthkitbridge.analytics`
- `com.healthkitbridge.gaitmonitoring`
- `health-data-sync` (SwiftUI background task)
- `vitalsense.health.sync` (HealthKit sync)

✅ App Transport Security configured
✅ Required device capabilities specified

### 2. Entitlements ✅
**File:** `ios/VitalSense/VitalSense.entitlements`

✅ HealthKit capability enabled
✅ HealthKit background delivery enabled
✅ App Groups configured (`group.dev.andernet.VitalSense.shared`)

### 3. App Configuration ✅
**File:** `ios/VitalSense/Configuration/AppConfig.swift`

✅ Added missing properties:
- `hasCompletedOnboarding` (for onboarding flow)
- `gaitMonitoringEnabled` (for feature toggle)
- `networkConfiguration` (for ApiClient setup)
- `initialize()` method (for async initialization)

✅ Config.plist loaded properly with defaults

### 4. Project Structure ✅

✅ Main app entry point: `VitalSenseApp.swift`
✅ All managers properly initialized
✅ Background tasks registered
✅ SwiftUI lifecycle properly implemented

## 🔧 Xcode Project Settings to Verify

### In Xcode, verify these settings:

1. **Target: VitalSense**
   - **General Tab:**
     - Display Name: VitalSense
     - Bundle Identifier: `dev.andernet.VitalSense` (or your custom ID)
     - Version: 1.0
     - Build: 1
     - Minimum Deployment: iOS 16.0
     - Supported Destinations: iPhone, iPad

   - **Signing & Capabilities Tab:**
     - ✅ HealthKit (with Background Delivery)
     - ✅ App Groups (`group.dev.andernet.VitalSense.shared`)
     - ✅ Background Modes:
       - ✅ Background processing
       - ✅ Background fetch
       - ✅ Remote notifications
       - ✅ Background processing (for HealthKit)

   - **Info Tab:**
     - Verify `VitalSense-Info.plist` is selected
     - Verify `VitalSense.entitlements` is selected

   - **Build Settings:**
     - Swift Language Version: Swift 5.9
     - iOS Deployment Target: 16.0
     - Supported Platforms: iphoneos iphonesimulator

2. **Target: VitalSenseWidgets**
   - Same App Groups capability
   - HealthKit usage descriptions in Info.plist

3. **Target: VitalSenseWatch Watch App**
   - WatchKit App configured
   - HealthKit enabled
   - Info.plist has health usage descriptions

## 📋 Build & Run Checklist

### Before Building:

- [ ] Open `ios/VitalSense.xcworkspace` (preferred) or `ios/VitalSense.xcodeproj`
- [ ] Select the VitalSense scheme
- [ ] Select a destination (iPhone simulator or device)
- [ ] Verify no red errors in Project Navigator

### Initial Build:

1. **Clean Build Folder:**
   - Product > Clean Build Folder (Cmd+Shift+K)

2. **Resolve Package Dependencies:**
   - File > Packages > Resolve Package Versions
   - Or run: `cd ios && swift package resolve`

3. **Build:**
   - Product > Build (Cmd+B)
   - Check for any compilation errors

4. **Run:**
   - Product > Run (Cmd+R)
   - App should launch and show LaunchScreen
   - Initialization should complete and show ContentView

### Testing Initialization:

On first run, you should see:
1. ✅ LaunchScreen appears
2. ✅ Console shows: "📋 AppConfig loaded..."
3. ✅ Console shows: "✅ AppConfig initialized"
4. ✅ HealthKit authorization request appears
5. ✅ Notification permission request appears
6. ✅ ContentView appears after initialization

## ⚠️ Common Issues & Solutions

### Issue: "Cannot find 'AppConfig' in scope"
**Solution:** 
- Ensure `AppConfig.swift` is included in the VitalSense target
- Check Build Phases > Compile Sources includes AppConfig.swift

### Issue: "HealthKit capability not enabled"
**Solution:**
- Go to Signing & Capabilities tab
- Click "+ Capability" and add HealthKit
- Enable "Background Delivery"

### Issue: Background tasks not working
**Solution:**
- Verify `BGTaskSchedulerPermittedIdentifiers` in Info.plist
- Check Background Modes capability is enabled
- Test on physical device (background tasks unreliable in simulator)

### Issue: "Cannot find module 'Charts'"
**Solution:**
- iOS 16+ required for Swift Charts
- Verify deployment target is iOS 16.0+
- Use `@available(iOS 16.0, *)` checks where needed

### Issue: Config.plist not found
**Solution:**
- Verify Config.plist is in VitalSense/Resources/
- Check "Copy Bundle Resources" includes Config.plist
- Build Phases > Copy Bundle Resources should list Config.plist

## 📱 Testing on Device

### Required for Testing:
- Physical iPhone or iPad (iOS 16+)
- Apple Developer account (for device provisioning)
- Health app with some health data (optional but recommended)

### Capabilities Requiring Device:
- HealthKit (works in simulator but limited)
- Background tasks (unreliable in simulator)
- Location services (simulator has limited support)
- Camera/LiDAR (only available on supported devices)
- Push notifications (requires provisioning)

## 🎯 Next Steps

1. ✅ Open project in Xcode
2. ✅ Verify all capabilities are enabled
3. ✅ Build and run on simulator first
4. ✅ Test on physical device for full functionality
5. ✅ Verify all features work as expected

## 📚 Additional Resources

See `XCODE_PROJECT_SETUP.md` for detailed configuration documentation.
