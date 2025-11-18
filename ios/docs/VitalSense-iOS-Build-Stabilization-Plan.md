# VitalSense iOS Build Stabilization & Deployment Plan

This document captures a concrete, phased plan to make the VitalSense iOS app compile cleanly and deploy reliably to a physical device. It summarizes the current known issues from recent `xcodebuild` output and provides an execution order you (or a future AI session) can follow without relying on prior chat context.

---

## Phase 0 – Baseline & Reproducibility

1. **Capture current build state**
   - Open `ios/VitalSense.xcworkspace` and confirm the active scheme (e.g., `VitalSense`).
   - Run a clean build in Xcode and via terminal:
     - From `ios/`:
       - `xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense -destination 'generic/platform=iOS'`
   - Save the full failing `xcodebuild` output (or reference existing logs in `reports/` and `ios/docs/`) as the baseline.

2. **Create a working notes doc**
   - In `ios/docs/` (or similar), log:
     - Xcode version and iOS SDK version.
     - Active schemes and build configurations used.
     - Link to this plan and baseline build log.

3. **Identify primary build target(s)**
   - In `VitalSense.xcodeproj`:
     - Enumerate iOS app, watch app, widget, and extension targets.
     - Document which targets must ship now (e.g., iOS app + watch app; widgets optional) and any experimental targets that can be temporarily disabled.

**Success Criteria**
- Reproducible, documented failing build with known Xcode/Xcodebuild settings.
- Single source of truth doc listing active targets and failure categories.

---

## Phase 1 – Entry Points & Build Targets

Known issues:
- Multiple `@main` entry points reported in compilation:
  - `@main struct VitalSenseApp: App`.
  - `@main struct VitalSenseWidgetBundle: WidgetBundle`.

1. **Inventory all `@main` declarations**
   - Search under `ios/VitalSense/` and `ios/Sources/` for:
     - `@main`, `App {`, and `WidgetBundle`.
   - Identify at least:
     - `VitalSenseApp` (main iOS app).
     - `VitalSenseWidgetBundle` (widget entry).

2. **Decide target ownership for each `@main`**
   - Confirm:
     - `VitalSenseApp` is only in the main iOS app target.
     - `VitalSenseWidgetBundle` is only in the widget extension target.
   - If any `@main`-annotated type is in multiple targets:
     - Adjust target membership in Xcode (File Inspector) or move files to target-specific groups.

3. **Resolve multiple `@main` errors**
   - For each extra `@main` in the main app target:
     - Either remove `@main` and convert to a regular type used by a different entry point, or
     - Exclude that file from the app target where it shouldn’t act as an entry.
   - Ensure widgets use `@main struct VitalSenseWidgetBundle: WidgetBundle` in the widget target only, and the app uses `@main struct VitalSenseApp: App` in the main app target only.

4. **Validate target membership**
   - For all app and widget roots and their immediate dependencies, verify target membership aligns with intent:
     - Shared code in a shared framework/module.
     - App-only code not visible to widget/watch if not needed.
   - Update Xcode project settings and any `.xcconfig`/schemes as needed.

**Success Criteria**
- No "'main' attribute can only apply to one type" errors.
- Each target has exactly one entry root (`App` for app, `WidgetBundle` for widgets, etc.).

---

## Phase 2 – Core Models & Domain Types De-duplication

Known issues (from `xcodebuild`):
- Duplicate / ambiguous types and invalid redeclarations across core and feature modules, including but not limited to:
  - `HealthMetrics` (e.g., in `EnhancedLiDARMLManager.swift` and `SmartNotificationManager.swift`).
  - `EnvironmentalContext` (multiple definitions: ML, fall-risk, LiDAR posture analyzer).
  - `GaitPrediction`, `FallRiskPrediction`, `GaitFeatures`, `GaitAnalysisData`.
  - `UserProfile`, `UserHealthProfile`.
  - `SensorReading`, `WatchDataBatch`.
  - `AlertType`, `HealthAlert`.
  - `FallRiskLevel`, `RecommendationPriority`, `TrendDirection`.
  - `HeartRatePoint`, `HealthInsight`.
  - `TimeRange`, `HealthStatus`.
  - `SleepData`, `WalkingSession`, etc.

1. **Inventory all model definitions**
   - For each problematic type in the errors, project-wide search for declarations:
     - `struct HealthMetrics`, `struct EnvironmentalContext`, `struct GaitPrediction`, `enum FallRiskLevel`, etc.
   - For each type, document:
     - File path and module/target membership.
     - Whether definitions are identical, supersets, or divergent.

