---
name: add-e2e-test
description: "Scaffold a new Playwright E2E test for VitalSense. Use when adding end-to-end tests for user flows, page interactions, API verification, or regression tests. Includes test file creation, page object patterns, and CI integration."
argument-hint: "Feature or page to test (e.g., 'login flow', 'health dashboard', 'fall risk alerts')"
---

# Add E2E Test

## When to Use
- Add end-to-end tests for a new user flow
- Create regression tests for bug fixes
- Test API responses through the UI layer
- Verify accessibility in a full browser context

## Prerequisites
- Playwright installed: `pnpm exec playwright install chromium`
- App builds: `pnpm build`
- Config: `playwright.config.ts` (testDir: `./e2e`, baseURL: `http://localhost:4173`)

## Procedure

### 1. Create Test File
Create `e2e/<feature-name>.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('<Feature Name>', () => {
  test('should <expected behavior>', async ({ page }) => {
    await page.goto('/');

    // Interact with the page
    await page.click('[data-testid="feature-button"]');

    // Assert outcomes
    await expect(page.locator('[role="alert"]')).toBeVisible();
  });

  test('should handle error state', async ({ page }) => {
    // Test error scenarios
  });

  test('should be keyboard accessible', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const focused = page.locator(':focus');
    await expect(focused).toBeAttached();
  });
});
```

### 2. Test Patterns (Reference: `e2e/smoke.spec.ts`)
- **Page load**: `await page.goto('/')` + `await expect(page).toHaveTitle(/VitalSense/i)`
- **No console errors**: Capture `page.on('pageerror')`, assert empty
- **API calls**: Use `request` fixture for direct API testing
- **Network idle**: `await page.waitForLoadState('networkidle')`
- **Keyboard nav**: Tab through elements, assert `:focus` is attached

### 3. Add Page Object (for complex pages)
Create `e2e/pages/<page-name>.ts`:

```typescript
import { type Page, type Locator } from '@playwright/test';

export class FeaturePage {
  readonly page: Page;
  readonly heading: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.getByRole('heading', { name: /feature/i });
    this.submitButton = page.getByRole('button', { name: /submit/i });
  }

  async goto() {
    await this.page.goto('/feature');
  }

  async submit() {
    await this.submitButton.click();
  }
}
```

### 4. Run Tests
```bash
# Run all E2E tests
pnpm exec playwright test

# Run specific test file
pnpm exec playwright test e2e/<feature-name>.spec.ts

# Run with UI mode (for debugging)
pnpm exec playwright test --ui

# Run headed (see the browser)
pnpm exec playwright test --headed
```

### 5. CI Considerations
- CI uses `reporter: 'github'`, retries: 2, single worker
- WebServer auto-starts via `pnpm preview` on port 4173
- Artifacts: `playwright-report/` directory

## Checklist
- [ ] Test file in `e2e/` directory
- [ ] Descriptive test names explaining expected behavior
- [ ] Happy path + error scenarios covered
- [ ] No hardcoded waits — use `waitForLoadState` or `expect` with auto-retry
- [ ] Accessibility checks (keyboard navigation, ARIA assertions)
- [ ] No console errors asserted where appropriate
- [ ] Page object created if >3 tests reference the same page
- [ ] Tests pass locally: `pnpm exec playwright test`
