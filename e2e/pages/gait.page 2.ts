import { type Locator, type Page, expect } from '@playwright/test';

/** Page object for the Gait Analysis Dashboard tab. */
export class GaitPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly badge: Locator;

  /* Mode buttons */
  readonly overviewBtn: Locator;
  readonly lidarBtn: Locator;
  readonly walkingBtn: Locator;

  /* Overview stats */
  readonly gaitQuality: Locator;
  readonly avgSpeed: Locator;
  readonly cadence: Locator;
  readonly balanceScore: Locator;

  /* Analysis options */
  readonly startLidarBtn: Locator;
  readonly startWalkingBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: /Gait Analysis Dashboard/i,
    });
    this.badge = page.getByText('Advanced Analytics');

    this.overviewBtn = page.getByRole('button', { name: /Overview/i });
    this.lidarBtn = page.getByRole('button', { name: /LiDAR Analysis/i });
    this.walkingBtn = page.getByRole('button', { name: /Walking Tracker/i });

    this.gaitQuality = page.getByText('Gait Quality');
    this.avgSpeed = page.getByText('Avg Speed (m/s)');
    this.cadence = page.getByText('Cadence (steps/min)');
    this.balanceScore = page.getByText('Balance Score');

    this.startLidarBtn = page.getByRole('button', {
      name: /Start LiDAR Analysis/i,
    });
    this.startWalkingBtn = page.getByRole('button', {
      name: /Start Walking Tracker/i,
    });
  }

  async switchMode(mode: 'overview' | 'lidar' | 'walking'): Promise<void> {
    const buttons = {
      overview: this.overviewBtn,
      lidar: this.lidarBtn,
      walking: this.walkingBtn,
    } as const;
    const btn = buttons[mode];
    await btn.click();
    await this.page.waitForLoadState('networkidle');
  }

  async expectOverviewVisible(): Promise<void> {
    await expect(this.gaitQuality).toBeVisible();
    await expect(this.avgSpeed).toBeVisible();
    await expect(this.cadence).toBeVisible();
    await expect(this.balanceScore).toBeVisible();
  }
}
