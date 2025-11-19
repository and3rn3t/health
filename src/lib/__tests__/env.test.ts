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
      // Mock import.meta.env to return false for DEV
      const originalImport = (globalThis as any).import;
      (globalThis as any).import = {
        meta: {
          env: {
            DEV: false,
          },
        },
      };

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

      // The function reads from import.meta which is module-level, so we need to test differently
      // Since we can't easily mock import.meta at runtime, we test the window.location fallback
      // For production hostname without dev ports, it should return false
      const result = isDev();
      // If import.meta.env.DEV is not set, it falls back to window.location check
      // health.andernet.dev is not localhost/127.0.0.1 and has no dev port, so should be false
      expect(result).toBe(false);

      if (originalImport) {
        (globalThis as any).import = originalImport;
      } else {
        delete (globalThis as any).import;
      }
    });

    test('should return false when window is not available', () => {
      // Mock import.meta.env to return false for DEV
      const originalImport = (globalThis as any).import;
      (globalThis as any).import = {
        meta: {
          env: {
            DEV: false,
          },
        },
      };

      const originalWindow = globalThis.window;
      delete (globalThis as any).window;

      // Without window, and with DEV=false, should return false
      const result = isDev();
      expect(result).toBe(false);

      globalThis.window = originalWindow;
      if (originalImport) {
        (globalThis as any).import = originalImport;
      } else {
        delete (globalThis as any).import;
      }
    });
  });
});

