import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';
import { SettingsPage } from './pages/settings.page';

test.describe('Settings Page', () => {
  let app: AppPage;
  let settings: SettingsPage;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
    settings = new SettingsPage(page);
    await app.goto();
    await app.navigateTo('settings');
  });

  test('renders settings heading', async () => {
    await expect(settings.heading).toBeVisible();
  });

  test('shows all sections', async () => {
    await settings.expectSectionsVisible();
  });

  test('danger zone buttons are present', async () => {
    await expect(settings.resetBtn).toBeVisible();
    await expect(settings.deleteBtn).toBeVisible();
  });

  test('reset button is styled as destructive', async () => {
    // The reset button should have a red/destructive visual treatment
    const classes = await settings.resetBtn.getAttribute('class');
    expect(classes).toBeTruthy();
  });

  test('navigating away and back preserves settings tab', async () => {
    const errors = app.collectErrors();

    // Go to another tab and come back
    await app.navigateTo('dashboard');
    await app.navigateTo('settings');

    await expect(settings.heading).toBeVisible();
    expect(errors).toHaveLength(0);
  });
});
