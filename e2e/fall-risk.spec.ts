import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';
import { FallRiskPage } from './pages/fall-risk.page';

test.describe('Fall Risk Page', () => {
  let app: AppPage;
  let fallRisk: FallRiskPage;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
    fallRisk = new FallRiskPage(page);
    await app.goto();
    await app.navigateTo('fall-risk');
  });

  test('renders Fall Detection heading', async () => {
    await expect(fallRisk.heading).toBeVisible();
  });

  test('displays all three status cards', async () => {
    await fallRisk.expectStatusCardsVisible();
  });

  test('shows active system status', async ({ page }) => {
    await expect(page.getByText('Active').first()).toBeVisible();
  });

  test('displays detection settings section', async () => {
    await fallRisk.expectSettingsVisible();
  });

  test('shows action buttons', async () => {
    await expect(fallRisk.testAlertBtn).toBeVisible();
    await expect(fallRisk.configContactsBtn).toBeVisible();
  });

  test('shows recent activity section', async () => {
    await expect(fallRisk.recentActivity).toBeVisible();
  });

  test('activity log has entries', async ({ page }) => {
    // Verify at least one activity entry is present
    const entries = page.getByText(/Normal Activity|Exercise Session|System Check/i);
    await expect(entries.first()).toBeVisible();
  });

  test('no console errors when interacting with buttons', async () => {
    const errors = app.collectErrors();

    // Test Alert button should be clickable without crash
    await fallRisk.testAlertBtn.click();
    // Configure Contacts button
    await fallRisk.configContactsBtn.click();

    expect(errors).toHaveLength(0);
  });
});
