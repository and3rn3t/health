# VitalSense Watch Remote App – Initial Implementation & Roadmap

Date: 2025-09-19

This document summarizes the first implementation pass of the Apple Watch companion app acting as a lightweight real‑time remote for the iPhone’s gait + fall risk analysis pipeline and outlines next steps to mature it.

## ✅ Implemented in this pass

1. Core message schema (bi‑directional) via `WatchConnectivity`:
   - Requests: `requestLiveStatus`, `startMonitoring`, `stopMonitoring`, `triggerFallRiskAssessment`, `performBalanceTest` (placeholder), `acknowledgeAlert`, `sendQuickEvent`.
   - Responses/streams: `liveStatusUpdate`, `fallRiskSummary`, `balanceTestProgress`, `balanceTestResult`, `alert`.
2. Shared, Codable envelope + payload types (`WatchMessageEnvelope`, `LiveStatusPayload`, etc.).
3. iPhone side manager (`WatchConnectivityManager`) that:
   - Activates `WCSession`, sends periodic (15s) live status snapshots.
   - Handles on‑demand commands (assessment trigger, start/stop monitoring placeholders).
   - Summarizes latest fall risk results to watch.
4. Watch side manager (`WatchAppConnectivityManager`) + reactive dashboard view (`RemoteControlDashboard`).
5. UI on watch:
   - Status panel (risk level, connection status, gait placeholders).
   - Remote control buttons (Refresh, Assess, Start, Stop).
   - Fall risk summary + modal detail sheet (factors + recommendations).
6. Structural refactor of the watch app root to include new “Remote” tab and placeholder screens for future gait + settings views.

## 🔧 Integration gaps / TODOs

| Area | Gap | Planned Action |
|------|-----|----------------|
| Gait live metrics | Placeholders (nil) in `LiveStatusPayload` | Expose a lightweight gait metrics provider or reuse existing (missing) manager once added to Core; publish Combine publisher for latest snapshot. |
| Start/Stop monitoring | FallRiskAssessmentManager lacks explicit continuous monitoring control | Introduce a `MonitoringController` facade: `startContinuous()`, `stopContinuous()`, else treat comprehensive assessments as one‑shots. |
| Balance tests | Only executed inside comprehensive assessment | Add dedicated balance test API returning async progress callbacks to map into `balanceTestProgress` / `balanceTestResult`. |
| Alerts pipeline | No watch alert push yet | Hook into `SmartNotificationManager` / WebSocket emergency alerts → map to `alert` envelope; persist acknowledgement events from watch. |
| Quick events | `sendQuickEvent` not persisted | Introduce a ring buffer (max N) & flush to server (WebSocket or REST) with device + timestamp metadata. |
| Reliability | No resend / context fallback | Use `updateApplicationContext` for last known status in addition to `sendMessageData` for reachability gaps. |
| Power considerations | Periodic 15s updates may be excessive while user inactive | Add adaptive cadence (foreground 15s, background 60–120s, suspend when no monitoring). |
| Security / auth | No token layering on WC payloads | If required, embed a short‑lived HMAC signature (shared secret) for sensitive commands like emergency acknowledgement. |
| Duplication of shared models | Messages file duplicated (iOS + watch target) to avoid Xcode build phase edits | Move to a truly shared group and include in both targets in Xcode; delete duplicate. |

## 📡 Connectivity architecture

Current path (simple):

Watch → (sendMessageData) → iPhone `WatchConnectivityManager` → FallRiskAssessmentManager/WebSocketManager → (process) → send snapshot/summary back.

Future resilience upgrades:

1. Maintain rolling `LiveStatusPayload` in `applicationContext` so watch obtains snapshot on activation even if a direct message race occurs.
2. Queue outbound watch commands if `!session.isReachable` and flush on reachability change.
3. Optionally add background transfer of periodic summaries using `transferCurrentComplicationUserInfo` once complications are added.

## 🔒 Privacy & data minimization

Only summarized / relative metrics are sent to watch (no raw sensor frames, no PII). Continue to avoid transmitting exact birth date, medication detail, or environment metadata to watch. If future features require them, gate behind explicit user consent & redaction.

## 🧪 Suggested test scenarios

1. Watch triggers assessment while iPhone app in background – verify delivery & summary update within 30s.
2. Simulated network disruption (toggle Airplane mode) – ensure next reachable interval sends updated status automatically.
3. Rapid button presses (Start → Stop → Start) – confirm idempotent handling and no crash.
4. Large recommendation lists – sheet truncation / scrolling behavior.
5. High risk transition (medium → high) – color + alert envelope (once implemented) propagate.

## 🔜 Next iterations (ordered)

1. Add actual gait metrics source (publish Combine stream) & wire into `buildLiveStatusPayload()`.
2. Implement dedicated balance test command path with progress streaming.
3. Add alert push integration (WebSocket emergency alerts → watch `alert`).
4. Introduce adaptive update cadence + `applicationContext` fallback.
5. Persist & sync quick events + acknowledgements.
6. Migrate duplicated shared models into a single shared target group.
7. Add complications (risk level, last assessment age, quick Assess tap).

## Minimal developer integration steps now

1. Add newly created Swift files to appropriate Xcode targets (if not auto‑detected):
   - iOS target: `WatchConnectivityMessages.swift`, `WatchConnectivityManager.swift`.
   - Watch target: `WatchConnectivityMessages.swift` (or keep duplicate), `Connectivity/WatchConnectivityManager.swift`, `Views/RemoteControlDashboard.swift`.
2. Instantiate `WatchConnectivityManager.shared.configure(fallRiskManager:)` after creating the `FallRiskAssessmentManager` (e.g., inside app init / dependency graph).
3. Build & run iPhone + Watch – verify live status requests respond.

---
Maintainer: Generated initial scaffold by AI assistant. Please refine in subsequent commits.
