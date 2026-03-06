# Performance SLO & Governance

This document defines the current performance Service Level Objectives (SLOs), budgets, and governance tooling used to keep the VitalSense web app fast and predictable.

**Last Updated:** 2025-09-18

## Objectives

| Area | Target / Budget | Hard Fail Condition | Source of Truth / Script |
|------|-----------------|---------------------|---------------------------|
| JS Bundle (total gzip) | <= 400 KB | > 400 KB (`ci:bundle-threshold`) | `scripts/ci/verify-bundle-threshold.mjs` |
| CSS Bundle (total gzip) | <= 60 KB | > 60 KB (`ci:bundle-threshold`) | same as above |
| Bundle Drift (JS) | + <= 15 KB vs `main` | > +15 KB delta | `scripts/ci/compare-bundle-drift.mjs` |
| Bundle Drift (CSS) | + <= 5 KB vs `main` | > +5 KB delta | same drift script |
| Import Latency (synthetic) | < 1200 ms | > 1200 ms (status = degraded) | `scripts/ci/performance-slo-probe.mjs` |
| WebSocket Schema Types | Stable / declared | Unexpected type w/o hash update | `scripts/ci/websocket-schema-drift.mjs` |
| WebSocket Resilience | Reconnect < 6s | Failure / timeout | `scripts/node/test/test-websocket-reconnect.js` |

## Tooling Overview

| Script | Purpose | Output |
|--------|---------|--------|
| `ci:bundle-threshold` | Enforce absolute gzip budgets | `reports/bundle-threshold.json` |
| `ci:bundle-drift` | Compare build vs `origin/main` (worktree) | `reports/bundle-drift.json` |
| `ci:perf-slo` | Synthetic import latency + bundle snapshot | `reports/perf-slo.json`, history file |
| `ci:ws-schema` | Validate runtime WS types vs baseline/hash | `reports/ws-schema-drift.json` |
| `branding:audit` | Branding integrity & residue scan | `reports/branding-audit-summary.md` |

## Interpretation

### Status Levels

- **PASS**: All budgets within thresholds; no drift or unexpected schema.
- **DEGRADED**: A non-fatal SLO early warning (e.g. import latency > 1200 ms, near budget but not over hard fail). Improve before merging repeated degradations.
- **FAIL**: Budget exceeded or unexpected WebSocket type (without intentional baseline hash update) → blocks merge.

### Typical Remediation Flow

1. Check drift report `reports/bundle-drift.json` → identify largest delta modules.
2. If vendor bloat: investigate recently added dependencies (tree-shakability, dynamic import candidate).
3. If app code grew: split rarely used feature behind `React.lazy()` boundary.
4. If import latency high: profile during local `start-dev` with DevTools Coverage + Performance.
5. For WebSocket schema changes: update `schemas/websocket-message-types.json` + run `npm run ci:ws-schema -- --update-hash` intentionally in a dedicated PR.

## History & Trend Tracking

`ci:perf-slo` maintains a rolling `reports/perf-slo-history.json` (last 50 entries). Use this to:

- Spot gradual creep (e.g. +3–5 KB per PR).
- Justify refactors or dependency slimming.

A future enhancement will generate a Markdown badge panel & graphs from this history.

## Developer Workflow Checklist (Performance Angle)

- Before opening PR: run `npm run build && npm run ci:bundle-threshold`.
- After large dependency add: run `npm run ci:bundle-drift`.
- Suspicious latency: run `npm run ci:perf-slo` twice (stability check) and inspect deltas.
- WebSocket type addition: update baseline JSON + hash (separate PR, clear commit message).

## Adding a New Performance Budget

1. Decide metric (e.g., Largest Async Chunk Gzip <= 150 KB).
2. Add collection to a CI script output (e.g., extend `compare-bundle-drift.mjs`).
3. Store to `reports/` JSON.
4. Update this doc + `DOCUMENTATION_INDEX.md`.
5. Integrate gating (soft warn first, convert to fail after stabilization).

## Planned Enhancements

- Synthetic page load probe (Playwright) measuring paint + hydration.
- CI summary badge generation.
- Per-chunk budgets for vendor/app separation.
- Performance badge injection in README with rolling trends.

## Source Map & Debug Strategy

- Keep source maps only in non-production preview / build analysis tasks.
- Strip large dev-only comments before final Worker deploy.

## FAQ

**Q: Drift failed but total bundle under budget—should I ignore?**  
A: No. Drift guards early creep. Investigate; if justified (new approved feature), adjust architecture (lazy-load) rather than raising ceiling.

**Q: Import latency fluctuates slightly across runs.**  
A: Treat <10% variance as noise. Re-run; if persistent, inspect recently touched initialization code.

---
**Owner:** Performance Governance Working Set (default: whoever merged last perf change)
