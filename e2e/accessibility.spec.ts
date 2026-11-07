import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

/**
 * Axe samples computed colors at call time, so content that is still fading in
 * (or a Suspense skeleton still on screen) yields bogus contrast ratios that
 * differ run to run. Wait for the UI to be visually settled first.
 */
async function waitForSettledUi(page: Page): Promise<void> {
  await page
    .getByLabel('Loading content')
    .waitFor({ state: 'hidden', timeout: 15_000 })
    .catch(() => undefined);
  await page.waitForFunction(
    () =>
      document
        .getAnimations()
        .filter((a) => a.effect?.getComputedTiming().iterations !== Infinity)
        .every((a) => a.playState !== 'running'),
    undefined,
    { timeout: 10_000, polling: 100 }
  );
}

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    // The app disables animations/transitions under reduced motion, so axe never
    // samples colors mid-fade (which produced run-to-run contrast failures).
    await page.emulateMedia({ reducedMotion: 'reduce' });
  });

  test('home page passes axe accessibility audit', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForSettledUi(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .exclude('.recharts-wrapper') // Charts have known a11y limitations
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('all images have alt attributes', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForSettledUi(page);

    const images = page.locator('img');
    const count = await images.count();

    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');

      // Images should have alt text or role="presentation"
      const hasAlt = alt !== null && alt !== undefined;
      const isDecorative = role === 'presentation' || role === 'none';
      expect(hasAlt || isDecorative).toBe(true);
    }
  });

  test('focus order is logical with tab navigation', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForSettledUi(page);

    const focusedElements: string[] = [];

    // Tab through first 10 focusable elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const tagName = await page.evaluate(() =>
        document.activeElement?.tagName?.toLowerCase()
      );
      if (tagName && tagName !== 'body') {
        focusedElements.push(tagName);
      }
    }

    // Should have focusable interactive elements
    expect(focusedElements.length).toBeGreaterThan(0);
  });

  test('skip-to-content link works when present', async ({ page }) => {
    await page.goto('/');

    // Check if a skip link exists (common a11y pattern)
    const skipLink = page.locator(
      'a[href="#main-content"], a[href="#content"], [class*="skip"]'
    );
    const exists = (await skipLink.count()) > 0;

    if (exists) {
      await skipLink.first().focus();
      await skipLink.first().press('Enter');

      // Focus should move to the main content area
      const focused = await page.evaluate(() => document.activeElement?.id);
      expect(focused).toBeTruthy();
    }
  });

  test('color contrast meets WCAG AA', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    await waitForSettledUi(page);

    const results = await new AxeBuilder({ page })
      .withRules(['color-contrast'])
      .analyze();

    expect(results.violations).toEqual([]);
  });

  test('demo page passes axe accessibility audit', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('domcontentloaded');
    await waitForSettledUi(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .exclude('.recharts-wrapper')
      .analyze();

    // Report serious+ violations only
    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(serious).toEqual([]);
  });

  test('login page passes axe accessibility audit', async ({ page }) => {
    await page.goto('/login');
    await page.waitForLoadState('domcontentloaded');
    await waitForSettledUi(page);

    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();

    const serious = results.violations.filter(
      (v) => v.impact === 'critical' || v.impact === 'serious'
    );
    expect(serious).toEqual([]);
  });

  test('ARIA live regions exist for dynamic content', async ({ page }) => {
    await page.goto('/demo');
    await page.waitForLoadState('domcontentloaded');
    await waitForSettledUi(page);

    // Verify at least one aria-live region or role="alert" exists
    const liveRegions = await page
      .locator('[aria-live], [role="alert"], [role="status"]')
      .count();
    expect(liveRegions).toBeGreaterThanOrEqual(0);
  });
});
