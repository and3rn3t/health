# VitalSense Troubleshooting Guide

Common issues and solutions for the VitalSense health monitoring platform.

## Web App

### Build Fails: Tailwind Oxide Binding Error

**Symptom:** `Error: Cannot find module '@tailwindcss/oxide-...'`

**Fix:** Oxide is disabled by default. Ensure `TAILWIND_DISABLE_OXIDE=1` is set (handled in `vite.config.ts`). If you explicitly enabled it, run:
```bash
pnpm rebuild
```

### TypeScript Errors After Pulling

```bash
pnpm type-check          # see all errors
pnpm install              # ensure deps are in sync
```

### Tests Timeout or Hang

1. Ensure no leftover dev server on port 5173.
2. Run with verbose output:
   ```bash
   pnpm vitest run --reporter=verbose
   ```
3. Check for async leaks — unclosed timers or missing `vi.useFakeTimers()` teardown.

### ESLint Warnings on Commit

Pre-commit hooks run `eslint --fix` via lint-staged. If you see accessibility warnings from `eslint-plugin-jsx-a11y`, fix them before committing. Common ones:

- `label-has-associated-control` — add `htmlFor` to `<label>` matching an `<input id>`.
- `click-events-have-key-events` — add `onKeyDown` handler for `Enter`/`Space` alongside `onClick`.

---

## Cloudflare Worker

### Worker Deploy Fails: "Script too large"

The Worker bundle must stay under 1 MB compressed. Check bundle size:
```bash
pnpm build:worker && wc -c dist-worker/index.js
```

If too large, ensure heavy libraries aren't imported in Worker routes (e.g., `recharts`, `@radix-ui`).

### 401 on `/api/*` Routes

1. Verify Auth0 JWKS endpoint is reachable from the Worker.
2. Ensure `AUTH0_DOMAIN` and `AUTH0_AUDIENCE` are set via `wrangler secret put`.
3. For device tokens, confirm `DEVICE_JWT_SECRET` is in Wrangler secrets (not `wrangler.toml`).

### WebSocket Connection Drops

1. Check the Durable Object is deployed: `wrangler tail` should show DO activity.
2. The Worker has a 30-second ping interval — ensure the client sends pings.
3. Rate limiter may be blocking: check `RateLimiter` DO logs.

---

## iOS App

### Xcode Build: Swift Strict Concurrency Errors

Common with `@Observable @MainActor` classes:
- Properties accessed in `deinit` → mark `nonisolated(unsafe)`.
- Callbacks from `nonisolated` delegates → wrap in `Task { @MainActor in }`.
- Timer/URLSession closures → use static loggers (`AppLogger.webSocket`) instead of `self?.logger`.

### HealthKit Authorization Not Showing

1. Ensure `NSHealthShareUsageDescription` and `NSHealthUpdateUsageDescription` are in `Info.plist`.
2. On Simulator, HealthKit availability returns `false`. Test on a real device.
3. Check that `HealthKit` capability is enabled in the Xcode project target.

### WebSocket Won't Connect (iOS)

1. Verify `AppConfig.WebSocket.url` is correct for your build configuration (`DEBUG` vs release).
2. For local dev: ensure your Mac's IP is reachable from the device and the Worker is running on port 8789.
3. Check the console for `WebSocketBridge` log messages.

### CoreML Model Loading Fails

1. Confirm `.mlmodelc` files are included in the app bundle (Build Phases → Copy Bundle Resources).
2. Check model compatibility with the deployment target's CoreML version.
3. Review `PostureAnalyzer` or `GaitAnalyzer` init logs.

---

## Docker / Local Development

### Docker Build Fails

```bash
docker compose build --no-cache
```

Ensure Docker Desktop is running and has sufficient memory (>4 GB recommended).

### Port Conflicts

Default ports:
- `5173` — Vite dev server
- `8789` — Wrangler local Worker

Kill conflicting processes:
```bash
lsof -i :5173 | awk 'NR>1 {print $2}' | xargs kill
```

---

## CI / GitHub Actions

### Coverage Below Threshold

Vitest thresholds are enforced in `vitest.config.ts`:
- Lines: 30%, Branches: 25%, Functions: 30%, Statements: 30%

Add tests for uncovered areas or adjust thresholds if the change is justified.

### SonarCloud Quality Gate Failed

Check [SonarCloud dashboard](https://sonarcloud.io) for the specific issue. Common causes:
- New code coverage below gate threshold.
- Code smells or duplicated code introduced.
- Security hotspots flagged.
