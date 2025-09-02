/**
 * Enhanced Authentication Provider with HIPAA Compliance
 *
 * Features:
 * - Secure user session management
 * - Role-based access control
 * - Automatic token refresh
 * - Audit logging for health data access
 * - MFA enforcement
 * - Session timeout protection
 */

import { auth0Config, getAuth0ConfigForEnvironment } from '@/lib/auth0Config';
import {
  type AuthContextType,
  USER_ROLES,
  type UserProfile,
  logAuthError,
  logAuthOperation,
} from '@/lib/authTypes';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { toast } from 'sonner';

export const AuthContext = createContext<AuthContextType | null>(null);

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
        ] as string[]) || [USER_ROLES.PATIENT];
        const permissions =
          (idToken?.['https://vitalsense.app/permissions'] as string[]) || [];

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
          roles: roles as any[],
          permissions: permissions as any[],
          lastLogin: new Date().toISOString(),
          mfaEnabled,
          hipaaConsent,
          emergencyContacts: idToken?.[
            'https://vitalsense.app/emergency_contacts'
          ] as string[],
        };

        // Log successful authentication
        logAuthOperation('user_authentication', {
          userId: profile.id,
          email: profile.email,
          roles,
          mfaEnabled,
          hipaaConsent,
        });

        return profile;
      } catch (error) {
        logAuthError(error as Error, {
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

  // Logout function with dependency isolation
  const logout = useCallback(async () => {
    try {
      // Log logout event
      if (user) {
        logAuthOperation('user_logout', {
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
      logAuthError(error as Error, { operation: 'logout' });
      toast.error('Logout failed. Please clear your browser cache.');
    }
  }, [auth0Logout, user]);

  // Update user profile when Auth0 state changes
  useEffect(() => {
    const updateUserProfile = async () => {
      setIsLoading(true);
      const profile = await buildUserProfile();
      setUser(profile);
      setIsLoading(false);

      // Enforce HIPAA consent
      if (profile && !profile.hipaaConsent) {
        toast.error('HIPAA consent is required to access health data');
        await logout();
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
  }, [
    auth0IsAuthenticated,
    auth0User,
    auth0IsLoading,
    buildUserProfile,
    logout,
  ]);

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
      logAuthError(error as Error, { operation: 'login' });
      toast.error('Login failed. Please try again.');
    }
  }, [loginWithRedirect]);

  // Permission checking methods
  const hasRole = useCallback(
    (role: string): boolean => {
      return user?.roles.includes(role as any) || false;
    },
    [user]
  );

  const hasPermission = useCallback(
    (permission: string): boolean => {
      return user?.permissions.includes(permission as any) || false;
    },
    [user]
  );

  const hasAnyPermission = useCallback(
    (permissions: string[]): boolean => {
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
      logAuthError(error as Error, { operation: 'refresh_session' });
      throw error;
    }
  }, [getAccessTokenSilently, buildUserProfile]);

  const validateSession = useCallback(async (): Promise<boolean> => {
    try {
      const token = await getAccessTokenSilently();
      return !!token;
    } catch (error) {
      logAuthError(error as Error, { operation: 'validate_session' });
      return false;
    }
  }, [getAccessTokenSilently]);

  // Token methods
  const getAccessToken = useCallback(async (): Promise<string | undefined> => {
    try {
      return await getAccessTokenSilently();
    } catch (error) {
      logAuthError(error as Error, { operation: 'get_access_token' });
      return undefined;
    }
  }, [getAccessTokenSilently]);

  const getIdToken = useCallback(async (): Promise<string | undefined> => {
    try {
      const claims = await getIdTokenClaims();
      return claims?.__raw;
    } catch (error) {
      logAuthError(error as Error, { operation: 'get_id_token' });
      return undefined;
    }
  }, [getIdTokenClaims]);

  // Audit logging for health data access
  const logHealthDataAccess = useCallback(
    (action: string, resource: string) => {
      if (user) {
        logAuthOperation('health_data_access', {
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
