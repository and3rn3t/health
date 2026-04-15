// Vitest setup for ESBuild + React testing
import '@testing-library/jest-dom';
import { webcrypto as cryptoWeb } from 'node:crypto';
import { afterEach, vi } from 'vitest';

// Clear mock call history after each test to prevent cross-test pollution.
// Uses clearAllMocks (not restoreAllMocks) to preserve module-level mock
// implementations that tests configure outside beforeEach.
afterEach(() => {
  vi.clearAllMocks();
});

// --- Crypto polyfill (needed by both jsdom and node environments) ---
if (!('crypto' in globalThis)) {
  (globalThis as unknown as Record<string, unknown>).crypto =
    cryptoWeb as unknown;
}

// --- DOM mocks (only when running in jsdom, skipped for node-env integration tests) ---
if (globalThis.window !== undefined) {
  // Mock WebSocket — prevents real connections during component tests
  class MockWebSocket {
    url: string;
    readyState: number = 1; // OPEN
    onopen: ((ev: Event) => void) | null = null;
    onmessage: ((ev: MessageEvent) => void) | null = null;
    onclose: ((ev: Event) => void) | null = null;
    onerror: ((ev: Event) => void) | null = null;
    send: (data?: unknown) => void = vi.fn();
    close: (code?: number, reason?: string) => void = vi.fn();
    addEventListener: (..._args: unknown[]) => void = vi.fn();
    removeEventListener: (..._args: unknown[]) => void = vi.fn();
    constructor(url: string) {
      this.url = url;
    }
  }
  (globalThis as unknown as Record<string, unknown>).WebSocket =
    MockWebSocket as unknown;

  // Mock window.location
  Object.defineProperty(globalThis, 'location', {
    value: {
      protocol: 'https:',
      host: 'localhost:3000',
      href: 'https://localhost:3000',
      assign: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
    },
    writable: true,
  });

  // Suppress jsdom navigation errors (expected in tests with download links)
  const originalError = console.error;
  console.error = (...args: unknown[]) => {
    const message = String(args[0] || '');
    if (message.includes('Not implemented: navigation')) {
      return;
    }
    originalError(...args);
  };

  // Mock matchMedia for responsive hooks
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (globalThis as any).matchMedia !== 'function') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).matchMedia = (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    });
  }

  // IntersectionObserver stub for Radix UI components
  if (!('IntersectionObserver' in globalThis)) {
    class MockIntersectionObserver implements IntersectionObserver {
      readonly root: Element | Document | null = null;
      readonly rootMargin: string = '0px';
      readonly scrollMargin: string = '0px';
      readonly thresholds: ReadonlyArray<number> = [0];
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
      takeRecords = vi.fn().mockReturnValue([]);
    }
    (globalThis as unknown as Record<string, unknown>).IntersectionObserver =
      MockIntersectionObserver;
  }

  // ResizeObserver stub
  if (!('ResizeObserver' in globalThis)) {
    class MockResizeObserver {
      observe = vi.fn();
      unobserve = vi.fn();
      disconnect = vi.fn();
    }
    (globalThis as unknown as Record<string, unknown>).ResizeObserver =
      MockResizeObserver;
  }
}

// NOTE: useAuth mock moved to individual test files via vi.mock('@/hooks/useAuth').
// This allows tests to customize auth state (unauthenticated, loading, error, etc.)
// instead of being locked into a single "authenticated" mock.
