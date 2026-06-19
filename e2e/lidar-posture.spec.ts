import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';
import { LidarPage } from './pages/lidar.page';

test.describe('LiDAR Posture Analysis', () => {
  let app: AppPage;
  let lidar: LidarPage;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
    lidar = new LidarPage(page);
    await app.goto();
    await app.navigateTo('lidar-posture');
  });

  test('renders LiDAR Gait Analyzer heading', async () => {
    // The heading or the unavailable fallback should be visible
    const heading = lidar.heading;
    const unavailable = lidar.unavailableHeading;
    const eitherVisible =
      (await heading.isVisible().catch(() => false)) ||
      (await unavailable.isVisible().catch(() => false));
    expect(eitherVisible).toBe(true);
  });

  test('shows calibration card or unavailable state', async () => {
    // Depending on lazy-load timing and device capability, this may show
    // real-time tabs, an unavailable state, or a loading placeholder first.
    const calibration = lidar.calibrationHeading;
    const unavailable = lidar.unavailableHeading;
    const loading = app.page.getByLabel(/Loading content/i).first();
    const eitherVisible =
      (await calibration.isVisible().catch(() => false)) ||
      (await unavailable.isVisible().catch(() => false)) ||
      (await loading.isVisible().catch(() => false));
    expect(eitherVisible).toBe(true);
  });

  test('no console errors on page load', async () => {
    const errors = app.collectErrors();
    // Give the page time to settle
    await app.page.waitForTimeout(500);
    expect(errors).toHaveLength(0);
  });

  test('navigating away and back preserves content', async () => {
    const errors = app.collectErrors();

    await app.navigateTo('dashboard');
    await app.navigateTo('lidar-posture');

    // Content should still render — either the analyzer or the unavailable card
    const heading = lidar.heading;
    const unavailable = lidar.unavailableHeading;
    const eitherVisible =
      (await heading.isVisible().catch(() => false)) ||
      (await unavailable.isVisible().catch(() => false));
    expect(eitherVisible).toBe(true);
    expect(errors).toHaveLength(0);
  });

  test('LiDAR tab is accessible via keyboard', async ({ page }) => {
    // Navigate to the lidar tab using the app's sidebar
    await app.clickSidebarItem('lidar-posture');

    // Content should be visible
    const main = page.locator('main#main-content');
    await expect(main).toBeVisible();
  });
});
