# WebSocket Manager Test Notes

This directory includes deterministic tests for `WebSocketManager` leveraging new DEBUG-only hooks and abstractions:

- `WebSocketManagerHeartbeatTests`: Simulates heartbeat failures via `test_runHeartbeatTick(simulateError:)` and asserts reconnect hook invocation (`onReconnectAttempt`).
- `WebSocketManagerSendBufferTests`: Verifies buffered messages flush correctly once a `TestWebSocketTaskAdapter` is injected and `test_forceFlushBuffer()` is called.
- `WebSocketManagerBackoffTests`: Ensures exponential backoff calculation matches expected growth and cap rules using `computeBackoffDelayForTest`.

## Key Debug Hooks Used

- `test_injectTaskAdapter(_:, markConnected:)`
- `test_getBufferedSendCount()` / `test_forceFlushBuffer()`
- `test_startHeartbeat()` / `test_runHeartbeatTick(simulateError:)`
- `test_getMissedHeartbeatThreshold()`

## Adapter Abstraction

`WebSocketTasking` decouples tests from `URLSessionWebSocketTask`; `TestWebSocketTaskAdapter` provides:

- Captured messages (`sentMessages`, `drainSentDataMessages()`)
- Programmable ping outcomes (`nextPingError`)
- Manual inbound event emission (`emit(_:)`, `emitError(_:)`).

These tests rely on DEBUG compilation; ensure the scheme/build configuration defines DEBUG for the test target.
