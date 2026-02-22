# Developer Onboarding Guide

Welcome to the Andernet Posture development team! This guide will help you get up to speed quickly.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Initial Setup](#initial-setup)
3. [Architecture Overview](#architecture-overview)
4. [Development Workflow](#development-workflow)
5. [Key Concepts](#key-concepts)
6. [Common Tasks](#common-tasks)
7. [Debugging Tips](#debugging-tips)
8. [Code Style](#code-style)
9. [Testing](#testing)
10. [Resources](#resources)

---

## Prerequisites

### Required Software

| Tool | Version | Purpose |
|------|---------|---------|
| Xcode | 26.0+ | iOS development |
| macOS | Sonoma 14.0+ | Development environment |
| Git | 2.0+ | Version control |
| Swift | 5.0+ | Programming language |

### Required Hardware

- **Mac** with Apple Silicon or Intel processor
- **iPhone** with A12+ chip for testing (ARKit body tracking **does not** work in Simulator)
  - Recommended: iPhone 12 Pro or newer (has LiDAR)

### Recommended Knowledge

- ✅ Swift language and Swift Concurrency (async/await, actors)
- ✅ SwiftUI and the Observation framework
- ✅ SwiftData for persistence
- ✅ ARKit and RealityKit basics
- ⚠️ Clinical/biomechanics terminology (we provide glossaries)
- ⚠️ CoreML (nice to have for ML model work)

---

## Initial Setup

### 1. Clone the Repository

```bash
git clone https://github.com/and3rn3t/Andernet-Posture.git
cd Andernet-Posture
```

### 2. Open in Xcode

```bash
open "Andernet Posture.xcodeproj"
```

Or use the provided script:

```bash
open "Andernet Posture/Andernet Posture.xcodeproj"
```

### 3. Configure Signing

1. Select the **Andernet Posture** target in Xcode
2. Go to **Signing & Capabilities** tab
3. Check **Automatically manage signing**
4. Select your **Team** from the dropdown
5. Xcode will automatically provision the app

### 4. Enable Capabilities

Verify these capabilities are enabled (should be automatic):

- ✅ **HealthKit** — Read/write health data
- ✅ **iCloud** → CloudKit — Session data sync
- ✅ **Background Modes** → Remote notifications (for CloudKit)

### 5. Build and Run

1. Connect your iPhone via USB
2. Select your device in Xcode's scheme selector
3. Press `Cmd+R` to build and run
4. **First run:** You'll be prompted for Camera and Motion permissions — grant them

### 6. Verify Setup

When the app launches:

1. Complete the onboarding flow
2. Tap **Capture** tab
3. Grant Camera permission if prompted
4. You should see AR camera view with skeleton overlay

✅ If you see the skeleton, you're all set!

---

## Architecture Overview

### Tech Stack

```
┌─────────────────────────────────────┐
│           SwiftUI Views             │
├─────────────────────────────────────┤
│       @Observable ViewModels        │
├─────────────────────────────────────┤
│      Protocol-Based Services        │
│  ├─ ARKit Body Tracking             │
│  ├─ CoreMotion Sampling             │
│  ├─ CoreML Inference                │
│  ├─ HealthKit Integration           │
│  └─ CloudKit Sync                   │
├─────────────────────────────────────┤
│        SwiftData Persistence         │
└─────────────────────────────────────┘
```

### MVVM Pattern

We follow strict **Model-View-ViewModel** separation:

```swift
// ✅ Good: ViewModel orchestrates services
@Observable
final class CaptureViewModel {
    private let bodyTracker: any BodyTrackingService
    private let recorder: SessionRecorder
    
    func startCapture() async throws {
        try await bodyTracker.start()
        try await recorder.startRecording()
    }
}

// ❌ Bad: View talks directly to services
struct CaptureView: View {
    let bodyTracker: DefaultBodyTrackingService  // Don't do this!
}
```

### Service Protocols

All major services are **protocol-based** for testability:

```swift
protocol BodyTrackingService: Actor {
    func start() async throws
    func stop()
}

// Production
actor DefaultBodyTrackingService: BodyTrackingService { ... }

// Testing
final class MockBodyTrackingService: BodyTrackingService { ... }
```

### Actor Isolation

We use **Swift Concurrency** with strict isolation:

- `@MainActor` — ViewModels, UI updates
- `actor` — Services that manage mutable state (BodyTracker, MotionService)
- `Sendable` — All data models passed between actors

```swift
// ✅ Main actor for UI
@MainActor
@Observable
final class DashboardViewModel { ... }

// ✅ Actor for background service
actor DefaultBodyTrackingService { ... }

// ✅ Sendable for data
struct BodyFrame: Sendable { ... }
```

---

## Development Workflow

### Branch Strategy

- `main` — Stable, always buildable
- `feature/your-feature` — Feature branches
- `fix/bug-description` — Bug fix branches

### Typical Workflow

```bash
# 1. Create feature branch
git checkout -b feature/new-analyzer

# 2. Make changes, commit frequently
git add .
git commit -m "Add ROM analyzer for shoulder joints"

# 3. Push to remote
git push origin feature/new-analyzer

# 4. Open pull request on GitHub
# 5. Address review feedback
# 6. Merge to main after approval
```

### Code Review Checklist

Before submitting a PR:

- [ ] Code builds without warnings
- [ ] Tests pass (`Cmd+U`)
- [ ] SwiftLint passes (no new violations)
- [ ] Updated `API.md` if public API changed
- [ ] Added inline documentation for new types
- [ ] Tested on physical device (if AR-related)

---

## Key Concepts

### 1. Body Tracking Frame Processing

ARKit produces skeleton frames at ~60 FPS:

```swift
// ARSessionDelegate callback (nonisolated)
nonisolated func session(_ session: ARSession, didUpdate anchors: [ARAnchor]) {
    guard let bodyAnchor = anchors.compactMap({ $0 as? ARBodyAnchor }).first else {
        return
    }
    
    // Convert ARKit skeleton to our BodyFrame
    let frame = BodyFrame(from: bodyAnchor, timestamp: bodyAnchor.timestamp)
    
    // Notify delegate on main actor
    Task { @MainActor in
        delegate?.bodyTrackingService(self, didUpdate: frame)
    }
}
```

**Key Point:** ARKit runs on a background thread. Always dispatch to `@MainActor` for UI updates.

### 2. Session Recording Pipeline

```
┌──────────────┐
│ ARKit Frames │ (60 FPS)
└──────┬───────┘
       │
       ├─────────────────────┐
       │                     ▼
       │           ┌─────────────────┐
       │           │ BodyTracker     │
       │           │ (actor)         │
       │           └────────┬────────┘
       │                    │
       │                    │ BodyFrame
       │                    ▼
       │           ┌─────────────────┐
       │           │ SessionRecorder │
       │           │ (@MainActor)    │
       │           │ - Collects      │
       │           │ - Timestamps    │
       │           │ - Buffers       │
       │           └────────┬────────┘
       │                    │
┌──────▼───────┐            │
│ CoreMotion   │            │ Save
│ (60 Hz)      │            ▼
└──────┬───────┘   ┌─────────────────┐
       │           │ GaitSession     │
       │           │ (SwiftData)     │
       └──────────▶│ - bodyFrames    │
                   │ - motionFrames  │
                   └─────────────────┘
```

### 3. Analysis Pipeline

Analysis happens **after** recording completes:

```swift
// 1. Record session
try await recorder.startRecording()
// ... user moves around ...
let session = await recorder.stopRecording()

// 2. Analyze session
let postureAnalyzer = DefaultPostureAnalyzer()
let gaitAnalyzer = DefaultGaitAnalyzer()

session.postureMetrics = postureAnalyzer.analyzeBatch(frames: session.bodyFrames)
session.gaitMetrics = gaitAnalyzer.analyze(
    bodyFrames: session.bodyFrames,
    motionFrames: session.motionFrames
)

// 3. Save analyzed session
try modelContext.save()
```

**Why?** Real-time analysis would drop frames. We buffer everything, then analyze in one batch.

### 4. CoreML Model Usage

Models are loaded lazily and cached:

```swift
// Warm up at app launch (optional)
await MLModelService.warmUp(models: [.gaitPatternClassifier])

// Use in analyzer
let analyzer = CoreMLGaitPatternClassifier()
let pattern = try? analyzer.classify(metrics: gaitMetrics)

// Fallback to rule-based if ML fails
if pattern == nil {
    let fallback = DefaultGaitPatternClassifier()
    pattern = fallback.classify(metrics: gaitMetrics)
}
```

### 5. Clinical Severity Mapping

All metrics are mapped to 4-level severity:

```swift
enum ClinicalSeverity: String {
    case normal    // Green
    case mild      // Yellow
    case moderate  // Orange
    case severe    // Red
}

// Example: CVA thresholds
let severity = switch cvaAngle {
    case 50...:        .normal
    case 45..<50:      .mild
    case 40..<45:      .moderate
    default:           .severe
}
```

---

## Common Tasks

### Task 1: Add a New Clinical Metric

**Example:** Add "Shoulder Elevation Asymmetry"

1. **Define the metric calculation:**

```swift
// In PostureAnalyzer.swift or new analyzer
extension DefaultPostureAnalyzer {
    private func calculateShoulderAsymmetry(frame: BodyFrame) -> Double {
        guard let leftShoulder = frame.joints[.leftShoulder]?.position.y,
              let rightShoulder = frame.joints[.rightShoulder]?.position.y else {
            return 0
        }
        
        return abs(leftShoulder - rightShoulder) * 1000  // Convert to mm
    }
}
```

2. **Add to PostureMetrics:**

```swift
struct PostureMetrics: Sendable {
    // ... existing fields ...
    let shoulderAsymmetry: Double  // Add this
}
```

3. **Define clinical norms:**

```swift
// In ClinicalPostureNorms.swift
static func shoulderAsymmetrySeverity(_ value: Double) -> ClinicalSeverity {
    switch value {
        case ..<10: return .normal
        case 10..<20: return .mild
        case 20..<30: return .moderate
        default: return .severe
    }
}
```

4. **Add to glossary:**

```swift
// In ClinicalGlossary.swift
"Shoulder Asymmetry": Entry(
    plainName: "Shoulder Height Difference",
    explanation: "Measures the vertical difference between your left and right shoulders. Large differences may indicate muscle imbalances or scoliosis."
)
```

5. **Update UI to display it:**

```swift
// In SessionDetailView.swift or similar
MetricRow(
    label: "Shoulder Asymmetry",
    value: "\(metrics.shoulderAsymmetry, format: .number.precision(.fractionLength(1))) mm",
    severity: ClinicalPostureNorms.shoulderAsymmetrySeverity(metrics.shoulderAsymmetry)
)
```

6. **Add tests:**

```swift
// In AnalyzerTests.swift
func testShoulderAsymmetry() {
    let frame = BodyFrame.mock(
        leftShoulderY: 1.5,
        rightShoulderY: 1.52  // 20mm difference
    )
    
    let analyzer = DefaultPostureAnalyzer()
    let metrics = analyzer.analyze(frame: frame)
    
    XCTAssertEqual(metrics.shoulderAsymmetry, 20, accuracy: 0.5)
}
```

### Task 2: Add a New Insight Type

**Example:** Detect "Anterior Pelvic Tilt Worsening"

1. **Add to InsightsEngine.swift:**

```swift
// In InsightsEngine.swift
private static func checkPelvicTiltTrend(sessions: [GaitSession]) -> Insight? {
    let recentTilts = sessions.prefix(10).compactMap { $0.postureMetrics?.pelvicTilt }
    let olderTilts = sessions.dropFirst(10).prefix(10).compactMap { $0.postureMetrics?.pelvicTilt }
    
    guard recentTilts.count >= 5, olderTilts.count >= 5 else { return nil }
    
    let recentAvg = recentTilts.reduce(0, +) / Double(recentTilts.count)
    let olderAvg = olderTilts.reduce(0, +) / Double(olderTilts.count)
    
    if recentAvg > olderAvg + 3 {  // Worsening by >3°
        return Insight(
            icon: "figure.stand.line.dotted.figure.stand",
            title: "Pelvic Tilt Increasing",
            body: "Your anterior pelvic tilt has increased by \((recentAvg - olderAvg).formatted(.number.precision(.fractionLength(1))))° over the past 10 sessions. This may indicate tight hip flexors or weak glutes.",
            severity: .moderate,
            category: .posture,
            exercises: ExerciseLibrary.forAnteriorPelvicTilt
        )
    }
    
    return nil
}
```

2. **Call it from `generateInsights()`:**

```swift
static func generateInsights(...) -> [Insight] {
    var insights: [Insight] = []
    
    // ... existing checks ...
    
    if let pelvicInsight = checkPelvicTiltTrend(sessions: sessions) {
        insights.append(pelvicInsight)
    }
    
    return insights
}
```

### Task 3: Export a New Data Format

**Example:** Add JSON export

1. **Add method to ExportService.swift:**

```swift
static func generateJSON(for session: GaitSession) -> Data {
    let encoder = JSONEncoder()
    encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
    encoder.dateEncodingStrategy = .iso8601
    
    let export = SessionExport(
        id: session.id.uuidString,
        timestamp: session.timestamp,
        duration: session.duration,
        postureMetrics: session.postureMetrics,
        gaitMetrics: session.gaitMetrics
    )
    
    return (try? encoder.encode(export)) ?? Data()
}

private struct SessionExport: Encodable {
    let id: String
    let timestamp: Date
    let duration: TimeInterval
    let postureMetrics: PostureMetrics?
    let gaitMetrics: GaitMetrics?
}
```

2. **Add to SessionExportButton.swift:**

```swift
Menu {
    // ... existing PDF/CSV buttons ...
    
    Button {
        let jsonData = ExportService.generateJSON(for: session)
        let url = ExportService.shareURL(for: jsonData, filename: "session-\(session.id).json")
        isSharePresented = true
        shareURL = url
    } label: {
        Label("Export as JSON", systemImage: "doc.text")
    }
}
```

---

## Debugging Tips

### ARKit Body Tracking Issues

**Problem:** "Body tracking not working" / No skeleton visible

**Solutions:**

1. **Check device support:**
   ```swift
   guard ARBodyTrackingConfiguration.isSupported else {
       print("❌ Body tracking not supported on this device")
       return
   }
   ```

2. **Verify camera permissions:**
   ```swift
   let status = AVCaptureDevice.authorizationStatus(for: .video)
   if status != .authorized {
       print("❌ Camera permission denied")
   }
   ```

3. **Check lighting:** ARKit needs good lighting. Avoid:
   - Direct sunlight
   - Very dark rooms
   - Backlighting

4. **Ensure full body visible:** User must be 1-3 meters from camera, full body in frame

5. **Use Console.app:** Filter logs for subsystem `dev.andernet.posture`

### Performance Issues

**Problem:** App is laggy/dropping frames

**Tools:**

1. **Instruments → Time Profiler**
   - `Cmd+I` → Select "Time Profiler"
   - Look for "hot spots" in call tree

2. **Xcode Debug Navigator**
   - `Cmd+7` during run
   - Watch CPU, Memory, Energy usage

**Common Causes:**

- Too frequent SwiftUI redraws → Use `@Observable` correctly, minimize published state
- Heavy analysis on main thread → Move to background actor
- Memory leaks → Use Instruments → Leaks

### SwiftData Issues

**Problem:** Sessions not saving / Data not appearing

**Debug:**

```swift
do {
    try modelContext.save()
    print("✅ Saved successfully")
} catch {
    print("❌ Save failed: \(error.localizedDescription)")
    // Check:
    // - Is modelContext valid?
    // - Are all relationships set correctly?
    // - Is model marked @Model?
}
```

**Check ModelContainer:**

```swift
// In App.swift
.modelContainer(for: GaitSession.self) { result in
    switch result {
        case .success(let container):
            print("✅ ModelContainer initialized")
        case .failure(let error):
            print("❌ ModelContainer failed: \(error)")
    }
}
```

### CoreML Model Issues

**Problem:** Model not loading / Predictions failing

**Debug:**

```swift
do {
    let model = try await MLModelService.loadModel(.gaitPatternClassifier)
    print("✅ Model loaded: \(model)")
} catch {
    print("❌ Model load failed: \(error)")
    // Check:
    // - Is .mlmodelc in app bundle?
    // - Is bundle identifier correct?
    // - Try cleaning build folder (Cmd+Shift+K)
}
```

**Verify bundle contains model:**

```bash
# After building
find ~/Library/Developer/Xcode/DerivedData -name "*.mlmodelc"
```

---

## Code Style

We follow **Swift best practices** plus project-specific conventions:

### Naming

```swift
// ✅ Protocol names describe capability
protocol BodyTrackingService { ... }
protocol PostureAnalyzer { ... }

// ✅ Default implementations prefixed
struct DefaultPostureAnalyzer: PostureAnalyzer { ... }

// ✅ ViewModels suffixed
@Observable final class CaptureViewModel { ... }

// ✅ Services suffixed
actor DefaultBodyTrackingService { ... }
```

### Actor Isolation

```swift
// ✅ Explicit @MainActor for UI types
@MainActor
@Observable
final class DashboardViewModel { ... }

// ✅ Actor for mutable state
actor SessionRecorder { ... }

// ✅ Sendable for data crossing boundaries
struct BodyFrame: Sendable { ... }

// ❌ Don't use @MainActor on data models
// Bad:
@MainActor
struct BodyFrame { ... }  // Wrong! Not UI-related
```

### SwiftLint

We use SwiftLint for consistency. Run:

```bash
swiftlint
```

**Key rules:**

- Line length: 120 characters
- Force unwrapping: Discouraged (use `guard let` or `if let`)
- File length: Max 400 lines (use extensions for longer files)
- Type names: PascalCase
- Function names: camelCase

**Disable locally if needed:**

```swift
// swiftlint:disable:next force_cast
let view = cell.contentView as! CustomView
```

### Documentation

Use triple-slash for public APIs:

```swift
/// Analyzes posture metrics from a body frame.
///
/// - Parameter frame: The skeleton frame to analyze
/// - Returns: Computed posture metrics with severity classifications
/// - Note: Uses clinical thresholds from peer-reviewed literature
func analyze(frame: BodyFrame) -> PostureMetrics
```

---

## Testing

### Unit Tests

Run all tests: `Cmd+U`

**Test Structure:**

```
Andernet PostureTests/
├── AnalyzerTests.swift          # Posture, gait, balance analyzers
├── ClinicalTests.swift          # Severity classification, norms
├── CoreMLFallbackTests.swift   # ML model loading and fallbacks
├── MLModelServiceTests.swift   # Model lifecycle
└── ServiceTests.swift          # HealthKit, CloudSync, etc.
```

**Example Test:**

```swift
final class PostureAnalyzerTests: XCTestCase {
    func testCVACalculation() {
        // Arrange
        let frame = BodyFrame.mock(
            headPosition: SIMD3(0, 1.7, -0.1),
            c7Position: SIMD3(0, 1.5, 0)
        )
        let analyzer = DefaultPostureAnalyzer()
        
        // Act
        let metrics = analyzer.analyze(frame: frame)
        
        // Assert
        XCTAssertEqual(metrics.craniovertebralAngle, 45, accuracy: 1.0)
        XCTAssertEqual(metrics.severities["CVA"], .mild)
    }
}
```

### Mock Data

Create mock body frames for testing:

```swift
extension BodyFrame {
    static func mock(
        headPosition: SIMD3<Float> = SIMD3(0, 1.7, 0),
        c7Position: SIMD3<Float> = SIMD3(0, 1.5, 0)
        // ... other joints
    ) -> BodyFrame {
        BodyFrame(
            timestamp: Date().timeIntervalSince1970,
            joints: [
                .head: Joint(name: .head, position: headPosition, ...),
                .spine_7: Joint(name: .spine_7, position: c7Position, ...)
            ]
        )
    }
}
```

### Test Coverage

Aim for:

- **Analyzers:** 80%+ (critical paths)
- **Services:** 60%+ (focus on business logic)
- **ViewModels:** 50%+ (state transitions)
- **Views:** Optional (rely on UI tests)

---

## Resources

### Documentation

- [API.md](./API.md) — Complete API reference
- [README.md](./README.md) — Project overview
- Inline code docs — Triple-slash comments

### External Resources

**ARKit:**
- [Apple ARKit Documentation](https://developer.apple.com/documentation/arkit)
- [WWDC ARKit Sessions](https://developer.apple.com/videos/frameworks/arkit)

**SwiftData:**
- [Apple SwiftData Documentation](https://developer.apple.com/documentation/swiftdata)
- [Migrating to SwiftData](https://developer.apple.com/documentation/swiftdata/migrating-to-swiftdata)

**CoreML:**
- [Apple CoreML Documentation](https://developer.apple.com/documentation/coreml)
- [Create ML Documentation](https://developer.apple.com/documentation/createml)

**Clinical References:**
- Kendall FP et al. *Muscles: Testing and Function* (posture types)
- Perry J, Burnfield JM. *Gait Analysis: Normal and Pathological Function*
- Hignett S, McAtamney L. *Rapid Entire Body Assessment (REBA)*

### Getting Help

1. **Check existing code** — Search for similar implementations
2. **Read tests** — Tests show intended usage
3. **Ask questions** — Open GitHub Discussion or Slack
4. **File issues** — If you find bugs or inconsistencies

---

## Next Steps

Now that you're set up:

1. ✅ Build and run the app on your device
2. ✅ Capture a test session
3. ✅ Browse the codebase (start with `PostureGaitCaptureView.swift` → `CaptureViewModel.swift`)
4. ✅ Read [API.md](./API.md) for detailed service documentation
5. ✅ Pick a starter task:
   - Add a new clinical metric
   - Improve an existing analyzer
   - Fix a bug from the issue tracker
   - Write tests for untested code

**Welcome aboard!** 🎉

---

**Last Updated:** February 10, 2026
