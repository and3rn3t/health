---
description: 'Plan a dependency or framework migration with impact analysis, step-by-step guide, and test verification for VitalSense.'
---

Create a migration plan for the described dependency or framework upgrade:

1. **Impact Analysis**
   - List all files importing/using the dependency (search the codebase)
   - Identify breaking changes from the changelog or migration guide
   - Flag affected tests

2. **Risk Assessment**
   - Rate: LOW (drop-in replacement), MEDIUM (API changes), HIGH (architectural impact)
   - Identify rollback strategy

3. **Step-by-Step Migration**
   - Ordered list of changes with file paths
   - Code examples for each breaking change
   - New patterns replacing deprecated APIs

4. **Testing Strategy**
   - Which existing tests need updating
   - New tests needed for changed behavior
   - Manual verification steps

5. **Verification Checklist**
   - [ ] `pnpm type-check` passes
   - [ ] `pnpm lint` passes
   - [ ] `pnpm test` — all tests pass
   - [ ] `pnpm build` — app builds
   - [ ] `pnpm build:worker` — worker builds
   - [ ] Bundle size within target (~187KB)
   - [ ] No new `any` types introduced
