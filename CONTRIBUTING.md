# Contributing

Thanks for helping improve this project. Please follow these guidelines to keep changes safe and maintainable.

## Prereqs

- Node ≥22.21.1, pnpm 10.16+
- Wrangler CLI for Workers dev

## Setup

- Install deps: `pnpm install`
- Dev servers:
  - Frontend: `pnpm dev`
  - Worker: `pnpm cf:dev`

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

| Category | Command | Purpose |
|----------|---------|--------|
| Type check | `pnpm type-check` | Surface TS errors early |
| Lint | `pnpm lint` | Code style + obvious issues |
| Unit tests | `pnpm test` | Core logic validation |
| Full validation | `pnpm validate` | type-check + lint + test in one pass |
| E2E tests | `pnpm test:e2e` | End-to-end Playwright tests |
| Build | `pnpm build` | Ensure production build succeeds |

If you change public behavior or WebSocket message shapes, update/add Vitest tests under `src/__tests__` and adjust docs in `docs/architecture/WEBSOCKETS.md`.

## Security & privacy

- Do not log personal health data.
- Use Wrangler secrets/vars for configuration.

## PR Checklist (copy into description)

- [ ] TypeScript passes (`pnpm type-check`)
- [ ] Lint passes (no new warnings preferred)
- [ ] Unit tests pass / updated (`pnpm test`)
- [ ] Branding uses **VitalSense** in user-facing text
- [ ] No PII or raw health data in logs
- [ ] Docs updated (schemas / APIs / deployment) if applicable

See [Architecture](docs/architecture/ARCHITECTURE.md) and [WebSockets](docs/architecture/WEBSOCKETS.md) for more background.
