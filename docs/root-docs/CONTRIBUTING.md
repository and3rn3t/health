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

- Lint/format: `npm run lint`.
- Build: `npm run build`.
- If you change public behavior, add or update minimal tests (Vitest) where applicable.

## Security & privacy

- Do not log personal health data.
- Use Wrangler secrets/vars for configuration.

See `docs/ARCHITECTURE.md` and `docs/WEBSOCKETS.md` for more background.
