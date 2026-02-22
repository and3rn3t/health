# Andernet Posture

An iOS app for posture analysis and gait tracking using ARKit, CoreMotion, and HealthKit.

## Quick Start

### Requirements

- Xcode 15+
- iOS 17.0+
- iPhone or iPad with ARKit support
- Apple Developer account (for CloudKit and HealthKit)

### First-Time Setup

1. **Open Project**
   ```bash
   open "Andernet Posture.xcodeproj"
   ```

2. **Configure Signing**
   - Select target → Signing & Capabilities
   - Choose your Team
   - Update Bundle Identifier if needed: `dev.andernet.posture`

3. **Add Capabilities**
   - ☑️ iCloud (CloudKit + Key-value storage)
   - ☑️ HealthKit
   - Container: `iCloud.dev.andernet.posture`

4. **Build & Run**
   - Select a simulator or device
   - Press ⌘R
   - Grant Camera and HealthKit permissions when prompted

### CloudKit Setup

1. Sign into iCloud in Settings (Simulator or Device)
2. Go to [icloud.developer.apple.com/dashboard](https://icloud.developer.apple.com/dashboard)
3. Find or create container: `iCloud.dev.andernet.posture`
4. Schema auto-creates when you run the app
5. Before App Store release: Deploy schema from Development → Production

---

## Project Structure

```
Andernet-Posture/
├── 📱 Source Code
│   ├── Andernet_PostureApp.swift
│   ├── MetricsManager.swift
│   ├── Views/
│   ├── ViewModels/
│   ├── Models/
│   │   ├── GaitSession.swift
│   │   ├── UserGoals.swift
│   │   └── ...
│   ├── Services/
│   └── Analyzers/
│
├── ⚙️ Configuration
│   ├── Andernet Posture.entitlements
│   ├── Info.plist
│   └── .swiftlint.yml
│
├── 🧪 Testing
│   ├── Test Plans/
│   │   ├── SmokeTests.xctestplan
│   │   ├── FullSuite.xctestplan
│   │   └── AccessibilityTests.xctestplan
│   ├── Andernet PostureTests/
│   └── Andernet PostureUITests/
│
└── 📚 Documentation
    └── README.md
```

---

## Testing

### Test Suites

#### Unit Tests
- **ModelUtilityTests** - Data models (UserGoals, MotionFrame, etc.)
- **ServiceTests** - HealthKit, CloudKit, ML services
- **LocalizationTests** - String localization

#### UI Tests

**Base Infrastructure**
- **BaseUITest.swift** - Common setup and helper methods
- **PageObjects.swift** - Page Object pattern for maintainability

**Test Suites:**
1. **Smoke Tests** - Basic functionality and crash prevention
2. **Navigation Tests** - Tab navigation and state management
3. **Session Flow Tests** - Capture and session management
4. **Accessibility Tests** - VoiceOver, Dynamic Type, touch targets
5. **Performance Tests** - Launch time, scrolling, memory usage
6. **Launch Tests** - Different orientations and configurations

### Running Tests

**From Xcode:**
- Quick test: ⌘U (uses SmokeTests plan)
- Change test plan: Product → Scheme → Edit Scheme → Test

**From Command Line:**
```bash
# Smoke tests (2-3 minutes)
xcodebuild test -scheme "Andernet Posture" -testPlan SmokeTests \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Full suite (15-20 minutes)
xcodebuild test -scheme "Andernet Posture" -testPlan FullSuite \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro'

# Accessibility tests
xcodebuild test -scheme "Andernet Posture" -testPlan AccessibilityTests \
  -destination 'platform=iOS Simulator,name=iPhone 15 Pro'
```

### Test Plans

- **SmokeTests** - Run on every commit (fast feedback)
- **FullSuite** - Run before release (comprehensive)
- **AccessibilityTests** - Run weekly (VoiceOver, Dynamic Type)

### Test Environment

**Launch Arguments:**
- `UI_TESTING` - UI test automation mode

**Environment Variables:**
- `IS_UI_TESTING=1` - Flag for UI testing
- `DISABLE_ANIMATIONS=1` - Speeds up tests
- `NETWORK_OFFLINE=1` - Simulates offline mode

**In your app code:**
```swift
if ProcessInfo.processInfo.arguments.contains("UI_TESTING") {
    // Disable analytics, use mock data, etc.
}
```

### Page Object Pattern

Tests use the Page Object pattern for maintainability:
- `TabBar`, `DashboardPage`, `SessionsListPage`, `CapturePage`
- `ClinicalTestsPage`, `SettingsPage`, `SessionDetailPage`, `AlertHelper`

### Best Practices

1. Inherit from `BaseUITest` for common setup
2. Use Page Objects instead of querying elements directly
3. Use `waitForElement()` for reliability
4. Add accessibility identifiers to SwiftUI views:
   ```swift
   Button("Start") { }
       .accessibilityIdentifier("startButton")
   ```

---

## Development

### Key Technologies

- **ARKit** - Body tracking and pose estimation
- **CoreMotion** - Device motion and IMU data
- **SwiftData** - Local persistence with CloudKit sync
- **HealthKit** - Integration with Apple Health
- **Swift Charts** - Data visualization

### Data Models

**GaitSession** - Comprehensive gait and posture metrics:
- Basic: cadence, stride length, trunk lean
- Posture: CVA, SVA, kyphosis, lordosis
- Gait: walking speed, step width, asymmetry
- Balance: sway velocity, fall risk
- Clinical: 6MWT, TUG, Romberg scores
- Time-series data: body frames, step events, motion frames

**UserGoals** - User target metrics (syncs via CloudKit):
- Sessions per week
- Target posture score
- Target walking speed
- Target cadence

### Configuration Files

**Andernet Posture.entitlements** - App capabilities:
```xml
- iCloud CloudKit (container: iCloud.dev.andernet.posture)
- iCloud Key-Value Store
- HealthKit
```

**Info.plist** - Required privacy descriptions:
```
- NSCameraUsageDescription
- NSMotionUsageDescription
- NSHealthShareUsageDescription
- NSHealthUpdateUsageDescription
```

### Build Configurations

**Debug:**
- Optimization: `-Onone`
- Debug symbols: DWARF
- Use for: Development, debugging

**Release:**
- Optimization: `-O` (speed)
- Debug symbols: DWARF with dSYM
- Strip symbols: YES
- Use for: TestFlight, App Store

### Optional Build Scripts

**SwiftLint** (add to Build Phases):
```bash
if which swiftlint >/dev/null; then
  swiftlint
else
  echo "warning: SwiftLint not installed"
fi
```

**Auto-increment Build Number** (Release only):
```bash
if [ "$CONFIGURATION" == "Release" ]; then
    buildNumber=$(/usr/libexec/PlistBuddy -c "Print CFBundleVersion" "${INFOPLIST_FILE}")
    buildNumber=$((buildNumber + 1))
    /usr/libexec/PlistBuddy -c "Set :CFBundleVersion $buildNumber" "${INFOPLIST_FILE}"
fi
```

---

## Performance Monitoring

### MetricsManager

Production performance monitoring with `PerformanceMonitor`:

**Operations tracked:**
- Posture analysis
- Gait analysis
- Balance analysis
- ROM analysis
- Session save/load
- Insights generation

**Usage:**
```swift
PerformanceMonitor.measure(.postureAnalysis) {
    // Your code
}

// Or manual timing
let token = PerformanceMonitor.begin(.gaitAnalysis)
// ... work ...
PerformanceMonitor.end(token)

// Generate report
let report = PerformanceMonitor.report()
```

### Instruments

Profile with Xcode Instruments (⌘I):
- **Time Profiler** - CPU bottlenecks
- **Allocations** - Memory usage
- **Leaks** - Memory leaks
- **Core Animation** - UI hitches

---

## Distribution

### TestFlight

1. Select: **Any iOS Device (arm64)**
2. Archive: **⌘⇧B**
3. Distribute → TestFlight & App Store
4. Upload to App Store Connect

### App Store

1. Create app listing in App Store Connect
2. Archive and distribute
3. Submit for review

### Before Release

- [ ] Deploy CloudKit schema to Production
- [ ] Run FullSuite test plan
- [ ] Test on multiple devices
- [ ] Verify privacy descriptions
- [ ] Check code coverage

---

## Continuous Integration

### GitHub Actions

CI workflow in `.github/workflows/ci.yml`:
- Runs SwiftLint
- Runs SmokeTests on push
- Runs FullSuite on main branch
- Generates code coverage

---

## Troubleshooting

### Common Issues

**"No provisioning profile found"**
- Enable automatic signing or create App ID in Developer Portal

**"CloudKit operation failed"**
- Sign into iCloud in Settings
- Verify container name: `iCloud.dev.andernet.posture`

**"HealthKit not available"**
- Test on real device (some features don't work in Simulator)

**Tests timing out**
- Increase timeout values
- Verify animations are disabled
- Check simulator performance

**Flaky tests**
- Add proper waits for animations
- Ensure tests are independent
- Use `XCTNSPredicateExpectation` for complex conditions

---

## Resources

- [ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [SwiftData Documentation](https://developer.apple.com/documentation/swiftdata)
- [HealthKit Documentation](https://developer.apple.com/documentation/healthkit)
- [XCTest Documentation](https://developer.apple.com/documentation/xctest)
- [CloudKit Documentation](https://developer.apple.com/documentation/cloudkit)

---

## License
Copyright © 2026 Andernet. All rights reserved.

