# Immediate Xcode Action List (NOW_TASKS)

Purpose: Fast, minimal pass of items that MUST be done now in Xcode (or strongly recommended) before deeper polish. Refer to XCODE_FINALIZATION_CHECKLIST.md for full context.

Assumptions: No new capabilities beyond HealthKit + App Groups + Watch workout-processing. No pending localization delivery this week.

---
## 1. Preflight Script
[ ] Run: `./scripts/preflight-xcode-finalization.sh`  (resolve any red/yellow output first)

## 2. Signing & Capabilities
[ ] Open workspace (VitalSense.xcworkspace)
[ ] For each target (iOS App, Watch App/Extension, Widget, Unit/UI Tests): Set Team, clear signing warnings
[ ] Confirm bundle IDs (no placeholder strings)
[ ] Enable ONLY:
    - iOS App: HealthKit, App Groups
    - Watch: HealthKit, App Groups, Background Modes → workout-processing
    - Widget: App Groups
[ ] Remove any accidental capabilities
[ ] Build once to regenerate entitlements

## 3. Assets & Visual Previews
[ ] Asset catalogs: No missing icon slots / warnings (iOS + Watch + Widget)
[ ] Open SwiftUI previews: dashboard, gait session, permissions, widget
[ ] Check: Light/Dark, Large Dynamic Type, accessibility sizes
[ ] Widget preview: No clipping, correct tint

## 4. Build Settings Quick Sanity (App + Widget)
[ ] Debug: Optimization = None
[ ] Release: Optimization = Speed / Whole Module
[ ] Dead code stripping enabled in Release
[ ] No stray `-ObjC` or legacy linker flags
[ ] Swift version consistent across targets
[ ] Script phases before Compile Sources; resource copy after

## 5. Runtime Inspection
[ ] Run app, start mock/short gait session
[ ] View Hierarchy Debugger: Layout & accessibility grouping sane
[ ] Memory Graph Debugger: No obvious retain cycles (managers, delegates)

## 6. Performance Baseline
[ ] Instruments → Time Profiler (2–3 min session) capture screenshot of top self time frames
[ ] Instruments → (optionally Leaks) zero persistent leaks
[ ] Live Diagnostics gauges: CPU & Memory stable

## 7. Tests & Coverage (Recommended)
[ ] Run Unit Tests in Xcode (green)
[ ] (Optional) Create simple Test Plan enabling code coverage
[ ] Inspect per-line coverage for any newly added critical modules

## 8. Safety & Tag
[ ] If any pbxproj merge recently resolved: Clean build succeeds
[ ] Entitlements diff check (App vs Watch vs Widget) matches capabilities
[ ] Git tag baseline (e.g. `v0.1.0-baseline-xcode`) once all above pass

## 9. Defer (Not Needed Now)
- Formal Release archive & submission
- Localization export/import (unless translators waiting)
- Extended Instruments (Energy, Allocations) unless an issue suspected
- Crash symbolication (do after first TestFlight crash or sample log)
- Macro / Core Data / ML previews (not in use)

---
## Fast Execution Order (TL;DR)
1. Preflight script
2. Signing + Capabilities
3. Build & Assets check
4. Previews (UI states)
5. Debug session → View Hierarchy + Memory Graph
6. Instruments Time Profiler baseline
7. Tests + (optional) coverage
8. Entitlement sanity + tag

---
## Evidence to Capture (Drop in /ProjectInfo/baselines/ if desired)
- Screenshot: Time Profiler top 10
- Screenshot: Memory Graph (no leaks/retain cycles of concern)
- Coverage summary (if generated)

---
Completion Gate: All checkboxes in sections 1–8 checked with no new warnings in Xcode Issue Navigator.
