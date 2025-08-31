# Copilot Instructions for this repository

These instructions guide GitHub Copilot Chat/Edits to produce code and docs that fit this project’s stack, architecture, and goals.

## Project context

- Purpose: Apple Health insights, fall risk monitoring, emergency alerts, caregiver dashboards (see `docs/PRD.md`).
- Frontend: React 19 (TS) + Vite, Tailwind v4, Radix UI, GitHub Spark UI utilities, TanStack Query.
- Runtime: Cloudflare Workers (Hono) for static/API, optional Node WebSocket bridge in `server/` for local/edge streaming.
- Data: Local KV via `@github/spark/hooks` on the client; Cloudflare KV/R2 bindings planned via Wrangler.

## Architecture and boundaries

- React app builds to `dist` (served by Worker assets). Worker entry is `src/worker.ts` (built to `dist-worker/index.js`).
- Worker: Hono routes for `/health`, `/api/*`, and static serving; no Node-only APIs unless `nodejs_compat` is enabled (it is, but keep code Workers-safe).
- WebSocket server (local dev): `server/websocket-server.js` (Express + ws). Message types: `connection_established`, `live_health_update`, `historical_data_update`, `emergency_alert`.

## Language, modules, and layout

- TypeScript, ESM only. Do not use `require`/CommonJS. Use `import` and named exports.
- Paths alias: import app code with `@/*` (configured in `tsconfig.json` and `vite.config.ts`).
- File locations:
  - Components: `src/components/**` (`ui/` for primitives, domains under `health/`, `gamification/`, etc.).
  - Hooks: `src/hooks/**`.
  - Libraries/utilities: `src/lib/**`.
  - Styles: `src/**/*.css` and `src/styles/theme.css`.

## UI and styling

- Use Tailwind v4 classes with semantic tokens from our CSS variables (`theme.json` + `styles/theme.css`). Prefer utility classes; avoid inline styles.
- Prefer existing UI primitives from `src/components/ui/*` and Radix-based components; compose over re-creating components.
- Icons: prefer `@phosphor-icons/react` or `lucide-react` already used in the codebase.
- Dark mode: Tailwind is configured with `darkMode: ["selector", '[data-appearance="dark"]']`. If you add theme toggles or components checking theme, prefer toggling `[data-appearance="dark"]` on `document.documentElement`. Avoid adding a separate theme mechanism.

## State, data fetching, and realtime

- Local persisted UI state: use `useKV` from `@github/spark/hooks` for lightweight, user-specific values.
- Server data: use `@tanstack/react-query` for fetches, caching, and mutations. Co-locate query keys/constants.
- Pagination: prefer cursor-based pagination for `/api/health-data` using an infinite query hook. The API returns `{ data, nextCursor?, hasMore? }`; older clients may only read `data`.
- Validation: use `zod` for runtime schema validation at boundaries (WebSocket payloads, Worker request bodies, query params).
- WebSocket client code should be resilient: auto-reconnect, heartbeat/ping support, backoff, and message-type guards with `zod`.

## Cloudflare Worker best practices

- Use Hono handlers (`(c) => { ... }`) and `serveStatic` for assets and index fallback.
- Stick to Web APIs (Request/Response, fetch, crypto). Avoid Nodejs-only APIs even with `nodejs_compat` unless strictly necessary.
- Access environment via `c.env`. Don’t hardcode secrets; use Wrangler secrets/vars.
- Keep Worker bundles small and edge-safe; avoid large Node libraries.

## Conventions and patterns

- Components: function components with explicit props types; avoid `any`. Keep files small and focused.
- Hooks: prefix with `use*`; side-effects with `useEffect`; memoize intensive computations.
- Error handling: use `react-error-boundary` already wired in `src/main.tsx`. Prefer error boundaries over try/catch in render.
- Routing: The app is currently single-entry; if adding routes, prefer client-side composition (tabs/conditional panels) unless a router is introduced.
- Imports: absolute `@/` first, then third-party, then relative. Keep deterministic order. No circular deps.
- Formatting: Prettier with Tailwind plugin; keep class order normalized.

## Security, privacy, and compliance

- Treat health data as sensitive. Do not log raw health metrics or personally identifiable information.
- Validate and narrow inputs with `zod`. Sanitize outputs. Fail closed on parse errors.
- For alerts/emergency paths, debounce and confirm critical actions. Provide a cancel window where applicable.
- Do not introduce analytics or third-party network calls without explicit approval.

## When generating code, prefer these choices

- React + TS + Vite idioms; minimal runtime dependencies; tree-shakable libraries.
- Networking: `fetch` with typed wrappers; integrate with React Query. For Workers, use Hono `c.req`, `c.env`.
- Realtime: `WebSocket` browser API; message envelopes `{ type, data, timestamp }` with `zod` validation.
- Styling: Tailwind utilities + existing UI components; no CSS-in-JS.
- Storage: `useKV` for client persistence; Cloudflare KV/R2 via Wrangler for server-side persistence (define bindings, don’t hardcode IDs in code).

## Don’ts

- Don’t use Node APIs in Worker routes (fs, net, crypto in Node mode) unless guarded and necessary.
- Don’t bypass React Query for server-state unless it’s a one-off local computation.
- Don’t introduce CommonJS, default exports that fight tree-shaking, or unnamed functions.
- Don’t create duplicate UI primitives; extend `src/components/ui/*` instead.

## Useful scaffolds Copilot can follow

- React Query hook skeleton
  - Input: key, url, optional schema
  - Output: `{ data, error, isLoading }`
  - Error modes: network failure, schema parse failure
- Infinite query hook skeleton (cursor pagination)
  - Input: params (metric, from, to, limit)
  - Data shape: pages of `{ items, nextCursor }`
  - getNextPageParam: `page.nextCursor`
  - Merge strategy: `pages.flatMap(p => p.items)`
- WebSocket client manager
  - Inputs: url, `onMessage` map keyed by `type`
  - Behaviors: backoff reconnect, ping/pong keepalive, close on tab hidden if needed
- Hono route handler
  - Validate `c.req.json()` against `zod` schema; return `c.json(result, status)`; handle bad input with 400

## File naming

- Components: `PascalCase.tsx` in a folder that matches the domain (e.g., `src/components/health/*`).
- Hooks: `useX.ts` in `src/hooks/`.
- Libs/utils: `camelCase.ts` in `src/lib/`.
- Tests (if added): colocate as `*.test.ts(x)` using Vitest. Avoid adding test deps without approval.

## Integration cues from this repo

- WebSocket message types to handle: `live_health_update`, `historical_data_update`, `emergency_alert`.
- Existing domains: health analytics, fall risk, caregiver dashboards, notifications, gamification, usage analytics.
- Styling tokens: `--color-*`, `--radius-*`, spacing via CSS variables (see `tailwind.config.js` and `theme.json`).

## Example prompts that fit this repo

- “Create a React Query hook for GET /api/health-data with zod validation and a loading/error UI snippet using our Button and Alert components.”
- “Add a WebSocket client utility that connects to ws://localhost:3001, validates message envelopes with zod, and exposes a subscribe API.”
- “Add a Hono POST /api/health-data route that validates input, writes to KV if bound, and returns the stored record.”

---

By following these rules, Copilot should generate code that compiles with Vite + TS, runs in Cloudflare Workers where expected, and matches our UI/UX and privacy standards.
