# iOS Integration Quick Guide

This branch includes AR overlay upgrades, a robust WebSocketManager, a LiDAR session simulator, and Live Activity scaffolding.

## Wire-up steps in Xcode

1) Targets → HealthKitBridge (app)
   - Add files if missing in target membership:
     - Core/Managers/WebSocketManager.swift
     - Core/Managers/LiDARSessionManager.swift
     - Core/LiveActivities/GaitLiveActivityController.swift
     - Core/Messages/MessageTypes.swift
     - UI/Views/AR/GaitAROverlayView.swift
     - UI/Views/GaitShowcaseHomeView.swift

2) Create Widget Extension target (HealthKitBridgeWidgets)
   - File → New → Target → Widget Extension
   - Add `HealthKitBridgeWidgets/GaitActivityWidget.swift` to this target
   - Signing & Capabilities: add Live Activities to both app and widget extension

3) Configure WebSocket endpoint
   - Update `AppConfig.shared.webSocketURL` to your dev server (wss:// or ws://)
   - Connect: `await WebSocketManager.shared.connect(with: <JWT>)`
   - Subscribe to messages as needed:
     - `WebSocketManager.shared.onLiveHealthUpdate { update in /* ... */ }`

4) Test paths
   - Simulator (no AR): GaitAROverlayView renders preview and stability; LiDARSessionManager simulates metrics.
   - Device with LiDAR: AR path active; distance markers and stability-driven sway appear during movement.

5) Live Activity
   - Start: `GaitLiveActivityController.shared.startSessionActivity(protocolName: ..., duration: ..., isConnected: ...)`
   - Updates are pushed from LiDARSessionManager timer each second.

## Notes

- Privacy: payload contents are never logged; only statuses/errors.
- Stability: heuristic based on lateral deviation variance (preview signal).
- Subscriptions: Use `subscribe(type:as:)` and `unsubscribe(_:,from:)` to manage listeners.
