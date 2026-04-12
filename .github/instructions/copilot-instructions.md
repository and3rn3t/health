# Copilot Instructions for VitalSense

## Project context

- **Purpose**: Apple Health insights, fall risk monitoring, emergency alerts, caregiver dashboards (see `docs/architecture/PRD.md`).
- **Branding**: Always use **VitalSense** in user-facing text — never "Health App".
- **Frontend**: React 19 (TS) + Vite, Tailwind v4, Radix UI, TanStack Query.
- **Runtime**: Cloudflare Workers (Hono) for static assets + API. Worker entry: `src/worker.ts` → `dist-worker/index.js`.
- **iOS**: Swift/HealthKit app in `ios/` — singletons (`AppConfig.shared`, `HealthKitManager.shared`), WebSocket bridge.
- **Auth**: Auth0 with JWT verification (JWKS + HS256 fallback). Config in `src/lib/auth0Config.ts` and `wrangler.toml`.
- **Data**: Client-side `useKV` from `@/hooks/useCloudflareKV`; server-side Cloudflare KV/R2 via Wrangler bindings.

## Architecture and boundaries

- React app → `dist/` (served by Worker). Worker: Hono routes for `/health`, `/api/*`, static serving.
- Worker must stay Workers-safe — Web APIs only (Request/Response, fetch, crypto). No Node-only APIs.
- WebSocket: Durable Object `HealthWebSocket` with auth-gated upgrade, `RateLimiter` DO for POST rate limiting.
- Schemas: `src/schemas/health.ts` — all zod schemas for health data validation.
- Separate Vite configs: `vite.config.ts` (app) and `vite.worker.config.ts` (worker).

## Language, modules, and layout

- TypeScript, ESM only (`import`, named exports). No `require`/CommonJS.
- Path alias: `@/*` (configured in `tsconfig.json` and `vite.config.ts`).
- File locations:
  - Components: `src/components/**` (`ui/` for primitives, `health/`, `gamification/`, etc.)
  - Hooks: `src/hooks/**`
  - Libraries: `src/lib/**`
  - Schemas: `src/schemas/**`
  - Worker: `src/worker/` (routes, helpers, Durable Objects)
  - Styles: `src/main.css` (includes Tailwind v4 theme tokens)

## UI and styling

- Tailwind v4 with semantic CSS tokens from `src/main.css`. Utility classes preferred.
- Compose from existing `src/components/ui/*` and Radix primitives — don't re-create.
- Icons: `lucide-react` via barrel `src/lib/icons.ts`, or `@phosphor-icons/react`.
- Dark mode: `[data-appearance="dark"]` on `document.documentElement`. No alternate theme systems.
- Colors: primary `#2563eb`, accent teal `#056487`, dark accent foreground `#333333`.
- VitalSense palette in `src/lib/vitalsense-colors.ts` with `getVitalSenseClasses`.

### CSS strategy

- Single entry: `src/main.css` with `@layer base|components|utilities` and Tailwind v4 `@theme` tokens.
- New CSS files only for sizable lazy-loaded feature chunks.
- Semantic light/dark tokens, WCAG AA contrast (normal ≥4.5, large/UI ≥3.0).
- Guard enforced: `pnpm run guard:css` (local), `pnpm run ci:css-guard` (CI).

## State, data fetching, and realtime

- UI state: `useKV` from `@/hooks/useCloudflareKV` for lightweight client persistence.
- Server state: `@tanstack/react-query` — co-locate query keys/constants.
- Pagination: cursor-based (`{ data, nextCursor?, hasMore? }`).
- Validation: `zod` at all boundaries (WebSocket payloads, Worker bodies, query params).
- WebSocket: auto-reconnect with backoff, heartbeat/ping, message-type guards via `zod`.

## Cloudflare Worker best practices

- Hono handlers + `serveStatic` for assets/fallback.
- Web APIs only. Access env via `c.env`. Secrets in Wrangler — never hardcode.
- Validate `c.req.json()` with zod; return `c.json(result, status)`; 400 on bad input.
- Keep Worker bundles small and edge-safe.

## Conventions and patterns

- Function components with explicit props types; no `any`.
- Hooks: `use*` prefix; memoize expensive computations (`useMemo`, `useCallback`).
- Error boundaries via `react-error-boundary` (wired in `src/main.tsx`).
- Imports: `@/` first, third-party, then relative. No circular deps.
- Formatting: Prettier with Tailwind plugin.

## Performance

- `useMemo`/`useCallback`/`React.memo` where it matters (applied in `App.tsx`).
- `React.lazy()` + `<Suspense>` for code splitting large/conditional components (>50KB).
- Keep route chunks <100KB. Production bundle target ~187KB.
- Use dynamic imports for feature modules.

## Security, privacy, and compliance

- Health data is sensitive — never log raw metrics or PII.
- Validate inputs with `zod`, sanitize outputs, fail closed on parse errors.
- Always validate JWT tokens server-side in Worker routes.
- Debounce and confirm critical actions (alerts/emergency). Provide cancel windows.
- No analytics or third-party network calls without explicit approval.

## Code generation preferences

- React + TS + Vite idioms; minimal dependencies; tree-shakable.
- Networking: `fetch` + React Query. Workers: `c.req`/`c.env`.
- Realtime: `WebSocket` API; envelopes `{ type, data, timestamp }` + zod.
- Styling: Tailwind utilities + existing components; no CSS-in-JS.
- Storage: `useKV` from `@/hooks/useCloudflareKV` (client); Cloudflare KV/R2 (server, bind in wrangler.toml).

## Don'ts

- Don't use Node APIs in Worker routes unless guarded and necessary.
- Don't bypass React Query for server-state.
- Don't introduce CommonJS or unnamed default exports.
- Don't create duplicate UI primitives — extend `src/components/ui/*`.
- Don't hardcode secrets or KV binding IDs.

## File naming

- Components: `PascalCase.tsx` in domain folders (`src/components/health/*`).
- Hooks: `useX.ts` in `src/hooks/`.
- Libs/utils: `camelCase.ts` in `src/lib/`.
- Tests: colocated `*.test.ts(x)` with Vitest.

## iOS development (Swift/HealthKit)

- Singleton pattern: `AppConfig.shared`, `HealthKitManager.shared`, `ApiClient.shared` (private inits).
- HealthKit permissions via usage descriptions in `Info.plist`.
- Design for background execution with proper task management.
- Project: `ios/Andernet-Posture/` (main app), `ios/HealthKitBridge/` (generated configs). Tests in `Andernet PostureTests/`.

### SwiftLint compliance (mandatory)

- **ERROR**: Lines >150 chars (build-blocking). **WARNING**: >120 chars.
- Break long function calls, dictionaries, conditionals into multi-line format.
- No `force_unwrapping` — use `if let`/`guard let`.
- Files <600 lines, class bodies <800 lines.
- Validate: `docker run --rm -v "$(pwd)/ios:/workspace" ghcr.io/realm/swiftlint:latest swiftlint /workspace`

## Terminal rules

- Never run commands in active terminals — check status first.
- `isBackground=true` for long-running processes (servers, watchers).
- Check dependencies are installed before running commands.
