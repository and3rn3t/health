import { describe, expect, it } from 'vitest';
import { NAV_ITEMS } from '../navigation';

describe('NAV_ITEMS', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(NAV_ITEMS)).toBe(true);
    expect(NAV_ITEMS.length).toBeGreaterThan(0);
  });

  it('includes Dashboard route', () => {
    const dashboard = NAV_ITEMS.find((item) => item.label === 'Dashboard');
    expect(dashboard).toBeDefined();
    expect(dashboard?.path).toBe('/');
  });

  it('each item has required fields', () => {
    for (const item of NAV_ITEMS) {
      expect(item.label).toBeDefined();
      expect(typeof item.label).toBe('string');
      expect(item.path).toBeDefined();
      expect(typeof item.path).toBe('string');
    }
  });
});
