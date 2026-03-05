# CI Integration for Geospatial Tests

## Overview

Geospatial and workflow tests have been integrated into the CI/CD pipeline to ensure all features are automatically tested on every commit and pull request.

## Test Suites in CI

### 1. **Unit Tests w/ Coverage** (`test:coverage`)
- Runs all unit tests with coverage reporting
- Enforces minimum 10% coverage threshold
- Generates coverage artifacts for tracking

### 2. **Geospatial Tests (Phase 2-3)** (`test:geospatial`)
- **Location**: `src/lib/__tests__/`
- **Test Files**:
  - `risk-scoring.test.ts` - Risk scoring calculations
  - `explainability.test.ts` - AI explainability features
  - `change-detection.test.ts` - Change detection algorithms
  - `vector-spatial.test.ts` - Vector spatial operations
  - `lidar.test.ts` - LiDAR processing functions
  - `features.test.ts` - Feature extraction
- **Total**: 38 tests covering Phase 2-3 geospatial features

### 3. **Phase 5 Workflow Tests** (`test:phase5`)
- **Location**: `src/lib/__tests__/`
- **Test Files**:
  - `projects.test.ts` - Projects and AOI workflows
  - `scheduling.test.ts` - Scheduled analyses
  - `exports.test.ts` - Export functionality
  - `rbac.test.ts` - RBAC and audit trails
- **Total**: 39 tests covering Phase 5 workflow features

### 4. **Acceptance Tests** (Optional)
- **Location**: `src/__tests__/analysis.acceptance*.test.ts`
- Tests against golden datasets
- Validates end-to-end analysis workflows
- Runs with soft failure (doesn't block CI)

## CI Workflow

The tests run in the `code_quality` job in `.github/workflows/ci-core.yml`:

```yaml
- name: Unit Tests w/ Coverage (enforced)
  run: pnpm run test:coverage
- name: Geospatial Tests (Phase 2-3)
  run: pnpm run test:geospatial
- name: Phase 5 Workflow Tests
  run: pnpm run test:phase5
- name: Acceptance Tests
  run: pnpm test src/__tests__/analysis.acceptance*.test.ts || echo "Acceptance tests optional"
```

## Test Execution

### Local Testing

```bash
# Run all tests
npm test

# Run geospatial tests only
npm run test:geospatial

# Run Phase 5 tests only
npm run test:phase5

# Run with coverage
npm run test:coverage
```

### CI Execution

Tests run automatically on:
- **Push** to `main` or `develop` branches
- **Pull Requests** to `main` or `develop`
- **Tags** starting with `v*`
- **Manual workflow dispatch**

## Test Results

### Expected Output

**Geospatial Tests:**
```
✓ src/lib/__tests__/risk-scoring.test.ts (5 tests)
✓ src/lib/__tests__/explainability.test.ts (5 tests)
✓ src/lib/__tests__/change-detection.test.ts (5 tests)
✓ src/lib/__tests__/vector-spatial.test.ts (6 tests)
✓ src/lib/__tests__/lidar.test.ts (8 tests)
✓ src/lib/__tests__/features.test.ts (9 tests)

Test Files  6 passed (6)
     Tests  38 passed (38)
```

**Phase 5 Tests:**
```
✓ src/lib/__tests__/projects.test.ts (8 tests)
✓ src/lib/__tests__/scheduling.test.ts (10 tests)
✓ src/lib/__tests__/exports.test.ts (13 tests)
✓ src/lib/__tests__/rbac.test.ts (8 tests)

Test Files  4 passed (4)
     Tests  39 passed (39)
```

## Failure Handling

- **Geospatial & Phase 5 Tests**: Hard failure - CI will fail if these tests fail
- **Acceptance Tests**: Soft failure - CI continues but logs the failure

## Adding New Tests

When adding new geospatial or workflow features:

1. **Create test file** in `src/lib/__tests__/`
2. **Add to test script** in `package.json`:
   ```json
   "test:geospatial": "vitest run ... new-test.test.ts"
   ```
3. **Update CI workflow** if needed (usually automatic)
4. **Run locally** to verify: `npm run test:geospatial`

## Coverage Tracking

Test coverage is tracked and reported in CI:
- Coverage artifacts uploaded to GitHub Actions
- Coverage delta computed against baseline
- Minimum 10% coverage enforced (configurable via `coverage-target.json`)

## Troubleshooting

### Tests Fail in CI but Pass Locally

1. Check Node.js version compatibility
2. Verify all dependencies are installed
3. Check for environment-specific issues
4. Review CI logs for detailed error messages

### Coverage Below Threshold

1. Add more test cases
2. Adjust `coverage-target.json` if needed
3. Review uncovered code paths

### Test Timeout

1. Check for long-running tests
2. Increase timeout in `vitest.config.ts` if needed
3. Optimize test data size

## Next Steps

- ✅ Geospatial tests integrated
- ✅ Phase 5 tests integrated
- ✅ Acceptance tests included (optional)
- 🔄 Consider adding integration tests for API endpoints
- 🔄 Add performance benchmarks for large datasets
