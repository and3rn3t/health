# Architecture Overview

This app delivers Apple Health insights, fall risk monitoring, and emergency alerts with a React + Cloudflare Workers stack and an optional Node WebSocket bridge for local/edge streaming.

## High-level

- Frontend: React 19 + Vite (TypeScript), Tailwind v4, Radix UI, GitHub Spark UI.
- Worker: Cloudflare Workers using Hono for `/health`, `/api/*`, and static serving of `dist/`.
- Realtime (local/dev): Optional Node bridge in `server/websocket-server.js` (Express + ws).
- Client storage: `useKV` from `@github/spark/hooks` for local, user-specific UI state.
- Server storage (planned): Cloudflare KV and R2 via Wrangler bindings.

## Build outputs

- App bundle: `dist/` (served as Worker assets via `[assets]` in `wrangler.toml`).
- Worker bundle: `dist-worker/index.js` (entry: `src/worker.ts`, built via `vite.worker.config.ts`).

## Routing and assets

- Worker routes:
  - GET `/health`: health check with environment echo.
  - GET `/api/health-data`: placeholder API for future data fetches.
  - POST `/api/health-data`: placeholder API for future writes.
  - GET `/*`: static and index fallback via `serveStatic`.
- Assets: Served from `dist/` via Wrangler `[assets]` binding `ASSETS`.

## WebSocket (local bridge)

- `server/websocket-server.js` emits messages to web clients:
  - `connection_established`
  - `live_health_update`
  - `historical_data_update`
  - `emergency_alert`
- Used in dev or hybrid edge scenarios; production WS may move to Durable Objects/Sockets.

## Styling and theming

- Tailwind v4 with CSS variables from `theme.json` and `src/styles/theme.css`.
- Dark mode: Tailwind is configured for `[data-appearance="dark"]`; toggle via `document.documentElement.setAttribute('data-appearance', 'dark' | 'light')`.

## Validation and types

- Use zod at boundaries (Worker APIs, WS payloads). See `src/schemas/health.ts` for message envelopes and health data shapes.

## Privacy and security

- Treat health data as sensitive. Avoid logging raw personal metrics. Validate inputs, sanitize outputs, and fail closed on parse errors.

---

For deeper UX and feature goals, see `docs/PRD.md` and `docs/NEXT_STEPS.md`.
