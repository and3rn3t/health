/**
 * Shared accessibility test utilities for component-level a11y checks.
 *
 * Uses vitest-axe (axe-core) to run WCAG audits on rendered components.
 *
 * Usage:
 *   import { expectNoA11yViolations, renderAndAudit } from '@/test/a11y-helpers';
 *   const { container } = render(<MyComponent />);
 *   await expectNoA11yViolations(container);
 */

import { axe } from 'vitest-axe';
import { expect } from 'vitest';

 
const matchers = await import('vitest-axe/matchers');
expect.extend(matchers);

/**
 * Run axe-core on an HTML element and assert zero violations.
 * Defaults to WCAG 2.1 AA rules.
 */
export async function expectNoA11yViolations(
  container: HTMLElement,
  options?: {
    /** Additional axe rules to disable (e.g. 'color-contrast' for dark mode testing) */
    disableRules?: string[];
  },
): Promise<Awaited<ReturnType<typeof axe>>> {
  const disabledRules: Record<string, { enabled: boolean }> = {};

  // jsdom doesn't handle color-contrast or scrollable-region-focusable reliably
  const alwaysDisable = ['color-contrast', 'scrollable-region-focusable'];
  for (const rule of [...alwaysDisable, ...(options?.disableRules ?? [])]) {
    disabledRules[rule] = { enabled: false };
  }

  const results = await axe(container, {
    rules: disabledRules,
  });

  // @ts-expect-error vitest-axe extends expect
  expect(results).toHaveNoViolations();

  return results;
}
