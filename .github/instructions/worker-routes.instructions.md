---
description: "Use when creating or modifying Cloudflare Worker routes, Hono handlers, Durable Objects, middleware, or server-side API logic. Covers Workers-safe APIs, zod validation, auth, and rate limiting."
applyTo: "src/worker/**/*.ts"
---

# Cloudflare Worker Guidelines — VitalSense

## Runtime Constraints
- **Workers-safe only**: Web APIs (Request, Response, fetch, crypto, URL, TextEncoder).
- **No Node APIs** unless guarded and absolutely necessary (`nodejs_compat` flag is on but avoid reliance).
- Access env via `c.env` — never hardcode secrets.

## Hono Patterns
- Routes in `src/worker/routes/` — group by domain (auth, health-data, ws, telemetry).
- Validate `c.req.json()` with zod schemas from `src/schemas/health.ts`.
- Return `c.json(result, status)` — 400 on validation failure, fail closed on parse errors.
- Use middleware from `src/worker/middleware.ts` for auth, CORS, logging.

## Auth
- JWT verification via Auth0 (JWKS + HS256 fallback).
- Config in `src/lib/auth0Config.ts` and `wrangler.toml`.
- All `/api/*` routes must validate JWT tokens server-side.

## Durable Objects
- `HealthWebSocket`: Auth-gated WebSocket upgrade with heartbeat/ping.
- `RateLimiter`: POST rate limiting per client.
- Keep DO state minimal — use KV/R2 for persistent data.

## Data
- Server-side storage: Cloudflare KV and R2 via Wrangler bindings.
- Pagination: cursor-based `{ data, nextCursor?, hasMore? }`.
- Analytics Engine bindings: `HEALTH_ANALYTICS`, `SECURITY_ANALYTICS`, `PERFORMANCE_ANALYTICS`.

## Security
- Never log raw health metrics or PII.
- Sanitize outputs, validate all inputs with zod.
- Keep Worker bundles small and edge-safe.
