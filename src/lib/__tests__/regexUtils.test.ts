import { describe, test, expect } from 'vitest';
import {
  sanitizeRegexInput,
  createSafeRegex,
  isRegexSafe,
} from '../regexUtils';

describe('regexUtils', () => {
  describe('sanitizeRegexInput', () => {
    test('should escape special regex characters', () => {
      expect(sanitizeRegexInput('hello.world')).toBe('hello\\.world');
      expect(sanitizeRegexInput('test*pattern')).toBe('test\\*pattern');
      expect(sanitizeRegexInput('a+b?c')).toBe('a\\+b\\?c');
      expect(sanitizeRegexInput('^start$')).toBe('\\^start\\$');
      expect(sanitizeRegexInput('(group)')).toBe('\\(group\\)');
      expect(sanitizeRegexInput('[chars]')).toBe('\\[chars\\]');
      expect(sanitizeRegexInput('{count}')).toBe('\\{count\\}');
      expect(sanitizeRegexInput('a|b')).toBe('a\\|b');
    });

    test('should handle strings without special characters', () => {
      expect(sanitizeRegexInput('plaintext')).toBe('plaintext');
      expect(sanitizeRegexInput('123abc')).toBe('123abc');
    });

    test('should throw error for non-string input', () => {
      expect(() => sanitizeRegexInput(null as any)).toThrow(TypeError);
      expect(() => sanitizeRegexInput(123 as any)).toThrow(TypeError);
      expect(() => sanitizeRegexInput({} as any)).toThrow(TypeError);
    });

    test('should throw error for input exceeding max length', () => {
      const longString = 'a'.repeat(101);
      expect(() => sanitizeRegexInput(longString)).toThrow(
        'Input too long (max 100 characters)'
      );
    });

    test('should handle empty string', () => {
      expect(sanitizeRegexInput('')).toBe('');
    });

    test('should escape all special characters in combination', () => {
      expect(sanitizeRegexInput('.*+?^${}()|[]\\')).toBe(
        '\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\'
      );
    });
  });

  describe('createSafeRegex', () => {
    test('should create regex from template with variables', () => {
      const regex = createSafeRegex('^${prefix}-${suffix}$', {
        prefix: 'test',
        suffix: '123',
      });
      expect(regex.test('test-123')).toBe(true);
      expect(regex.test('test-456')).toBe(false);
    });

    test('should sanitize variables before insertion', () => {
      const regex = createSafeRegex('^${pattern}$', {
        pattern: 'test.*special',
      });
      expect(regex.test('test.*special')).toBe(true);
      expect(regex.test('testXspecial')).toBe(false);
    });

    test('should handle multiple occurrences of same variable', () => {
      const regex = createSafeRegex('${word}-${word}-${word}', {
        word: 'test',
      });
      expect(regex.test('test-test-test')).toBe(true);
    });

    test('should throw error for pattern exceeding max length', () => {
      const longPattern = 'a'.repeat(501);
      expect(() =>
        createSafeRegex(longPattern, {})
      ).toThrow('Regex pattern too long');
    });

    test('should handle empty template', () => {
      const regex = createSafeRegex('', {});
      expect(regex.test('')).toBe(true);
    });
  });

  describe('isRegexSafe', () => {
    test('should detect nested quantifiers as unsafe', () => {
      expect(isRegexSafe('(a+)+')).toBe(false);
      expect(isRegexSafe('(a*)*')).toBe(false);
      expect(isRegexSafe('(a+)*')).toBe(false);
      expect(isRegexSafe('(a*)+')).toBe(false);
    });

    test('should detect complex alternation with quantifiers as unsafe', () => {
      expect(isRegexSafe('(a|b|c)*')).toBe(false);
      expect(isRegexSafe('(a|b)+')).toBe(false);
    });

    test('should detect unbounded repetition as unsafe', () => {
      expect(isRegexSafe('[abc]**')).toBe(false);
      expect(isRegexSafe('[abc]++')).toBe(false);
    });

    test('should identify safe patterns', () => {
      expect(isRegexSafe('^test$')).toBe(true);
      expect(isRegexSafe('\\d+')).toBe(true);
      expect(isRegexSafe('[a-z]{3,5}')).toBe(true);
      expect(isRegexSafe('test|pattern')).toBe(true);
    });

    test('should handle empty pattern', () => {
      expect(isRegexSafe('')).toBe(true);
    });

    test('should handle simple patterns', () => {
      expect(isRegexSafe('hello')).toBe(true);
      expect(isRegexSafe('.*')).toBe(true);
      expect(isRegexSafe('test+')).toBe(true);
    });
  });
});

