---
description: "Use when working on iOS Swift code, HealthKit integration, SwiftUI views, CoreML models, WebSocket bridge, or the Andernet Posture app."
applyTo: "ios/**/*.swift"
---

# iOS / Swift Guidelines — VitalSense

## Architecture
- Singleton pattern: `AppConfig.shared`, `HealthKitManager.shared`, `ApiClient.shared`.
- HealthKit permissions declared in `Info.plist`.
- WebSocket bridge in `ios/HealthKitBridge/` connects iOS ↔ Workers.
- CoreML models in `ios/Andernet-Posture/MLTraining/`.

## Code Style
- SwiftLint enforced (strict mode in CI).
- Line lengths: WARNING >120 chars, ERROR >150 chars.
- Config: `ios/Andernet-Posture/.swiftlint.yml`.
- SwiftUI preferred for new views.

## Data Flow
- HealthKit → local processing → WebSocket → Cloudflare Workers.
- Background task management for data sync.
- Zod-equivalent validation on the Swift side before sending to server.

## Testing
- Unit tests: `Andernet PostureTests/` (XCTest framework).
- UI tests: `Andernet PostureUITests/`.
- CI: SwiftLint lint → unit tests (iPhone 16 Pro simulator) → archive.

## Build
- Xcode 26.2 pinned (`.xcode-version`).
- Swift Package Manager for dependencies (`Package.swift`, `Package.resolved`).
- Fastlane for automation (`ios/fastlane/`).
- Targets: dev, release, perf, posture build configurations.

## Security
- Never log raw health data or PII.
- HealthKit data stays on-device unless explicitly synced.
- All network calls use HTTPS with certificate pinning where applicable.
