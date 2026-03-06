## VitalSense Web App Go-Live Configuration (Basic)

Scope: Single-region deploy, basic auth if any, no PHI/PII compliance requirements.

### Runtime Configuration
- File: `public/app-config.js`
- Keys:
  - `api.baseUrl`: Origin of the backend/API (e.g., `https://health.andernet.dev`).
  - `wsBaseUrl`: Full WebSocket URL (e.g., `wss://health.andernet.dev/ws`). If omitted, frontend uses `/api/ws-url`.
  - `features.enableWebSocket`: Should be `true` for live streaming.
  - `features.enableAuth`: Leave `false` unless backend requires bearer tokens.

### Environment Notes
- The Worker exposes `/api/ws-url` to derive the correct WS URL from the request host. `wsBaseUrl` can override this on the client.
- Health data HTTP endpoints live under `/api/health-data*`.

### Build & Deploy
1. Ensure `public/app-config.js` is adjusted for your target origin (base URL and ws URL if needed).
2. Build the app with Vite; static assets are served by the Worker’s ASSETS binding.
3. Verify `/api/_selftest` and `/api/_diagnostics` return `200` in the target environment.
4. Smoke test:
   - Load the dashboard/home page
   - Verify no console errors
   - Verify `GET /api/health-data` succeeds (empty is OK)
   - Verify WebSocket connects or `/api/ws-url` returns a URL

### Rollback
- Revert `public/app-config.js` to previous version and redeploy.
