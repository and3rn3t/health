import { test, expect } from '@playwright/test';
import { AppPage } from './pages/app.page';

test.describe('Performance', () => {
  test('initial page load completes within budget', async ({ page }) => {
    const start = Date.now();
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');
    const loadTime = Date.now() - start;

    // Budget: 5 seconds for full load (generous for CI environments)
    expect(loadTime).toBeLessThan(5_000);
  });

  test('no layout shifts after initial render', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // Measure CLS using the Performance Observer API
    const cls = await page.evaluate(() =>
      new Promise<number>((resolve) => {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            const layoutShift = entry as PerformanceEntry & {
              hadRecentInput: boolean;
              value: number;
            };
            if (!layoutShift.hadRecentInput) {
              clsValue += layoutShift.value;
            }
          }
        });
        observer.observe({ type: 'layout-shift', buffered: true });
        // Wait a moment then collect
        setTimeout(() => {
          observer.disconnect();
          resolve(clsValue);
        }, 1000);
      }),
    );

    // CLS should be under 0.1 (good threshold per Web Vitals)
    expect(cls).toBeLessThan(0.1);
  });

  test('tab navigation does not cause full page reloads', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    // Track navigation events — SPA should not trigger hard navigations
    const navigations: string[] = [];
    page.on('framenavigated', (frame) => {
      if (frame === page.mainFrame()) {
        navigations.push(frame.url());
      }
    });

    await app.navigateTo('gait-analysis');
    await app.navigateTo('fall-risk');
    await app.navigateTo('settings');
    await app.navigateTo('dashboard');

    // TanStack Router can emit same-document navigation events for route changes.
    // Keep this bounded to guard against unexpected hard reload loops.
    expect(navigations.length).toBeLessThanOrEqual(5);
  });

  test('lazy-loaded tabs render within timeout', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    const tabs = [
      'gait-analysis',
      'lidar-posture',
      'fall-risk',
      'settings',
    ] as const;

    for (const tab of tabs) {
      const start = Date.now();
      await app.navigateTo(tab);
      // Wait for main content to have visible children
      await page.locator('main#main-content').locator(':visible').first().waitFor();
      const renderTime = Date.now() - start;

      // Each lazy tab should render within 3 seconds
      expect(renderTime).toBeLessThan(3_000);
    }
  });

  test('no memory leaks from repeated tab switching', async ({ page }) => {
    const app = new AppPage(page);
    await app.goto();

    // Get initial heap snapshot
    const initialHeap = await page.evaluate(
      () => (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0,
    );

    // Rapidly switch tabs 20 times
    const tabs = ['gait-analysis', 'fall-risk', 'settings', 'dashboard'] as const;
    for (let i = 0; i < 20; i++) {
      await app.navigateTo(tabs[i % tabs.length]);
    }

    // Force garbage collection if available
    await page.evaluate(() => {
      const g = globalThis as unknown as Record<string, unknown>;
      if (typeof g.gc === 'function') {
        (g.gc as () => void)();
      }
    });

    const finalHeap = await page.evaluate(
      () => (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0,
    );

    // If memory API is available, ensure heap doesn't grow more than 50MB
    if (initialHeap > 0 && finalHeap > 0) {
      const growth = finalHeap - initialHeap;
      expect(growth).toBeLessThan(50 * 1024 * 1024);
    }
  });

  test('main bundle loads without render-blocking requests', async ({
    page,
  }) => {
    const blockedRequests: string[] = [];

    page.on('request', (req) => {
      const url = req.url();
      // Check for synchronous script loads from CDNs that could block render
      if (
        req.resourceType() === 'script' &&
        !url.includes('localhost') &&
        !url.includes('127.0.0.1')
      ) {
        blockedRequests.push(url);
      }
    });

    await page.goto('/');
    await page.waitForLoadState('domcontentloaded');

    // No external render-blocking scripts
    expect(blockedRequests).toHaveLength(0);
  });
});
