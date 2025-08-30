# WebSockets Contracts

This app uses a local Node bridge (`server/websocket-server.js`) during development to push live health data and alerts. Message envelopes are validated with zod in the client.

## Envelope

- All messages follow `{ type, data, timestamp }`.
- Types:
  - `connection_established`
  - `live_health_update`
  - `historical_data_update`
  - `emergency_alert`
  - `error`

See `src/schemas/health.ts` for the zod schema and TS types.

## Client behavior

- Auto-reconnect with exponential backoff (jitter recommended).
- Heartbeat: respond to ping or send periodic pings.
- Validate by type-safe handlers, drop and log on parse errors.

## Sample payloads

```json
{ "type": "connection_established", "data": { "clientId": "abc" }, "timestamp": 1712345678 }
```

```json
{ "type": "live_health_update", "data": { "metrics": [{ "name": "heart_rate", "value": 72, "unit": "bpm" }] }, "timestamp": 1712345680 }
```

```json
{ "type": "emergency_alert", "data": { "alert": { "kind": "fall_detected", "severity": "high", "message": "Possible fall detected" } }, "timestamp": 1712345690 }
```
