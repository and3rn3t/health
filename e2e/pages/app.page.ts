import { type Locator, type Page, expect } from '@playwright/test';

/** Reusable page object for the main VitalSense app shell. */
export class AppPage {
  readonly page: Page;

  /* ── Navigation ── */
  readonly sidebar: Locator;
  readonly sidebarToggle: Locator;
  readonly mainContent: Locator;
  readonly pageTitle: Locator;

  /* ── Sidebar items (desktop) ── */
  readonly dashboardLink: Locator;
  readonly gaitLink: Locator;
  readonly lidarLink: Locator;
  readonly fallRiskLink: Locator;
  readonly settingsLink: Locator;

  /* ── Mobile nav ── */
  readonly mobileTabBar: Locator;

  constructor(page: Page) {
    this.page = page;

    this.sidebar = page.locator('aside[aria-label="Primary navigation"]');
    this.sidebarToggle = page.getByRole('button', {
      name: 'Toggle Navigation',
    });
    this.mainContent = page.locator('main#main-content');
    this.pageTitle = this.mainContent.locator('h1.sr-only');

    // Sidebar navigation items use data-id
    this.dashboardLink = this.sidebar.locator('[data-id="dashboard"]');
    this.gaitLink = this.sidebar.locator('[data-id="gait-analysis"]');
    this.lidarLink = this.sidebar.locator('[data-id="lidar-posture"]');
    this.fallRiskLink = this.sidebar.locator('[data-id="fall-risk"]');
    this.settingsLink = this.sidebar.locator('[data-id="settings"]');

    this.mobileTabBar = page.getByRole('tablist', {
      name: 'Main navigation',
    });
  }

  async goto(): Promise<void> {
    await this.page.goto('/');
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Navigate to a tab via the app's custom event system.
   * Uses window.dispatchEvent('navigate') which the React component listens for.
   * This bypasses CSS layout issues with the collapsed sidebar.
   */
  async navigateTo(
    tab: 'dashboard' | 'gait-analysis' | 'lidar-posture' | 'fall-risk' | 'settings',
  ): Promise<void> {
    await this.page.evaluate((tabId: string) => {
      window.dispatchEvent(
        new CustomEvent('navigate', { detail: { feature: tabId } }),
      );
    }, tab);
    // Wait for React transition + lazy component to load
    await this.page.waitForLoadState('networkidle');
  }

  /**
   * Click a sidebar item directly (for testing sidebar interaction).
   * Opens the sidebar first if collapsed so clicks aren't intercepted.
   */
  async clickSidebarItem(
    tab: 'dashboard' | 'gait-analysis' | 'lidar-posture' | 'fall-risk' | 'settings',
  ): Promise<void> {
    // Ensure sidebar is expanded so items are clickable
    const toggle = this.sidebarToggle;
    if ((await toggle.count()) > 0) {
      const expanded = await toggle.getAttribute('aria-expanded');
      if (expanded !== 'true') {
        await toggle.click();
      }
    }
    await this.sidebar.locator(`[data-id="${tab}"]`).click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Navigate using mobile bottom tabs. */
  async mobileNavigateTo(label: string): Promise<void> {
    await this.mobileTabBar
      .getByRole('tab', { name: new RegExp(label, 'i') })
      .click();
    await this.page.waitForLoadState('networkidle');
  }

  /** Assert the page title (sr-only h1) matches the expected aria-live text. */
  async expectActiveTab(label: string | RegExp): Promise<void> {
    await expect(this.pageTitle).toHaveText(label);
  }

  /** Assert no JS errors were thrown. Returns collected errors for manual checks. */
  collectErrors(): string[] {
    const errors: string[] = [];
    this.page.on('pageerror', (err) => errors.push(err.message));
    return errors;
  }
}
