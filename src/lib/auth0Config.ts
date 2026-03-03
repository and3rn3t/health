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

declare global {
  interface Window {
    __VITALSENSE_CONFIG__?: {
      environment?: string;
      auth0?: {
        domain?: string;
        clientId?: string;
        redirectUri?: string;
        audience?: string;
        scope?: string;
      };
    };
  }
}

// Safely read a Vite env var without assuming import.meta.env exists at runtime
const safeGetViteEnv = (key: string): string | undefined => {
  try {
    const meta: unknown = import.meta;
    if (meta && typeof meta === 'object' && 'env' in meta) {
      const env = (meta as { env?: Record<string, unknown> }).env;
      const val = env?.[key];
      return typeof val === 'string' && val.length > 0 ? val : undefined;
    }
  } catch {
    // ignore – return undefined and let callers fall back
  }
  return undefined;
};

export const auth0Config = {
  // Auth0 Application Configuration
  domain:
    (typeof window !== 'undefined' &&
      window.__VITALSENSE_CONFIG__?.auth0?.domain) ||
    safeGetViteEnv('VITE_AUTH0_DOMAIN') ||
    // Safe placeholder; isValidAuth0Config will reject defaults
    'vitalsense-health.auth0.com',
  clientId:
    (typeof window !== 'undefined' &&
      window.__VITALSENSE_CONFIG__?.auth0?.clientId) ||
    safeGetViteEnv('VITE_AUTH0_CLIENT_ID') ||
    // Safe placeholder; isValidAuth0Config will reject defaults
    'your-client-id',

  // Security Configuration
  redirectUri:
    (typeof window !== 'undefined' &&
      window.__VITALSENSE_CONFIG__?.auth0?.redirectUri) ||
    (typeof window !== 'undefined'
      ? `${window.location.origin}/callback`
      : '/callback'),
  logoutUri:
    typeof window !== 'undefined'
      ? `${window.location.origin}/login`
      : '/login',

  // HIPAA Compliance Settings
  audience:
    (typeof window !== 'undefined' &&
      window.__VITALSENSE_CONFIG__?.auth0?.audience) ||
    'https://vitalsense-health-api',
  scope:
    (typeof window !== 'undefined' &&
      window.__VITALSENSE_CONFIG__?.auth0?.scope) ||
    'openid profile email read:health_data write:health_data',

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
  HEALTHCARE_PROVIDER: 'healthcare_provider',
  ADMIN: 'admin',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

// Permission scopes for different health data operations
export const PERMISSIONS = {
  // Health Data Access
  READ_HEALTH_DATA: 'read:health_data',
  WRITE_HEALTH_DATA: 'write:health_data',
  DELETE_HEALTH_DATA: 'delete:health_data',

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
  // Resolve environment robustly without assuming import.meta.env exists at runtime
  let environment =
    (typeof window !== 'undefined' &&
      window.__VITALSENSE_CONFIG__?.environment) ||
    undefined;

  if (!environment) {
    const envVar = safeGetViteEnv('VITE_ENVIRONMENT');
    if (envVar) environment = envVar;
  }

  if (!environment) environment = 'development';

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
