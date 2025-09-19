# VitalSense CSS Strategy

> [!IMPORTANT]
> This document is the **canonical source** for all CSS policy (strategy, tokens, guard enforcement, contrast, baseline drift). It supersedes the older `CSS_GUARD_ENFORCEMENT.md` file, which is now deprecated and retained only as a pointer to avoid breaking historical links.

Date: 2025-09-17

This document codifies our CSS approach for the VitalSense app to balance performance, maintainability, and simplicity.

## Summary

- Consolidate production CSS into a single hashed bundle generated from `src/main.css` (Tailwind v4 + PostCSS).
- Only split CSS when it directly corresponds to a lazy‑loaded feature chunk that is large and infrequently used.
- Prefer Tailwind utilities and component primitives over bespoke CSS files.
- Enforce automated accessibility + size guard (contrast, line/byte limits, utility leakage) on `src/main.css` via pre-commit + CI.

## Rationale

- Fewer CSS files lead to fewer render‑blocking requests and better cache behavior at the edge (Cloudflare Workers).
- Tailwind utilities reduce the need for component‑scoped CSS; custom rules live in Tailwind `@layer` blocks inside `main.css`.
- Our SPA architecture (single route) provides limited benefit from aggressive CSS splitting unless we also code‑split features.

## When to consolidate

- Global theme tokens, base resets, and shared component styles → `src/main.css`.
- Legacy/standalone component CSS not tied to lazy chunks → fold into `main.css` and remove the extra file.

## When to split

- The feature is dynamically imported and sizable (e.g., LiDAR 3D/visual analytics), and its styles are unique.
- Place its CSS alongside the feature so Vite extracts it with the JS chunk (natural CSS code‑splitting).

## Guardrails and measurement

- Target CSS bundle: ≤ ~60 KB minified (current state ~53 KB, acceptable).
- Use VS Code tasks to measure:
  - "📦 Quick Bundle Check" – fast size summary
  - "🔍 Full Bundle Analysis" – detailed composition
- Author file constraints (guard enforced):
  - ≤250 lines (configurable `CSS_GUARD_MAX_LINES`)
  - ≤15 KB authored source (configurable `CSS_GUARD_MAX_BYTES`)
  - Exactly one sentinel comment `/* SENTINEL:EOF */`
  - No pasted generated Tailwind utilities (`--tw-` vars or bulk utility selectors)
  - All semantic color token pairs pass WCAG AA (normal 4.5+, large/UI 3.0+)
  - Duplicate conflicting root token definitions prohibited

### Contrast & Token Enforcement

Automated scripts:

| Purpose | Command / Script |
|---------|------------------|
| Run guard locally | `pnpm run guard:css` |
| Install pre-commit hook | `pnpm run hook:css-guard` |
| CI hard gate | `pnpm run ci:css-guard` |
| Drift detection (soft) | `pnpm run ci:css-contrast-drift` |

Artifacts: `reports/contrast-report.json` (pairs, ratios, file metrics). Baseline stored at `scripts/ci/baselines/contrast-baseline.json` for regression detection (default max regression Δ=0.10).

Environment overrides:

| Var | Meaning | Default |
|-----|---------|---------|
| `CSS_GUARD_MAX_LINES` | Line limit | 250 |
| `CSS_GUARD_MAX_BYTES` | Byte size limit | 15360 |
| `CSS_GUARD_ALLOW_TW` | Permit raw utility leakage (emergency) | false |
| `CSS_CONTRAST_MAX_DELTA` | Allowed contrast regression delta | 0.10 |
| `CSS_UPDATE_BASELINE` | If `true` and no regressions, update baseline | (unset) |

Dark theme adjustments (Sept 2025): dark `--primary` unified to `#2563eb`, `--destructive` to `#dc2626`, and `--accent-foreground` to `#333333` raising all dark theme pairs to AA normal.

Baseline workflow:

1. Improve tokens (guard still passes).
2. Run `pnpm run ci:css-contrast-drift` locally. If happy with new ratios: proceed.
3. `CSS_UPDATE_BASELINE=true pnpm run ci:css-contrast-drift` to update stored baseline.
4. Commit updated baseline file.

Borderline warnings identify pairs within 0.05 of their threshold—treat them as proactive tuning candidates.

## Implementation notes

- Authoring: keep custom rules in `src/main.css` using Tailwind `@layer base|components|utilities`.
- Avoid inline styles; prefer Tailwind utilities and existing UI primitives (`src/components/ui/*`).
- Data‑attribute variants (e.g., Radix) are supported; expect benign warnings during minification.

## Caching & deployment

- Vite emits hashed CSS filenames; the Worker should serve them with long `Cache-Control` and rely on hash for invalidation.
- Avoid multiple global CSS assets; prefer one main CSS to maximize cache hit ratio.

## Maintenance checklist

- Before adding new CSS files, ask: can this be expressed via Tailwind utilities or a small `@layer` in `main.css`?
- If creating a lazy feature: confirm its CSS is collocated so it splits with the JS chunk.
- After changes, run the bundle checks and verify no visual regressions in dark mode and sidebars.
