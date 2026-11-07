# VitalSense iOS (Andernet Posture)

Native iOS app for VitalSense: HealthKit integration, CoreML posture analysis,
gait tracking, fall detection, and a WebSocket bridge to the Cloudflare Workers
backend.

## Quick Start

Requires a Mac with Xcode 26.2 (see `.xcode-version`).

```bash
open "ios/Andernet-Posture/Andernet Posture.xcodeproj"

# From ios/
make lint     # SwiftLint check
make build    # Build project
make test     # Run unit tests
```

## Layout

```
Andernet-Posture/Andernet Posture/         Main app source
Andernet-Posture/Andernet Posture.xcodeproj/
Andernet-Posture/Andernet PostureTests/    Unit tests (XCTest)
Andernet-Posture/Andernet PostureUITests/  UI tests
Andernet-Posture/MLTraining/               CoreML training pipelines
HealthKitBridge/                           HealthKit ↔ WebSocket bridge
Sources/VitalSenseCore/                    Shared core library
fastlane/                                  Release automation
scripts/, tools/                           Build and maintenance helpers
```

## Documentation

- [CLAUDE.md](CLAUDE.md) — architecture, patterns, build settings, SwiftLint rules
- [docs/INDEX.md](docs/INDEX.md) — guides (model training, analytics, crash reporting, App Store assets)
- [Andernet-Posture/docs/](Andernet-Posture/docs/) — app architecture, API, testing, onboarding
