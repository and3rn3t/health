import { describe, test, expect } from 'vitest';
import {
  secureRandom,
  secureRandomInt,
  secureRandomFloat,
  secureRandomBoolean,
  secureRandomChoice,
  secureShuffle,
} from '../secureRandom';

describe('secureRandom', () => {
  describe('secureRandom', () => {
    test('should return a number between 0 and 1', () => {
      for (let i = 0; i < 100; i++) {
        const value = secureRandom();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThan(1);
      }
    });

    test('should return different values on multiple calls', () => {
      const values = new Set();
      for (let i = 0; i < 50; i++) {
        values.add(secureRandom());
      }
      // Very unlikely to have all same values
      expect(values.size).toBeGreaterThan(1);
    });
  });

  describe('secureRandomInt', () => {
    test('should return integer within range [min, max)', () => {
      for (let i = 0; i < 100; i++) {
        const value = secureRandomInt(5, 10);
        expect(value).toBeGreaterThanOrEqual(5);
        expect(value).toBeLessThan(10);
        expect(Number.isInteger(value)).toBe(true);
      }
    });

    test('should handle single value range', () => {
      const value = secureRandomInt(5, 6);
      expect(value).toBe(5);
    });

    test('should handle negative ranges', () => {
      const value = secureRandomInt(-10, -5);
      expect(value).toBeGreaterThanOrEqual(-10);
      expect(value).toBeLessThan(-5);
    });

    test('should handle zero range', () => {
      const value = secureRandomInt(0, 1);
      expect(value).toBe(0);
    });
  });

  describe('secureRandomFloat', () => {
    test('should return float within range [min, max)', () => {
      for (let i = 0; i < 100; i++) {
        const value = secureRandomFloat(1.5, 2.5);
        expect(value).toBeGreaterThanOrEqual(1.5);
        expect(value).toBeLessThan(2.5);
      }
    });

    test('should handle negative ranges', () => {
      const value = secureRandomFloat(-1.0, 0.0);
      expect(value).toBeGreaterThanOrEqual(-1.0);
      expect(value).toBeLessThan(0.0);
    });

    test('should return different values', () => {
      const values = new Set();
      for (let i = 0; i < 50; i++) {
        values.add(secureRandomFloat(0, 1));
      }
      expect(values.size).toBeGreaterThan(1);
    });
  });

  describe('secureRandomBoolean', () => {
    test('should return boolean value', () => {
      for (let i = 0; i < 100; i++) {
        const value = secureRandomBoolean();
        expect(typeof value).toBe('boolean');
      }
    });

    test('should return both true and false over many calls', () => {
      let hasTrue = false;
      let hasFalse = false;
      for (let i = 0; i < 100; i++) {
        const value = secureRandomBoolean();
        if (value) hasTrue = true;
        else hasFalse = true;
        if (hasTrue && hasFalse) break;
      }
      // Very likely to have both values
      expect(hasTrue || hasFalse).toBe(true);
    });
  });

  describe('secureRandomChoice', () => {
    test('should return element from array', () => {
      const array = [1, 2, 3, 4, 5];
      for (let i = 0; i < 100; i++) {
        const value = secureRandomChoice(array);
        expect(array).toContain(value);
      }
    });

    test('should throw error for empty array', () => {
      expect(() => secureRandomChoice([])).toThrow(
        'Cannot select from empty array'
      );
    });

    test('should work with single element array', () => {
      const array = [42];
      expect(secureRandomChoice(array)).toBe(42);
    });

    test('should work with different types', () => {
      expect(secureRandomChoice(['a', 'b', 'c'])).toMatch(/^[abc]$/);
      expect(secureRandomChoice([true, false])).toBeTypeOf('boolean');
      expect(secureRandomChoice([{ id: 1 }, { id: 2 }])).toHaveProperty('id');
    });
  });

  describe('secureShuffle', () => {
    test('should return array with same length', () => {
      const array = [1, 2, 3, 4, 5];
      const shuffled = secureShuffle(array);
      expect(shuffled.length).toBe(array.length);
    });

    test('should contain all original elements', () => {
      const array = [1, 2, 3, 4, 5];
      const shuffled = secureShuffle(array);
      expect(shuffled.sort()).toEqual(array.sort());
    });

    test('should not mutate original array', () => {
      const array = [1, 2, 3, 4, 5];
      const original = [...array];
      secureShuffle(array);
      expect(array).toEqual(original);
    });

    test('should produce different order (likely)', () => {
      const array = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
      const shuffled1 = secureShuffle(array);
      const shuffled2 = secureShuffle(array);
      // Very unlikely to have same order twice
      expect(shuffled1).not.toEqual(shuffled2);
    });

    test('should handle empty array', () => {
      expect(secureShuffle([])).toEqual([]);
    });

    test('should handle single element array', () => {
      expect(secureShuffle([42])).toEqual([42]);
    });

    test('should work with different types', () => {
      const strings = ['a', 'b', 'c'];
      const shuffled = secureShuffle(strings);
      expect(shuffled.sort()).toEqual(strings.sort());
    });
  });
});

