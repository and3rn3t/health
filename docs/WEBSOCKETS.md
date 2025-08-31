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
