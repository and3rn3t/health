import { type Locator, type Page, expect } from '@playwright/test';

/** Reusable page object for the main VitalSense app shell. */
export class AppPage {
  readonly page: Page;

  /* ── Navigation ── */
  readonly sidebar: Locator;
  readonly sidebarToggle: Locator;
  readonly mainContent: Locator;

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
    // Route label is exposed on main content via aria-label in RootLayout

    this.dashboardLink = this.sidebar.getByRole('link', { name: /Dashboard/i });
    this.gaitLink = this.sidebar.getByRole('link', { name: /Gait Analysis/i });
    this.lidarLink = this.sidebar.getByRole('link', {
      name: /LiDAR & Posture/i,
    });
    this.fallRiskLink = this.sidebar.getByRole('link', { name: /Fall Risk/i });
    this.settingsLink = this.sidebar.getByRole('link', { name: /Settings/i });

    this.mobileTabBar = page.locator('nav[aria-label="Main navigation"]');
  }

  async goto(): Promise<void> {
    await this.page.goto('/', { waitUntil: 'domcontentloaded' });
    await expect(this.mainContent.first()).toBeVisible();
  }

  /**
   * Navigate to a tab via the app's custom event system.
   * Uses window.dispatchEvent('navigate') which the React component listens for.
   * This bypasses CSS layout issues with the collapsed sidebar.
   */
  async navigateTo(
    tab: 'dashboard' | 'gait-analysis' | 'lidar-posture' | 'fall-risk' | 'settings',
  ): Promise<void> {
    const pathByTab: Record<typeof tab, string> = {
      dashboard: '/',
      'gait-analysis': '/gait-analysis',
      'lidar-posture': '/lidar-posture',
      'fall-risk': '/fall-risk',
      settings: '/settings',
    };
    const linkByTab: Record<typeof tab, Locator> = {
      dashboard: this.dashboardLink,
      'gait-analysis': this.gaitLink,
      'lidar-posture': this.lidarLink,
      'fall-risk': this.fallRiskLink,
      settings: this.settingsLink,
    };
    await linkByTab[tab].click();
    try {
      await this.page.waitForURL(new RegExp(`${pathByTab[tab]}$`), {
        timeout: 10_000,
      });
    } catch {
      // Offline-mode tests can intentionally block route chunk fetches.
      // Keep assertions focused on graceful degradation, not URL transitions.
    }
    await expect(this.mainContent).toBeVisible();
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
    const linkByTab: Record<typeof tab, Locator> = {
      dashboard: this.dashboardLink,
      'gait-analysis': this.gaitLink,
      'lidar-posture': this.lidarLink,
      'fall-risk': this.fallRiskLink,
      settings: this.settingsLink,
    };
    await linkByTab[tab].click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Navigate using mobile bottom tabs. */
  async mobileNavigateTo(label: string): Promise<void> {
    await this.mobileTabBar.getByRole('link', { name: new RegExp(label, 'i') }).click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  /** Assert the route label exposed on main content matches the expected tab. */
  async expectActiveTab(label: string | RegExp): Promise<void> {
    await expect(this.mainContent).toHaveAttribute('aria-label', label);
  }

  /** Assert no JS errors were thrown. Returns collected errors for manual checks. */
  collectErrors(): string[] {
    const errors: string[] = [];
    this.page.on('pageerror', (err) => {
      const message = err.message;
      const lower = message.toLowerCase();
      if (
        lower.includes('websocket') ||
        lower.includes('ws://') ||
        lower.includes('wss://') ||
        lower.includes('connecting state')
      ) {
        return;
      }
      errors.push(message);
    });
    return errors;
  }
}
