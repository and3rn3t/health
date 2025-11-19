import { describe, test, expect } from 'vitest';
import { cn } from '../utils';

describe('utils', () => {
  describe('cn', () => {
    test('should merge class names', () => {
      expect(cn('foo', 'bar')).toBe('foo bar');
    });

    test('should handle conditional classes', () => {
      const condition1 = false;
      const condition2 = true;
      expect(cn('foo', condition1 && 'bar', 'baz')).toBe('foo baz');
      expect(cn('foo', condition2 && 'bar', 'baz')).toBe('foo bar baz');
    });

    test('should handle undefined and null', () => {
      expect(cn('foo', undefined, null, 'bar')).toBe('foo bar');
    });

    test('should merge Tailwind classes correctly', () => {
      expect(cn('px-2 py-1', 'px-4')).toBe('px-4 py-1');
    });

    test('should handle empty strings', () => {
      expect(cn('foo', '', 'bar')).toBe('foo bar');
    });

    test('should handle arrays', () => {
      expect(cn(['foo', 'bar'], 'baz')).toBe('foo bar baz');
    });

    test('should handle objects', () => {
      expect(cn({ foo: true, bar: false, baz: true })).toBe('foo baz');
    });

    test('should handle mixed inputs', () => {
      expect(cn('foo', ['bar', 'baz'], { qux: true })).toBe('foo bar baz qux');
    });
  });
});

