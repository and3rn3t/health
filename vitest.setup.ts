// Vitest setup for ESBuild + React testing
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock WebSocket for testing
global.WebSocket = class MockWebSocket {
  url: string;
  readyState: number;

  constructor(url: string) {
    this.url = url;
    this.readyState = 1; // OPEN
  }

  send() {}
  close() {}
  addEventListener() {}
  removeEventListener() {}
} as any;

// Mock window.location for tests that need it
Object.defineProperty(window, 'location', {
  value: {
    protocol: 'https:',
    host: 'localhost:3000',
    href: 'https://localhost:3000',
  },
  writable: true,
});

// Mock useAuth hook globally
vi.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: 'test-user',
      email: 'test@vitalsense.com',
      name: 'Test User',
    },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
    getAccessToken: vi.fn().mockResolvedValue('mock-token'),
  }),
}));
if (!global.crypto) {
  const { webcrypto } = require('crypto');
  global.crypto = webcrypto as any;
}
