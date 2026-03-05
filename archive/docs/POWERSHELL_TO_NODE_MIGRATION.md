# PowerShell → Node Migration Guide

This document tracks migration of PowerShell scripts to Node.js equivalents for cross‑platform workflows.

## Completed migrations (use Node scripts)

- scripts/probe.ps1 → scripts/node/health/probe.js
  - npm: `npm run probe:dev`
  - VS Code: tasks “probe-health-nodejs”, “enhanced-probe-nodejs”
- scripts/check-bundle-size.ps1 → scripts/quick-bundle-check.js
  - VS Code: “📦 Quick Bundle Check” now uses Node
- scripts/verify-production-branding.ps1 → scripts/node/branding/verify-production-branding.js (purpose narrowed to branding markers)
  - npm: `npm run verify:branding:node` (or `node scripts/node/branding/verify-production-branding.js`)
  - VS Code: “💎 Node: Production Branding Check” (production) & “💎 Node: Local Branding Check” (local Worker)
- scripts/verify-vitalsense-rebrand.ps1 → scripts/node/branding/verify-vitalsense-rebrand.js
  - npm: `npm run verify:rebrand`
  - VS Code: “🪄 Node: Rebrand Scan”
- scripts/find-worker-url.ps1 / scripts/find-url.ps1 → scripts/node/branding/find-worker-url.js
  - npm: `npm run find:worker:url`
  - VS Code: “🌐 Node: Find Worker URL”
- scripts/test-browser-endpoints.ps1 → scripts/node/test/test-browser-endpoints.js
- scripts/test-enhanced-health-processing.ps1 → scripts/node/test/test-enhanced-health-processing.js
- scripts/test-websocket-connection.ps1 → scripts/node/test/test-websocket-connection.js
- scripts/simple-context.ps1 → scripts/node/dev/simple-context.js

## Prefer Node where available (PS retained for legacy)

- scripts/probe.ps1
  - Node replacement: scripts/node/health/probe.js
  - package.json keeps `probe:dev:ps` for fallback
- (Removed) scripts/verify-production-branding.ps1
  - Node replacement: scripts/node/branding/verify-production-branding.js
  - PowerShell version deleted (was superseded and no longer needed)
- (Removed) scripts/verify-vitalsense-rebrand.ps1
  - Node replacement: scripts/node/branding/verify-vitalsense-rebrand.js
  - PowerShell version deleted
- (Removed) scripts/find-worker-url.ps1 & scripts/find-url.ps1
  - Node replacement: scripts/node/branding/find-worker-url.js
  - PowerShell versions deleted

## Pending candidates (no direct Node port yet)

- scripts/dns-setup.ps1 → Node candidate exists: scripts/node/deploy/dns-setup.js
  - Update workflows/tasks to call Node variant
- scripts/deploy-platform.ps1 → Node candidate: scripts/node/deploy/platform-deploy.js
- scripts/quick-deploy-auth0.ps1 → Node candidate: scripts/node/deploy/vitalsense-deploy.js
- ios/* PowerShell (lint/format/test): kept for Windows dev; Node wrappers not planned (Swift tooling is platform specific)

### New Node-only utilities (no prior PowerShell equivalent or PS now removed)

- Branding verification (prod/local): `scripts/node/branding/verify-production-branding.js`
- Rebrand residue scan: `scripts/node/branding/verify-vitalsense-rebrand.js`
- Worker URL discovery: `scripts/node/branding/find-worker-url.js`

These are integrated into `package.json` and will be referenced in CI shortly.

## How to choose

- Prefer Node scripts for CI and cross‑platform local runs.
- Keep PowerShell for iOS/Swift-specific flows or Windows-centric utilities.

## Next steps

- Replace remaining VS Code tasks that reference PS when Node equivalents exist (in progress; branding tasks added).
- Update GitHub Actions to invoke Node scripts for probes/tests/branding (branding audit job being added).
- Move any residual deprecated PS scripts into `scripts/legacy/` (branding-related PS already removed).
- Add CI gating (optional) to fail if rebrand scan finds legacy “HealthGuard” references.
- Periodically prune unused PS scripts after each release cycle.

## Audit summary (latest update)

| Domain | Legacy PS | Node Replacement | PS Status | CI Integration |
|--------|-----------|------------------|-----------|----------------|
| Branding (prod) | verify-production-branding.ps1 | branding/verify-production-branding.js | Removed | Pending (added to smoke + deploy) |
| Rebrand Scan | verify-vitalsense-rebrand.ps1 | branding/verify-vitalsense-rebrand.js | Removed | Pending (deploy branding-audit) |
| Worker URL Discovery | find-worker-url.ps1 | branding/find-worker-url.js | Removed | Optional |
| Health Probe | probe.ps1 | health/probe.js | Retained (fallback) | Used in smoke |
| Enhanced Health Processing | test-enhanced-health-processing.ps1 | test/test-enhanced-health-processing.js | Removed | Test suites |
| WebSocket Test | test-websocket-connection.ps1 | test/test-websocket-connection.js | Removed | Test suites |
| Browser Endpoints | test-browser-endpoints.ps1 | test/test-browser-endpoints.js | Removed | Test suites |

> This table will be pruned once all CI workflows exclusively use Node scripts.
