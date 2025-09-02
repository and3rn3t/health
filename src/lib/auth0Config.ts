/**
 * Auth0 Configuration for VitalSense Health App
 *
 * Security Features:
 * - HIPAA-compliant authentication flow
 * - Secure token handling with refresh rotation
 * - Role-based access control (RBAC)
 * - Multi-factor authentication (MFA) enforcement
 * - Session management with automatic logout
 */

export const auth0Config = {
  // Auth0 Application Configuration
  domain: import.meta.env.VITE_AUTH0_DOMAIN || 'vitalsense-health.auth0.com',
  clientId: import.meta.env.VITE_AUTH0_CLIENT_ID || 'your-client-id',

  // Security Configuration
  redirectUri:
    import.meta.env.VITE_AUTH0_REDIRECT_URI ||
    `${window.location.origin}/callback`,
  logoutUri:
    import.meta.env.VITE_AUTH0_LOGOUT_URI || `${window.location.origin}/login`,

  // HIPAA Compliance Settings
  audience:
    import.meta.env.VITE_AUTH0_AUDIENCE || 'https://vitalsense-health-api',
  scope:
    'openid profile email read:health_data write:health_data manage:emergency_contacts',

  // Enhanced Security Options
  useRefreshTokens: true,
  cacheLocation: 'localstorage' as const,

  // Session Management
  sessionCheckExpiryDays: 1,

  // Advanced Security
  advancedOptions: {
    defaultScope: 'openid profile email offline_access',

    // PKCE (Proof Key for Code Exchange) for additional security
    usePKCE: true,

    // Token validation
    clockSkew: 60,

    // Refresh token rotation for maximum security
    useRefreshTokenRotation: true,

    // Custom parameters for health data context
    customParams: {
      context: 'health_data_access',
      compliance: 'hipaa',
    },
  },
};

// User roles for role-based access control
export const USER_ROLES = {
  PATIENT: 'patient',
  CAREGIVER: 'caregiver',
  HEALTHCARE_PROVIDER: 'healthcare_provider',
  EMERGENCY_CONTACT: 'emergency_contact',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Permission scopes for different health data operations
export const PERMISSIONS = {
  // Health Data Access
  READ_HEALTH_DATA: 'read:health_data',
  WRITE_HEALTH_DATA: 'write:health_data',
  DELETE_HEALTH_DATA: 'delete:health_data',

  // Emergency Features
  TRIGGER_EMERGENCY: 'trigger:emergency',
  MANAGE_EMERGENCY_CONTACTS: 'manage:emergency_contacts',
  VIEW_EMERGENCY_HISTORY: 'view:emergency_history',

  // Analytics and Insights
  VIEW_ANALYTICS: 'view:analytics',
  EXPORT_DATA: 'export:data',
  VIEW_PREDICTIONS: 'view:predictions',

  // Administrative
  MANAGE_USERS: 'manage:users',
  VIEW_AUDIT_LOGS: 'view:audit_logs',
  CONFIGURE_SYSTEM: 'configure:system',
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// Security validation helpers
export const isValidAuth0Config = (): boolean => {
  return !!(
    auth0Config.domain &&
    auth0Config.clientId &&
    auth0Config.domain !== 'vitalsense-health.auth0.com' &&
    auth0Config.clientId !== 'your-client-id'
  );
};

// Environment-specific configuration
export const getAuth0ConfigForEnvironment = () => {
  const environment = import.meta.env.VITE_ENVIRONMENT || 'development';

  const baseConfig = { ...auth0Config };

  switch (environment) {
    case 'production':
      return {
        ...baseConfig,
        // Enhanced security for production
        cacheLocation: 'memory' as const,
        sessionCheckExpiryDays: 0.5, // 12 hours
        advancedOptions: {
          ...baseConfig.advancedOptions,
          clockSkew: 30, // Tighter clock skew tolerance
        },
      };

    case 'staging':
      return {
        ...baseConfig,
        sessionCheckExpiryDays: 0.25, // 6 hours for testing
      };

    default: // development
      return baseConfig;
  }
};
