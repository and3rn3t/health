# Andernet Posture — Architecture

This document provides a comprehensive architectural overview of the Andernet Posture application using Mermaid diagrams. Each section covers a distinct layer or concern of the system.

> **Rendering:** GitHub natively renders Mermaid blocks in Markdown. If viewing locally, use a Mermaid-compatible viewer or the [Mermaid Live Editor](https://mermaid.live).

---

## Table of Contents

1. [High-Level System Overview](#1-high-level-system-overview)
2. [MVVM Architecture](#2-mvvm-architecture)
3. [Real-Time Data Flow Pipeline](#3-real-time-data-flow-pipeline)
4. [Service Layer](#4-service-layer)
5. [Clinical Analysis Engine](#5-clinical-analysis-engine)
6. [CoreML Pipeline](#6-coreml-pipeline)
7. [Data Persistence & Storage](#7-data-persistence--storage)
8. [Session Lifecycle State Machine](#8-session-lifecycle-state-machine)
9. [UI Navigation Map](#9-ui-navigation-map)
10. [CI/CD Pipeline](#10-cicd-pipeline)
11. [Privacy & Permissions Model](#11-privacy--permissions-model)

---

## 1. High-Level System Overview

The top-level view of every major subsystem and how they connect. The app runs entirely on-device with optional iCloud sync — no backend server is involved.

```mermaid
graph TB
    subgraph Device["iPhone / iPad (A12+ with ARKit)"]
        subgraph App["Andernet Posture App"]
            UI["SwiftUI Views<br/>(5-tab navigation)"]
            VM["ViewModels<br/>(@Observable, @MainActor)"]
            SVC["Service Layer<br/>(protocol-based)"]
            ANA["Analysis Engine<br/>(posture, gait, clinical)"]
            ML["CoreML Models<br/>(5 on-device models)"]
            DATA["SwiftData Store<br/>(GaitSession @Model)"]
        end

        AR["ARKit + RealityKit<br/>Body Tracking (60 fps)"]
        CM["CoreMotion<br/>Accelerometer / Gyroscope"]
        CAM["Camera<br/>RGB + LiDAR Depth"]
    end

    HK["HealthKit<br/>Apple Health"]
    CK["CloudKit<br/>iCloud Private DB"]
    KVS["iCloud KVS<br/>Demographics Sync"]

    CAM --> AR
    AR --> SVC
    CM --> SVC
    SVC --> ANA
    ANA --> ML
    SVC --> VM
    VM --> UI
    SVC --> DATA
    DATA --> CK
    SVC --> HK
    KVS <--> DATA

    style Device fill:#1a1a2e,stroke:#16213e,color:#e0e0e0
    style App fill:#0f3460,stroke:#533483,color:#e0e0e0
    style AR fill:#e94560,stroke:#c81d4e,color:#fff
    style CM fill:#e94560,stroke:#c81d4e,color:#fff
    style CAM fill:#e94560,stroke:#c81d4e,color:#fff
    style HK fill:#533483,stroke:#7b2d8e,color:#fff
    style CK fill:#533483,stroke:#7b2d8e,color:#fff
    style KVS fill:#533483,stroke:#7b2d8e,color:#fff
```

**Key points:**

- **On-device processing** — All posture/gait analysis, ML inference, and clinical scoring run locally on the Neural Engine and CPU. No data leaves the device except through explicit HealthKit writes or iCloud sync.
- **ARKit body tracking** provides a 91-joint skeleton at up to 60 fps. The app extracts a relevant subset of joints and feeds them through the analysis pipeline.
- **CoreMotion** supplements ARKit with raw accelerometer and gyroscope data at 60 Hz for step detection and movement smoothness metrics.
- **Protocol-based services** allow swapping real implementations for mocks in unit tests without requiring a physical device.

---

## 2. MVVM Architecture

The app follows Model-View-ViewModel with protocol-based dependency injection. All ViewModels are `@Observable` and isolated to `@MainActor`.

```mermaid
graph LR
    subgraph Views["Views (SwiftUI)"]
        DV[DashboardView]
        CV[PostureGaitCaptureView]
        SLV[SessionListView]
        SDV[SessionDetailView]
        CTV[ClinicalTestView]
        SV[SettingsView]
        OV[OnboardingView]
    end

    subgraph ViewModels["ViewModels (@Observable)"]
        DVM[DashboardViewModel]
        CVM[CaptureViewModel]
        SDVM[SessionDetailViewModel]
        PHVM[ProgressHistoryViewModel]
        CTVM[ClinicalTestViewModel]
    end

    subgraph Models["Models (SwiftData + Value Types)"]
        GS[GaitSession]
        BF[BodyFrame]
        SE[StepEvent]
        MF[MotionFrame]
        UG[UserGoals]
    end

    DV --> DVM
    CV --> CVM
    SLV --> DVM
    SDV --> SDVM
    CTV --> CTVM

    DVM --> GS
    CVM --> GS
    CVM --> BF
    CVM --> SE
    CVM --> MF
    SDVM --> GS
    PHVM --> GS

    style Views fill:#2d6a4f,stroke:#40916c,color:#fff
    style ViewModels fill:#1b4332,stroke:#2d6a4f,color:#fff
    style Models fill:#081c15,stroke:#1b4332,color:#fff
```

**Responsibilities:**

| Layer | Role |
|-------|------|
| **Views** | Declarative SwiftUI components. No business logic — they observe ViewModel properties and call ViewModel methods. |
| **ViewModels** | Coordinate services, transform data for display, manage UI state. `CaptureViewModel` is the largest, orchestrating 14+ analyzers in real time. |
| **Models** | `GaitSession` is the single SwiftData `@Model` containing all persisted session data. `BodyFrame`, `StepEvent`, and `MotionFrame` are value types encoded as JSON for time-series storage. |

---

## 3. Real-Time Data Flow Pipeline

This diagram traces the path of a single frame from the camera through the entire analysis pipeline to the UI and persistence layer.

```mermaid
flowchart TD
    CAM[/"Camera Feed (60 fps)"/]
    ARSession["ARSession<br/>ARBodyTrackingConfiguration"]
    Delegate["ARSessionDelegate<br/>(nonisolated callback)"]
    BTS["BodyTrackingService<br/>Joint extraction"]
    Throttle{"Sampling Rate<br/>Throttle (15–60 Hz)"}

    subgraph CaptureVM["CaptureViewModel.processFrame()"]
        direction TB
        PA["PostureAnalyzer<br/>CVA, SVA, kyphosis,<br/>lordosis, NYPR"]
        GA["GaitAnalyzer<br/>Cadence, stride length,<br/>step detection"]
        BA["BalanceAnalyzer<br/>Sway velocity, area"]
        RA["ROMAnalyzer<br/>Hip, knee, trunk angles"]
        ES["ErgonomicScorer<br/>REBA score"]
        FR["FallRiskAnalyzer<br/>8-factor composite"]
        FA["FatigueAnalyzer<br/>Trend regression"]
        SA["SmoothnessAnalyzer<br/>SPARC, harmonic ratio"]
        GPC["GaitPatternClassifier<br/>8 gait pattern classes"]
        CSD["CrossedSyndromeDetector<br/>Upper/lower syndrome"]
        PRE["PainRiskEngine<br/>Multi-factor alerts"]
        FS["FrailtyScreener<br/>Fried index"]
        CE["CardioEstimator<br/>6MWT, MET"]
    end

    SR["SessionRecorder<br/>Append BodyFrame"]
    UI["SwiftUI Views<br/>Real-time metric display"]
    HAPTIC["Haptic Feedback<br/>On alert thresholds"]

    CAM --> ARSession --> Delegate --> BTS --> Throttle
    Throttle -->|frame forwarded| CaptureVM
    Throttle -->|frame skipped| DROP[/Discarded/]

    PA & GA & BA & RA & ES & FR & FA & SA & GPC & CSD & PRE & FS & CE --> SR
    CaptureVM --> UI
    CaptureVM --> HAPTIC
    SR -->|on stop| SAVE["Save GaitSession<br/>to SwiftData"]

    style CaptureVM fill:#264653,stroke:#2a9d8f,color:#fff
    style SAVE fill:#e76f51,stroke:#f4a261,color:#fff
    style CAM fill:#e9c46a,stroke:#f4a261,color:#000
    style DROP fill:#6c757d,stroke:#495057,color:#fff
```

**Pipeline details:**

- **Frame extraction** — `BodyARView.Coordinator` receives `ARBodyAnchor` updates from the AR session delegate. Joint positions are extracted from the skeleton's `jointModelTransforms`.
- **Throttling** — A configurable sampling rate (default 60 Hz, adjustable 15–60 Hz) skips frames to reduce CPU load from expensive analyzer computations.
- **Parallel analysis** — All 13 analyzers run on each forwarded frame. Each produces typed metrics that flow into the `BodyFrame` recorded by `SessionRecorder`.
- **Recording** — `SessionRecorder` operates on a serial `DispatchQueue` at `userInitiated` QoS. Frames are appended to an in-memory buffer with a 36,000-frame capacity (~10 minutes at 60 fps). When capacity is hit, the first half is decimated (keeping every 2nd frame).
- **Persistence** — On session stop, aggregated metrics are computed and a `GaitSession` object is created in SwiftData. Time-series data is JSON-encoded into `@Attribute(.externalStorage)` properties.

---

## 4. Service Layer

All services conform to protocols for testability. The app injects real implementations at runtime and mock implementations in tests.

```mermaid
classDiagram
    class BodyTrackingService {
        <<protocol>>
        +start()
        +stop()
        +onBodyUpdate: callback
    }

    class PostureAnalyzer {
        <<protocol>>
        +analyze(joints) PostureMetrics?
    }

    class GaitAnalyzer {
        <<protocol>>
        +processFrame(joints, timestamp) GaitMetrics
        +stepEvents: [StepEvent]
    }

    class MotionService {
        <<protocol>>
        +startUpdates()
        +stopUpdates()
        +latestMotion: MotionFrame?
    }

    class HealthKitService {
        <<protocol>>
        +requestAuthorization() async
        +saveSession() async throws
        +fetchSteps() async
    }

    class MLModelService {
        <<protocol>>
        +loadModel(name) async throws
        +isModelAvailable(name) Bool
        +useMLModels: Bool
    }

    class SessionRecorder {
        +state: RecordingState
        +startCalibration()
        +startRecording()
        +pause()
        +stop()
        +recordFrame(BodyFrame)
    }

    class InsightsEngine {
        +generateInsights(sessions) [Insight]
    }

    class ExportService {
        +generateCSV(session) URL
        +generatePDF(session) URL
    }

    class CloudSyncService {
        +syncStatus: SyncStatus
        +monitorSync()
    }

    class CaptureViewModel {
        +processFrame()
        +startSession()
        +stopSession()
    }

    CaptureViewModel --> BodyTrackingService
    CaptureViewModel --> PostureAnalyzer
    CaptureViewModel --> GaitAnalyzer
    CaptureViewModel --> MotionService
    CaptureViewModel --> SessionRecorder
    CaptureViewModel --> HealthKitService
    CaptureViewModel --> MLModelService

    SessionRecorder --> GaitSession : creates

    note for CaptureViewModel "Orchestrates all services\nduring a capture session"
```

**Service boundaries:**

- **BodyTrackingService** owns the `ARSession` lifecycle and emits joint dictionaries.
- **PostureAnalyzer** and **GaitAnalyzer** are stateless per-frame processors (though GaitAnalyzer maintains step history for cadence calculation).
- **SessionRecorder** is the recording state machine — it manages calibration, recording, pause, and stop transitions, and buffers frames.
- **HealthKitService** handles authorization, reading historical data, and writing session summaries to Apple Health.
- **MLModelService** manages CoreML model loading, warm-up, and availability checks, with a toggle to fall back to rule-based analyzers.
- **CloudSyncService** monitors iCloud sync status and surfaces it in the Settings UI.

---

## 5. Clinical Analysis Engine

The analysis engine is organized into three tiers of increasing clinical complexity.

```mermaid
graph TB
    subgraph Tier1["Tier 1 — Direct Measurements"]
        CVA["CVA<br/>Craniovertebral Angle<br/>(normal 49–56°)"]
        SVA["SVA<br/>Sagittal Vertical Axis<br/>(normal < 5 cm)"]
        TL["Trunk Lean<br/>Sagittal + Frontal"]
        SH["Shoulder Asymmetry<br/>L/R height difference"]
        PO["Pelvic Obliquity<br/>Hip height asymmetry"]
        CAD["Cadence<br/>Steps/min"]
        SL["Stride Length<br/>(meters)"]
        WS["Walking Speed<br/>(m/s)"]
        SW["Step Width<br/>Medial-lateral"]
    end

    subgraph Tier2["Tier 2 — Proxy & Composite"]
        KY["Thoracic Kyphosis<br/>3-point Cobb proxy<br/>(normal 20–45°)"]
        LO["Lumbar Lordosis<br/>3-point angle proxy<br/>(normal 40–60°)"]
        CSD_metric["Coronal Spine<br/>Deviation"]
        RSI["Robinson Symmetry<br/>Index (>10% abnormal)"]
        TP["Temporal Params<br/>Stance%, Swing%,<br/>Double Support%"]
        SWAY["Postural Sway<br/>Velocity + Area"]
        ROM["Range of Motion<br/>Hip, Knee, Trunk"]
    end

    subgraph Tier3["Tier 3 — Clinical Scores & Decision Support"]
        PS["Posture Score<br/>(0–100 weighted)"]
        NYPR["NYPR Automated<br/>Subset"]
        KEND["Kendall Postural<br/>Type Classification"]
        REBA["REBA Ergonomic<br/>Score"]
        FALL["Fall Risk<br/>8-factor assessment"]
        CROSS["Crossed Syndromes<br/>Upper / Lower"]
        PAIN["Pain Risk<br/>Multi-factor alerts"]
        FRAIL["Frailty Screening<br/>Fried Index (0–3+)"]
        CARDIO["Cardiovascular<br/>6MWT, TUG, MET"]
        FATIGUE["Fatigue Index<br/>Trend regression"]
        SMOOTH["Smoothness<br/>SPARC, Harmonic Ratio"]
        GAIT_PAT["Gait Pattern<br/>8-class classifier"]
    end

    CVA & SVA & KY & LO & TL & SH & PO --> PS
    CVA & SVA & KY & LO & TL & SH & PO --> NYPR
    CVA & SVA & KY & LO --> KEND
    TL & SH & PO & ROM --> REBA
    WS & SL & CAD & TP & SWAY & RSI --> FALL
    CVA & KY & LO & SH & PO & ROM --> CROSS
    PS & FALL & CROSS & ROM --> PAIN
    WS & SL & CAD & FALL --> FRAIL
    WS & SL & CAD --> CARDIO
    PS & CAD & SWAY --> FATIGUE
    CAD & SL & WS --> GAIT_PAT

    style Tier1 fill:#264653,stroke:#2a9d8f,color:#fff
    style Tier2 fill:#2a9d8f,stroke:#e9c46a,color:#fff
    style Tier3 fill:#e76f51,stroke:#f4a261,color:#fff
```

**Analysis tiers explained:**

- **Tier 1** metrics are directly computed from joint positions (angles, distances) or gait events (step counts, timing). These are the rawest measurements.
- **Tier 2** metrics derive from Tier 1 using proxy calculations (e.g., kyphosis via a 3-point Cobb angle approximation) or composite formulas (e.g., Robinson Symmetry Index).
- **Tier 3** produces clinically meaningful scores and classifications. These consume multiple lower-tier metrics and apply literature-grounded thresholds and weightings. Each Tier 3 analyzer has both a rule-based and a CoreML implementation.

---

## 6. CoreML Pipeline

Five on-device CoreML models augment the rule-based analyzers. All models were trained via knowledge distillation from the rule-based implementations.

```mermaid
flowchart LR
    subgraph Training["Training Pipeline (Offline)"]
        RB["Rule-Based<br/>Analyzers"]
        GEN["generate_training_data.swift<br/>Knowledge Distillation"]
        JSON["Training Data<br/>JSON (5k–10k samples)"]
        CML["Create ML<br/>Model Training"]
        MLMODEL[".mlmodel files<br/>(5 models)"]
    end

    subgraph Runtime["Runtime (On-Device)"]
        MLS["MLModelService<br/>Load & Warm-Up"]
        TOGGLE{"useMLModels<br/>toggle?"}
        subgraph Models["CoreML Models"]
            M1["PostureScorer<br/>9 inputs → score 0–100"]
            M2["GaitPatternClassifier<br/>14 inputs → 8 classes"]
            M3["FallRiskPredictor<br/>8 inputs → risk score"]
            M4["CrossedSyndromeDetector<br/>7 inputs → syndrome scores"]
            M5["FatiguePredictor<br/>8 inputs → fatigue index"]
        end
        subgraph Fallback["Rule-Based Fallbacks"]
            F1["DefaultPostureAnalyzer"]
            F2["DefaultGaitPatternClassifier"]
            F3["DefaultFallRiskAnalyzer"]
            F4["DefaultCrossedSyndromeDetector"]
            F5["DefaultFatigueAnalyzer"]
        end
    end

    RB --> GEN --> JSON --> CML --> MLMODEL
    MLMODEL --> MLS
    MLS --> TOGGLE
    TOGGLE -->|ML enabled| Models
    TOGGLE -->|ML disabled or<br/>model unavailable| Fallback

    style Training fill:#3d405b,stroke:#81b29a,color:#fff
    style Runtime fill:#264653,stroke:#2a9d8f,color:#fff
    style Models fill:#2a9d8f,stroke:#e9c46a,color:#fff
    style Fallback fill:#e76f51,stroke:#f4a261,color:#fff
```

**Model details:**

| Model | Inputs | Output | Training Samples |
|-------|--------|--------|-----------------|
| **PostureScorer** | 9 posture sub-metrics | Score 0–100 | 10,000 |
| **GaitPatternClassifier** | 14 gait parameters | 8 gait pattern classes | 10,000 |
| **FallRiskPredictor** | 8 balance/gait factors | Risk score (0.0–1.0) | 10,000 |
| **CrossedSyndromeDetector** | 7 postural measurements | Upper/lower syndrome scores | 10,000 |
| **FatiguePredictor** | 8 session trend features | Fatigue index (0.0–1.0) | 5,000 |

All models use `.cpuAndNeuralEngine` compute units for optimal performance. If a model fails to load, the system silently falls back to the corresponding rule-based analyzer.

---

## 7. Data Persistence & Storage

Data is stored across four mechanisms depending on the type and sync requirements.

```mermaid
flowchart TB
    subgraph SwiftDataStore["SwiftData (Primary Store)"]
        GS["GaitSession @Model<br/>─────────────────<br/>Aggregated metrics<br/>Posture scores, gait metrics,<br/>clinical scores, risk levels"]
        EXT["External Storage (@Attribute)<br/>─────────────────<br/>framesData: [BodyFrame] as JSON<br/>stepEventsData: [StepEvent] as JSON<br/>motionFramesData: [MotionFrame] as JSON"]
    end

    subgraph CloudKit["CloudKit (iCloud Sync)"]
        PDB["Private Database<br/>iCloud.dev.andernet.posture"]
    end

    subgraph KVStore["iCloud KVS"]
        DEMO["Demographics<br/>height, weight, age, sex"]
    end

    subgraph UserDef["UserDefaults"]
        PREFS["App Preferences<br/>useMLModels, skeletonOverlay,<br/>samplingRate, hasCompletedOnboarding"]
    end

    subgraph TempFS["FileManager (Temporary)"]
        CSV["CSV Exports"]
        PDF["PDF Reports"]
    end

    GS --> EXT
    GS <-->|automatic sync| PDB
    KVStore <-->|cross-device| DEMO
    PREFS -.->|read by| MLS2["MLModelService"]
    GS -->|on export| CSV & PDF

    style SwiftDataStore fill:#264653,stroke:#2a9d8f,color:#fff
    style CloudKit fill:#533483,stroke:#7b2d8e,color:#fff
    style KVStore fill:#533483,stroke:#7b2d8e,color:#fff
    style UserDef fill:#3d405b,stroke:#81b29a,color:#fff
    style TempFS fill:#6c757d,stroke:#495057,color:#fff
```

**Storage strategy:**

- **SwiftData** is the single source of truth for session data. `GaitSession` stores aggregated metrics as typed properties and time-series data as JSON-encoded `Data` blobs marked with `.externalStorage` (stored as separate files on disk for efficiency).
- **CloudKit** provides automatic cross-device sync via the SwiftData-CloudKit integration. The private database container `iCloud.dev.andernet.posture` holds all sessions.
- **iCloud Key-Value Store** syncs lightweight demographic data (height, weight, age) across devices without going through the full CloudKit pipeline.
- **UserDefaults** stores app preferences (ML toggle, overlay settings, onboarding status).
- **Temporary files** are created for CSV/PDF exports and cleaned up by the system.

---

## 8. Session Lifecycle State Machine

A capture session moves through a well-defined set of states managed by `SessionRecorder`.

```mermaid
stateDiagram-v2
    [*] --> Idle

    Idle --> Calibrating : startCalibration()
    Calibrating --> Recording : calibration complete\n(3-second countdown)
    Recording --> Paused : pause()
    Paused --> Recording : resume()
    Recording --> Saving : stop()
    Paused --> Saving : stop()
    Saving --> Idle : session saved\nto SwiftData

    Calibrating --> Idle : cancel()
    Recording --> Idle : cancel()\n(discard session)
    Paused --> Idle : cancel()\n(discard session)

    state Calibrating {
        [*] --> Countdown
        Countdown --> BodyDetected : body anchor found
        BodyDetected --> Ready : 3 seconds elapsed
    }

    state Recording {
        [*] --> Capturing
        Capturing --> Capturing : processFrame()\n(append BodyFrame)
        Capturing --> Decimating : buffer full\n(36,000 frames)
        Decimating --> Capturing : first half decimated\n(keep every 2nd frame)
    }

    state Saving {
        [*] --> Aggregating
        Aggregating --> Encoding : compute averages,\npeaks, durations
        Encoding --> Persisting : JSON-encode\nframes/steps/motion
        Persisting --> SyncHealthKit : save GaitSession\nto SwiftData
        SyncHealthKit --> [*] : write to\nHealthKit
    }
```

**State transitions:**

- **Idle** — No active session. The capture view shows the live AR preview.
- **Calibrating** — A 3-second countdown runs while verifying that ARKit can detect a body anchor. Ensures the user is positioned correctly before data recording begins.
- **Recording** — Frames are actively captured and processed. The UI displays real-time metrics. The frame buffer has a 36,000-frame capacity; when full, the oldest half is decimated (keeping every other frame) to bound memory.
- **Paused** — Recording is temporarily halted. Frames are not captured but the session remains active.
- **Saving** — On stop, the system aggregates metrics (averages, peaks, durations), JSON-encodes time-series data, persists the `GaitSession` to SwiftData, and writes a summary to HealthKit.

---

## 9. UI Navigation Map

The app uses a 5-tab navigation structure with modal presentations for capture and onboarding.

```mermaid
graph TB
    subgraph TabBar["MainTabView (5 Tabs)"]
        T1["Dashboard"]
        T2["Sessions"]
        T3["Capture"]
        T4["Tests"]
        T5["Settings"]
    end

    subgraph DashboardStack["Dashboard"]
        DV2["DashboardView<br/>─────────────────<br/>Insights cards<br/>Score rings<br/>Trend charts<br/>Exercise recommendations"]
        GOALS["GoalsView<br/>User goals & progress"]
    end

    subgraph SessionsStack["Sessions"]
        SLV2["SessionListView<br/>─────────────────<br/>Session history<br/>Swipe to delete"]
        SDV2["SessionDetailView<br/>─────────────────<br/>Metric breakdown<br/>Severity badges<br/>Charts"]
        PLAY["SessionPlaybackView<br/>Frame-by-frame replay"]
        COMP["ComparisonView<br/>Side-by-side sessions"]
        EXPORT["ExportView<br/>PDF / CSV generation"]
        REPORT["PerformanceReportView<br/>Clinical summary"]
    end

    subgraph CaptureStack["Capture"]
        PGC["PostureGaitCaptureView<br/>─────────────────<br/>Live AR camera feed<br/>Skeleton overlay<br/>Real-time metrics<br/>Record controls"]
        BODY["BodyARView<br/>RealityKit AR renderer"]
    end

    subgraph TestsStack["Clinical Tests"]
        CTV2["ClinicalTestView<br/>─────────────────<br/>6-Minute Walk Test<br/>Timed Up & Go<br/>Romberg Test<br/>Functional Reach"]
    end

    subgraph SettingsStack["Settings"]
        SET["SettingsView<br/>─────────────────<br/>ML model toggle<br/>Skeleton overlay options<br/>Sampling rate<br/>iCloud sync status<br/>Data management"]
        HELP["HelpView<br/>Clinical glossary"]
    end

    SPLASH["SplashScreenView"] --> ONBOARD["OnboardingView"]
    ONBOARD --> TabBar

    T1 --> DV2
    T2 --> SLV2
    T3 --> PGC
    T4 --> CTV2
    T5 --> SET

    DV2 --> GOALS
    SLV2 --> SDV2
    SDV2 --> PLAY
    SDV2 --> COMP
    SDV2 --> EXPORT
    SDV2 --> REPORT
    PGC --> BODY
    SET --> HELP

    style TabBar fill:#264653,stroke:#2a9d8f,color:#fff
    style DashboardStack fill:#2a9d8f,stroke:#264653,color:#fff
    style SessionsStack fill:#e9c46a,stroke:#f4a261,color:#000
    style CaptureStack fill:#e76f51,stroke:#f4a261,color:#fff
    style TestsStack fill:#3d405b,stroke:#81b29a,color:#fff
    style SettingsStack fill:#6c757d,stroke:#495057,color:#fff
```

**Navigation details:**

- **Splash / Onboarding** is shown on first launch. After completion, the `hasCompletedOnboarding` flag is set and the tab view is shown directly on subsequent launches.
- **Dashboard** is the landing tab, showing aggregated insights, trend charts, posture/gait score rings, and exercise recommendations.
- **Sessions** provides the full history with drill-down into individual session details, playback, comparison, and export.
- **Capture** is the core experience — live AR body tracking with real-time metric overlays and recording controls.
- **Clinical Tests** offers structured test workflows (6-Minute Walk Test, Timed Up and Go, Romberg, Functional Reach).
- **Settings** manages app preferences, ML model toggles, overlay configuration, sync status, and data management.

---

## 10. CI/CD Pipeline

The project uses GitHub Actions for continuous integration on every push and pull request to `main`.

```mermaid
flowchart LR
    subgraph Trigger["Trigger"]
        PUSH["Push to main"]
        PR["Pull Request to main"]
    end

    subgraph Runner["macOS 15 Runner"]
        CHECKOUT["Checkout Code"]
        XCODE["Select Xcode 26.2"]
        DEPS["Resolve Swift<br/>Package Dependencies"]
        BUILD["xcodebuild<br/>build-for-testing<br/>(iPhone 16 Pro Simulator)"]
        TEST["xcodebuild<br/>test-without-building"]
        LINT["swiftlint --strict"]
    end

    subgraph Results["Results"]
        PASS["Build + Tests + Lint<br/>All Pass ✓"]
        FAIL["Upload Test Results<br/>as Artifact"]
    end

    PUSH & PR --> CHECKOUT
    CHECKOUT --> XCODE --> DEPS --> BUILD --> TEST --> LINT
    LINT -->|success| PASS
    TEST -->|failure| FAIL
    BUILD -->|failure| FAIL

    style Trigger fill:#264653,stroke:#2a9d8f,color:#fff
    style Runner fill:#3d405b,stroke:#81b29a,color:#fff
    style PASS fill:#2a9d8f,stroke:#264653,color:#fff
    style FAIL fill:#e76f51,stroke:#f4a261,color:#fff
```

**Pipeline steps:**

1. **Checkout** — Standard `actions/checkout@v4`.
2. **Xcode selection** — Pins to Xcode 26.2 for reproducible builds.
3. **Dependencies** — Resolves Swift Package Manager dependencies.
4. **Build** — Compiles the full app target for testing with code signing disabled (`CODE_SIGNING_ALLOWED=NO`).
5. **Test** — Runs the full test suite on an iPhone 16 Pro simulator. AR-dependent tests are skipped in the simulator environment.
6. **Lint** — SwiftLint runs in strict mode, enforcing the rules defined in `.swiftlint.yml`.
7. **Artifacts** — On failure, test result bundles are uploaded for debugging.

---

## 11. Privacy & Permissions Model

The app requests the minimum permissions necessary and processes all data on-device.

```mermaid
flowchart TB
    subgraph Permissions["System Permission Prompts"]
        P1["NSCameraUsageDescription<br/>Camera for AR body tracking"]
        P2["NSMotionUsageDescription<br/>Accelerometer/gyroscope for gait"]
        P3["NSHealthShareUsageDescription<br/>Read walking metrics from Health"]
        P4["NSHealthUpdateUsageDescription<br/>Write session summaries to Health"]
    end

    subgraph Processing["On-Device Processing"]
        ARKIT["ARKit<br/>Skeleton extraction"]
        COREMOTION["CoreMotion<br/>Motion sampling"]
        ANALYSIS["Analysis Engine<br/>All computation local"]
        COREML["CoreML<br/>Neural Engine inference"]
    end

    subgraph Storage["Data Storage"]
        LOCAL["SwiftData<br/>Local-first persistence"]
        ICLOUD["iCloud CloudKit<br/>Opt-in sync for signed-in users"]
        HEALTH["HealthKit<br/>Explicit user action to write"]
    end

    subgraph Privacy["Privacy Guarantees"]
        NO_SERVER["No backend server<br/>No data transmission"]
        NO_ANALYTICS["No analytics or tracking"]
        MANIFEST["PrivacyInfo.xcprivacy<br/>App privacy manifest"]
        USER_CONTROL["User controls all<br/>data sharing"]
    end

    P1 --> ARKIT
    P2 --> COREMOTION
    P3 & P4 --> HEALTH
    ARKIT & COREMOTION --> ANALYSIS --> COREML
    ANALYSIS --> LOCAL
    LOCAL -->|user opted in| ICLOUD

    style Permissions fill:#e76f51,stroke:#f4a261,color:#fff
    style Processing fill:#264653,stroke:#2a9d8f,color:#fff
    style Storage fill:#3d405b,stroke:#81b29a,color:#fff
    style Privacy fill:#2a9d8f,stroke:#264653,color:#fff
```

**Privacy principles:**

- **On-device only** — No data is transmitted to any server. All analysis, ML inference, and storage happens locally.
- **Explicit consent** — Each permission (camera, motion, HealthKit) requires explicit user authorization through iOS system dialogs.
- **HealthKit writes are user-initiated** — Session data is only written to Apple Health when the user explicitly chooses to save.
- **iCloud sync is automatic but opt-in by nature** — Sync only occurs for users signed into iCloud. The app works fully offline with local SwiftData storage.
- **Privacy manifest** — `PrivacyInfo.xcprivacy` declares all data usage categories per App Store requirements.

---

## Component Quick Reference

| File | Layer | Purpose |
|------|-------|---------|
| `Andernet_PostureApp.swift` | Entry | SwiftData container setup, root view |
| `BodyARView.swift` | View | `UIViewRepresentable` wrapping `ARView` |
| `GaitSession.swift` | Model | SwiftData `@Model` — single persisted entity |
| `CaptureViewModel.swift` | ViewModel | Orchestrates 14+ analyzers in real time |
| `DashboardViewModel.swift` | ViewModel | Dashboard data, insights, trends |
| `BodyTrackingService.swift` | Service | ARKit body tracking lifecycle |
| `PostureAnalyzer.swift` | Analyzer | CVA, SVA, kyphosis, lordosis, NYPR |
| `GaitAnalyzer.swift` | Analyzer | Step detection, cadence, stride length |
| `SessionRecorder.swift` | Service | Recording state machine + frame buffer |
| `MLModelService.swift` | Service | CoreML model lifecycle management |
| `HealthKitService.swift` | Service | Apple Health read/write |
| `InsightsEngine.swift` | Service | Natural-language clinical insights |
| `ExportService.swift` | Service | PDF/CSV export generation |
| `CloudSyncService.swift` | Service | iCloud sync status monitoring |

---

*Generated for the Andernet Posture project. Diagrams are written in [Mermaid](https://mermaid.js.org/) and render natively on GitHub.*
