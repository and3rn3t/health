# CI Performance Optimizations

## Overview

This document outlines additional performance enhancements for the CI workflow to reduce test execution time and improve overall pipeline efficiency.

## Current Optimizations Applied ✅

1. ✅ ESLint caching with GitHub Actions cache
2. ✅ TypeScript incremental compilation enabled
3. ✅ Tests split into parallel jobs
4. ✅ Vitest parallel execution (4 threads in CI)
5. ✅ TypeScript build info caching

## Recommended Additional Optimizations

### 1. **pnpm Dependencies Caching** ⚡ HIGH IMPACT

**Problem**: Each job reinstalls dependencies from scratch, even though pnpm store is cached.

**Solution**: Cache `node_modules` across jobs using a shared cache key.

**Implementation**:
```yaml
- name: Cache node_modules
  uses: actions/cache@v4
  with:
    path: node_modules
    key: node-modules-${{ runner.os }}-${{ hashFiles('pnpm-lock.yaml') }}
    restore-keys: |
      node-modules-${{ runner.os }}-
```

**Expected Savings**: 30-60 seconds per job (50-80% faster dependency installation)

---

### 2. **Vite Build Cache** ⚡ HIGH IMPACT

**Problem**: Vite rebuilds everything even when source hasn't changed.

**Solution**: Cache Vite's build cache directory.

**Implementation**:
```yaml
- name: Cache Vite build
  uses: actions/cache@v4
  with:
    path: |
      node_modules/.vite
      dist
    key: vite-build-${{ runner.os }}-${{ hashFiles('src/**/*.{ts,tsx}', 'vite.config.ts') }}
    restore-keys: |
      vite-build-${{ runner.os }}-
```

**Expected Savings**: 10-30 seconds for subsequent builds

---

### 3. **Test Sharding** ⚡ HIGH IMPACT

**Problem**: Large test suites run sequentially on a single runner.

**Solution**: Split tests into smaller shards that run in parallel.

**Implementation**: Update `vitest.config.ts`:
```typescript
test: {
  pool: 'threads',
  poolOptions: {
    threads: {
      maxThreads: process.env.CI ? 4 : 8,
      minThreads: process.env.CI ? 2 : 4,
      // Enable sharding when CI_SHARD is set
      ...(process.env.CI_SHARD && {
        shard: process.env.CI_SHARD,
      }),
    },
  },
}
```

**In workflow**, create matrix strategy:
```yaml
tests_unit:
  strategy:
    matrix:
      shard: [1, 2, 3, 4]
  env:
    CI_SHARD: ${{ format('{0}/{1}', matrix.shard, strategy.job-total) }}
```

**Expected Savings**: 40-60% faster for large test suites

---

### 4. **Incremental Testing** ⚡ MEDIUM IMPACT

**Problem**: All tests run on every commit, even when only specific files changed.

**Solution**: Use Vitest's `changed` mode with fallback to full suite.

**Implementation**:
```yaml
- name: Detect changed test files
  id: changed
  uses: tj-actions/changed-files@v44
  with:
    files: |
      src/**/*.{ts,tsx}
      src/**/*.test.{ts,tsx}
      src/**/__tests__/**/*.{ts,tsx}

- name: Run Tests (incremental or full)
  run: |
    if [ "${{ steps.changed.outputs.any_changed }}" == "true" ]; then
      # Run only tests related to changed files
      pnpm exec vitest run --changed
    else
      # Run full suite for documentation/CI config changes
      pnpm run test:coverage
    fi
```

**Expected Savings**: 50-80% faster for small PRs

---

### 5. **Early Failure Detection** ⚡ MEDIUM IMPACT

**Problem**: Slow tests run even when fast tests fail.

**Solution**: Run fast tests first, then slow tests.

**Implementation**:
```yaml
- name: Quick Unit Tests (fast fail)
  run: pnpm exec vitest run --reporter=verbose --run src/**/*.test.ts --testTimeout=5000

- name: Full Test Suite (if quick tests pass)
  if: success()
  run: pnpm run test:coverage
```

**Expected Savings**: Faster feedback (fail in 2-3 min instead of 10-15 min)

---

### 6. **Parallel Job Dependencies** ⚡ HIGH IMPACT

**Problem**: Jobs wait unnecessarily for others to complete.

**Solution**: Optimize job dependencies - start independent jobs immediately.

**Current**: All test jobs wait for `code_quality`

**Optimized**: Start test jobs immediately after build, only lint/typecheck in code_quality:

```yaml
tests_unit:
  needs: build  # Start immediately after build

code_quality:  # Can run in parallel with tests
  needs: build
```

**Expected Savings**: 1-2 minutes saved per workflow run

---

### 7. **Build Artifact Reuse** ⚡ MEDIUM IMPACT

**Problem**: Each job rebuilds if artifacts missing.

**Solution**: More aggressive artifact caching and sharing.

