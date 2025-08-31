# iOS Bridge (HealthKit -> WebSocket)

This folder contains a minimal Swift scaffolding to collect HealthKit data and stream to the local WebSocket bridge.

What’s included:

- HealthKitManager.swift: reads heart rate, walking steadiness, and steps; enables background delivery; streams to WS.
- WebSocketManager.swift: lightweight URLSessionWebSocket wrapper.
- ApiClient.swift: issues short-lived device tokens from the Worker (`/api/device/auth`).
- AppConfig.swift: loads `Config.plist` with API and WS URLs plus a test `USER_ID`.
- Config.sample.plist: copy to `Config.plist` and edit values.

Prerequisites on a Mac:

1. Xcode with a new iOS App target (Swift, iOS 16+ recommended). Add these files to the project.
2. Add HealthKit capability and required keys in Info.plist:
   - `NSHealthShareUsageDescription`
3. Add `Config.plist` to the app target with keys: `API_BASE_URL`, `WS_URL`, `USER_ID`.
4. Run backend locally:
   - Cloudflare Worker: `wrangler dev` (serves API and static app)
   - WS server: `node server/websocket-server.js`
5. Set secrets/bindings (Worker):
   - `wrangler secret put DEVICE_JWT_SECRET`
   - `wrangler secret put ENC_KEY` (optional, 32-byte base64 for KV encryption)
   - Configure KV/R2 ids in `wrangler.toml` for full persistence.

App flow:

- App requests HealthKit authorization.
- App calls `/api/device/auth` to get a short-lived HS256 token.
- App opens `WS_URL?token=...` and identifies as `ios_app` with `userId`.
- Live samples are sent as `{ type: 'live_health_data', data: { type, value, unit } }`.
- Historical batches are sent as `{ type: 'historical_data', data: { type, samples: [...] } }`.

Notes:

- Keep PHI out of logs. Only minimal debug prints remain.
- Background delivery is enabled for key metrics; background execution limits still apply.
- If you prefer not to use WS tokens in dev, set `WS_BEARER` on the Node server and remove token from the URL.
