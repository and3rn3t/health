# Andernet Posture

Real-time posture and gait analytics using ARKit body tracking, LiDAR, CoreMotion, and CoreML on iPhone.

## Features

- **Real-Time Body Tracking** — ARKit-powered skeleton visualization with advanced AR overlays
- **Clinical Gait Analysis** — Step detection, cadence, stride length, gait pattern classification
- **Posture Assessment** — Spine angles, craniovertebral angle, REBA scoring, crossed syndrome detection
- **CoreML Intelligence** — On-device models for gait classification, posture scoring, fall risk, and fatigue prediction
- **Clinical Test Protocols** — Guided TUG (Timed Up and Go), Romberg, and 6-Minute Walk Test
- **Insights Engine** — Natural-language clinical insights with personalized exercise recommendations
- **CloudKit Sync** — Seamless data synchronization across your devices
- **Export & Share** — PDF reports and CSV data export for healthcare providers
- **HealthKit Integration** — Read walking metrics, write session summaries
- **Progress Tracking** — Historical trends with Swift Charts visualizations

## Requirements

| Requirement | Minimum |
|---|---|
| Xcode | 26.0+ |
| iOS Deployment Target | 26.2 |
| Device | iPhone/iPad with A12+ chip and ARKit support |
| LiDAR | Recommended (iPhone 12 Pro+, iPad Pro 2020+) |

> **Note:** ARKit body tracking requires a physical device — it does not work in the iOS Simulator.

## Getting Started

1. **Clone the repository**

   ```bash
   git clone https://github.com/and3rn3t/Andernet-Posture.git
   cd Andernet-Posture
   ```

2. **Open in Xcode**

   ```bash
   open "Andernet Posture/Andernet Posture.xcodeproj"
   ```

3. **Select your team** — In *Signing & Capabilities*, pick your development team under *Automatically manage signing*.

4. **Build & Run** — Select a physical iOS device and press `Cmd+R`.

## Documentation

- **[ONBOARDING.md](./ONBOARDING.md)** — Developer onboarding guide with setup instructions, architecture overview, and common tasks
- **[API.md](./API.md)** — Comprehensive API reference for all services, analyzers, and data models
- **[CONTRIBUTING.md](./CONTRIBUTING.md)** — Contribution guidelines, code standards, and development workflow

## Project Structure

