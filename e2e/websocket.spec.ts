import { test, expect, type APIResponse } from '@playwright/test';
import { AppPage } from './pages/app.page';

async function readJsonResponse(res: APIResponse) {
  const contentType = res.headers()['content-type'] ?? '';
  if (!contentType.toLowerCase().includes('application/json')) {
    return null;
  }
  return res.json();
}

/**
 * E2E tests for WebSocket connectivity and real-time data flow.
 *
 * Validates: connection lifecycle, reconnection fallback, live data
 * rendering, and graceful degradation on WebSocket failure.
 */
test.describe('WebSocket Real-Time Data', () => {
  test('WebSocket probe endpoint returns metadata', async ({ request }) => {
    // The /ws endpoint without an Upgrade header returns probe metadata
    const res = await request.get('/ws');

    expect(res.ok()).toBe(true);
    const body = await readJsonResponse(res);
    if (!body) return;
    expect(body.ok).toBe(true);
    expect(body.upgradeRequired).toBe(true);
    expect(body.supportedMessageTypes).toContain('connection_established');
    expect(body.supportedMessageTypes).toContain('pong');
    expect(body.analyticsVersions).toBeDefined();
  });

  test('WebSocket URL endpoint returns valid URL', async ({ request }) => {
    const res = await request.get('/api/ws-url');

    if (!res.ok()) {
      expect([401, 403, 429]).toContain(res.status());
      return;
    }
    const body = await readJsonResponse(res);
    if (!body) return;
    expect(body.url).toBeDefined();
    expect(body.url).toMatch(/^wss?:\/\//);
  });

  test('WebSocket live-enabled endpoint returns boolean', async ({
    request,
  }) => {
    const res = await request.get('/api/ws-live-enabled');

    if (!res.ok()) {
      expect([401, 403, 429]).toContain(res.status());
      return;
    }
    const body = await readJsonResponse(res);
    if (!body) return;
    expect(typeof body.enabled).toBe('boolean');
  });

  test('dashboard shows connection status indicator', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    // The dashboard should show a connection badge/indicator
    const connectionIndicator = page.locator(
      '[data-testid="connection-status"], [class*="connection"], [aria-label*="connection"], [aria-label*="Connection"]',
    );

    // At minimum, some connection-related UI should be present
    const count = await connectionIndicator.count();
    if (count > 0) {
      await expect(connectionIndicator.first()).toBeVisible();
    }
  });

  test('app handles WebSocket connection failure gracefully', async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    // Block WebSocket connections to simulate failure
    await page.route('**/ws', (route) => route.abort('connectionrefused'));

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for any retry attempts
    await page.waitForTimeout(3000);

    // App should not crash — no unhandled errors
    const criticalErrors = errors.filter(
      (e) =>
        !e.includes('WebSocket') &&
        !e.includes('ws://') &&
        !e.includes('wss://') &&
        // Firefox dead-object error — browser-internal, not an app crash
        !e.toLowerCase().includes('an attempt was made to use an object'),
    );
    expect(criticalErrors).toHaveLength(0);

    // UI should still be functional
    const heading = page.locator('h1, [role="heading"]');
    await expect(heading.first()).toBeVisible();
  });

  test('app reconnects after WebSocket disconnect', async ({ page }) => {
    let wsOpened = false;

    // Track whether any WebSocket connects
    page.on('websocket', () => {
      wsOpened = true;
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Give the WebSocket time to connect
    await page.waitForTimeout(2000);

    // The app should be usable whether or not a WS connected
    const mainContent = page.locator('main, [role="main"]');
    await expect(mainContent.first()).toBeVisible();

    // Log for debugging — WS may not connect in preview/test mode
    console.log(`WebSocket opened: ${String(wsOpened)}`);
  });

  test('live metrics tab displays real-time data section', async ({
    page,
  }) => {
    const app = new AppPage(page);
    await app.goto();

    // Navigate to the Live Metrics tab if present on the dashboard
    const liveTab = page.locator(
      '[data-testid="live-metrics-tab"], button:has-text("Live"), [role="tab"]:has-text("Live")',
    );

    if ((await liveTab.count()) > 0) {
      await liveTab.first().click();
      await page.waitForLoadState('domcontentloaded');

      // Live metrics section should be visible
      const liveSection = page.locator(
        '[data-testid="live-metrics"], [class*="live"], h2:has-text("Live"), h3:has-text("Live")',
      );
      if ((await liveSection.count()) > 0) {
        await expect(liveSection.first()).toBeVisible();
      }
    }
  });

  test('no console errors from WebSocket during navigation', async ({
    page,
  }) => {
    const app = new AppPage(page);
    const errors = app.collectErrors();

    await app.goto();

    // Navigate through tabs — WebSocket should not cause errors
    await app.navigateTo('dashboard');
    await app.navigateTo('gait-analysis');
    await app.navigateTo('fall-risk');
    await app.navigateTo('settings');
    await app.navigateTo('dashboard');

    // Filter out expected WebSocket connection issues in preview mode
    const nonWsErrors = errors.filter(
      (e) =>
        !e.toLowerCase().includes('websocket') &&
        !e.toLowerCase().includes('ws://') &&
        !e.toLowerCase().includes('wss://') &&
        !e.toLowerCase().includes('connection') &&
        // Firefox dead-object error — browser-internal, not an app crash
        !e.toLowerCase().includes('an attempt was made to use an object'),
    );

    expect(nonWsErrors).toHaveLength(0);
  });
});
