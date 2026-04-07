# VitalSense Scripts Reference

Reference guide for all pnpm scripts defined in `package.json`.

**Last verified:** July 2025
**Total scripts:** 27

> For the most up-to-date list, run `pnpm run` in the project root.

---

## Quick Reference

```bash
# Development
pnpm dev              # Start Vite dev server
pnpm build            # Build React app
pnpm preview          # Preview production build
pnpm type-check       # TypeScript validation

# Testing
pnpm test             # Run Vitest
pnpm test:coverage    # Run with coverage
pnpm test:e2e         # Run Playwright E2E tests
pnpm test:ui          # Vitest browser UI

# Code Quality
pnpm lint             # ESLint check
pnpm lint:fix         # ESLint auto-fix
pnpm format           # Prettier format
pnpm validate         # Full CI: type-check + lint + test

# Deployment
pnpm cf:dev           # Local Workers preview
pnpm cf:deploy        # Deploy to development
pnpm deploy:prod      # Deploy to production
```

---

## Development

| Script | Command | Description |
|--------|---------|-------------|
| `dev` | `vite` | Start Vite dev server on port 5173 |
| `build` | `vite build` | Build React app to `dist/` |
| `preview` | `vite preview` | Preview production build locally |
| `build:worker` | `node scripts/build/build-worker.js` | Build Cloudflare Worker to `dist-worker/` |
| `build:all` | `vite build && node scripts/build/build-worker.js` | Build both app and Worker |

## Code Quality

| Script | Command | Description |
|--------|---------|-------------|
| `lint` | `eslint . --ext ts,tsx` | Lint TypeScript files |
| `lint:fix` | `eslint . --ext ts,tsx --fix` | Lint and auto-fix |
| `format` | `prettier --write "src/**/*.{ts,tsx,json,css,md}"` | Format source files |
| `type-check` | `tsc --noEmit` | TypeScript type validation |
| `validate` | `tsc --noEmit && eslint . --ext ts,tsx && vitest run` | Full CI validation pipeline |

## Testing

| Script | Command | Description |
|--------|---------|-------------|
| `test` | `vitest` | Run Vitest in watch mode |
| `test:ui` | `vitest --ui` | Vitest browser UI |
| `test:coverage` | `vitest run --coverage \|\| exit 0` | Run with V8 coverage |
| `test:e2e` | `playwright test` | Run Playwright E2E tests |

## Deployment

| Script | Command | Description |
|--------|---------|-------------|
| `cf:dev` | `wrangler dev` | Local Cloudflare Workers preview |
| `cf:deploy` | `wrangler deploy` | Deploy Worker to development |
| `deploy:prod` | `wrangler deploy --env production` | Deploy Worker to production |

## Health Config Sync

| Script | Command | Description |
|--------|---------|-------------|
| `gait:sync` | `node scripts/analysis/gait/sync-gait-config.js` | Sync gait configuration (web → iOS) |
| `fallrisk:sync` | `node scripts/analysis/fall/sync-fall-risk-config.js` | Sync fall risk configuration (web → iOS) |
| `analytics:sync` | `pnpm gait:sync && pnpm fallrisk:sync` | Sync all health configs |

## iOS

| Script | Command | Description |
|--------|---------|-------------|
| `ios:open` | `open ios/Andernet-Posture/*.xcodeproj` | Open Xcode project |

For iOS build, test, and lint commands, see the [iOS Makefile](../../ios/Makefile) (`make lint`, `make build`, `make test`).

## Maintenance

| Script | Command | Description |
|--------|---------|-------------|
| `clean` | `rm -rf dist dist-worker node_modules/.vite` | Remove build artifacts and Vite cache |
| `clean:all` | `rm -rf dist dist-worker node_modules` | Remove all generated files including `node_modules` |
| `preinstall` | `node scripts/ci/ensure-node-version.mjs` | Verify Node version on install |
| `prepare` | `husky` | Set up Git hooks via Husky |

---

## Related

- [Development Guide](DEVELOPMENT.md) — development workflow and setup
- [Testing Guide](testing.md) — testing strategy details
- [ios/Makefile](../../ios/Makefile) — iOS build and lint commands