2. **Define a canonical domain model layer**
   - Choose or create a central models location, e.g.:
     - `ios/VitalSense/Core/Models/` or `ios/Sources/Domain/Models/`.
   - For each domain type above:
     - Decide on one canonical definition (properties, semantics, protocol conformances).
     - Note any external dependencies (HealthKit, CoreLocation, ML, etc.).

3. **Merge or remove duplicates**
   - If duplicate definitions are equivalent or near-equivalent:
     - Keep the most complete version in the canonical location.
     - Remove other declarations or convert them into `typealias`es pointing to the canonical type.
   - If definitions are meaningfully different but share a name:
     - Introduce a single canonical type with clear semantics.
     - Add adapter structs or mapping functions at feature boundaries where specialized representations are needed.

4. **Clarify ownership of cross-cutting enums**
   - For enums like `AlertType`, `FallRiskLevel`, `HealthStatus`, `TrendDirection`, `TimeRange`:
     - Move them to a stable shared models file (e.g., `AlertModels.swift`, `RiskModels.swift`, `MetricTimeRange.swift`).
     - Update all feature modules to import and reuse these enums instead of redefining them.

5. **Resolve missing/undeclared core domain types**
   - For types referenced but not defined, e.g.:
     - `InterventionProgram`, `RiskFactorType`, `WalkingStabilityReading`, `BalanceAssessment`, `DailyMobilityTrends`, etc.
   - Infer intended semantics from usage (properties accessed, logic performed, comments).
   - Add minimal but coherent definitions to the canonical models layer.
   - Align naming and structure with the rest of the domain models.

**Success Criteria**
- No `invalid redeclaration` or `is ambiguous for type lookup` errors for domain models.
- All references resolve to a single, canonical definition for each core type.
- No "type not found" errors for integration types mentioned above.

---

## Phase 3 – Shared UI Components Consolidation

Known issues:
- Multiple, conflicting SwiftUI components with identical names, such as:
  - `MetricCard`, `StatusCard`, `CircularProgressView`, `ActionButton`.
  - `RecommendationRow`, `RecommendationDetailCard`.
  - `StatisticCard`, `FilterChip`.
  - `EmptyStateView`, `TrendIndicator`, `PermissionCard`, `AlertCard`.

1. **Inventory all SwiftUI component duplicates**
   - Search for each component name under `ios/VitalSense/` and related UI/feature folders.
   - For each component:
     - List declarations and their locations (dashboard views, gait views, LiDAR features, etc.).
     - Note differences in props and styling.

2. **Establish a shared UI module/folder**
   - Use or create a folder for reusable components, e.g.:
     - `ios/VitalSense/UI/Components/` or `SharedUI/`.
   - Decide which components should be app-wide and which remain feature-local.

3. **Define canonical props and contracts**
   - For each shared component (e.g., `MetricCard`):
     - Specify inputs (e.g., `title: String`, `value: String`, `unit: String?`, `trend: TrendDirection?`).
     - Align styles with the design system (colors, typography from `VitalSenseBrand` / Tailwind-ish theme).
   - Document these briefly in comments or a small UI doc.

4. **Consolidate and refactor duplicates**
   - Choose the best/most complete implementation as the canonical shared component.
   - Move or define the canonical version in the shared UI module.
   - Update all call sites to use the canonical component and adjust parameters as needed.
   - Remove or de-target the other duplicate definitions so only one type with a given name exists.

5. **Widget/watch-safe variants**
   - For widgets and watch components that require simplified UI:
     - Create compact variations (`MetricCardCompact`, `StatusCardCompact`, etc.) in the shared UI module.
   - Ensure they use only APIs allowed in WidgetKit / watchOS environments.

**Success Criteria**
- No duplicate or ambiguous SwiftUI view type errors.
- Shared components live in a single, well-defined location and are reused across screens.
- Widgets and watch views compile using appropriate, environment-safe components.

---

## Phase 4 – Core Managers & SwiftUI Responsibility Separation

Known issues:
- Non-UI managers containing SwiftUI views or property wrappers, e.g.:
  - `OfflineSupportManager.swift` defining `OfflineIndicatorView` and using `@StateObject`.

