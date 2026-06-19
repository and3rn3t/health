import { defineConfig, devices } from '@playwright/test';

const runAgainstWorker = process.env.E2E_USE_WRANGLER === 'true';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 4 : undefined,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['html', { open: 'on-failure' }]],
  use: {
    baseURL: 'http://localhost:4173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 15_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    // Mobile viewport for responsive testing
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 7'] },
    },
  ],
  webServer: {
    command: runAgainstWorker
      ? 'pnpm exec wrangler dev --port 4173 --host 127.0.0.1'
      : 'pnpm preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: runAgainstWorker ? 120_000 : 30_000,
  },

  // Accessibility testing: use @axe-core/playwright in test files
  // import { AxeBuilder } from '@axe-core/playwright';
  // const results = await new AxeBuilder({ page }).analyze();
  // expect(results.violations).toEqual([]);
});
