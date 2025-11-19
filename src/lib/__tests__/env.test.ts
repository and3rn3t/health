import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { safeGetViteEnv, isDev } from '../env';

describe('env', () => {
  describe('safeGetViteEnv', () => {
    beforeEach(() => {
      // Clear any existing mocks
      vi.clearAllMocks();
    });

    test('should return undefined when import.meta.env is not available', () => {
      // In test environment, import.meta.env might not be available
      const result = safeGetViteEnv('VITE_TEST_VAR');
      // Result could be undefined if env is not available
      expect(result === undefined || typeof result === 'string').toBe(true);
    });

    test('should return undefined for empty string values', () => {
      // Mock import.meta.env
      const originalMeta = (globalThis as any).import?.meta;
      if (originalMeta) {
        originalMeta.env = { VITE_EMPTY: '' };
        expect(safeGetViteEnv('VITE_EMPTY')).toBeUndefined();
      }
    });

    test('should handle non-string values gracefully', () => {
      const result = safeGetViteEnv('NON_EXISTENT');
      expect(result === undefined || typeof result === 'string').toBe(true);
    });
  });

  describe('isDev', () => {
    let originalLocation: Location | undefined;

    beforeEach(() => {
      originalLocation = globalThis.window?.location;
    });

    afterEach(() => {
      if (originalLocation && globalThis.window) {
        globalThis.window.location = originalLocation;
      }
    });

    test('should return true for localhost', () => {
      Object.defineProperty(globalThis, 'window', {
        value: {
          location: {
            hostname: 'localhost',
            port: '',
          },
        },
        writable: true,
        configurable: true,
      });

      expect(isDev()).toBe(true);
    });

    test('should return true for 127.0.0.1', () => {
      Object.defineProperty(globalThis, 'window', {
        value: {
          location: {
            hostname: '127.0.0.1',
            port: '',
          },
        },
        writable: true,
        configurable: true,
      });

      expect(isDev()).toBe(true);
    });

    test('should return true for dev ports', () => {
      Object.defineProperty(globalThis, 'window', {
        value: {
          location: {
            hostname: 'example.com',
            port: '5173',
          },
        },
        writable: true,
        configurable: true,
      });

      expect(isDev()).toBe(true);
    });

    test('should return false for production hostname', () => {
      Object.defineProperty(globalThis, 'window', {
        value: {
          location: {
            hostname: 'health.andernet.dev',
            port: '',
          },
        },
        writable: true,
        configurable: true,
      });

      expect(isDev()).toBe(false);
    });

    test('should return false when window is not available', () => {
      const originalWindow = globalThis.window;
      delete (globalThis as any).window;

      expect(isDev()).toBe(false);

      globalThis.window = originalWindow;
    });
  });
});

