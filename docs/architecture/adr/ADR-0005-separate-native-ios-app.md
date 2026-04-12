# ADR-0005: Separate Native iOS App

## Status
Accepted

## Date
2025-05-01

## Context
VitalSense needs access to Apple Health data (HealthKit), device motion sensors (CoreMotion), LiDAR depth data, and CoreML for on-device posture analysis. Options:
- React Native / Expo with HealthKit bridge
- Progressive Web App (PWA) with limited sensor access
- Native Swift/SwiftUI iOS app with WebSocket bridge to web backend

## Decision
Build a **native iOS app** (Swift/SwiftUI) that communicates with the Cloudflare Workers backend via a WebSocket bridge layer.

### Architecture
```
iOS App (HealthKit, CoreML, Sensors)
  └── WebSocket Bridge (HealthKitBridge/)
       └── Cloudflare Worker (HealthWebSocket DO)
            └── React Web Dashboard
```

### Key Reasons
1. **HealthKit access**: Only native apps can read/write HealthKit data. No cross-platform framework provides full HealthKit API coverage.
2. **On-device ML**: CoreML runs posture and gait analysis models on the Neural Engine. Data never leaves the device unless explicitly synced — critical for health data privacy.
3. **Sensor fidelity**: CoreMotion provides 100Hz accelerometer/gyroscope data. React Native bridges add latency and sampling artifacts that degrade gait analysis accuracy.
4. **Background processing**: Native background task APIs (BGTaskScheduler) enable reliable health data sync. PWAs and RN have limited background execution.
5. **App Store distribution**: Native app can leverage HealthKit-based App Store features (Health Records, Health app integration).

### Data Flow
- HealthKit data stays on-device by default
- User explicitly triggers sync → iOS app sends processed metrics (not raw data) over WebSocket
- Backend stores aggregate scores in KV, never raw health records
- Web dashboard receives real-time updates via the same WebSocket DO

## Consequences
- **Two codebases**: Web (React/TypeScript) and iOS (Swift/SwiftUI) require separate development workflows, CI pipelines, and expertise.
- **Config sync burden**: Health analysis thresholds (gait, fall risk) must stay in sync between `src/lib/` and `ios/`. Mitigated by `pnpm gait:sync` and `pnpm fallrisk:sync` scripts.
- **iOS-only mobile**: Android users cannot access native health features. Web dashboard provides read-only access.
- **Release cadence**: iOS releases go through App Store review (~24-48h). Web deploys are instant via Workers.

## Alternatives Rejected
- **React Native**: HealthKit bridges are incomplete and poorly maintained. CoreML integration requires native modules anyway, negating RN's benefit.
- **PWA**: No HealthKit access. Web Sensor APIs lack the fidelity needed for medical-grade gait analysis.
- **Flutter**: Better cross-platform than RN, but HealthKit plugin ecosystem is immature. Would still need native modules for CoreML.