```
Andernet Posture/
├── Andernet_PostureApp.swift       # App entry point, SwiftData container
├── BodyARView.swift                # ARView wrapper + skeleton overlay
├── PostureGaitCaptureView.swift    # Capture session UI
├── GaitSession.swift               # SwiftData @Model for session persistence
├── Info.plist                      # Privacy descriptions, device capabilities
├── PrivacyInfo.xcprivacy           # App privacy manifest
├── Models/
│   ├── BodyFrame.swift             # Skeleton joint snapshot
│   ├── ClinicalGlossary.swift      # Clinical terminology and definitions
│   ├── DisplayNames.swift          # Localized display names
│   ├── ExerciseRecommendation.swift # Evidence-based exercise library
│   ├── JointName.swift             # Tracked joint enum + ARKit mapping
│   ├── MotionFrame.swift           # CoreMotion device motion snapshot
│   ├── ProgressMetric.swift        # Progress tracking metrics
│   ├── StepEvent.swift             # Foot-strike event during gait
│   └── UserGoals.swift             # User-defined goals and targets
├── Services/
│   ├── AROverlayConfiguration.swift   # AR overlay mode configuration
│   ├── AROverlayRenderer.swift        # AR skeleton visualization renderer
│   ├── BodyTrackingService.swift      # ARKit body tracking protocol + impl
│   ├── CloudSyncService.swift         # CloudKit sync status monitoring
│   ├── ExportService.swift            # PDF and CSV export generation
│   ├── GaitAnalyzer.swift             # Step detection & gait metrics
│   ├── HealthKitService.swift         # HealthKit read/write
│   ├── InsightsEngine.swift           # Clinical insights generation
│   ├── KeyValueStoreSync.swift        # NSUbiquitousKeyValueStore sync
│   ├── MLModelService.swift           # CoreML model lifecycle manager
│   ├── MotionService.swift            # CoreMotion 60Hz sampling
│   ├── NotificationService.swift      # Local notifications
│   ├── PostureAnalyzer.swift          # Spine angle & posture scoring
│   ├── SessionAnalysisSummary.swift   # Session analysis results
│   ├── SessionRecorder.swift          # Record/stop/save session state machine
│   ├── Analyzers/
│   │   ├── BalanceAnalyzer.swift      # Balance and stability analysis
│   │   ├── CoreMLFallRiskAnalyzer.swift    # ML-powered fall risk
│   │   ├── CoreMLFatigueAnalyzer.swift     # ML-powered fatigue detection
│   │   ├── CoreMLGaitPatternClassifier.swift # ML gait classification
│   │   ├── CoreMLPostureAnalyzer.swift     # ML posture scoring
│   │   ├── ErgonomicScorer.swift      # REBA/RULA ergonomic scoring
│   │   ├── FallRiskAnalyzer.swift     # Rule-based fall risk assessment
│   │   ├── FatigueAnalyzer.swift      # Rule-based fatigue detection
│   │   ├── GaitPatternClassifier.swift # Rule-based gait classification
│   │   ├── ROMAnalyzer.swift          # Range of motion analysis
│   │   └── SmoothnessAnalyzer.swift   # Movement smoothness metrics
│   └── Clinical/
│       ├── CardioEstimator.swift      # Cardiovascular health estimation
│       ├── ClinicalPostureNorms.swift # Clinical reference ranges
│       ├── CoreMLCrossedSyndromeDetector.swift # ML syndrome detection
│       ├── CrossedSyndromeDetector.swift # Upper/lower crossed syndrome
│       ├── FrailtyScreener.swift      # Frailty assessment
│       ├── NormativeData.swift        # Age-adjusted norms
│       └── PainRiskEngine.swift       # Pain risk prediction
├── ViewModels/
│   ├── CaptureViewModel.swift         # Orchestrates capture services
│   ├── ClinicalTestViewModel.swift    # Clinical test protocol execution
│   ├── DashboardViewModel.swift       # Dashboard data & trends
│   ├── ProgressHistoryViewModel.swift # Historical progress tracking
│   └── SessionDetailViewModel.swift   # Single session detail
├── Views/
│   ├── AccessibleCaptureOverlay.swift  # Accessibility-enhanced capture UI
│   ├── AROverlaySettingsSection.swift  # AR overlay mode settings
│   ├── CaptureAROverlayBar.swift       # AR overlay mode picker
│   ├── ClinicalTestView.swift          # Guided clinical test UI
│   ├── ComparisonView.swift            # Session comparison view
│   ├── DashboardView.swift             # Overview with charts
│   ├── ExerciseDetailView.swift        # Exercise instructions
│   ├── ExportView.swift                # Export and share interface
│   ├── GoalsView.swift                 # Goal setting and tracking
│   ├── HelpView.swift                  # Help and documentation
│   ├── MainTabView.swift               # Tab bar navigation
│   ├── MetricExplainerView.swift       # Metric definitions and education
│   ├── OnboardingView.swift            # First-run onboarding
│   ├── PerformanceReportView.swift     # Comprehensive performance report
│   ├── ProgressHistoryView.swift       # Historical progress charts
│   ├── SessionAnalysisSection.swift    # Session analysis display
│   ├── SessionDetailView.swift         # Session drill-down with charts
│   ├── SessionExportButton.swift       # Export button component
│   ├── SessionListView.swift           # Session history list
│   ├── SessionPlaybackView.swift       # Session replay visualization
│   ├── SettingsView.swift              # Preferences & data management
│   ├── SplashScreenView.swift          # Launch splash screen
│   └── Components/                     # Reusable view components
├── Utilities/
│   ├── AccessibilityHelpers.swift      # VoiceOver and accessibility utilities
│   ├── AppLogger.swift                 # Structured OSLog loggers
│   ├── Formatters.swift                # Time & number formatting helpers
│   ├── PerformanceMonitor.swift        # Performance tracking and metrics
│   ├── SIMDExtensions.swift            # SIMD3<Float> convenience extensions
│   └── Theme.swift                     # App-wide theming
└── Assets.xcassets/                    # App icon, accent color, brand colors

MLTraining/
├── generate_training_data.swift        # ML training data generator
└── Data/                               # Generated training datasets
```

