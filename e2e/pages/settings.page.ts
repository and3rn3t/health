import { type Locator, type Page, expect } from '@playwright/test';

/** Page object for the Settings / Account & Profile tab. */
export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;

  /* Section headings */
  readonly profileSection: Locator;
  readonly privacySection: Locator;
  readonly notificationsSection: Locator;
  readonly dataSyncSection: Locator;
  readonly preferencesSection: Locator;

  /* Profile inputs */
  readonly displayNameInput: Locator;
  readonly emailInput: Locator;
  readonly phoneInput: Locator;

  /* Action buttons */
  readonly resetBtn: Locator;
  readonly saveBtn: Locator;
  readonly deleteBtn: Locator;
  readonly exportBtn: Locator;

  /* Toggles */
  readonly dataSharingToggle: Locator;
  readonly healthAlertsToggle: Locator;
  readonly autoSyncToggle: Locator;
  readonly lockNavOrderToggle: Locator;

  constructor(page: Page) {
    this.page = page;

    this.heading = page.getByRole('heading', {
      name: /Account & Profile/i,
    });

    this.profileSection = page.getByRole('heading', { name: /^Profile$/i });
    this.privacySection = page.getByRole('heading', {
      name: /Privacy & Security/i,
    });
    this.notificationsSection = page.getByRole('heading', {
      name: /^Notifications$/i,
    });
    this.dataSyncSection = page.getByRole('heading', {
      name: /Data & Sync/i,
    });
    this.preferencesSection = page.getByRole('heading', {
      name: /App Preferences/i,
    });

    this.displayNameInput = page.locator('input#displayName');
    this.emailInput = page.locator('input#email');
    this.phoneInput = page.locator('input#phone');

    this.resetBtn = page.getByRole('button', { name: /Reset/i });
    this.saveBtn = page.getByRole('button', { name: /Save changes/i });
    // Delete button may not exist — locator won't throw but assertions will
    this.deleteBtn = page.getByRole('button', { name: /Delete/i });
    this.exportBtn = page.getByRole('button', { name: /Download/i });

    this.dataSharingToggle = page
      .getByText('Data sharing')
      .locator('..')
      .locator('..')
      .getByRole('switch');
    this.healthAlertsToggle = page
      .getByText('Health alerts')
      .locator('..')
      .locator('..')
      .getByRole('switch');
    this.autoSyncToggle = page
      .getByText('Auto-sync')
      .locator('..')
      .locator('..')
      .getByRole('switch');
    this.lockNavOrderToggle = page.locator('#lockNavOrderToggle');
  }

  async expectSectionsVisible(): Promise<void> {
    await expect(this.profileSection).toBeVisible();
    await this.privacySection.scrollIntoViewIfNeeded();
    await expect(this.privacySection).toBeVisible();
    await this.notificationsSection.scrollIntoViewIfNeeded();
    await expect(this.notificationsSection).toBeVisible();
    await this.dataSyncSection.scrollIntoViewIfNeeded();
    await expect(this.dataSyncSection).toBeVisible();
    await this.preferencesSection.scrollIntoViewIfNeeded();
    await expect(this.preferencesSection).toBeVisible();
  }

  async expectProfileInputsVisible(): Promise<void> {
    await expect(this.displayNameInput).toBeVisible();
    await expect(this.emailInput).toBeVisible();
    await expect(this.phoneInput).toBeVisible();
  }

  async expectActionButtonsVisible(): Promise<void> {
    await this.resetBtn.scrollIntoViewIfNeeded();
    await expect(this.resetBtn).toBeVisible();
    await expect(this.saveBtn).toBeVisible();
  }
}
