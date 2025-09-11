/**
 * Authentication hook - separated for Fast Refresh compatibility
 */

import { AuthContext } from '@/contexts/AuthProvider';
import type { AuthContextType } from '@/lib/authTypes';
import { useContext } from 'react';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);

  // If auth is disabled, return mock values
  if (context === undefined || context === null) {
    // Check if auth is disabled in global config
    const isAuthDisabled =
      typeof window !== 'undefined' &&
      window.__VITALSENSE_CONFIG__?.features?.enableAuth === false;

    if (isAuthDisabled) {
      return {
        user: null,
        isAuthenticated: false,
        isLoading: false,
        login: () => Promise.resolve(),
        logout: () => Promise.resolve(),
        hasRole: () => false,
        hasPermission: () => false,
        hasAnyPermission: () => false,
        refreshSession: () => Promise.resolve(),
        validateSession: () => Promise.resolve(false),
        getAccessToken: () => Promise.resolve(undefined),
        getIdToken: () => Promise.resolve(undefined),
        logHealthDataAccess: () => {}, // No-op in development
      };
    }

    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