1. **Identify non-UI files with SwiftUI leakage**
   - Search for `import SwiftUI`, `@State`, `@StateObject`, `View`, `ViewModifier` in core manager folders, e.g. `Core/Managers/`.
   - List files where SwiftUI appears in non-UI layers (`OfflineSupportManager`, etc.).

2. **Define separation guidelines**
   - Core managers/services:
     - Should handle data, networking, analytics, and state.
     - May use `ObservableObject` and `@Published` but must not define views.
   - SwiftUI view layers:
     - Use `@StateObject`, `@ObservedObject`, environment objects, and own the rendering logic.

3. **Extract UI to dedicated view files**
   - For each offending case:
     - Move `View` definitions (e.g., `OfflineIndicatorView`) into `UI/Views/` or `UI/Components/`.
     - Keep the manager exposing only state and APIs consumed by those views.
   - Inject managers into views via `@StateObject`, `@EnvironmentObject`, or initializers.

4. **Clean up imports and dependencies**
   - Remove `import SwiftUI` from core manager files where no views remain.
   - Resolve any circular references introduced by moving views out.

**Success Criteria**
- Manager files contain no SwiftUI views or `@State*` wrappers.
- UI layers reference managers via their published state and APIs.
- Related compile-time errors about `View` or `@StateObject` in core files are resolved.

---

## Phase 5 – Watch & Widget Integration and Missing Types

Known issues:
- Missing/undeclared types for integration features:
  - `Logger` (used e.g. in `EnhancedLiDARMLManager` but not imported or defined).
  - `WatchLiDARIntegrationManager` (referenced in `EnhancedLiDARIntegrationConfig`).
  - Widget-related `WidgetPreferences`, `WidgetHealthManager` (in `WidgetConfigurationView`).
  - ML/streaming payload models such as `RealtimeGaitDataPayload`.

1. **Inventory missing integration symbols**
   - From latest `xcodebuild` output, list all "cannot find type in scope" or "use of unresolved identifier" errors for integration types.
   - For each symbol, note where it is used and what responsibilities it seems to have.

2. **Standardize logging**
   - Decide on the logging approach:
     - Use Apple’s `os.Logger` (add `import os` and create a thin wrapper), or
     - Use an existing `Log` utility in `Core/Logging/Log.swift` and adapt call sites.
   - For cases like `private let logger = Logger(subsystem: "com.vitalsense.ml", category: "EnhancedLiDARML")`:
     - Add `import os` and ensure `Logger` is in scope, or
     - Replace with a project-wide `Log` wrapper with similar semantics.

3. **Define watch integration managers**
   - Implement or stub `WatchLiDARIntegrationManager` based on its usage in `EnhancedLiDARIntegrationConfig`:
     - Likely responsible for sending/receiving LiDAR and gait updates between phone and watch.
     - Provide minimal methods used by call sites (e.g. `startSession`, `sendUpdate(_)`, etc.).
   - Place this manager in a shared module accessible to both iOS and watch targets.

4. **Widget models and preferences**
   - Implement `WidgetPreferences` and `WidgetHealthManager` in a widget-safe module:
     - `WidgetPreferences`: persist user widget settings (selected metrics, privacy level, etc.).
     - `WidgetHealthManager`: expose summary data for use by TimelineProviders.
   - Ensure no unsupported APIs (no live HealthKit queries directly in the widget timeline methods).

5. **ML & analytics payloads**
   - Define `RealtimeGaitDataPayload` and similar streaming payloads at the domain/ML boundary:
     - Include sensor samples, derived metrics, timestamps, session IDs.
   - Use these types consistently in:
     - WebSocket integration.
     - Watch connectivity.
     - ML pipelines.

**Success Criteria**
- No unresolved symbol errors for integration-related types.
- Logging calls resolve consistently across all targets.
- Watch and widget code compile with minimal, coherent integration managers.

---

## Phase 6 – ML, Analytics Types & Fall-Risk / Gait Harmonization

Known issues:
- Ambiguous or duplicated ML and gait/fall-risk types:
  - `GaitPrediction`, `FallRiskPrediction`, `GaitFeatures`, `GaitAnalysisData`.
  - `HealthPredictions`, `HealthInsight` duplicated between ML and iOS 26 feature files.
  - `TrendDirection`, `RecommendationPriority` defined both in ML types and fall-risk manager.
- Protocol conformance issues for `VitalSenseMLModel` and related model wrappers.