**Implementation**:
```yaml
- name: Cache build artifacts
  uses: actions/cache@v4
  with:
    path: |
      dist/**
      dist-worker/**
    key: build-artifacts-${{ github.sha }}
    restore-keys: |
      build-artifacts-
```

**Expected Savings**: Avoids rebuilds when artifacts available

---

### 8. **Vitest Pool Optimization** ⚡ LOW-MEDIUM IMPACT

**Problem**: Using threads pool but not optimized for CI.

**Solution**: Use `forks` pool for better isolation and stability.

**Implementation**:
```typescript
pool: process.env.CI ? 'forks' : 'threads',
poolOptions: {
  forks: {
    singleFork: false,
    isolate: true,
    maxForks: process.env.CI ? 2 : 4,
    minForks: 1,
  },
}
```

**Expected Savings**: More stable tests, slightly faster execution

---

### 9. **Test Timeout Optimization** ⚡ LOW IMPACT

**Problem**: Default timeouts may be too high, slowing down failure detection.

**Solution**: Set appropriate timeouts per test type.

**Implementation** in `vitest.config.ts`:
```typescript
test: {
  testTimeout: 10000,  // 10s default (was unlimited)
  hookTimeout: 5000,   // 5s for hooks
  teardownTimeout: 5000,
}
```

**Expected Savings**: Faster failure detection (fail at timeout instead of waiting longer)

---

### 10. **Conditional Test Execution** ⚡ MEDIUM IMPACT

**Problem**: Running all tests even when only specific areas changed.

**Solution**: Use path-based test filtering.

**Implementation**:
```yaml
- name: Determine test scope
  id: test-scope
  run: |
    if git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -q 'src/lib/ml'; then
      echo "scope=ml" >> $GITHUB_OUTPUT
    elif git diff --name-only ${{ github.event.before }} ${{ github.sha }} | grep -q 'src/components'; then
      echo "scope=components" >> $GITHUB_OUTPUT
    else
      echo "scope=all" >> $GITHUB_OUTPUT
    fi

- name: Run Targeted Tests
  run: |
    if [ "${{ steps.test-scope.outputs.scope }}" == "ml" ]; then
      pnpm test src/lib/ml/**/*.test.ts
    elif [ "${{ steps.test-scope.outputs.scope }}" == "components" ]; then
      pnpm test src/components/**/*.test.ts
    else
      pnpm run test:coverage
    fi
```

**Expected Savings**: 60-80% faster for targeted changes

---

## Priority Implementation Order

### Phase 1 (Immediate - Highest ROI)
1. **pnpm node_modules caching** - Easy to implement, huge impact
2. **Parallel job dependencies** - Simple change, significant time savings
3. **Test sharding** - Medium complexity, large impact

### Phase 2 (Short-term)
4. **Incremental testing** - Medium complexity, great for small PRs
5. **Early failure detection** - Low complexity, better developer experience
6. **Vite build cache** - Easy, good savings

### Phase 3 (Long-term)
7. **Conditional test execution** - Higher complexity, excellent for large repos
8. **Vitest pool optimization** - Medium complexity, stability improvements
9. **Test timeout optimization** - Easy, marginal gains
10. **Build artifact reuse** - Medium complexity, avoids rebuilds

---

## Expected Overall Impact

### Current State
- Average CI time: ~15-20 minutes
- Test execution: ~10-12 minutes

### After Phase 1
- Average CI time: ~10-12 minutes (**30-40% reduction**)
- Test execution: ~5-7 minutes (**50% reduction**)

### After All Phases
- Average CI time: ~6-8 minutes (**60-70% reduction**)
- Test execution: ~3-4 minutes (**70-75% reduction**)

---

## Implementation Notes

### Testing Strategy
- Implement optimizations incrementally
- Monitor CI run times for each phase
- Ensure test reliability doesn't decrease
- Keep fallback to full test suite for safety

### Rollout Plan
1. Start with Phase 1 optimizations (low risk, high reward)
2. Monitor for 1-2 weeks
3. Proceed to Phase 2 if metrics are positive
4. Evaluate Phase 3 based on team feedback and complexity

### Metrics to Track
- Average CI duration (by job)
- Test execution time
- Cache hit rates
- Test failure rates (should remain stable)
- Developer satisfaction (faster feedback)

---

## Additional Recommendations

### GitHub Actions Settings
1. **Enable dependency caching** in repository settings
2. **Use larger runners** for test jobs if available (4-core vs 2-core)
3. **Increase artifact retention** if builds are reused frequently

### Code-Level Optimizations
1. **Mock expensive operations** in tests (network calls, file I/O)
2. **Use test fixtures** instead of generating data on-the-fly
3. **Split large test files** into smaller, focused tests
4. **Remove unnecessary setup/teardown** in tests

### Infrastructure
1. **Consider self-hosted runners** for dedicated CI resources
2. **Use GitHub Actions usage insights** to optimize spending
3. **Set up test result artifacts** for faster debugging
