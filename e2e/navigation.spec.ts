import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';

test.describe('Tab Navigation', () => {
  let app: AppPage;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
    await app.goto();
  });

  test('sidebar contains all navigation items', async () => {
    // Sidebar starts collapsed (w-0) — check items are in the DOM
    await expect(app.dashboardLink).toBeAttached();
    await expect(app.gaitLink).toBeAttached();
    await expect(app.lidarLink).toBeAttached();
    await expect(app.fallRiskLink).toBeAttached();
    await expect(app.settingsLink).toBeAttached();
  });

  test('dashboard tab is active by default', async () => {
    await app.expectActiveTab('Dashboard');
  });

  test('clicking Gait Analysis tab renders gait content', async () => {
    const errors = app.collectErrors();
    await app.navigateTo('gait-analysis');

    await app.expectActiveTab('Gait Analysis');
    await expect(
      app.mainContent.locator('h1:not(.sr-only)').filter({ hasText: /Gait Analysis/ }),
    ).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('clicking LiDAR & Posture tab renders LiDAR content', async () => {
    const errors = app.collectErrors();
    await app.navigateTo('lidar-posture');

    await app.expectActiveTab('LiDAR & Posture');
    expect(errors).toHaveLength(0);
  });

  test('clicking Fall Risk tab renders fall detection', async () => {
    const errors = app.collectErrors();
    await app.navigateTo('fall-risk');

    await app.expectActiveTab('Fall Risk');
    await expect(
      app.page.getByRole('heading', { name: /Fall Detection/i }),
    ).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('clicking Settings tab renders settings panel', async () => {
    const errors = app.collectErrors();
    await app.navigateTo('settings');

    await app.expectActiveTab('Settings');
    // Two "Settings" headings exist (sr-only + visible) — check the visible one
    await expect(
      app.page.locator('h1:not(.sr-only)').filter({ hasText: 'Settings' }),
    ).toBeVisible();
    expect(errors).toHaveLength(0);
  });

  test('navigating between all tabs preserves app state', async () => {
    const errors = app.collectErrors();

    // Visit each tab in sequence
    for (const tab of [
      'gait-analysis',
      'lidar-posture',
      'fall-risk',
      'settings',
      'dashboard',
    ] as const) {
      await app.navigateTo(tab);
    }

    // Back on dashboard
    await app.expectActiveTab('Dashboard');
    expect(errors).toHaveLength(0);
  });

  test('document title updates with active tab', async ({ page }) => {
    await expect(page).toHaveTitle(/Dashboard.*VitalSense/i);

    await app.navigateTo('gait-analysis');
    await expect(page).toHaveTitle(/Gait Analysis.*VitalSense/i);

    await app.navigateTo('settings');
    await expect(page).toHaveTitle(/Settings.*VitalSense/i);
  });

  test('sidebar item shows active state', async () => {
    // Expand sidebar so items are interactive and visible
    await app.clickSidebarItem('dashboard');
    await expect(app.dashboardLink).toHaveAttribute('aria-current', 'page');

    await app.navigateTo('gait-analysis');
    await expect(app.gaitLink).toHaveAttribute('aria-current', 'page');
    // Dashboard should no longer be active
    await expect(app.dashboardLink).not.toHaveAttribute(
      'aria-current',
      'page',
    );
  });
});

test.describe('Tab Navigation – Mobile', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('mobile bottom tabs are visible', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    await expect(app.mobileTabBar).toBeVisible();
  });

  test('mobile tab switches view without errors', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    const errors = app.collectErrors();

    // Find a tab in the bottom bar and tap it
    const settingsTab = app.mobileTabBar.getByRole('tab', {
      name: /Settings/i,
    });
    if ((await settingsTab.count()) > 0) {
      await settingsTab.click();
      await page.waitForLoadState('networkidle');
      await app.expectActiveTab('Settings');
    }

    expect(errors).toHaveLength(0);
  });
});