## Architecture

- **MVVM** with protocol-based service injection for testability
- **SwiftData** for on-device session persistence
- **CloudKit** — NSPersistentCloudKitContainer for seamless multi-device sync
- **Swift Concurrency** — `@MainActor` default isolation, `nonisolated` for delegate callbacks
- **ARKit + RealityKit** — `ARBodyTrackingConfiguration` with real-time skeleton overlay and customizable visualization modes
- **CoreMotion** — 60 Hz accelerometer/gyroscope sampling for gait step detection
- **CoreML** — On-device machine learning models for advanced analysis:
  - **Gait Pattern Classifier** — Identifies 8 distinct gait patterns
  - **Posture Scorer** — Predicts composite posture quality
  - **Fall Risk Predictor** — Assesses fall risk from gait and balance metrics
  - **Crossed Syndrome Detector** — Detects upper and lower crossed syndrome
  - **Fatigue Predictor** — Estimates movement fatigue levels
- **Clinical Test Protocols** — Guided execution of TUG (Timed Up and Go), Romberg balance test, and 6-Minute Walk Test
- **Insights Engine** — Generates natural-language clinical insights with evidence-based exercise recommendations
- **Export System** — Professional PDF reports and CSV data export
- **HealthKit** — Read walking metrics, write session summaries
- **Swift Charts** — Posture score trends, gait analysis, and progress visualizations
- **Structured Logging** — OSLog-based logging with categorized subsystems
- **Localization** — String catalogs for internationalization support

## AR Overlay Modes

The app offers six different AR visualization modes for real-time skeleton tracking:

| Mode | Description |
|---|---|
| **Skeleton** | Standard cyan skeleton with joints and bone connections |
| **Severity** | Joint-by-joint color coding by clinical severity (green → red) |
| **Heatmap** | Full-body color map based on overall posture score |
| **Angles** | Floating angle measurement labels at key joints |
| **ROM** | Range-of-motion arc indicators at hips and knees |
| **Minimal** | Key landmarks only (head, shoulders, hips, feet) |

Users can switch between modes during capture via the AR overlay mode picker.

## Clinical Metrics

The app tracks and analyzes evidence-based clinical metrics derived from peer-reviewed literature:

### Posture Metrics

- **Craniovertebral Angle (CVA)** — Forward head posture indicator
- **Sagittal Vertical Axis (SVA)** — Spine alignment reference
- **Trunk Forward Lean** — Sagittal plane trunk deviation
- **Lateral Lean** — Coronal plane trunk deviation
- **REBA Score** — Rapid Entire Body Assessment for ergonomic risk
- **Postural Type (Kendall)** — Classification of posture patterns
- **Upper/Lower Crossed Syndrome** — Muscle imbalance detection

### Gait Metrics

- **Cadence** — Steps per minute
- **Stride Length** — Distance per gait cycle
- **Gait Speed** — Walking velocity
- **Step Time Asymmetry** — Left-right timing differences
- **Gait Asymmetry (Robinson SI)** — Symmetry index
- **Gait Pattern Classification** — 8 distinct patterns
- **Smoothness (SPARC)** — Movement quality indicator
- **Harmonic Ratio** — Gait smoothness in AP direction

### Balance & Stability

- **Sway Area** — 95% confidence ellipse
- **Sway Velocity** — Center of pressure movement speed
- **Fall Risk Score** — Composite fall risk assessment
- **Frailty Index** — Clinical frailty screening

### Range of Motion

- **Hip ROM** — Bilateral hip flexion/extension range
- **Knee ROM** — Bilateral knee flexion range
- **Ankle Dorsiflexion** — Ankle mobility

All metrics are classified into clinical severity levels (normal, mild, moderate, severe) based on established normative data and age-adjusted reference ranges.

For a detailed architecture overview with Mermaid diagrams, see **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

## Build Settings

