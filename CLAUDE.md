# CLAUDE.md — VitalSense

## Project Overview

VitalSense is a health monitoring platform: Apple Health insights, fall risk detection, emergency alerts, caregiver dashboards. Multi-platform with a React web app, Cloudflare Workers backend, and native iOS (Swift/HealthKit) app.

**Branding**: Always use **VitalSense** in user-facing text — never "Health App".

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19 + TypeScript + Vite, Tailwind v4, Radix UI, TanStack Query |
| Backend | Cloudflare Workers (Hono), Durable Objects, KV/R2 |
| iOS | Swift, SwiftUI, HealthKit, CoreML, WebSocket bridge |
| Auth | Auth0 with JWT (JWKS + HS256 fallback) |
| Testing | Vitest (unit), Playwright (E2E), XCTest (iOS) |
| Validation | Zod at all data boundaries |

## File Structure

```
src/components/     — React components (ui/, health/, gamification/)
src/hooks/          — Custom React hooks (useAuth, useLiveHealthData, useWebSocket)
src/lib/            — Utilities, config, health processors
src/schemas/        — Zod schemas for health data validation
src/worker/         — Cloudflare Worker (routes/, middleware, Durable Objects)
ios/                — Native iOS app (Andernet Posture)
docs/               — Architecture, deployment, development guides
scripts/            — Build, CI, config sync scripts
e2e/                — Playwright E2E tests
```

## Key Commands

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm test             # Run Vitest unit tests
pnpm lint             # ESLint check
pnpm type-check       # TypeScript validation
pnpm validate         # Full CI: lint + type-check + test
pnpm build            # Build app
pnpm build:worker     # Build Cloudflare Worker
pnpm cf:dev           # Local Workers preview
pnpm cf:deploy        # Deploy to dev
pnpm deploy:prod      # Deploy to production
pnpm gait:sync        # Sync gait config (web → iOS)
pnpm fallrisk:sync    # Sync fall risk config (web → iOS)
```

## Critical Rules

1. **TypeScript + ESM only** — no `require`, no CommonJS, no `any`
2. **Zod validation at all boundaries** — Worker request bodies, WebSocket payloads, query params. Fail closed on parse errors.
3. **No PII or raw health data in logs** — health data is sensitive. Never log metrics, user identifiers, or health records.
4. **Workers-safe APIs only** — Web APIs (Request, Response, fetch, crypto) in Worker code. No Node.js APIs.
5. **Secrets via `c.env`** — access Wrangler bindings, never hardcode secrets or API keys.
6. **Path alias `@/*`** maps to `./src/*` in tsconfig and Vite.
7. **Tailwind v4 utilities** — use semantic tokens from `theme.css`. No CSS-in-JS.
8. **Radix UI + existing `src/components/ui/*`** — don't recreate primitives.
9. **React Query for server state** — co-locate query keys. No bypassing with raw fetch.
10. **Colocated tests** — `*.test.ts(x)` next to source files, using Vitest + @testing-library/react.

## Architecture Boundaries

- **React app** builds to `dist/`, served by the Cloudflare Worker
- **Worker** (Hono): `/health` endpoint, `/api/*` routes, static asset serving, WebSocket upgrade
- **Durable Objects**: `HealthWebSocket` (auth-gated), `RateLimiter` (POST rate limiting)
- **Separate Vite configs**: `vite.config.ts` (app), `vite.worker.config.ts` (worker)
- **Auth flow**: Auth0 → JWT → Worker middleware verifies → route handler processes

## iOS (Swift)

- **Project**: `ios/Andernet-Posture/`
- **Singletons**: `AppConfig.shared`, `HealthKitManager.shared`, `ApiClient.shared`
- **HealthKit data stays on-device** unless explicitly synced via WebSocket bridge
- **SwiftLint**: WARNING >120 chars, ERROR >150 chars (strict in CI)
- **Xcode 26.2** pinned, Swift Package Manager for dependencies
- **Tests**: `Andernet PostureTests/` (unit), `Andernet PostureUITests/` (UI)

## Don'ts

- Don't use Node APIs in Worker routes
- Don't bypass React Query for server state
- Don't introduce CommonJS or unnamed default exports
- Don't create duplicate UI primitives — extend `src/components/ui/*`
- Don't hardcode secrets or KV binding IDs
- Don't log raw health data or PII
- Don't skip zod validation at any data boundary
