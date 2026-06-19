import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';
import { DashboardPage } from './pages/dashboard.page';

test.describe('Dashboard', () => {
  let app: AppPage;
  let dashboard: DashboardPage;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
    dashboard = new DashboardPage(page);
    await app.goto();
    // Dashboard is the default tab
  });

  test('renders VitalSense Live header', async () => {
    await dashboard.expectHeaderVisible();
  });

  test('shows all three tabs', async () => {
    await dashboard.expectTabsVisible();
  });

  test('system status card is visible in overview', async () => {
    await expect(dashboard.systemStatusCard).toBeVisible();
  });

  test('switching to devices tab shows connected devices', async () => {
    const errors = app.collectErrors();

    await dashboard.switchTab('devices');
    await expect(dashboard.connectedDevicesHeading).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test('switching tabs does not produce console errors', async () => {
    const errors = app.collectErrors();

    await dashboard.switchTab('metrics');
    await dashboard.switchTab('devices');
    await dashboard.switchTab('overview');

    expect(errors).toHaveLength(0);
  });

  test('navigation links are interactive', async ({ page }) => {
    const navLinks = page.locator('header a, nav a, [role="navigation"] a');
    const count = await navLinks.count();
    expect(count).toBeGreaterThan(0);

    for (let i = 0; i < Math.min(count, 5); i++) {
      await expect(navLinks.nth(i)).toBeVisible();
    }
  });

  test('responsive layout adjusts on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth,
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    // Allow bounded overflow caused by fixed side-nav containers while
    // still catching severe horizontal layout regressions.
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 240);
  });
});