1. **Centralize the ML model protocol**
   - Locate definition of `VitalSenseMLModel` and all conforming types (e.g. `FallRiskPredictionModel`).
   - Define the protocol in a single module (e.g., `Features/MachineLearning/`):
     - Associated types: `InputType`, `OutputType`.
     - Async inference method signature, e.g., `func predict(input: InputType) async throws -> OutputType`.

2. **Canonical gait and fall-risk models**
   - For `GaitFeatures`, `GaitAnalysisData`, `GaitPrediction`, `FallRiskPrediction`:
     - Keep one canonical definition in the ML or domain models layer.
   - Remove or alias duplicate definitions in feature or iOS 26-specific files.

3. **Harmonize fall-risk enums and mappings**
   - Ensure `FallRiskLevel` is defined once and used by:
     - ML outputs.
     - Fall-risk views.
     - Notifications and analytics.
   - Add helper functions:
     - Score → `FallRiskLevel`.
     - `FallRiskLevel` → display color and text.

4. **Fix ML protocol conformances**
   - Update all ML model wrapper classes to conform to `VitalSenseMLModel`:
     - Ensure `InputType` and `OutputType` line up with canonical types.
     - Fix generic constraints and any `retrain`/`confidence` helper methods.

**Success Criteria**
- All ML-related types compile without ambiguity.
- Only one definition of each ML domain type is used across app, watch, and widgets.
- `VitalSenseMLModel` conformances compile successfully.

---

## Phase 7 – HealthKit, iOS 26 Availability & Platform Guards

Known issues:
- HealthKit identifiers and APIs:
  - `HKCategoryTypeIdentifier.basalBodyTemperature` (no member reported in current SDK).
  - `HKLiveWorkoutBuilder` used without availability guards.
- Delegate/availability issues:
  - `WalkingSessionTracker` and related HealthKit workout builder delegate methods flagged as only available from iOS 26.

1. **Inventory HealthKit usage**
   - Search for `HKLiveWorkoutBuilder`, specific `HKQuantityTypeIdentifier`s, and `HKCategoryType` uses in:
     - `HealthKitManager`, `AdvancedHealthMetrics.swift`, `WalkingSessionTracker`, etc.

2. **Fix identifiers and APIs**
   - Validate each identifier against current SDK:
     - Replace invalid/removed identifiers with current equivalents, or remove if not needed.
     - Avoid force-unwraps (`!`) on types that may be unavailable; use `if let` or availability checks.

3. **Add availability annotations & runtime guards**
   - Annotate types and methods that rely on newer APIs with `@available(iOS X, *)`.
   - Wrap usage in `if #available(iOS X, *) { ... }` blocks.
   - Provide safe fallbacks (no-ops or reduced functionality) for earlier OS versions.

4. **Delegate conformances**
   - Ensure `WalkingSessionTracker` and other delegates correctly implement:
     - `HKLiveWorkoutBuilderDelegate` methods.
     - `CLLocationManagerDelegate` methods.
   - Add `@MainActor` annotations where needed to satisfy concurrency rules.

**Success Criteria**
- No HealthKit-related compile errors regarding identifiers or availability.
- Delegates compile cleanly and are availability-safe.
- App runs on the minimum supported iOS version without unguarded API crashes.

---

## Phase 8 – WCSession, WidgetKit & Other Protocol Conformances

Known issues:
- `AppleWatchGaitMonitor: WCSessionDelegate` missing required methods (`sessionDidBecomeInactive`, `sessionDidDeactivate`).
- WidgetKit provider and entry types:
  - `LegacyEntry` and `LegacyProvider` not fully conforming to `TimelineEntry`/`TimelineProvider`.

1. **WCSessionDelegate cleanup**
   - Find all `WCSessionDelegate` conformances (e.g., `AppleWatchGaitMonitor`).
   - Implement all required methods with correct signatures.
   - Ensure only one effective delegate instance is set on `WCSession.default`.

2. **WidgetKit protocols**
   - In `VitalSense/UI/Components/VitalSenseWidget.swift` and `VitalSenseWidgets/VitalSenseHealthWidget.swift`:
     - Ensure the `Entry` type (e.g., `LegacyEntry`) conforms to `TimelineEntry` by including `var date: Date`.
     - Implement all required provider methods:
       - `placeholder(in:)`, `getSnapshot(in:completion:)`, `getTimeline(in:completion:)`.
   - Apply `@MainActor` to providers as suggested by warnings for Swift 6.

