# Testing Guide

Comprehensive guide to the Andernet Posture test architecture, execution, and best practices.

---

## Test Pyramid

```
            ┌──────────────────┐
            │   Snapshot (5)   │  Visual regression — ViewModels → Views
            ├──────────────────┤
            │   UI Tests (25)  │  XCUITest — navigation, accessibility, perf
            ├──────────────────┤
            │  Unit Tests (170+)  │  Swift Testing — analyzers, services, models
            └──────────────────┘
```

| Layer | Framework | Count | Execution Time |
|-------|-----------|-------|----------------|
| Unit Tests | Swift Testing (`@Test`, `#expect`) | 170+ | ~30-60s |
| UI Tests | XCUITest (`XCTestCase`) | ~25 | ~3-10 min |
| Snapshot Tests | swift-snapshot-testing (pending setup) | ~5 | ~5s |

---

## Running Tests

### From Xcode

| Action | Shortcut | What Runs |
|--------|----------|-----------|
| Run all tests | `⌘U` | Default scheme (unit + UI tests) |
| Run single test | Click diamond in gutter | That test only |
| Run test file | Right-click → Run | All tests in file |

### From Command Line

```bash
# Unit tests only (fastest — ~30s)
xcodebuild test \
  -project "Andernet Posture.xcodeproj" \
  -scheme "Andernet Posture" \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro,OS=latest" \
  -only-testing "Andernet PostureTests" \
  CODE_SIGN_IDENTITY="" CODE_SIGNING_REQUIRED=NO

# Smoke UI tests (~2 min)
xcodebuild test \
  -project "Andernet Posture.xcodeproj" \
  -scheme "Andernet Posture" \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro,OS=latest" \
  -testPlan SmokeTests

# Full suite with coverage (~10-15 min)
xcodebuild test \
  -project "Andernet Posture.xcodeproj" \
  -scheme "Andernet Posture" \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro,OS=latest" \
  -testPlan FullSuite \
  -enableCodeCoverage YES

# Accessibility tests only
xcodebuild test \
  -project "Andernet Posture.xcodeproj" \
  -scheme "Andernet Posture" \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro,OS=latest" \
  -testPlan AccessibilityTests
```

---

## Test Plans

| Plan | Targets | Coverage | When Used |
|------|---------|----------|-----------|
| **SmokeTests** | 7 selected UI tests | Off | Every PR (CI) |
| **FullSuite** | All unit + UI tests | On | Merges to `main` (CI) |
| **AccessibilityTests** | `AccessibilityTests` class | Off | Nightly CI + manual |

---

## CI Pipeline

```
PR opened/updated ──┬── unit-tests (parallel)     ──→ ~1-2 min
                    ├── smoke-ui-tests (parallel)  ──→ ~2 min
                    └── swiftlint (parallel)        ──→ ~30s

Merge to main ──────── full-suite                  ──→ ~10-15 min (with coverage)

Nightly (3 AM UTC) ─┬── full-suite + TSan          ──→ ~15-20 min
                    ├── full-ui-tests              ──→ ~10 min
                    └── accessibility-tests        ──→ ~5 min
```

All CI jobs run on `macos-15` with Xcode 26.2 targeting an iPhone 16 Pro simulator.

---

## Test Architecture

### Dependency Injection

All services use **protocol-based DI**. ViewModels accept protocols in their initializers:

```swift
// Protocol defined in Services/
protocol PostureAnalyzer { ... }

// Production implementation
final class DefaultPostureAnalyzer: PostureAnalyzer { ... }

// Mock for tests
final class MockPostureAnalyzer: PostureAnalyzer {
    var analyzeCallCount = 0
    var stubbedPostureMetrics = PostureMetrics(...)
    func analyze(joints:) -> PostureMetrics {
        analyzeCallCount += 1
        return stubbedPostureMetrics
    }
}
```

### Pipeline Injection

`CaptureViewModel` uses three pipeline objects to group related analyzers:

- `PosturePipeline` — posture, ergonomic, ROM, fatigue, smoothness analyzers
- `GaitPipeline` — gait, fall risk, pattern classifier, crossed syndrome, pain risk
- `SensorPipeline` — IMU step detector, trunk motion, pedometer

Each pipeline accepts protocol-typed analyzers, making the full 14+ analyzer chain testable.

### Mock Services

All 27 service mocks live in `Andernet PostureTests/Mocks/MockServices.swift`:

| Mock | Protocol |
|------|----------|
| `MockGaitAnalyzer` | `GaitAnalyzer` |
| `MockPostureAnalyzer` | `PostureAnalyzer` |
| `MockSessionRecorder` | `SessionRecorder` |
| `MockMotionService` | `MotionService` |
| `MockBalanceAnalyzer` | `BalanceAnalyzer` |
| `MockROMAnalyzer` | `ROMAnalyzer` |
| `MockErgonomicScorer` | `ErgonomicScorer` |
| `MockFatigueAnalyzer` | `FatigueAnalyzer` |
| `MockSmoothnessAnalyzer` | `SmoothnessAnalyzer` |
| `MockFallRiskAnalyzer` | `FallRiskAnalyzer` |
| `MockGaitPatternClassifier` | `GaitPatternClassifier` |
| `MockCrossedSyndromeDetector` | `CrossedSyndromeDetector` |
| `MockPainRiskEngine` | `PainRiskEngine` |
| `MockFrailtyScreener` | `FrailtyScreener` |
| `MockCardioEstimator` | `CardioEstimator` |
| `MockHealthKitService` | `HealthKitService` |
| `MockPedometerService` | `PedometerService` |
| `MockIMUStepDetector` | `IMUStepDetector` |
| `MockTrunkMotionAnalyzer` | `TrunkMotionAnalyzer` |
| `MockInsightsEngine` | `InsightsEngine` |
| `MockExportService` | `ExportServiceProtocol` |
| `MockSixMWTProtocol` | `SixMWTProtocol` |
| `MockBodyTrackingService` | `BodyTrackingService` |
| `MockCloudSyncService` | `CloudSyncServiceProtocol` |
| `MockKeyValueStoreSync` | `KeyValueStoreSyncProtocol` |
| `MockNotificationService` | `NotificationService` |
| `MockMLModelService` | `MLModelServiceProtocol` |

