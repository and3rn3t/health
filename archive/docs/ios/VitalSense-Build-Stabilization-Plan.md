# VitalSense iOS Build Stabilization & Refactor Plan

_Last updated: 2025-11-18_

This document captures the strategy to restore the `VitalSense` iOS target to a clean, reproducible build suitable for deployment to physical devices (e.g., **Matt's iPhone**), while progressively refactoring duplicate/ambiguous types and tightening HealthKit, WidgetKit, and concurrency boundaries.

---

## High-Level Phases

1. Phase 0: Triage & Guardrails
2. Phase 1: Canonical Core Models (Health, Gait, User, Alerts)
3. Phase 2: Fall-Risk Domain Unification
4. Phase 3: Gait / LiDAR / ML Feature Alignment
5. Phase 4: Shared Infrastructure Types (Heartbeat, Flags, Watch Batches, Interventions)
6. Phase 5: SwiftUI View & Widget Component Consolidation
7. Phase 6: WidgetKit Providers & Entrypoints
8. Phase 7: HealthKit & WalkingSession Availability Fixes
9. Phase 8: WebSocket & Misc Helper Redeclarations
10. Phase 9: Concurrency & Actor Isolation Cleanup

Each phase is designed to be small enough that the app can be re-built between phases, so regressions are detected early.

---

## Phase 0: Triage & Guardrails

**Goal:** Understand duplicate/missing types and ensure we do not fight Xcode’s build system.

- Run a full clean build (iphoneos or simulator) and capture logs in `reports/`.
- Identify clusters of errors:
  - Duplicate type definitions (e.g., `HealthMetrics`, `EnvironmentalContext`, `UserProfile`, `GaitPrediction`, `FallRiskPrediction`, `SensorReading`, `EmergencyAlert`, `GaitAssessment`, `FallRiskLevel`, `RecommendationPriority`, `TrendDirection`, `HealthInsight`, `HeartRatePoint`, `SleepData`).
  - Missing infrastructural types (`HeartbeatScheduling`, `WebSocketFeatureFlags`, `WatchDataBatch`, `InterventionProgram`, `RiskFactorType`, widget managers, etc.).
  - SwiftUI/WidgetKit duplication and protocol conformance issues.
  - HealthKit availability mismatches (unsupported identifiers, iOS-26-only APIs).
  - Actor isolation warnings that will become Swift 6 errors.
- Decide target OS floor and Swift version expectations based on the Xcode project settings.

---

## Phase 1: Canonical Core Models (Health, Gait, User, Alerts)

**Goal:** Choose and enforce a single source of truth for cross-cutting domain models.

- Designate canonical homes:
  - `Core/Models/HealthData.swift`: core health metrics and insights (`HealthMetric`, `HealthInsight`, `TrendDirection`, etc.).
  - `Core/Models/GaitAnalysisModels.swift`: gait and generic fall-risk models (`GaitMetrics`, `GaitAssessment`, `BalanceMetrics`, `SensorReading`, etc.).
  - `Core/Models/UserModels.swift`: user-related models (`UserProfile`, possibly `RiskFactorType`).
  - `Core/Models/AlertModels.swift`: emergency and health alerts (`EmergencyAlert`, `AlertType`, severities).
- Update feature files to import/reuse these models and remove local duplicates.
- Where semantics differ, introduce feature-specific wrappers or typealiases rather than redefining the same names.

Checkpoint: Rebuild and verify a reduction in duplicate-type and ambiguity errors for core domain models.

---

## Phase 2: Fall-Risk Domain Unification

**Goal:** Single, shared fall-risk domain for all features (fall-risk dashboards, gait dashboards, ML, watch).

- Canonicalize `FallRiskLevel`, `FallRiskAssessment`, `FallRiskRecommendation`, `RecommendationPriority` in a single core location (either `GaitAnalysisModels.swift` or a dedicated fall-risk models file).
- Update fall-risk feature files (`Features/FallRisk/**`) and gait dashboards (`Features/GaitAnalysis/**`, watch views) to use core types.
- Remove/rename duplicate enums/structs so each type name exists once per module.

Checkpoint: Rebuild. Fall-risk type duplication and ambiguity should be largely resolved.

---

## Phase 3: Gait / LiDAR / ML Feature Alignment

**Goal:** Ensure all gait/LiDAR/ML features use the same gait and risk models.

- Confirm canonical gait types in `GaitAnalysisModels.swift`.
- Update `Features/GaitAnalysis/**` to use those models consistently.
- Align LiDAR gait files (`Features/LiDAR/Gait/**`) and ML types (`Features/MachineLearning/MLHealthDataTypes.swift`, `MLModelImplementations.swift`, `VitalSenseMLHealthAnalyzer.swift`) to core domain models.

Checkpoint: Rebuild; gait-related and ML-related type conflicts should be mostly gone.

---

## Phase 4: Shared Infrastructure Types

**Goal:** Define missing infrastructural types in a small, shared surface.

- Add `Core/Models/InfrastructureModels.swift` for:
  - `HeartbeatScheduling` and `DefaultHeartbeatScheduler` (WebSocket heartbeats).
  - `WebSocketFeatureFlags` (feature toggles for streaming, LiDAR, widgets).
  - `WatchDataBatch` (payload for watch connectivity).
  - Additional infra types like `InterventionProgram`, `RiskFactorType` as needed.
- Update:
  - `Core/Managers/WebSocketManager*.swift` to use these types.
  - `Core/Managers/WatchConnectivityManager.swift` and related message types.
  - Fall-risk and ML engines to use shared `InterventionProgram`/`RiskFactorType`.

Checkpoint: Rebuild. Missing-type errors should drop sharply.

---

## Phase 5: SwiftUI View & Widget Component Consolidation

**Goal:** Ensure there is exactly one source-of-truth for shared SwiftUI components.

- Choose canonical homes in `UI/Components/**` (e.g., `ModernDesignSystem.swift`, `EnhancedUIComponents.swift`).
- For each shared component name (`MetricCard`, `StatusCard`, `ActionButton`, `PermissionCard`, `EmptyStateView`, `CircularProgressView`, `RecommendationRow`, `RecommendationDetailCard`, `TrendIndicator`):
  - Keep one canonical definition.
  - Rename or delete feature-specific duplicates.
- Make sure `ContentView`, `HealthMetricsView`, `GaitAnalysisView` are not duplicated across the module; keep the app-shell versions as canonical.

Checkpoint: Rebuild with focus on SwiftUI errors. Most should now be limited to protocol conformance warnings.

---

## Phase 6: WidgetKit Providers & Entrypoints

**Goal:** Normalize widget providers and ensure correct `@main` usage.

- Ensure `@main` appears only:
  - Once for the main app in `VitalSenseApp.swift`.
  - Once for each widget bundle in the **widget extension target**, not in the app target.
- For widget providers (`LegacyProvider`, `HealthProvider`, etc.):
  - Ensure they conform to `TimelineProvider`/`TimelineEntry` correctly.
  - Use shared health/gait models where appropriate.

Checkpoint: Build both application and widget schemes.

---

## Phase 7: HealthKit & WalkingSession Availability Fixes

**Goal:** Match HealthKit usage to the deployed iOS SDK and guard newer APIs.

- Remove or guard unsupported identifiers (e.g. `HKCategoryTypeIdentifier.basalBodyTemperature`).
- Guard iOS 26-only APIs (`HKLiveWorkoutBuilder`, iOS 26 enhancements) with `@available` annotations and runtime checks.
- Provide safe fallbacks or no-op implementations for earlier OS versions.

Checkpoint: Rebuild; HealthKit-related errors should disappear.

---

## Phase 8: WebSocket & Misc Helper Redeclarations

**Goal:** Clean up remaining helper redeclarations and minor structural issues.

- Consolidate WebSocket helpers like `sendJSON` into a single implementation.
- Deduplicate generic helpers (`formatDate`, `deleteNotifications`) into a shared util, or keep a single implementation per feature.

Checkpoint: Rebuild. Remaining errors should be mostly concurrency/actor isolation.

---

## Phase 9: Concurrency & Actor Isolation Cleanup

**Goal:** Address Swift 6 concurrency warnings and make actor isolation explicit.

- Mark UI-facing managers and view models as `@MainActor` where appropriate.
- Add `Sendable`/`@unchecked Sendable` conformances for value-like types passed across actors.
- Adjust protocol conformances (e.g., delegates, `TimelineProvider`) for actor isolation, using `@preconcurrency` where needed.

Final checkpoint: Clean Release build for `VitalSense` on `iphoneos` and successful deployment to a physical device (Matt’s iPhone).

---

## Operational Checkpoints

At the end of each phase:

- Run `xcodebuild` for the `VitalSense` scheme.
- Capture logs under `reports/ios-build-<phase>.log`.
- Ensure error count moves monotonically downward.

Once the app builds cleanly:

- Open `VitalSense.xcworkspace`.
- Select device `Matt's iPhone` as run destination.
- Run the `VitalSense` scheme and confirm on-device launch.

This document should be updated as we make structural changes, record decisions (e.g., canonical type locations), and add notes for future maintainers.