3. **Other delegates**
   - Validate conformance for:
     - `UNUserNotificationCenterDelegate` in `SmartNotificationManager`.
     - `CLLocationManagerDelegate` in `EmergencyResponseSystem` and `WalkingSessionTracker`.
   - Add `@MainActor` or `@preconcurrency` where required by newer Swift concurrency rules.

**Success Criteria**
- No protocol conformance errors (missing methods or incompatible signatures).
- Widget and watch integration builds successfully.

---

## Phase 9 – Final Build, Signing & On-Device Deployment

1. **Clean build for all targets**
   - From `ios/`:
     - In Xcode, perform Product → Clean Build Folder.
     - Then run via terminal:
       - `xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense -destination 'generic/platform=iOS' clean build`
   - Optionally build watch and widget schemes separately to verify their statuses.

2. **Resolve remaining build/link issues**
   - Fix missing frameworks, duplicate symbols, or misconfigured build settings.
   - Ensure Swift concurrency, SwiftUI, HealthKit, and WidgetKit frameworks are linked where needed.

3. **Configure signing and capabilities**
   - In Xcode for the main app target:
     - Set the correct team, bundle identifier, and provisioning profiles.
     - Ensure entitlements and capabilities align (HealthKit, Background Modes, Watch Connectivity, Widgets, etc.).
   - Do the same for watch app and widget targets if they will be deployed.

4. **Deploy to a physical device**
   - Connect an iOS device (e.g., "Matt's iPhone") running a supported iOS version.
   - Select the device as the run destination and run the `VitalSense` scheme.
   - Verify that the app installs, launches, and gets through initial onboarding without crashing.

5. **Smoke test core flows**
   - On-device, verify:
     - Main dashboard, gait analysis, metrics, and settings screens render correctly.
     - HealthKit permissions flow works and handles denial gracefully.
     - Watch and widget integrations don’t cause runtime failures (even if feature-complete behavior is deferred).

**Success Criteria**
- Main iOS app builds with no compile or link errors.
- App successfully deploys and runs on a physical device.
- No immediate runtime crashes from previously-known problem areas.

---

## Next Phases – VitalSense iOS Build Stabilization (Checklist)

1. **Reconfirm current failure clusters from latest `xcodebuild`**
   - [ ] From `ios/`, run `xcodebuild -workspace VitalSense.xcworkspace -scheme VitalSense -destination 'generic/platform=iOS'`.
   - [ ] Categorize the first 50–100 errors into:
     - Model redeclarations / ambiguity.
     - Unresolved domain types (watch/widget/ML/fall-risk/gait).
     - Logging / `Logger` imports.
     - Entry-point / availability issues.

2. **Centralize core models under `Core/Models` and remove duplicates**
   - [ ] Treat `VitalSense/Core/Models` as canonical for shared domain types (including `HealthData` and `HealthKitError`).
   - [ ] For each frequently duplicated type (e.g. `HealthMetrics`, `EnvironmentalContext`, `UserProfile`, `AlertType`, `HealthAlert`, `FallRiskLevel`, `RecommendationPriority`, `TrendDirection`, `HeartRatePoint`, `HealthInsight`, `TimeRange`, `SleepData`, `WalkingSession`):
     - [ ] Search for all declarations and usages across the project.
     - [ ] Choose a canonical definition under `Core/Models` (possibly new files like `HealthMetrics.swift`, `EnvironmentalContext.swift`, `UserProfile.swift`, `Alerts.swift`, `RiskModels.swift`, `Trends.swift`).
     - [ ] Remove duplicate definitions from feature/ML/LiDAR/fall-risk files (e.g. `EnhancedLiDARMLManager.swift`, `SmartNotificationManager.swift`, gait/fall-risk managers) and switch them to import/use the canonical types.
     - [ ] Where semantics differ, rename feature-local variants (e.g. `EnvironmentalContextSnapshot`) and adapt call sites, instead of overloading a single type name.

3. **Define missing cross-cutting domain types in `Core/Models`**
   - [ ] From current build errors, list all unresolved domain types (examples: `InterventionProgram`, `RiskFactorType`, `WalkingStabilityReading`, `BalanceAssessment`, `DailyMobilityTrends`, `RealtimeGaitDataPayload`).
   - [ ] For each type:
     - [ ] Inspect all usages to infer the minimal properties actually required.
     - [ ] Introduce lean definitions under `Core/Models` (e.g. `FallRiskModels.swift`, `GaitModels.swift`, `Interventions.swift`, `StreamingPayloads.swift`).
     - [ ] Remove any ad-hoc or partial definitions from feature files and point them to the canonical versions.

