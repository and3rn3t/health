import { type Locator, type Page, expect } from '@playwright/test';

/** Page object for the Gait Analysis tab. */
export class GaitPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly badge: Locator;

  /* Mode buttons */
  readonly overviewBtn: Locator;
  readonly lidarBtn: Locator;
  readonly walkingBtn: Locator;

  /* Quick stat cards (Overview mode) */
  readonly gaitQuality: Locator;
  readonly avgSpeed: Locator;
  readonly cadence: Locator;
  readonly balanceScore: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.locator('h1:not(.sr-only)').filter({ hasText: /Gait Analysis/ });
    this.badge = page.getByText('Advanced Analytics');

    this.overviewBtn = page.getByRole('button', { name: /Overview/i }).first();
    this.lidarBtn = page.getByRole('button', { name: /LiDAR Analysis/i }).first();
    this.walkingBtn = page.getByRole('button', { name: /Walking/i }).first();

    this.gaitQuality = page.getByText('Gait Quality');
    this.avgSpeed = page.getByText('Avg Speed');
    this.cadence = page.getByText('Cadence');
    this.balanceScore = page.getByText('Balance Score');
  }

  async expectOverviewVisible(): Promise<void> {
    await expect(this.gaitQuality).toBeVisible();
    await expect(this.avgSpeed).toBeVisible();
    await expect(this.cadence).toBeVisible();
    await expect(this.balanceScore).toBeVisible();
  }

  async switchMode(mode: 'overview' | 'lidar' | 'walking'): Promise<void> {
    const btn =
      mode === 'overview'
        ? this.overviewBtn
        : mode === 'lidar'
          ? this.lidarBtn
          : this.walkingBtn;
    await btn.click();
  }
}
