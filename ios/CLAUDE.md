# CLAUDE.md — VitalSense iOS (Andernet Posture)

## Overview

Native iOS health monitoring app. HealthKit integration, CoreML posture analysis, gait tracking, fall detection, WebSocket bridge to Cloudflare Workers backend.

**Branding**: Always use **VitalSense** in user-facing text.

## Architecture

```
ios/Andernet-Posture/Andernet Posture/  — Main app source
ios/Andernet-Posture/Andernet Posture.xcodeproj/  — Xcode project
ios/Andernet-Posture/Andernet PostureTests/  — Unit tests (XCTest)
ios/Andernet-Posture/Andernet PostureUITests/  — UI tests
ios/Andernet-Posture/MLTraining/  — CoreML training pipelines
ios/HealthKitBridge/  — HealthKit ↔ WebSocket bridge
ios/Sources/VitalSenseCore/  — Shared core library
ios/fastlane/  — Fastlane automation
```

## Patterns

- **Singletons**: `AppConfig.shared`, `HealthKitManager.shared`, `ApiClient.shared` (private inits)
- **SwiftUI preferred** for all new views (UIKit only when SwiftUI is insufficient)
- **Swift Package Manager** for dependencies (`Package.swift`, `Package.resolved`)
- **Data flow**: HealthKit → local processing → WebSocket → Cloudflare Workers
- **Background tasks** for health data sync with proper task management

## Build

- **Xcode 26.2** pinned (`.xcode-version`)
- **Deployment target**: iOS 26.2
- **Team ID**: C8U3P6AJ6L
- **Simulator**: iPhone 17 Pro
- **Configurations**: dev, release, perf, posture

## SwiftLint (Mandatory)

- Config: `ios/Andernet-Posture/.swiftlint.yml`
- **WARNING**: lines >120 chars
- **ERROR** (build-blocking): lines >150 chars
- Strict mode in CI — all warnings are errors
- No `force_unwrapping` — use `if let` / `guard let`
- Files <600 lines, class bodies <800 lines
- Validate: `docker run --rm -v "$(pwd)/ios:/workspace" ghcr.io/realm/swiftlint:latest swiftlint /workspace`

## Critical Rules

1. **Never log raw health data or PII** — health data is sensitive
2. **HealthKit data stays on-device** unless explicitly synced
3. **Honor HealthKit permission checks** — never bypass authorization
4. **Validate data before sending** over WebSocket bridge
5. **HTTPS with certificate pinning** where applicable
6. **Add HealthKit permissions** to `Info.plist` when accessing new data types

## Testing

- Unit tests: `Andernet PostureTests/` (XCTest)
- UI tests: `Andernet PostureUITests/`
- Test plans: `UnitTests.xctestplan`, `SmokeTests.xctestplan`, `FullSuite.xctestplan`, `AccessibilityTests.xctestplan`
- CI: SwiftLint → unit tests → archive

## Key Commands

```bash
# From ios/ directory
make lint          # SwiftLint check
make build         # Build project
make test          # Run unit tests
```
