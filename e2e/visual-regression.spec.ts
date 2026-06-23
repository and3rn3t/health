import { test, expect } from '@playwright/test';

test.describe('Visual Regression', () => {
  // No Firefox/WebKit baselines exist in the repo — skip on non-Chromium browsers
  test.skip(({ browserName }) => browserName !== 'chromium', 'Baseline screenshots are Chromium-only');

  test('home page snapshot', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Wait for animations/transitions to settle
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('home-page.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('mobile viewport snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('home-mobile.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });

  test('dark mode snapshot', async ({ page }) => {
    // Emulate dark color scheme
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot('home-dark.png', {
      fullPage: true,
      maxDiffPixelRatio: 0.02,
    });
  });
});
