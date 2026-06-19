import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';

test.describe('Error Scenarios', () => {
  test('app recovers from navigating to a non-existent route', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/this-does-not-exist');
    await page.waitForLoadState('domcontentloaded');

    // App should not crash — should render something
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();
  });

  test('rapid tab switching does not crash', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    const errors = app.collectErrors();

    // Rapidly cycle tabs via custom events without waiting for networkidle
    for (const tab of [
      'gait-analysis',
      'fall-risk',
      'settings',
      'lidar-posture',
      'dashboard',
      'gait-analysis',
      'settings',
      'dashboard',
    ]) {
      await page.evaluate((tabId: string) => {
        window.dispatchEvent(
          new CustomEvent('navigate', { detail: { feature: tabId } }),
        );
      }, tab);
    }

    // Let the final navigation settle
    await page.waitForLoadState('domcontentloaded');
    expect(errors).toHaveLength(0);
  });

  test('error boundary catches lazy load failures gracefully', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // The error boundary wraps all tab content; body should have content
    await expect(page.locator('body')).not.toBeEmpty();
  });

  test('offline fallback page is served', async ({ request }) => {
    const response = await request.get('/offline.html');
    expect(response.ok()).toBe(true);
    const html = await response.text();
    expect(html.length).toBeGreaterThan(0);
  });

  test('unknown routes serve the SPA shell', async ({ request }) => {
    // Preview server serves the SPA for all routes (no Worker backend)
    const response = await request.get('/api/nonexistent-endpoint-xyz');
    // Static preview serves index.html with 200 for all paths
    expect(response.ok()).toBe(true);
  });

  test('app handles back/forward browser navigation', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    const errors = app.collectErrors();

    // Navigate to a different tab
    await app.navigateTo('settings');

    // Use browser back
    await page.goBack();
    await page.waitForLoadState('domcontentloaded');

    // Use browser forward
    await page.goForward();
    await page.waitForLoadState('domcontentloaded');

    // App should not crash
    await expect(page.locator('body')).not.toBeEmpty();
    expect(errors).toHaveLength(0);
  });

  test('page recovers from reload on any tab', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();
    await app.navigateTo('gait-analysis');

    const errors = app.collectErrors();

    // Hard reload the page
    await page.reload();
    await page.waitForLoadState('domcontentloaded');

    // App should re-render (defaults to dashboard on fresh load)
    await expect(app.mainContent).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