4. **Normalize logging across managers and features**
   - [ ] Decide on a primary logging abstraction:
     - Either direct `os.Logger` everywhere, or a `Log` wrapper backed by `os.Logger`.
   - [ ] In a shared logging file (e.g. `Core/Logging/Logging.swift`):
     - [ ] Centralize logger instances and helper functions (e.g. `Log.info(_:, category:)`, `Log.error(_:, category:)`).
   - [ ] Update files that currently reference `Logger` or custom logging (e.g. `EnhancedLiDARMLManager.swift`, `SmartNotificationManager.swift`, connectivity/ML managers) to:
     - [ ] Import the right module (`import os` / `import OSLog`).
     - [ ] Use the shared logging API consistently.
   - [ ] Rebuild to confirm all unresolved `Logger`/logging symbol errors are gone.

5. **Add minimal stubs for watch-only types referenced by the main app**
   - [ ] From the build log, identify unresolved watch-side types (e.g. `WatchLiDARIntegrationManager`, watch connectivity helpers) that the iOS app references.
   - [ ] For each such type:
     - [ ] Decide whether it should be excluded from the iOS app target or stubbed.
     - [ ] If required by iOS code, add a minimal stub in a shared folder (e.g. `Core/Watch/WatchLiDARIntegrationManager.swift`) that defines the initializers and methods actually used, with safe no-op implementations.
     - [ ] Guard any WatchConnectivity-specific code with `#if canImport(WatchConnectivity)` and availability where needed.

6. **Add minimal stubs for widget-only types referenced by the app**
   - [ ] Identify unresolved widget-related types (e.g. `WidgetPreferences`, `WidgetHealthManager`) used by configuration views or dashboards.
   - [ ] Introduce simple stub implementations in `Core/Widgets` (e.g. `WidgetPreferences.swift`, `WidgetHealthManager.swift`) that:
     - [ ] Provide the properties/methods required by callers.
     - [ ] Use in-memory or `UserDefaults`-based storage as appropriate.
   - [ ] Guard any WidgetKit-specific APIs with `#if canImport(WidgetKit)` and appropriate `@available` attributes so the main app build is not broken.

7. **Clean up `@main` entry points and target membership**
   - [ ] Search for all `@main` usages (e.g. `VitalSenseApp`, `VitalSenseWidgetBundle`, watch app main).
   - [ ] Ensure:
     - [ ] `VitalSenseApp` is the only `@main` type in the main app target.
     - [ ] `VitalSenseWidgetBundle` is only included in the widget extension target (or converted from `@main` to a plain `WidgetBundle` if necessary).
     - [ ] Any demo or sample `@main` types are not part of the main `VitalSense` target.

8. **Audit and fix iOS 26 availability for `HKLiveWorkoutBuilder` and related HealthKit APIs**
   - [ ] Search for `HKLiveWorkoutBuilder` / `HKLiveWorkoutBuilderDelegate` (e.g. in `WalkingSessionTracker.swift`).
   - [ ] For each usage:
     - [ ] Add `@available(iOS 26, *)` to types or methods that depend on these APIs.
     - [ ] Wrap calls in `if #available(iOS 26, *) { ... }` and provide safe fallbacks for earlier iOS versions.
     - [ ] Implement all required delegate methods within these availability-guarded scopes.

9. **Resolve remaining ML/fall-risk/gait model clusters after centralization**
   - [ ] After the above steps, rerun the build and collect any remaining unresolved-type or redeclaration errors related to ML/gait/fall-risk models (e.g. `GaitPrediction`, `FallRiskPrediction`, `GaitFeatures`, `GaitAnalysisData`).
   - [ ] Centralize these under a dedicated models file (e.g. `Core/Models/MLModels.swift` or `Features/MachineLearning/Models/*`).
   - [ ] Ensure a single `VitalSenseMLModel` protocol and adjust all conforming model wrappers to match the canonical signature.

10. **Short iteration loop: Build, triage, and update docs**
    - [ ] After each cluster of changes above, run the `xcodebuild` command again.
    - [ ] Update this stabilization plan and `docs/FIXES_SUMMARY.md` to mark newly completed items and to capture any new error patterns that surface.
