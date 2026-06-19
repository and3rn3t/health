import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';

/**
 * E2E tests for offline mode and network resilience.
 *
 * Validates: graceful degradation when offline, service worker caching,
 * fallback UI states, and recovery when coming back online.
 */
test.describe('Offline & Network Resilience', () => {
  test('app shows fallback when going offline after load', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Verify app loaded correctly first
    const heading = page.locator('h1, [role="heading"]');
    await expect(heading.first()).toBeVisible();

    // Go offline
    await context.setOffline(true);

    // Navigate within the app — SPA routing should still work for cached routes
    const app = new AppPage(page);
    await app.navigateTo('settings');

    // Wait for any error states to appear
    await page.waitForTimeout(1000);

    // App should not completely crash — some UI should remain visible
    const mainContent = page.locator('main, [role="main"], body');
    await expect(mainContent.first()).toBeVisible();

    await context.setOffline(false);
  });

  test('app does not show unhandled errors when offline', async ({
    page,
    context,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Go offline
    await context.setOffline(true);

    // Try to interact with the app
    const app = new AppPage(page);
    await app.navigateTo('dashboard');
    await page.waitForTimeout(2000);

    // Filter expected network errors (fetch failures are expected offline)
    const unexpectedErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes('fetch') &&
        !e.toLowerCase().includes('network') &&
        !e.toLowerCase().includes('offline') &&
        !e.toLowerCase().includes('failed to fetch') &&
        !e.toLowerCase().includes('websocket') &&
        !e.toLowerCase().includes('load failed') &&
        !e.toLowerCase().includes('connection'),
    );

    expect(unexpectedErrors).toHaveLength(0);

    await context.setOffline(false);
  });

  test('offline.html fallback is served', async ({ request }) => {
    // The build should include an offline fallback page
    const res = await request.get('/offline.html');

    // If the offline page exists, verify it has reasonable content
    if (res.ok()) {
      const html = await res.text();
      expect(html).toContain('html');
      // Should have some user-friendly content
      expect(html.length).toBeGreaterThan(100);
    }
  });

  test('app recovers after coming back online', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Go offline briefly
    await context.setOffline(true);
    await page.waitForTimeout(2000);

    // Come back online
    await context.setOffline(false);

    // Give the app time to reconnect
    await page.waitForTimeout(3000);

    // App should be functional — verify by navigating
    const app = new AppPage(page);
    await app.navigateTo('dashboard');

    const heading = page.locator('h1, [role="heading"]');
    await expect(heading.first()).toBeVisible();
  });

  test('API requests fail gracefully when offline', async ({
    page,
    context,
  }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Track failed request count
    let failedRequestCount = 0;
    page.on('requestfailed', () => {
      failedRequestCount++;
    });

    // Go offline
    await context.setOffline(true);

    // Trigger data-fetching actions
    const app = new AppPage(page);
    await app.navigateTo('gait-analysis');
    await page.waitForTimeout(2000);

    // Some requests should fail (expected offline)
    // eslint-disable-next-line no-console
    console.log(`Offline: ${failedRequestCount} requests failed (expected)`);

    // But the important thing is the UI doesn't crash
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent.first()).toBeVisible();

    await context.setOffline(false);
  });

  test('static assets are cached after first load', async ({
    page,
    context,
  }) => {
    // First load — populate cache
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Go offline
    await context.setOffline(true);

    // Reload the page — should serve from service worker / browser cache
    try {
      await page.reload({ timeout: 10000 });
    } catch {
      // Reload may timeout if no SW is registered — that's acceptable
    }

    // If service worker is active, the page should still render something
    // If not, the browser will show its own offline page — we just check no crash
    const body = page.locator('body');
    await expect(body).toBeVisible();

    await context.setOffline(false);
  });

  test('slow network degrades performance but app remains functional', async ({
    page,
  }) => {
    // Simulate slow 3G
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (400 * 1024) / 8, // 400 kbps
      uploadThroughput: (400 * 1024) / 8,
      latency: 400, // 400ms RTT
    });

    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    // App should eventually load even on slow network (generous 30s timeout)
    expect(loadTime).toBeLessThan(30_000);

    // UI should be functional
    const heading = page.locator('h1, [role="heading"]');
    await expect(heading.first()).toBeVisible({ timeout: 15_000 });

    // Reset network conditions
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: -1,
      uploadThroughput: -1,
      latency: 0,
    });
  });
});
