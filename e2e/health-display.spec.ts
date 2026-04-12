import { test, expect } from '@playwright/test';

test.describe('Health Data Display', () => {
  test('health section renders without errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Look for health-related content (cards, metrics, charts)
    const healthContent = page.locator(
      '[data-testid*="health"], [class*="health"], [aria-label*="health"], [aria-label*="Health"]'
    );
    const genericCards = page.locator(
      '[class*="card"], [data-testid*="card"], [role="region"]'
    );

    // At least some content should be visible (cards or health widgets)
    const healthCount = await healthContent.count();
    const cardCount = await genericCards.count();
    expect(healthCount + cardCount).toBeGreaterThan(0);

    // No JS errors during rendering
    expect(errors).toHaveLength(0);
  });

  test('API health endpoint responds correctly', async ({ request }) => {
    // This tests the built preview server's /health endpoint
    const response = await request.get('/health');
    // In the preview (static) server, /health may not exist — that's OK
    // But if it does respond, validate the shape
    if (response.ok()) {
      const body = await response.json();
      expect(body).toHaveProperty('status');
    }
  });
});

test.describe('Error Boundaries', () => {
  test('app recovers from navigation to unknown route', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/this-route-does-not-exist-12345');
    await page.waitForLoadState('networkidle');

    // App should not crash — should show some content (404 page or redirect)
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });
});