---

## Shared Fixtures

Located in `Andernet PostureTests/Fixtures/`:

### JointFixtures

```swift
JointFixtures.upright()       // 22-joint upright standing
JointFixtures.stub()          // 18-joint minimal
JointFixtures.forwardLean()   // Head shifted forward
JointFixtures.lateralTilt()   // Asymmetric shoulders
JointFixtures.midStride()     // Walking position
```

### SessionFixtures

```swift
SessionFixtures.empty()                        // Date + duration only
SessionFixtures.standard()                     // Common metrics populated
SessionFixtures.standard(postureScore: 90)     // Custom values
SessionFixtures.daysAgo(7, postureScore: 80)   // Date-relative
SessionFixtures.series(count: 10)              // Multiple sessions
SessionFixtures.clinical(cva: 35, sva: 8)      // Clinical metrics
```

### FrameFixtures

```swift
FrameFixtures.upright()                        // Standing frame
FrameFixtures.forwardLean()                    // Poor posture
FrameFixtures.walking()                        // Mid-stride
FrameFixtures.walkSequence(count: 30)          // Time series
```

---

## UI Test Architecture

### Page Object Pattern

UI tests use page objects in `PageObjects.swift`:

```swift
let tabBar = TabBar(app: app)
tabBar.navigateToDashboard()

let dashboard = DashboardPage(app: app)
dashboard.scrollView.swipeUp()
```

Available page objects: `TabBar`, `DashboardPage`, `SessionsListPage`, `CapturePage`, `ClinicalTestsPage`, `SettingsPage`, `SessionDetailPage`, `AlertHelper`.

### Base Class

All UI test classes extend `BaseUITest`, which:
- Launches the app with `UI_TESTING` and `DISABLE_ANIMATIONS` flags
- Waits for splash screen to dismiss
- Provides `takeScreenshot(named:)` and `waitForElement(_:)` helpers

### Test Helpers

`TestHelpers.swift` provides:
- `waitForHittable(timeout:)` — wait for tappable element
- `tapWithRetry(retries:)` — retry taps on flaky elements
- `swipeUntilVisible(element:direction:)` — scroll to find element
- `TestDataHelper` — test data seeding
- `ScreenshotHelper` — organized screenshot capture
- `AccessibilityTestHelper` — a11y validation utilities

---

## Writing New Tests

### Unit Test

1. Create a new file in `Andernet PostureTests/` named `{Feature}Tests.swift`
2. Import `Testing` and `@testable import Andernet_Posture`
3. Use `@Suite("FeatureName")` struct
4. Use shared fixtures from `Fixtures/`
5. Use mocks from `Mocks/MockServices.swift`
6. Add `@MainActor` annotation for tests touching `@Observable` types

```swift
import Testing
@testable import Andernet_Posture

@Suite("MyNewAnalyzer")
struct MyNewAnalyzerTests {
    @Test func basicFunctionality() {
        let joints = JointFixtures.upright()
        // ... test logic ...
        #expect(result.isValid)
    }
}
```

### UI Test

1. Create a new file in `Andernet PostureUITests/` (use `ExampleNewTests.swift.template` as reference)
2. Extend `BaseUITest`
3. Use page objects for element interaction
4. Use `waitForExistence(timeout:)` instead of `sleep()`

### Adding a Mock

1. Add the mock class to `MockServices.swift`
2. Conform to the protocol
3. Add call count properties for methods you want to verify
4. Add stubbed return values for methods that return data

---

## Snapshot Testing Setup

To enable visual regression testing:

1. In Xcode: **File → Add Package Dependencies**
2. URL: `https://github.com/pointfreeco/swift-snapshot-testing`
3. Version: Up to Next Major from 1.17.0
4. Add `SnapshotTesting` to the **Andernet PostureTests** target only
5. Uncomment tests in `Andernet PostureTests/Snapshots/SnapshotTests.swift`
6. Run once with `SNAPSHOT_RECORD_MODE=1` env var to generate reference images
7. Run again without that env var — tests will compare against references

Reference images are stored in `__Snapshots__/` alongside the test file and should be committed to git.

---

## Performance Tips

- **Disable code coverage** when running tests locally unless you need it (`-enableCodeCoverage NO`)
- **Run only changed test files** during development (click the test diamond)
- **Unit tests are parallelized** — the scheme has `parallelizable="YES"` for both test targets
- **Use `sleep()` sparingly** in UI tests — prefer `waitForExistence(timeout:)` or `waitForHittable(timeout:)`
- **Avoid `Task.sleep` in unit tests** — use deterministic signals (`TaskGroup`, `CheckedContinuation`) when testing concurrency

---

**Last Updated:** February 10, 2026
