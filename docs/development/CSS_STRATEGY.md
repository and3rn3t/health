# VitalSense CSS Strategy

Date: 2025-09-17

This document codifies our CSS approach for the VitalSense app to balance performance, maintainability, and simplicity.

## Summary

- Consolidate production CSS into a single hashed bundle generated from `src/main.css` (Tailwind v4 + PostCSS).
- Only split CSS when it directly corresponds to a lazy‑loaded feature chunk that is large and infrequently used.
- Prefer Tailwind utilities and component primitives over bespoke CSS files.

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
