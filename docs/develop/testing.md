# Testing Guide

Testing strategy and commands for the VitalSense health monitoring platform.

## Test Types

### Unit Tests (Vitest)

Colocated `*.test.ts(x)` files next to source code. Uses Vitest with `@testing-library/react` for component tests.

```bash
pnpm test              # Run all unit tests
pnpm test -- --watch   # Watch mode
pnpm test:coverage     # Coverage report
```

### E2E Tests (Playwright)

End-to-end tests in `e2e/` directory.

```bash
pnpm test:e2e          # Run Playwright tests
```

Configuration: [playwright.config.ts](../../playwright.config.ts)

When API/Worker endpoints are required during E2E, run tests against a local Worker runtime:

```bash
E2E_USE_WRANGLER=true pnpm test:e2e
```

CI and nightly workflows use this mode so `/api/*`, `/ws`, and `/health` routes are exercised through the Worker instead of a static preview server.

### iOS Tests (XCTest)

Unit and UI tests for the native iOS app.

- Unit tests: `ios/Andernet-Posture/Andernet PostureTests/`
- UI tests: `ios/Andernet-Posture/Andernet PostureUITests/`
- Test plans: `UnitTests.xctestplan`, `SmokeTests.xctestplan`, `FullSuite.xctestplan`, `AccessibilityTests.xctestplan`

```bash
# From ios/ directory
make test              # Run unit tests
make lint              # SwiftLint check
```

## Conventions

- **Colocated tests**: Place `*.test.ts(x)` next to the source file, not in a separate `__tests__` directory.
- **Vitest + @testing-library/react** for component tests.
- **No mocking React Query internals** — wrap components in a test `QueryClientProvider` instead.
- **Zod schemas** are tested by validating known-good and known-bad payloads.
- Health data in fixtures should use synthetic values, never real PII.

## CI Pipeline

Tests run automatically in GitHub Actions:
1. TypeScript type-check (`tsc --noEmit`)
2. ESLint
3. Vitest unit tests
4. Bundle size budget check
5. SwiftLint (iOS)
## Adding New Tests

### Unit Test Template
```typescript
import { describe, test, expect } from 'vitest'
import { yourFunction } from '../your-module'

describe('Your Module', () => {
  test('does something correctly', () => {
    const result = yourFunction(input)
    expect(result).toMatchExpectedOutput()
  })
})
```

### Integration Test Template
```typescript
test('endpoint works correctly', async () => {
  const response = await fetch(`${API_URL}/your-endpoint`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ /* test data */ }),
  })
  expect(response.ok).toBe(true)
  const data = await response.json()
  expect(data).toMatchExpectedStructure()
})
```

## Golden Datasets

Golden datasets are stored in `fixtures/golden/` and represent expected outputs for acceptance tests. When updating algorithms, update golden datasets accordingly.

## Continuous Integration

Tests should be run in CI/CD pipelines:
- On every pull request
- Before merging to main
- On scheduled basis for regression detection

## Test Maintenance

- Update tests when adding new features
- Update golden datasets when algorithm behavior changes
- Keep test data realistic but minimal
- Ensure tests are deterministic (no random data without seeds)
