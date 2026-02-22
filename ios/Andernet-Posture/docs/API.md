# Andernet Posture API Documentation

Comprehensive API reference for core services, analyzers, and data models.

---

## Table of Contents

- [Core Services](#core-services)
  - [BodyTrackingService](#bodytrackingservice)
  - [SessionRecorder](#sessionrecorder)
  - [PostureAnalyzer](#postureanalyzer)
  - [GaitAnalyzer](#gaitanalyzer)
  - [MLModelService](#mlmodelservice)
  - [InsightsEngine](#insightsengine)
  - [ExportService](#exportservice)
- [Analyzers](#analyzers)
  - [BalanceAnalyzer](#balanceanalyzer)
  - [FallRiskAnalyzer](#fallriskanalyzer)
  - [ROMAnalyzer](#romanalyzer)
- [Clinical Services](#clinical-services)
  - [ClinicalPostureNorms](#clinicalposturenorms)
  - [CrossedSyndromeDetector](#crossedsyndromdetector)
- [Data Models](#data-models)
  - [GaitSession](#gaitsession)
  - [BodyFrame](#bodyframe)
  - [MotionFrame](#motionframe)
- [Utilities](#utilities)
  - [AppLogger](#applogger)
  - [ClinicalGlossary](#clinicalglossary)

---

## Core Services

### BodyTrackingService

**Protocol:** Real-time ARKit body tracking with 91-point skeleton detection.

```swift
protocol BodyTrackingService: Actor {
    var delegate: (any BodyTrackingDelegate)? { get set }
    func start() async throws
    func stop()
    var isRunning: Bool { get async }
}
```

#### Default Implementation

```swift
actor DefaultBodyTrackingService: BodyTrackingService
```

**Key Methods:**

- `start()` — Initializes ARSession with `ARBodyTrackingConfiguration`
- `stop()` — Pauses ARSession and cleans up resources
- `session(_:didUpdate:)` — ARSessionDelegate callback processing body anchors

**Delegate Protocol:**

```swift
@MainActor
protocol BodyTrackingDelegate: AnyObject {
    func bodyTrackingService(
        _ service: any BodyTrackingService,
        didUpdate frame: BodyFrame
    )
    func bodyTrackingService(
        _ service: any BodyTrackingService,
        didFailWithError error: Error
    )
}
```

**Usage Example:**

```swift
let service = DefaultBodyTrackingService()
service.delegate = self
try await service.start()

// Implement delegate
func bodyTrackingService(
    _ service: any BodyTrackingService,
    didUpdate frame: BodyFrame
) {
    // Process 91-joint skeleton frame
    let headPosition = frame.joints[.head]?.position
}
```

---

### SessionRecorder

**Purpose:** Orchestrates capture session lifecycle and frame collection.

```swift
@MainActor
@Observable
final class SessionRecorder
```

**State Machine:**

```swift
enum RecordingState: Sendable {
    case idle
    case recording(startTime: Date, frameCount: Int)
    case stopped(session: GaitSession)
    case error(String)
}
```

**Key Properties:**

```swift
var state: RecordingState { get }
var currentFrameCount: Int { get }
var currentDuration: TimeInterval { get }
```

**Key Methods:**

```swift
func startRecording() async throws
func stopRecording() async -> GaitSession?
func cancelRecording()
func saveSession(_ session: GaitSession) async throws
```

**Dependencies:**

- `BodyTrackingService` — Skeleton frames
- `MotionService` — Accelerometer/gyroscope data at 60Hz
- `ModelContext` — SwiftData persistence

**Usage Example:**

```swift
let recorder = SessionRecorder(
    bodyTracker: bodyService,
    motionService: motionService,
    modelContext: modelContext
)

try await recorder.startRecording()
// ... capture session ...
if let session = await recorder.stopRecording() {
    try await recorder.saveSession(session)
}
```

---

### PostureAnalyzer

**Protocol:** Analyzes spine alignment and posture metrics from body frames.

```swift
protocol PostureAnalyzer: Sendable {
    func analyze(frame: BodyFrame) -> PostureMetrics
    func analyzeBatch(frames: [BodyFrame]) -> PostureMetrics
}
```

#### Default Implementation

```swift
struct DefaultPostureAnalyzer: PostureAnalyzer
```

**PostureMetrics Structure:**

```swift
struct PostureMetrics: Sendable {
    let craniovertebralAngle: Double      // CVA in degrees
    let sagittalVerticalAxis: Double      // SVA in mm
    let trunkForwardLean: Double          // Sagittal trunk angle
    let lateralLean: Double               // Coronal trunk deviation
    let shoulderProtraction: Double       // Shoulder anterior shift
    let pelvicTilt: Double                // Anterior/posterior pelvic tilt
    let rebaScore: Int                    // Ergonomic risk (0-15)
    let posturalType: KendallPostureType  // Ideal, kyphotic, lordotic, etc.
    let overallScore: Double              // Composite 0-100
    let severities: [String: ClinicalSeverity]
}
```

**Key Calculations:**

- **CVA** — Angle between C7, tragus, and horizontal
  - Normal: >50°, Mild: 45-50°, Moderate: 40-45°, Severe: <40°
- **SVA** — Horizontal offset from C7 to S1
  - Normal: <40mm, Mild: 40-60mm, Moderate: 60-95mm, Severe: >95mm
- **REBA** — Rapid Entire Body Assessment score
  - Low: 1-3, Medium: 4-7, High: 8-10, Very High: 11-15

**Usage Example:**

```swift
let analyzer = DefaultPostureAnalyzer()
let metrics = analyzer.analyze(frame: bodyFrame)

if metrics.severities["CVA"] == .severe {
    print("Forward head posture detected: \(metrics.craniovertebralAngle)°")
}
```

---

### GaitAnalyzer

**Protocol:** Detects steps and computes gait metrics from motion and body data.

```swift
protocol GaitAnalyzer: Sendable {
    func analyze(
        bodyFrames: [BodyFrame],
        motionFrames: [MotionFrame]
    ) -> GaitMetrics
}
```

#### Default Implementation

```swift
struct DefaultGaitAnalyzer: GaitAnalyzer
```

**GaitMetrics Structure:**

```swift
struct GaitMetrics: Sendable {
    let steps: [StepEvent]
    let cadence: Double                   // Steps/min
    let strideLength: Double              // Meters per stride
    let gaitSpeed: Double                 // m/s
    let stepTimeAsymmetry: Double         // Left-right timing difference
    let robinsonSymmetryIndex: Double     // 0-100 (100 = perfect)
    let gaitPattern: GaitPatternType      // Normal, antalgic, etc.
    let smoothness: Double                // SPARC metric
    let harmonicRatio: Double             // AP direction smoothness
    let overallScore: Double              // Composite 0-100
}
```

**StepEvent Structure:**

```swift
struct StepEvent: Codable, Sendable {
    let timestamp: TimeInterval
    let foot: Foot                        // .left or .right
    let strikePosition: SIMD3<Float>?     // World-space position
    let stepTime: TimeInterval            // Duration since last step
    let peakAcceleration: Double          // Peak vertical acceleration
}
```

**Step Detection Algorithm:**

1. High-pass filter on vertical acceleration (0.5 Hz cutoff)
2. Peak detection with minimum 0.3s interval
3. Threshold: 1.2g for valid foot strike
4. Foot assignment based on hip height differential

**Usage Example:**

```swift
let analyzer = DefaultGaitAnalyzer()
let metrics = analyzer.analyze(
    bodyFrames: session.bodyFrames,
    motionFrames: session.motionFrames
)

print("Cadence: \(metrics.cadence) steps/min")
print("Gait speed: \(metrics.gaitSpeed) m/s")
print("Symmetry: \(metrics.robinsonSymmetryIndex)%")
```

---

### MLModelService

**Purpose:** CoreML model lifecycle management with lazy loading and caching.

```swift
@MainActor
final class MLModelService
```

**Model Registry:**

```swift
enum MLModelIdentifier: String, CaseIterable {
    case gaitPatternClassifier
    case postureScorer
    case fallRiskPredictor
    case crossedSyndromeDetector
    case fatiguePredictor
}
```

**Key Methods:**

```swift
static func loadModel(_ identifier: MLModelIdentifier) async throws -> MLModel
static func warmUp(models: [MLModelIdentifier]) async
static func clearCache()
static var isModelAvailable: (MLModelIdentifier) -> Bool
```

**Model Specifications:**

| Model | Type | Inputs | Output | Size |
|-------|------|--------|--------|------|
| GaitPatternClassifier | Classifier | 24 features | 8 classes | ~2MB |
| PostureScorer | Regressor | 18 features | 0-100 score | ~1.5MB |
| FallRiskPredictor | Regressor | 15 features | Risk % | ~1MB |
| CrossedSyndromeDetector | Classifier | 12 features | Yes/No + type | ~800KB |
| FatiguePredictor | Regressor | 20 features | Fatigue % | ~1.2MB |

**Usage Example:**

```swift
// Warm up models at app launch
await MLModelService.warmUp(models: [
    .gaitPatternClassifier,
    .postureScorer,
    .fallRiskPredictor
])

// Load and use a model
if MLModelService.isModelAvailable(.gaitPatternClassifier) {
    let model = try await MLModelService.loadModel(.gaitPatternClassifier)
    // Use model for prediction
}
```

**Fallback Strategy:**

All CoreML analyzers have rule-based fallbacks:
- If model fails to load → use `DefaultGaitPatternClassifier`
- If model throws → log error and return rule-based result
- No network required, all models bundled in app

---

### InsightsEngine

**Purpose:** Generates natural-language clinical insights from session history.

```swift
enum InsightsEngine {
    static func generateInsights(
        from sessions: [GaitSession],
        userAge: Int?,
        userGoals: UserGoals?
    ) -> [Insight]
}
```

**Insight Structure:**

```swift
struct Insight: Identifiable, Sendable {
    let id: UUID
    let icon: String                       // SF Symbol
    let title: String                      // Short headline
    let body: String                       // Natural language description
    let severity: ClinicalSeverity
    let category: InsightCategory
    let exercises: [ExerciseRecommendation]
}
```

**Insight Categories:**

```swift
enum InsightCategory: String, CaseIterable {
    case posture
    case gait
    case balance
    case risk
    case progress
    case recommendation
}
```

**Generation Rules:**

- Analyzes last 30 days of sessions
- Detects trends (improving, stable, worsening)
- Compares to age-adjusted norms
- Prioritizes by severity and recency
- Limits to 8 insights per dashboard

**Example Insights:**

```swift
let sessions = try modelContext.fetch(/* last 30 days */)
let insights = InsightsEngine.generateInsights(
    from: sessions,
    userAge: 45,
    userGoals: userGoals
)

for insight in insights {
    print("\(insight.icon) \(insight.title)")
    print(insight.body)
    if !insight.exercises.isEmpty {
        print("Exercises: \(insight.exercises.map(\.name).joined(separator: ", "))")
    }
}
```

---

### ExportService

**Purpose:** PDF and CSV export generation for sessions.

```swift
enum ExportService {
    static func generatePDF(for session: GaitSession) -> Data
    static func generateCSV(for session: GaitSession) -> Data
    static func generateMultiSessionCSV(sessions: [GaitSession]) -> Data
    static func shareURL(for data: Data, filename: String) -> URL
}
```

**PDF Report Contents:**

1. Header with app name, logo, date
2. Session summary (duration, frame count, date)
3. Posture metrics table with severity color coding
4. Gait metrics table
5. Clinical insights section
6. Recommended exercises
7. Charts (posture trend, gait symmetry)
8. Footer with disclaimer

**CSV Format:**

```csv
Metric,Value,Unit,Severity,Normal Range
Craniovertebral Angle,48.5,degrees,mild,>50
Trunk Forward Lean,12.3,degrees,normal,<10
Cadence,112,steps/min,normal,100-120
Stride Length,1.42,m,normal,1.3-1.6
```

**Usage Example:**

```swift
// Single session PDF
let pdfData = ExportService.generatePDF(for: session)
let url = ExportService.shareURL(for: pdfData, filename: "Posture-Report.pdf")
// Present UIActivityViewController with url

// Multi-session CSV
let csvData = ExportService.generateMultiSessionCSV(sessions: allSessions)
let csvURL = ExportService.shareURL(for: csvData, filename: "Sessions-Export.csv")
```

---

## Analyzers

### BalanceAnalyzer

**Purpose:** Computes balance and stability metrics from body frames.

```swift
protocol BalanceAnalyzer: Sendable {
    func analyze(frames: [BodyFrame]) -> BalanceMetrics
}
```

**BalanceMetrics:**

```swift
struct BalanceMetrics: Sendable {
    let swayArea: Double              // mm², 95% confidence ellipse
    let swayVelocity: Double          // mm/s
    let rombergQuotient: Double       // Eyes closed / eyes open
    let mediolateralSway: Double      // mm
    let anteroposteriorSway: Double   // mm
    let stability: ClinicalSeverity
}
```

**Calculation Method:**

- Tracks center of mass (COM) from pelvis joint
- Computes 95% confidence ellipse from trajectory
- Reference: Prieto et al., IEEE Trans BME 1996

**Normal Ranges:**

- Sway area: <100mm² (normal), 100-200 (mild), 200-400 (moderate), >400 (severe)
- Sway velocity: <10mm/s (normal), 10-20 (mild), 20-40 (moderate), >40 (severe)

---

### FallRiskAnalyzer

**Purpose:** Assesses fall risk from gait and balance data.

```swift
protocol FallRiskAnalyzer: Sendable {
    func analyze(
        gaitMetrics: GaitMetrics,
        balanceMetrics: BalanceMetrics,
        age: Int?
    ) -> FallRiskAssessment
}
```

**FallRiskAssessment:**

```swift
struct FallRiskAssessment: Sendable {
    let riskPercent: Double           // 0-100
    let riskLevel: RiskLevel          // low, moderate, high, critical
    let contributors: [RiskFactor]    // Factors increasing risk
    let recommendations: [String]
}

enum RiskLevel: String, Sendable {
    case low        // <20%
    case moderate   // 20-40%
    case high       // 40-60%
    case critical   // >60%
}
```

**Risk Factors:**

- Slow gait speed (<0.8 m/s)
- High sway area (>200mm²)
- Poor balance (Romberg quotient >2)
- High gait asymmetry (>10%)
- Age >65 years
- Low cadence (<90 steps/min)

**Scoring Formula:**

Based on weighted combination of:
- Gait speed: 30%
- Balance: 25%
- Asymmetry: 20%
- Smoothness: 15%
- Age factor: 10%

---

### ROMAnalyzer

**Purpose:** Range of motion analysis for major joints.

```swift
protocol ROMAnalyzer: Sendable {
    func analyze(frames: [BodyFrame]) -> ROMMetrics
}
```

**ROMMetrics:**

```swift
struct ROMMetrics: Sendable {
    let hipFlexionLeft: Double        // Degrees
    let hipFlexionRight: Double
    let hipExtensionLeft: Double
    let hipExtensionRight: Double
    let kneeFlexionLeft: Double
    let kneeFlexionRight: Double
    let ankleFlexionLeft: Double
    let ankleFlexionRight: Double
    let shoulderFlexionLeft: Double
    let shoulderFlexionRight: Double
}
```

**Normal Ranges (Adults):**

- Hip flexion: 110-120°
- Hip extension: 10-15°
- Knee flexion: 130-140°
- Ankle dorsiflexion: 15-20°
- Shoulder flexion: 170-180°

---

## Clinical Services

### ClinicalPostureNorms

**Purpose:** Clinical reference ranges and severity classification.

```swift
enum ClinicalPostureNorms {
    static func severity(
        for metric: String,
        value: Double,
        age: Int?
    ) -> ClinicalSeverity
    
    static func normalRange(
        for metric: String,
        age: Int?
    ) -> ClosedRange<Double>
}
```

**Severity Enum:**

```swift
enum ClinicalSeverity: String, Codable, CaseIterable {
    case normal
    case mild
    case moderate
    case severe
    
    var colorName: String  // "green", "yellow", "orange", "red"
    var ordinal: Int       // 0-3 for comparison
}
```

**Metrics with Age Adjustment:**

- Gait speed: Decreases ~0.01 m/s per year after age 60
- Sway area: Increases ~2mm² per year after age 50
- Hip ROM: Decreases ~1° per decade after age 30

---

### CrossedSyndromeDetector

**Purpose:** Detects upper and lower crossed syndrome patterns.

```swift
protocol CrossedSyndromeDetector: Sendable {
    func detect(metrics: PostureMetrics) -> CrossedSyndromeResult
}
```

**CrossedSyndromeResult:**

```swift
struct CrossedSyndromeResult: Sendable {
    let hasUpperCrossed: Bool
    let hasLowerCrossed: Bool
    let upperConfidence: Double       // 0-1
    let lowerConfidence: Double
    let imbalances: [MuscleImbalance]
}

struct MuscleImbalance: Sendable {
    let muscleGroup: String           // e.g. "Pectoralis"
    let state: ImbalanceState         // .tight or .weak
    let severity: ClinicalSeverity
}
```

**Detection Criteria:**

**Upper Crossed Syndrome:**
- Forward head posture (CVA < 50°)
- Rounded shoulders (protraction > 20mm)
- Elevated shoulders

**Lower Crossed Syndrome:**
- Anterior pelvic tilt (>12°)
- Excessive lumbar lordosis
- Hip flexor tightness

---

## Data Models

### GaitSession

**SwiftData Model:** Represents a complete capture session.

```swift
@Model
final class GaitSession {
    var id: UUID
    var timestamp: Date
    var duration: TimeInterval
    var bodyFrames: [BodyFrame]
    var motionFrames: [MotionFrame]
    
    // Computed analysis results (stored)
    var postureMetrics: PostureMetrics?
    var gaitMetrics: GaitMetrics?
    var balanceMetrics: BalanceMetrics?
    var fallRisk: FallRiskAssessment?
    
    // Metadata
    var notes: String?
    var tags: [String]
    var isAnalyzed: Bool
}
```

**Relationships:**

- One-to-many with `BodyFrame` (embedded)
- One-to-many with `MotionFrame` (embedded)

**Queries:**

```swift
// Fetch last 30 days
let descriptor = FetchDescriptor<GaitSession>(
    predicate: #Predicate { session in
        session.timestamp > Date().addingTimeInterval(-30 * 86400)
    },
    sortBy: [SortDescriptor(\.timestamp, order: .reverse)]
)

// Fetch unanalyzed
let descriptor = FetchDescriptor<GaitSession>(
    predicate: #Predicate { $0.isAnalyzed == false }
)
```

---

### BodyFrame

**Structure:** Snapshot of 91-joint skeleton at one moment.

```swift
struct BodyFrame: Codable, Sendable {
    let timestamp: TimeInterval
    let joints: [JointName: Joint]
    let rootTransform: simd_float4x4?
    
    struct Joint: Codable, Sendable {
        let name: JointName
        let position: SIMD3<Float>     // World-space position
        let orientation: simd_quatf?   // Quaternion rotation
        let confidence: Float          // 0-1, tracking quality
    }
}
```

**JointName Enum:**

```swift
enum JointName: String, Codable, CaseIterable, Sendable {
    // Head & Neck
    case head, neck_1, neck_2, neck_3, neck_4
    
    // Spine
    case spine_1, spine_2, spine_3, spine_4, spine_5, spine_6, spine_7
    
    // Arms (L/R)
    case leftShoulder, leftArm, leftForearm, leftHand
    case rightShoulder, rightArm, rightForearm, rightHand
    
    // Legs (L/R)
    case leftUpLeg, leftLeg, leftFoot, leftToes
    case rightUpLeg, rightLeg, rightFoot, rightToes
    
    // Plus fingers (5 per hand × 3 segments = 30 joints)
    // Total: 91 joints
}
```

---

### MotionFrame

**Structure:** CoreMotion sensor snapshot at 60Hz.

```swift
struct MotionFrame: Codable, Sendable {
    let timestamp: TimeInterval
    let acceleration: SIMD3<Double>      // m/s² (user acceleration)
    let rotationRate: SIMD3<Double>      // rad/s
    let gravity: SIMD3<Double>           // m/s²
    let magneticField: SIMD3<Double>?    // μT (optional)
    let attitude: Attitude?
    
    struct Attitude: Codable, Sendable {
        let pitch: Double                // Radians
        let roll: Double
        let yaw: Double
    }
}
```

**Sampling Rate:** 60 Hz via `CMMotionManager`

---

## Utilities

### AppLogger

**Purpose:** Structured OSLog loggers for all subsystems.

```swift
enum AppLogger {
    static let app: Logger               // App lifecycle
    static let arTracking: Logger        // ARKit tracking
    static let capture: Logger           // Capture sessions
    static let recorder: Logger          // Session recording
    static let analysis: Logger          // Analyzers
    static let ml: Logger                // CoreML models
    static let export: Logger            // PDF/CSV export
    static let sync: Logger              // CloudKit sync
    static let health: Logger            // HealthKit
}
```

**Usage:**

```swift
AppLogger.capture.info("Starting capture session")
AppLogger.analysis.debug("CVA: \(cva, format: .fixed(precision: 1))°")
AppLogger.ml.error("Failed to load model: \(error.localizedDescription)")
```

**Log Levels:**

- `.debug` — Verbose, development only
- `.info` — Normal operations
- `.notice` — Significant events
- `.warning` — Recoverable issues
- `.error` — Errors requiring attention
- `.fault` — Critical failures

---

### ClinicalGlossary

**Purpose:** Plain-English metric names and explanations.

```swift
enum ClinicalGlossary {
    struct Entry {
        let plainName: String            // "Head Position"
        let explanation: String          // Layperson description
    }
    
    static func entry(for label: String) -> Entry?
}
```

**Example Entries:**

```swift
ClinicalGlossary.entry(for: "Craniovertebral Angle")
// => Entry(
//      plainName: "Head Position",
//      explanation: "Measures how far forward your head..."
//    )

ClinicalGlossary.entry(for: "Robinson SI")
// => Entry(
//      plainName: "Walking Symmetry",
//      explanation: "Shows how evenly you step..."
//    )
```

**Coverage:** 40+ clinical metrics with aliases

---

## Best Practices

### Error Handling

```swift
// Services throw descriptive errors
enum CaptureError: LocalizedError {
    case arKitNotSupported
    case cameraAccessDenied
    case bodyTrackingFailed(Error)
    
    var errorDescription: String? {
        switch self {
        case .arKitNotSupported:
            return "ARKit body tracking requires iPhone 12 or newer"
        case .cameraAccessDenied:
            return "Camera access required for body tracking"
        case .bodyTrackingFailed(let error):
            return "Body tracking failed: \(error.localizedDescription)"
        }
    }
}
```

### Concurrency

```swift
// Prefer structured concurrency
Task {
    async let posture = analyzer.analyzePosture(frames)
    async let gait = analyzer.analyzeGait(frames)
    async let balance = analyzer.analyzeBalance(frames)
    
    let (p, g, b) = await (posture, gait, balance)
    // Process results
}

// Use @MainActor for UI updates
@MainActor
func updateUI(with metrics: PostureMetrics) {
    scoreLabel.text = "\(metrics.overallScore)"
}
```

### Testing

```swift
// Protocol-based services enable easy mocking
final class MockBodyTrackingService: BodyTrackingService {
    var mockFrames: [BodyFrame] = []
    
    func start() async throws {
        for frame in mockFrames {
            delegate?.bodyTrackingService(self, didUpdate: frame)
        }
    }
}

// Use in tests
let mock = MockBodyTrackingService()
mock.mockFrames = [/* test frames */]
let viewModel = CaptureViewModel(bodyService: mock)
```

---

## Version History

- **1.0** (Current) — Initial API documentation
- Subject to change as features evolve

---

## Support

For questions or issues with the API:
- Review inline code documentation
- Check test files for usage examples
- Open an issue on GitHub

**Last Updated:** February 10, 2026
