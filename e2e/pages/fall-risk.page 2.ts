import { type Locator, type Page, expect } from '@playwright/test';

/** Page object for the Fall Risk / Fall Detection tab. */
export class FallRiskPage {
  readonly page: Page;
  readonly heading: Locator;

  /* Status cards */
  readonly systemStatus: Locator;
  readonly lastCheck: Locator;
  readonly riskLevel: Locator;

  /* Settings toggles */
  readonly autoDetection: Locator;
  readonly emergencyAlerts: Locator;
  readonly appleWatch: Locator;

  /* Action buttons */
  readonly testAlertBtn: Locator;
  readonly configContactsBtn: Locator;

  /* Activity log */
  readonly recentActivity: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: /Fall Detection/i,
    });

    this.systemStatus = page.getByText('System Status');
    this.lastCheck = page.getByText('Last Check');
    this.riskLevel = page.getByText('Risk Level');

    this.autoDetection = page.getByText('Automatic Detection');
    this.emergencyAlerts = page.getByRole('heading', { name: 'Emergency Alerts' });
    this.appleWatch = page.getByText('Apple Watch Integration');

    this.testAlertBtn = page.getByRole('button', {
      name: /Test Alert/i,
    });
    this.configContactsBtn = page.getByRole('button', {
      name: /Configure Contacts/i,
    });

    this.recentActivity = page.getByRole('heading', {
      name: /Recent Activity/i,
    });
  }

  async expectStatusCardsVisible(): Promise<void> {
    await expect(this.systemStatus).toBeVisible();
    await expect(this.lastCheck).toBeVisible();
    await expect(this.riskLevel).toBeVisible();
  }

  async expectSettingsVisible(): Promise<void> {
    // Settings may be below the fold — scroll them into view
    await this.autoDetection.scrollIntoViewIfNeeded();
    await expect(this.autoDetection).toBeVisible();
    await this.emergencyAlerts.scrollIntoViewIfNeeded();
    await expect(this.emergencyAlerts).toBeVisible();
    await this.appleWatch.scrollIntoViewIfNeeded();
    await expect(this.appleWatch).toBeVisible();
  }
}
