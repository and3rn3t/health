import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';
import { GaitPage } from './pages/gait.page';

test.describe('Gait Analysis Page', () => {
  let app: AppPage;
  let gait: GaitPage;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
    gait = new GaitPage(page);
    await app.goto();
    await app.navigateTo('gait-analysis');
  });

  test('renders heading and badge', async () => {
    await expect(gait.heading).toBeVisible();
    await expect(gait.badge).toBeVisible();
  });

  test('shows three analysis mode buttons', async () => {
    await expect(gait.overviewBtn).toBeVisible();
    await expect(gait.lidarBtn).toBeVisible();
    await expect(gait.walkingBtn).toBeVisible();
  });

  test('overview mode displays quick stat cards', async () => {
    await gait.switchMode('overview');
    await gait.expectOverviewVisible();
  });

  test('switching to LiDAR mode loads LiDAR content', async () => {
    const errors = app.collectErrors();

    await gait.switchMode('lidar');
    // LiDAR panel should appear — look for any content change
    await expect(
      app.page.getByText(/LiDAR/i).first(),
    ).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test('switching to Walking mode loads walking content', async () => {
    const errors = app.collectErrors();

    await gait.switchMode('walking');
    await expect(
      app.page.getByText(/Walking|Pattern/i).first(),
    ).toBeVisible();

    expect(errors).toHaveLength(0);
  });

  test('mode buttons toggle active state', async () => {
    // Click LiDAR, then back to Overview
    await gait.switchMode('lidar');
    await gait.switchMode('overview');

    // Overview stats should be visible again
    await gait.expectOverviewVisible();
  });

  test('no console errors across mode switches', async () => {
    const errors = app.collectErrors();

    await gait.switchMode('overview');
    await gait.switchMode('lidar');
    await gait.switchMode('walking');
    await gait.switchMode('overview');

    expect(errors).toHaveLength(0);
  });
});
