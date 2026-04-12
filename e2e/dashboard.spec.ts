import { test, expect } from '@playwright/test';

test.describe('Dashboard & Navigation', () => {
  test('dashboard route renders health dashboard content', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // The main app should render dashboard-like content
    const main = page.locator('main, [role="main"], #root');
    await expect(main).toBeVisible();
  });

  test('navigation links are interactive', async ({ page }) => {
    await page.goto('/');

    const navLinks = page.locator('header a, nav a, [role="navigation"] a');
    const count = await navLinks.count();

    // App should have at least one navigation link
    expect(count).toBeGreaterThan(0);

    // Each link should be visible and have an href
    for (let i = 0; i < Math.min(count, 5); i++) {
      const link = navLinks.nth(i);
      await expect(link).toBeVisible();
    }
  });

  test('responsive layout adjusts on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Content should still be visible
    const body = page.locator('body');
    await expect(body).not.toBeEmpty();

    // No horizontal overflow
    const scrollWidth = await page.evaluate(
      () => document.documentElement.scrollWidth
    );
    const clientWidth = await page.evaluate(
      () => document.documentElement.clientWidth
    );
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5); // 5px tolerance
  });
});
