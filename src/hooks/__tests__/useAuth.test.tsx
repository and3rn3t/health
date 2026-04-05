import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth, AuthContext } from '../useAuth';
import type { AuthContextType } from '@/lib/authTypes';

describe('useAuth', () => {
  test('should return context when provided', () => {
    const mockContext: AuthContextType = {
      user: {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        roles: [],
        permissions: [],
        lastLogin: new Date().toISOString(),
        mfaEnabled: false,
        hipaaConsent: false,
      },
      isAuthenticated: true,
      isLoading: false,
      login: vi.fn(),
      logout: vi.fn(),
      hasRole: vi.fn(() => true),
      hasPermission: vi.fn(() => true),
      hasAnyPermission: vi.fn(() => true),
      refreshSession: vi.fn(),
      validateSession: vi.fn(() => Promise.resolve(true)),
      getAccessToken: vi.fn(() => Promise.resolve('token')),
      getIdToken: vi.fn(() => Promise.resolve('id-token')),
      logHealthDataAccess: vi.fn(),
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={mockContext}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current).toBe(mockContext);
    expect(result.current.isAuthenticated).toBe(true);
  });

  test('should throw error when context is not provided and auth is enabled', () => {
    // Clear window config
    delete (window as Window & { __VITALSENSE_CONFIG__?: Record<string, unknown> }).__VITALSENSE_CONFIG__;

    // Suppress console.error for this test
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Use expect().toThrow() pattern for testing error boundaries
    expect(() => {
      renderHook(() => useAuth(), {
        wrapper: ({ children }) => <>{children}</>, // No provider
      });
    }).toThrow('useAuth must be used within an AuthProvider');

    consoleError.mockRestore();
  });

  test('should return mock values when auth is disabled', () => {
    (window as Window & { __VITALSENSE_CONFIG__?: Record<string, unknown> }).__VITALSENSE_CONFIG__ = {
      features: {
        enableAuth: false,
      },
    };

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(typeof result.current.login).toBe('function');
    expect(typeof result.current.logout).toBe('function');
    expect(result.current.hasRole('admin')).toBe(false);
    expect(result.current.hasPermission('read:health_data')).toBe(false);
  });

  test('should handle null context when auth is disabled', () => {
    (window as Window & { __VITALSENSE_CONFIG__?: Record<string, unknown> }).__VITALSENSE_CONFIG__ = {
      features: {
        enableAuth: false,
      },
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={null as unknown as React.ContextType<typeof AuthContext>}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
  });
});
