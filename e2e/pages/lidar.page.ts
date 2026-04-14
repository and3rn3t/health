import { type Locator, type Page, expect } from '@playwright/test';

/** Page object for the LiDAR Gait Analyzer view (within gait analysis or lidar-posture tab). */
export class LidarPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly statusBadge: Locator;

  /* Calibration */
  readonly calibrationHeading: Locator;
  readonly calibrateBtn: Locator;

  /* Analysis Controls section (rendered by LiDARControls) */
  readonly analysisControlsHeading: Locator;

  /* LiDAR unavailable fallback */
  readonly unavailableHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: /LiDAR Gait Analyzer/i,
    });

    this.statusBadge = page.getByText(
      /LiDAR Ready|Simulated|LiDAR Unavailable/i,
    );

    this.calibrationHeading = page.getByText('Calibration Required');
    this.calibrateBtn = page.getByRole('button', {
      name: /Begin Calibration/i,
    });

    this.analysisControlsHeading = page.getByText('Analysis Controls');

    this.unavailableHeading = page.getByText('LiDAR Not Available');
  }

  async expectCalibrationVisible(): Promise<void> {
    await expect(this.calibrationHeading).toBeVisible();
    await expect(this.calibrateBtn).toBeVisible();
  }

  async calibrate(): Promise<void> {
    await this.calibrateBtn.click();
  }

  async expectAnalyzerVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.statusBadge).toBeVisible();
  }
}
