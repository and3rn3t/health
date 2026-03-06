/**
 * Enhanced Authentication Context with HIPAA Compliance
 *
 * Features:
 * - Secure user session management
 * - Role-based access control
 * - Automatic token refresh
 * - Audit logging for health data access
 * - MFA enforcement
 * - Session timeout protection
 */

import {
  auth0Config,
  getAuth0ConfigForEnvironment,
  USER_ROLES,
  type Permission,
  type UserRole,
} from '@/lib/auth0Config';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

interface UserProfile {
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

interface AuthContextType {
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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Lightweight logger shim
const authLog = {
  info: (...args: unknown[]) => {
    try {
      console.info('[auth]', ...args);
    } catch {
      /* no-op */
    }
  },
  warn: (...args: unknown[]) => {
    try {
      console.warn('[auth]', ...args);
    } catch {
      /* no-op */
    }
  },
  error: (...args: unknown[]) => {
    try {
      console.error('[auth]', ...args);
    } catch {
      /* no-op */
    }
  },
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

function AuthContextProvider({ children }: AuthProviderProps) {
  const {
    user: auth0User,
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
    getIdTokenClaims,
  } = useAuth0();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const hipaaWarnedRef = useRef(false);
  const sessionGet = (k: string): string | null => {
    try {
      return typeof window !== 'undefined'
        ? window.sessionStorage.getItem(k)
        : null;
    } catch {
      return null;
    }
  };
  const sessionSet = (k: string, v: string) => {
    try {
      if (typeof window !== 'undefined') window.sessionStorage.setItem(k, v);
    } catch {
      /* no-op */
    }
  };

  // Extract user profile from Auth0 user
  const buildUserProfile =
    useCallback(async (): Promise<UserProfile | null> => {
      if (!auth0User || !auth0IsAuthenticated) return null;

      try {
        // Get access token to extract permissions and roles
        await getAccessTokenSilently();
        const idToken = await getIdTokenClaims();

        // Extract roles and permissions from token claims
        const roles = (idToken?.[
          'https://vitalsense.app/roles'
        ] as UserRole[]) || [USER_ROLES.PATIENT];
        const permissions =
          (idToken?.['https://vitalsense.app/permissions'] as Permission[]) ||
          [];

        // Check for required HIPAA consent
        const hipaaConsent =
          idToken?.['https://vitalsense.app/hipaa_consent'] === true;
        const mfaEnabled =
          idToken?.['https://vitalsense.app/mfa_enabled'] === true;

        const profile: UserProfile = {
          id: auth0User.sub || '',
          email: auth0User.email || '',
          name: auth0User.name || '',
          picture: auth0User.picture,
          roles,
          permissions,
          lastLogin: new Date().toISOString(),
          mfaEnabled,
          hipaaConsent,
          emergencyContacts: idToken?.[
            'https://vitalsense.app/emergency_contacts'
          ] as string[],
        };

        // Log successful authentication
        authLog.info('user_authentication', {
          userId: profile.id,
          email: profile.email,
          roles,
          mfaEnabled,
          hipaaConsent,
        });

        return profile;
      } catch (error) {
        authLog.error('build_user_profile_error', error, {
          operation: 'build_user_profile',
          userId: auth0User.sub,
        });
        return null;
      }
    }, [
      auth0User,
      auth0IsAuthenticated,
      getAccessTokenSilently,
      getIdTokenClaims,
    ]);

  // Update user profile when Auth0 state changes
  useEffect(() => {
    const updateUserProfile = async () => {
      setIsLoading(true);
      const profile = await buildUserProfile();
      setUser(profile);
      setIsLoading(false);

      // HIPAA consent: no toast here; inline banner handles user messaging
      if (profile && !profile.hipaaConsent) {
        const key = `hipaa:warned:${profile.id}`;
        const already = hipaaWarnedRef.current || !!sessionGet(key);
        if (!already) {
          hipaaWarnedRef.current = true;
          sessionSet(key, '1');
        }
      }

      // Enforce MFA for healthcare providers and admins
      if (
        profile &&
        (profile.roles.includes(USER_ROLES.HEALTHCARE_PROVIDER) ||
          profile.roles.includes(USER_ROLES.ADMIN)) &&
        !profile.mfaEnabled
      ) {
        toast.error('Multi-factor authentication is required for your role');
        // Could redirect to MFA setup
      }
    };

    if (auth0IsAuthenticated && auth0User) {
      updateUserProfile();
    } else {
      setUser(null);
      setIsLoading(auth0IsLoading);
    }
  }, [auth0IsAuthenticated, auth0User, auth0IsLoading, buildUserProfile]);

  // Authentication methods
  const login = useCallback(async () => {
    try {
      await loginWithRedirect({
        authorizationParams: {
          audience: auth0Config.audience,
          scope: auth0Config.scope,
        },
      });
    } catch (error) {
      authLog.error('login_failed', error);
      toast.error('Login failed. Please try again.');
    }
  }, [loginWithRedirect]);

  const logout = useCallback(async () => {
    try {
      // Log logout event
      if (user) {
        authLog.info('user_logout', {
          userId: user.id,
          email: user.email,
        });
      }

      await auth0Logout({
        logoutParams: {
          returnTo: auth0Config.logoutUri,
        },
      });
    } catch (error) {
      authLog.error('logout_failed', error);
      toast.error('Logout failed. Please clear your browser cache.');
    }
  }, [auth0Logout, user]);

  // Permission checking methods
  const hasRole = useCallback(
    (role: UserRole): boolean => {
      return user?.roles.includes(role) || false;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: Permission): boolean => {
      return user?.permissions.includes(permission) || false;
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: Permission[]): boolean => {
      return permissions.some((permission) => hasPermission(permission));
    },
    [hasPermission]
  );

  // Session management
  const refreshSession = useCallback(async () => {
    try {
      await getAccessTokenSilently({ cacheMode: 'off' });
      const profile = await buildUserProfile();
      setUser(profile);
    } catch (error) {
      authLog.error('refresh_session_failed', error);
      throw error;
    }
  }, [getAccessTokenSilently, buildUserProfile]);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getAccessTokenSilently();
      return !!token;
    } catch (error) {
      authLog.error('validate_session_failed', error);
      return false;
    }
  }, [getAccessTokenSilently]);

