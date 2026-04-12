/** @type {import('@stryker-mutator/api/core').PartialStrykerOptions} */
export default {
  mutate: [
    'src/lib/**/*.ts',
    'src/schemas/**/*.ts',
    'src/hooks/**/*.ts',
    '!src/**/*.test.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
  testRunner: 'vitest',
  vitest: {
    configFile: 'vitest.config.ts',
  },
  reporters: ['html', 'clear-text', 'progress'],
  htmlReporter: {
    fileName: 'mutation-report/index.html',
  },
  thresholds: {
    high: 80,
    low: 60,
    break: 50,
  },
  concurrency: 2,
  timeoutMS: 30_000,
  incremental: true,
  incrementalFile: '.stryker-incremental.json',
  ignoreStatic: true,
};
