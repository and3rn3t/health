import { type Locator, type Page, expect } from '@playwright/test';

/** Page object for the Settings tab. */
export class SettingsPage {
  readonly page: Page;
  readonly heading: Locator;

  /* Sections */
  readonly appPreferences: Locator;
  readonly dangerZone: Locator;

  /* Danger actions */
  readonly resetBtn: Locator;
  readonly deleteBtn: Locator;

  constructor(page: Page) {
    this.page = page;

    // Use the visible heading (not the sr-only one)
    this.heading = page.locator('h1.text-vitalsense-primary, h1:not(.sr-only)').filter({ hasText: 'Settings' }).first();

    this.profileSection = page.getByText(/^Profile$/i).first();
    this.privacySection = page.getByText(/Privacy & Security/i).first();
    this.notificationsSection = page.getByText(/^Notifications$/i).first();
    this.dataSyncSection = page.getByText(/Data & Sync/i).first();
    this.preferencesSection = page.getByText(/App Preferences/i).first();
    this.appPreferences = page.getByText('App Preferences').first();
    this.dangerZone = page.getByText('Danger Zone');


    // Scope buttons to the danger zone section to avoid duplicates
    const dangerSection = page.locator('.border-red-200, [class*="border-red"]').first();
    this.resetBtn = dangerSection.getByRole('button', { name: /Reset/i });
    this.deleteBtn = dangerSection.getByRole('button', { name: /Delete/i });
  }

  async expectSectionsVisible(): Promise<void> {
    await expect(this.heading).toBeVisible();
    await expect(this.appPreferences).toBeVisible();
    await expect(this.dangerZone).toBeVisible();
  }
}
