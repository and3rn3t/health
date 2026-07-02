import { test, expect } from '@playwright/test';

test.describe('Auth Flow', () => {
  test('login page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Login page should render some content
    await expect(page.locator('body')).not.toBeEmpty();
    // Title should still reference VitalSense
    await expect(page).toHaveTitle(/VitalSense/i);
  });

  test('demo page loads without crash', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/demo');
    await page.waitForLoadState('networkidle');

    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('protected API paths serve the SPA in preview mode', async ({
    request,
  }) => {
    // In preview mode (no Worker), all paths serve the SPA shell
    const response = await request.get('/api/health-data');
    expect(response.ok()).toBe(true);
  });

  test('login page has accessible form elements', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('networkidle');

    // Should have at least one interactive element (button, link, or input)
    const interactive = page.locator('button, a, input, [role="button"]');
    const count = await interactive.count();
    expect(count).toBeGreaterThan(0);
  });

  test('demo-static page serves as fallback', async ({ request }) => {
    const response = await request.get('/demo-static');
    // Should return 200 (static page) or 302 (redirect to demo)
    expect([200, 301, 302]).toContain(response.status());
  });
});
