import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('page loads with VitalSense title', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/VitalSense/i);
  });

  test('main content renders without crash', async ({ page }) => {
    await page.goto('/');
    // Wait for React to hydrate — the app should show some content
    await expect(page.locator('body')).not.toBeEmpty();
    // No uncaught errors in console
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));
    await page.waitForTimeout(1000);
    expect(errors).toHaveLength(0);
  });

  test('navigation header is visible', async ({ page }) => {
    await page.goto('/');
    // Look for the navigation / header area
    const header = page.locator('header, nav, [role="navigation"]').first();
    await expect(header).toBeVisible();
  });

  test('no console errors on initial load', async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', (err) => errors.push(err.message));

    await page.goto('/');
    await page.waitForLoadState('networkidle');

    expect(errors).toHaveLength(0);
  });

  test('app responds to keyboard navigation', async ({ page }) => {
    await page.goto('/');
    // Tab through interactive elements — should not throw
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    const focusedTag = await page.evaluate(
      () => document.activeElement?.tagName ?? null
    );
    expect(focusedTag).not.toBeNull();
    expect(focusedTag).not.toBe('BODY');
  });
});

test.describe('Static Assets', () => {
  test('manifest.json is served', async ({ request }) => {
    const response = await request.get('/manifest.json');
    expect(response.ok()).toBe(true);
    const body = await response.json();
    expect(body).toHaveProperty('name');
  });

  test('offline.html is served', async ({ request }) => {
    const response = await request.get('/offline.html');
    expect(response.ok()).toBe(true);
  });
});
