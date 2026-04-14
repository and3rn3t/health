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

  test('action buttons are present', async () => {
    await settings.resetBtn.scrollIntoViewIfNeeded();
    await expect(settings.resetBtn).toBeVisible();
    await expect(settings.saveBtn).toBeVisible();
  });

  test('profile inputs are editable', async () => {
    await settings.expectProfileInputsVisible();
    await settings.displayNameInput.fill('Test User');
    await expect(settings.displayNameInput).toHaveValue('Test User');
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