| Setting | Value | Purpose |
|---|---|---|
| `SWIFT_DEFAULT_ACTOR_ISOLATION` | `MainActor` | All types default to main actor |
| `SWIFT_APPROACHABLE_CONCURRENCY` | `YES` | Simplified concurrency model |
| `SWIFT_STRICT_CONCURRENCY` | `complete` | Full concurrency checking |
| `SWIFT_UPCOMING_FEATURE_MEMBER_IMPORT_VISIBILITY` | `YES` | Explicit imports required |

## Privacy & Capabilities

The app requests access to:

| Permission | Usage |
|---|---|
| **Camera** | ARKit body tracking and LiDAR depth |
| **Motion & Fitness** | CoreMotion accelerometer/gyroscope for gait analysis |
| **HealthKit (Read)** | Walking metrics, step counts, historical trends |
| **HealthKit (Write)** | Save posture/gait session summaries |
| **iCloud (CloudKit)** | Sync session data across your devices (optional) |

Entitlements: HealthKit and iCloud capabilities are enabled in `Andernet_Posture.entitlements`.

## Machine Learning Training

The `MLTraining/` directory contains tools for generating training datasets using knowledge distillation from the app's rule-based analyzers.

### Generating Training Data

```bash
swift MLTraining/generate_training_data.swift
```

This produces Create ML–compatible JSON datasets in `MLTraining/Data/`:

- `GaitPatternClassifier_training.json` (10,000 samples)
- `PostureScorer_training.json` (10,000 samples)
- `FallRiskPredictor_training.json` (10,000 samples)
- `CrossedSyndromeDetector_training.json` (10,000 samples)
- `FatiguePredictor_training.json` (5,000 samples)

### Training Models

1. Open **Create ML** → New Document → Tabular Regressor/Classifier
2. Import the generated JSON training data
3. Set the target column to the label/score field
4. Train, evaluate, and export the `.mlmodel`
5. Compile to `.mlmodelc` and add to the app bundle

The ML models are designed to replicate and enhance the scoring logic of their corresponding default analyzers, enabling faster inference and batch processing.

## Testing

```bash
# Run unit tests
xcodebuild test -project "Andernet Posture/Andernet Posture.xcodeproj" \
  -scheme "Andernet Posture" \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro"
```

> Unit tests for analyzers and services work on Simulator. AR-dependent tests require a physical device.

The test suite includes:

- **AnalyzerTests** — Posture, gait, balance, and ROM analysis validation
- **ClinicalTests** — Clinical severity classification and normative data
- **CoreMLFallbackTests** — ML model loading and fallback logic
- **MLModelServiceTests** — CoreML lifecycle and caching
- **ProgressHistoryTests** — Historical trend calculations
- **ServiceTests** — HealthKit, CloudSync, and session recording
- **SessionAnalysisTests** — End-to-end analysis pipeline

## Accessibility

Andernet Posture is designed with comprehensive accessibility support:

- **VoiceOver** — Full screen reader support with descriptive labels for all UI elements
- **Dynamic Type** — Respects user text size preferences with `@ScaledMetric` sizing
- **Reduce Motion** — Alternative animations when reduce motion is enabled
- **High Contrast** — Severity color coding adapts to accessibility settings
- **Accessible Formatters** — Natural-language descriptions for clinical metrics
- **Keyboard Navigation** — Full keyboard support for navigation and controls

All clinical severity indicators include both visual color coding and text-based descriptions for users who are colorblind or using screen readers.

## Medical Disclaimer

**This app is a screening tool for educational and informational purposes only — it is not intended for clinical diagnosis or medical advice.**

All measurements and recommendations generated by Andernet Posture should be reviewed by a qualified healthcare provider before making any medical decisions. The app:

- Uses research-validated metrics but is not FDA-approved or CE-marked as a medical device
- Cannot replace professional clinical assessment
- May produce inaccurate results due to device positioning, lighting, or user movement
- Should not be used as the sole basis for treatment decisions

Users with concerning findings should consult their healthcare provider. Always seek professional medical advice for any health concerns.

## Contributing

We welcome contributions! Please read our [Contributing Guidelines](./CONTRIBUTING.md) for:

- Code of conduct
- Development process
- Pull request guidelines
- Code standards and style
- Testing requirements

For questions or discussions, open a GitHub Issue or Discussion.

## License

Copyright © 2026 Andernet. All rights reserved.
