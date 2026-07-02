import { type Locator, type Page, expect } from '@playwright/test';

/** Page object for the VitalSense Live Dashboard tab. */
export class DashboardPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly connectionBadge: Locator;

  /* Top-level action buttons */
  readonly exportBtn: Locator;
  readonly settingsBtn: Locator;

  /* Tab navigation */
  readonly overviewTab: Locator;
  readonly metricsTab: Locator;
  readonly devicesTab: Locator;

  /* Overview metric cards */
  readonly heartRateCard: Locator;
  readonly walkingSteadinessCard: Locator;
  readonly dailyStepsCard: Locator;
  readonly systemStatusCard: Locator;

  /* Devices section */
  readonly connectedDevicesHeading: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: /VitalSense Live/i,
    });
    this.connectionBadge = page.getByText(/Connected|Disconnected/);

    this.exportBtn = page.getByRole('button', { name: /Export/i });
    this.settingsBtn = page.getByRole('button', { name: /Settings/i });

    this.overviewTab = page.getByRole('tab', { name: /Overview/i });
    this.metricsTab = page.getByRole('tab', { name: /Live Metrics/i });
    this.devicesTab = page.getByRole('tab', { name: /Devices/i });

    this.heartRateCard = page
      .locator('[role="button"]')
      .filter({ hasText: /Heart Rate/i })
      .first();
    this.walkingSteadinessCard = page
      .locator('[role="button"]')
      .filter({ hasText: /Walking Steadiness/i })
      .first();
    this.dailyStepsCard = page
      .locator('[role="button"]')
      .filter({ hasText: /Daily Steps/i })
      .first();
    this.systemStatusCard = page.getByText('System Status').first();

    this.connectedDevicesHeading = page.getByText('Connected Devices').first();
  }

  async switchTab(
    tab: 'overview' | 'metrics' | 'devices',
  ): Promise<void> {
    const tabs = {
      overview: this.overviewTab,
      metrics: this.metricsTab,
      devices: this.devicesTab,
    } as const;
    const tabEl = tabs[tab];
    // Scroll into view first — on mobile the tab bar may be partially
    // off-screen until the user scrolls, causing click timeouts.
    await tabEl.scrollIntoViewIfNeeded();
    await tabEl.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async expectHeaderVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.exportBtn).toBeVisible();
    await expect(this.settingsBtn).toBeVisible();
  }

  async expectTabsVisible(): Promise<void> {
    await expect(this.overviewTab).toBeVisible();
    await expect(this.metricsTab).toBeVisible();
    await expect(this.devicesTab).toBeVisible();
  }
}
