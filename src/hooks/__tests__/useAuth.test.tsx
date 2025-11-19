import { describe, test, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useAuth } from '../useAuth';
import { AuthContext } from '@/contexts/AuthProvider';
import type { AuthContextType } from '@/lib/authTypes';

describe('useAuth', () => {
  test('should return context when provided', () => {
    const mockContext: AuthContextType = {
      user: { id: '1', email: 'test@example.com' },
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
    delete (window as any).__VITALSENSE_CONFIG__;

    const { result } = renderHook(() => useAuth());

    expect(result.error).toBeInstanceOf(Error);
    expect(result.error?.message).toBe('useAuth must be used within an AuthProvider');
  });

  test('should return mock values when auth is disabled', () => {
    (window as any).__VITALSENSE_CONFIG__ = {
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
    (window as any).__VITALSENSE_CONFIG__ = {
      features: {
        enableAuth: false,
      },
    };

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <AuthContext.Provider value={null as any}>{children}</AuthContext.Provider>
    );

    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
  });
});

