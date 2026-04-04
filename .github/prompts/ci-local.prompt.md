---
description: 'Run the full CI validation pipeline locally before pushing. Includes lint, type-check, test, build, and bundle verification.'
agent: 'agent'
tools: [execute, read]
---

Run the full VitalSense CI pipeline locally to validate before pushing:

1. **Lint**: `pnpm run lint`
2. **Type Check**: `pnpm run type-check`
3. **Tests**: `pnpm test`
4. **Build App**: `pnpm run build`
5. **Build Worker**: `pnpm run build:worker`
6. **Verify**: Check `dist/` and `dist-worker/index.js` exist and are reasonable size

Report pass/fail for each step. If any step fails, diagnose and suggest fixes. Stop at the first failure — no point building if lint fails.

Use the VitalSense branding check: grep for "Health App" in user-facing strings — it should always be "VitalSense".
