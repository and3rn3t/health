// Vitest setup for ESBuild + React testing
import '@testing-library/jest-dom';
import { webcrypto as cryptoWeb } from 'crypto';
import { vi } from 'vitest';

// Mock WebSocket for testing
class MockWebSocket {
  url: string;
  readyState: number = 1; // OPEN
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onclose: ((ev: Event) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  // No-op stubs for tests
  send: (data?: unknown) => void = vi.fn();
  close: (code?: number, reason?: string) => void = vi.fn();
  addEventListener: (..._args: unknown[]) => void = vi.fn();
  removeEventListener: (..._args: unknown[]) => void = vi.fn();

  constructor(url: string) {
    this.url = url;
  }
}

// Mock global WebSocket
(globalThis as unknown as Record<string, unknown>).WebSocket =
  MockWebSocket as unknown;

// Mock window.location for tests that need it
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'https:',
    host: 'localhost:3000',
    href: 'https://localhost:3000',
    assign: vi.fn(), // Mock location.assign to prevent navigation errors
    replace: vi.fn(), // Mock location.replace to prevent navigation errors
    reload: vi.fn(), // Mock location.reload to prevent navigation errors
  },
  writable: true,
});

// Suppress jsdom navigation errors (they're expected in tests with download links)
const originalError = console.error;
console.error = (...args: unknown[]) => {
  const message = String(args[0] || '');
  // Suppress jsdom navigation errors
  if (message.includes('Not implemented: navigation')) {
    return;
  }
  originalError(...args);
};

// Mock matchMedia for components that use responsive hooks
// Some jsdom versions expose matchMedia as undefined; normalize to a stub function
// eslint-disable-next-line @typescript-eslint/no-explicit-any
if (typeof (window as any).matchMedia !== 'function') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (window as any).matchMedia = (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // deprecated
    removeListener: () => {}, // deprecated
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  });
}

// NOTE: useAuth mock moved to individual test files via vi.mock('@/hooks/useAuth').
// This allows tests to customize auth state (unauthenticated, loading, error, etc.)
// instead of being locked into a single "authenticated" mock.

if (!('crypto' in globalThis)) {
  (globalThis as unknown as Record<string, unknown>).crypto =
    cryptoWeb as unknown;
}