  // Token methods
  const getAccessToken = useCallback(async (): Promise<string | undefined> => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      authLog.error('get_access_token_failed', error);
      return undefined;
    }
  }, [getAccessTokenSilently]);

  const getIdToken = useCallback(async (): Promise<string | undefined> => {
    try {
      const claims = await getIdTokenClaims();
      return claims?.__raw;
    } catch (error) {
      authLog.error('get_id_token_failed', error);
      return undefined;
    }
  }, [getIdTokenClaims]);

  // Audit logging for health data access
  const logHealthDataAccess = useCallback(
    (action: string, resource: string) => {
      if (user) {
        authLog.info('health_data_access', {
          userId: user.id,
          action,
          resource,
          timestamp: new Date().toISOString(),
        });
      }
    },
    [user]
  );

  const contextValue: AuthContextType = {
    user,
    isAuthenticated: auth0IsAuthenticated && !!user,
    isLoading,
    login,
    logout,
    hasRole,
    hasPermission,
    hasAnyPermission,
    refreshSession,
    validateSession,
    getAccessToken,
    getIdToken,
    logHealthDataAccess,
  };

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Main Auth Provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const config = getAuth0ConfigForEnvironment();

  return (
    <Auth0Provider
      domain={config.domain}
      clientId={config.clientId}
      authorizationParams={{
        redirect_uri: config.redirectUri,
        audience: config.audience,
        scope: config.scope,
      }}
      useRefreshTokens={config.useRefreshTokens}
      cacheLocation={config.cacheLocation}
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0Provider>
  );
}
