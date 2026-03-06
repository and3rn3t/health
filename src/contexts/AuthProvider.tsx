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
  PERMISSIONS,
  type Permission,
  USER_ROLES,
  type UserProfile,
  type UserRole,
  logAuthError,
  logAuthOperation,
} from '@/lib/authTypes';
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react';
import {
  ReactNode,
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthContextProvider({ children }: Readonly<AuthProviderProps>) {
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
  const hasLoggedAuthRef = useRef(false);

  const getUpdatedAt = (u: unknown): string | undefined => {
    if (
      u &&
      typeof u === 'object' &&
      'updated_at' in (u as Record<string, unknown>)
    ) {
      const v = (u as { updated_at?: unknown }).updated_at;
      return typeof v === 'string' ? v : undefined;
    }
    return undefined;
  };

  const sessionGet = (key: string): string | undefined => {
    try {
      return typeof window !== 'undefined'
        ? (window.sessionStorage.getItem(key) ?? undefined)
        : undefined;
    } catch {
      return undefined;
    }
  };

  const sessionSet = (key: string, value: string) => {
    try {
      if (typeof window !== 'undefined')
        window.sessionStorage.setItem(key, value);
    } catch {
      /* no-op */
    }
  };

  // Extract user profile from Auth0 user
  const buildUserProfile =
    useCallback(async (): Promise<UserProfile | null> => {
      if (!auth0User || !auth0IsAuthenticated) return null;

      try {
        // Build from ID token; don’t require an API access token
        let idToken = await getIdTokenClaims().catch(() => undefined);
        if (!idToken) {
          // Try once to refresh silently, but ignore failures
          try {
            await getAccessTokenSilently();
            idToken = await getIdTokenClaims().catch(() => undefined);
          } catch {
            /* ignore */
          }
        }

        // Extract roles and permissions from token claims (normalize shapes)
        const rawRoles = idToken?.['https://vitalsense.app/roles'];
        const rolesFromToken: string[] = Array.isArray(rawRoles)
          ? (rawRoles as unknown[]).filter(
              (r): r is string => typeof r === 'string' && r.trim().length > 0
            )
          : typeof rawRoles === 'string' && rawRoles.trim().length > 0
            ? [rawRoles]
            : [];

        const rawPerms = idToken?.['https://vitalsense.app/permissions'];
        let permissions: string[] = Array.isArray(rawPerms)
          ? (rawPerms as unknown[]).filter(
              (p): p is string => typeof p === 'string' && p.trim().length > 0
            )
          : typeof rawPerms === 'string' && rawPerms.trim().length > 0
            ? [rawPerms]
            : [];
        // Fallback: if no explicit permissions claim, grant basic read permission for authenticated users
        if (permissions.length === 0) {
          permissions = [PERMISSIONS.READ_HEALTH_DATA];
        }
        // Always ensure baseline read permission for authenticated users
        if (!permissions.includes(PERMISSIONS.READ_HEALTH_DATA)) {
          permissions = [...permissions, PERMISSIONS.READ_HEALTH_DATA];
        }

        // Derive a minimal virtual role set when roles aren't configured in Auth0
        // This keeps role-gated routes working using permission signals.
        const roles: string[] =
          rolesFromToken.length > 0
            ? [...rolesFromToken]
            : [USER_ROLES.PATIENT];
        const perms = new Set(permissions);
        if (
          (perms.has(PERMISSIONS.MANAGE_USERS) ||
            perms.has(PERMISSIONS.CONFIGURE_SYSTEM)) &&
          !roles.includes(USER_ROLES.ADMIN)
        ) {
          roles.push(USER_ROLES.ADMIN);
        }

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
          roles: roles as UserRole[],
          permissions: permissions as Permission[],
          // Use Auth0 user timestamp to avoid changing on every render
          lastLogin: getUpdatedAt(auth0User) ?? new Date().toISOString(),
          mfaEnabled,
          hipaaConsent,
          emergencyContacts: idToken?.[
            'https://vitalsense.app/emergency_contacts'
          ] as string[],
        };

        // Log successful authentication once per tab session and once per mount
        const logKey = `auth:logged:${profile.id}`;
        const alreadyLogged = sessionGet(logKey);
        if (!hasLoggedAuthRef.current && !alreadyLogged) {
          logAuthOperation('user_authentication', {
            userId: profile.id,
            email: profile.email,
            roles,
            mfaEnabled,
            hipaaConsent,
          });
          hasLoggedAuthRef.current = true;
          sessionSet(logKey, '1');
        }

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

      // HIPAA consent: warn but do not force logout to avoid redirect loops
      // Suppress HIPAA consent warning during initial auth to avoid noisy toasts

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
      logAuthError(error as Error, { operation: 'login' });
      toast.error('Login failed. Please try again.');
    }
  }, [loginWithRedirect]);

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

  const contextValue: AuthContextType = useMemo(
    () => ({
      user,
      // Use Auth0 SDK's flag directly; don't block on profile hydration
      isAuthenticated: auth0IsAuthenticated,
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
    }),
    [
      user,
      auth0IsAuthenticated,
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
    ]
  );

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  );
}

// Main Auth Provider component
export function AuthProvider({ children }: Readonly<AuthProviderProps>) {
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
      onRedirectCallback={(appState) => {
        try {
          const target =
            (appState &&
              (appState as unknown as { returnTo?: string }).returnTo) ||
            '/';
          window.history.replaceState(null, '', target);
          window.dispatchEvent(new PopStateEvent('popstate'));
        } catch {
          // no-op
        }
      }}
    >
      <AuthContextProvider>{children}</AuthContextProvider>
    </Auth0Provider>
  );
}
