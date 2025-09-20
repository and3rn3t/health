# Contributing

Thanks for helping improve this project. Please follow these guidelines to keep changes safe and maintainable.

## Prereqs

- Node 20 LTS, pnpm or npm
- Wrangler CLI for Workers dev

## Setup

- Install deps: `npm i`
- Dev servers:
  - Frontend+Worker: `npm run dev`
  - Local WebSocket bridge: `npm run server`

## Branching and PRs

- Create feature branches off `main`.
- Keep PRs small and focused. Include screenshots for UI changes.
- Add or update docs for public APIs and WS contracts.

## Code style

- TypeScript + ESM only. No CommonJS.
- Tailwind utilities with semantic tokens; prefer existing UI primitives.
- Validate inputs with zod at boundaries.

## Testing and checks

Before opening or updating a PR run:

| Category       | Command                                                                                        | Purpose                                 |
| -------------- | ---------------------------------------------------------------------------------------------- | --------------------------------------- |
| Type check     | `npx tsc --noEmit`                                                                             | Surface TS errors early                 |
| Lint           | `npm run lint`                                                                                 | Code style + obvious issues             |
| Unit tests     | `npm test`                                                                                     | Core logic validation                   |
| Bundle budget  | `npm run build && npm run ci:bundle-threshold`                                                 | Enforce JS/CSS gzip size ceilings       |
| Branding       | `npm run branding:audit:local` (dev worker running)                                            | VitalSense branding + no legacy residue |
| Smoke (worker) | `npm run ci:smoke`                                                                             | Health endpoint + minimal probes        |
| WebSocket      | `node scripts/node/test/test-websocket-reconnect.js --backendUrl=wss://health.andernet.dev/ws` | Reconnect resilience                    |
| Perf SLO       | `npm run ci:perf-slo`                                                                          | Snapshot bundle + latency status        |

Bundle gzip thresholds (defaults): JS < 400KB, CSS < 60KB. Adjust via `--js-max` / `--css-max` flags only with prior discussion.

If you change public behavior or WebSocket message shapes, update/add Vitest tests under `src/__tests__` and adjust docs in `docs/architecture/WEBSOCKETS.md`.

## Security & privacy

- Do not log personal health data.
- Use Wrangler secrets/vars for configuration.

## PR Checklist (copy into description)

- [ ] TypeScript passes (`npx tsc --noEmit`)
- [ ] Lint passes (no new warnings preferred)
- [ ] Unit tests pass / updated
- [ ] Bundle budgets pass (`npm run ci:bundle-threshold`)
- [ ] Branding audit passes (`npm run branding:audit:local` or prod)
- [ ] Privacy guard passes (`npm run ci:privacy`)
- [ ] WebSocket resilience test ok (if touching live sync / schemas)
- [ ] Docs updated (schemas / APIs / deployment) if applicable
- [ ] Performance SLO probe reviewed (if bundle / runtime init changed)

See `docs/ARCHITECTURE.md` and `docs/WEBSOCKETS.md` for more background.
