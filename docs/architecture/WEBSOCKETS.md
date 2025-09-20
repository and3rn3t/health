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

## /ws HTTP Metadata Fallback

The `/ws` endpoint now returns a JSON metadata document (HTTP 200) when requested without an `Upgrade: websocket` header. This enables health checks, CI tests, and tooling to introspect capabilities without opening a real socket.

Example response:

```json
{
  "ok": true,
  "upgradeRequired": true,
  "message": "Use WebSocket upgrade to establish a realtime session",
  "url": "wss://example.dev/ws",
  "supportedMessageTypes": [
    "connection_established",
    "live_health_update",
    "historical_data_update",
    "emergency_alert",
    "client_presence",
    "pong",
    "error"
  ],
  "analyticsVersions": {
    "gait": "<GAIT_ANALYTICS_VERSION>",
    "fallRisk": "<FALL_RISK_ANALYTICS_VERSION>"
  },
  "timestamp": "2025-09-19T18:45:12.123Z"
}
```

Notes:

- `Cache-Control: no-store` is set to avoid stale capability metadata.
- `analyticsVersions` lets clients decide whether cached config artifacts (e.g., gait/fall risk thresholds) are current.
- A legacy build may still return `426 Upgrade Required`; clients should treat that as a hint to re-deploy or fall back gracefully.

## Client behavior

- Auto-reconnect with exponential backoff (jitter recommended).
- Heartbeat: respond to ping or send periodic pings.
- Validate by type-safe handlers, drop and log on parse errors.

## Authentication

During development, the local Node bridge (`server/websocket-server.js`) supports JWT-based authentication for devices and dashboards.

- Token minting (Worker): `POST /api/device/auth` returns a short-lived HS256 JWT.
  - Claims: `iss`, `aud=ws-device`, `sub=<userId>`, `scope=device:<ios_app|web_dashboard>`, `exp`.
  - Requires `DEVICE_JWT_SECRET` set in the Worker env for signing.
- Passing token to WS:
  - Preferred: query param `?token=<jwt>` when opening the socket.
  - Also supported: `Authorization: Bearer <jwt>` header.
- Server checks `iss/aud/nbf/exp` and sets `userId` and `client type` from claims.

Dev convenience:

- In-app WS Token panel: use the floating “WS Token” button (bottom-right) to:
  - Set the WebSocket URL (e.g., `ws://localhost:3001`) and User ID.
  - Click “Get token” to mint a short-lived device token from the Worker.
  - Save to persist locally; the app exposes `window.__WS_DEVICE_TOKEN__` and `window.__WS_URL__` for the client.
  - A small badge appears when no token is set. The button shows a countdown to token expiry and auto-refreshes near expiry; if refresh fails within the last 30s, a toast warns you. 401s prompt a sign-in toast.
- You can also set `window.__WS_DEVICE_TOKEN__ = '<jwt>'` manually in the browser console; the client will append it to the WS URL automatically.
- The client respects `window.__WS_URL__` to override the base WS URL during development.
- Alternatively, a dev-only shared bearer via `WS_BEARER` can be used (less secure; avoid in production).

## Optional: paginated historical backfill

While HTTP GET `/api/health-data` is the primary path for paging through historical data, the same cursor concept can be mirrored over WebSockets using the existing `historical_data_update` type.

- Server sends: `historical_data_update` with `{ items, nextCursor? }`.
- Client may request another page when `nextCursor` is present (implementation-specific trigger), or the server can stream subsequent pages automatically.
- The page items mirror `ProcessedHealthData` records. Ordering should be newest-first to match HTTP.

Recommended flow:

1. On connect, issue an initial HTTP fetch to prefill the cache (faster and cacheable).
2. Subscribe to WS updates for `live_health_update` and optionally `historical_data_update` for background backfill.
3. If `historical_data_update.nextCursor` is present, continue until it becomes absent.

## Sample payloads

```json
{
  "type": "connection_established",
  "data": { "clientId": "abc" },
  "timestamp": 1712345678
}
```

```json
{
  "type": "live_health_update",
  "data": { "metrics": [{ "name": "heart_rate", "value": 72, "unit": "bpm" }] },
  "timestamp": 1712345680
}
```

```json
{
  "type": "emergency_alert",
  "data": {
    "alert": {
      "kind": "fall_detected",
      "severity": "high",
      "message": "Possible fall detected"
    }
  },
  "timestamp": 1712345690
}
```

```json
{
  "type": "historical_data_update",
  "data": {
    "items": [
      {
        "type": "steps",
        "value": 1200,
        "processedAt": "2025-08-30T10:00:00.000Z",
        "validated": true,
        "alert": null
      }
    ],
    "nextCursor": "opaque-token"
  },
  "timestamp": 1712345695
}
```
