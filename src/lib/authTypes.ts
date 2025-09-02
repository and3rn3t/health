/**
 * Authentication utilities and types
 */

import {
  PERMISSIONS,
  USER_ROLES,
  type Permission,
  type UserRole,
} from '@/lib/auth0Config';

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  picture?: string;
  roles: UserRole[];
  permissions: Permission[];
  lastLogin: string;
  mfaEnabled: boolean;
  hipaaConsent: boolean;
  emergencyContacts?: string[];
}

export interface AuthContextType {
  // User state
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Authentication methods
  login: () => Promise<void>;
  logout: () => Promise<void>;

  // Permission checking
  hasRole: (role: UserRole) => boolean;
  hasPermission: (permission: Permission) => boolean;
  hasAnyPermission: (permissions: Permission[]) => boolean;

  // Session management
  refreshSession: () => Promise<void>;
  validateSession: () => Promise<boolean>;

  // Security methods
  getAccessToken: () => Promise<string | undefined>;
  getIdToken: () => Promise<string | undefined>;

  // Audit logging
  logHealthDataAccess: (action: string, resource: string) => void;
}

// Auth-specific logging utilities
export const logAuthOperation = (
  operation: string,
  meta: Record<string, unknown> = {}
) => {
  // Use console.log with structured format for auth operations
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'info',
    operation: `auth_${operation}`,
    ...meta,
  };
  console.log(JSON.stringify(logEntry));
};

export const logAuthError = (
  error: Error,
  meta: Record<string, unknown> = {}
) => {
  // Use console.error with structured format for auth errors
  const logEntry = {
    timestamp: new Date().toISOString(),
    level: 'error',
    operation: 'auth_error',
    message: error.message,
    ...meta,
  };
  console.error(JSON.stringify(logEntry));
};

export { PERMISSIONS, USER_ROLES, type Permission, type UserRole };
