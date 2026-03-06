/**
 * User Profile Component
 *
 * Displays user information and security settings
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { getAuth0ConfigForEnvironment } from '@/lib/auth0Config';
import { USER_ROLES, logAuthError } from '@/lib/authTypes';
import {
  CheckCircle,
  Clock,
  Copy,
  Crown,
  KeyRound,
  Lock,
  LogOut,
  Mail,
  Plus,
  RefreshCw,
  Settings,
  Shield,
  User,
  X,
  XCircle,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export default function UserProfile() {
  const {
    user,
    logout,
    login,
    isLoading,
    refreshSession,
    validateSession,
    hasPermission,
    getAccessToken,
    getIdToken,
  } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [idTokenExpiry, setIdTokenExpiry] = useState<Date | null>(null);
  const [apiTokenExpiry, setApiTokenExpiry] = useState<Date | null>(null);
  const [now, setNow] = useState(new Date());

  const initials = useMemo(() => {
    if (!user?.name) return 'U';
    const parts = user.name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (
      parts[0].charAt(0) + parts[parts.length - 1].charAt(0)
    ).toUpperCase();
  }, [user?.name]);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    // setIsLoggingOut will be reset when component unmounts
  };

  const handleCopyUserId = useCallback(async () => {
    if (!user?.id) return;
    try {
      await navigator.clipboard.writeText(user.id);
      toast.success('User ID copied');
    } catch {
      toast.error('Failed to copy User ID');
    }
  }, [user?.id]);

  const handleRefreshSession = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await refreshSession();
      toast.success('Session refreshed');
    } catch (err) {
      logAuthError(
        err instanceof Error ? err : new Error('refresh_session_failed'),
        { operation: 'refresh_session' }
      );
      toast.error('Refresh failed');
    } finally {
      setIsRefreshing(false);
    }
  }, [refreshSession]);

  const handleValidateSession = useCallback(async () => {
    try {
      setIsValidating(true);
      const ok = await validateSession();
      if (ok) toast.success('Session is valid');
      else toast.error('Session is invalid');
    } catch (err) {
      logAuthError(
        err instanceof Error ? err : new Error('validate_session_failed'),
        { operation: 'validate_session' }
      );
      toast.error('Validation failed');
    } finally {
      setIsValidating(false);
    }
  }, [validateSession]);

  // Decode JWT exp
  const decodeJwtExp = (token?: string | undefined): number | null => {
    if (!token) return null;
    try {
      const parts = token.split('.');
      if (parts.length !== 3) return null;
      const payload = JSON.parse(atob(parts[1]));
      return typeof payload.exp === 'number' ? payload.exp : null;
    } catch {
      return null;
    }
  };

  const updateTokenExpiries = useCallback(async () => {
    try {
      const [idRaw, accessRaw] = await Promise.all([
        getIdToken(),
        getAccessToken(),
      ]);
      const idExp = decodeJwtExp(idRaw);
      const atExp = decodeJwtExp(accessRaw);
      setIdTokenExpiry(idExp ? new Date(idExp * 1000) : null);
      setApiTokenExpiry(atExp ? new Date(atExp * 1000) : null);
    } catch (err) {
      logAuthError(
        err instanceof Error ? err : new Error('token_decode_failed'),
        { operation: 'decode_tokens' }
      );
    }
  }, [getAccessToken, getIdToken]);

  // Ticker for countdown
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // Load expiries initially and after refresh
  useEffect(() => {
    updateTokenExpiries();
  }, [updateTokenExpiries, isRefreshing]);

  // Auto-refresh ~60s before expiry
  useEffect(() => {
    if (!autoRefresh) return;
    const soonMs = 60 * 1000;
    const next = [idTokenExpiry, apiTokenExpiry]
      .filter((d): d is Date => !!d)
      .map((d) => d.getTime())
      .sort((a, b) => a - b)[0];
    if (!next) return;
    const msLeft = next - now.getTime();
    if (msLeft > 0 && msLeft < soonMs && !isRefreshing) {
      // Non-blocking refresh
      handleRefreshSession().catch(() => {});
    }
  }, [
    autoRefresh,
    idTokenExpiry,
    apiTokenExpiry,
    now,
    isRefreshing,
    handleRefreshSession,
  ]);

  const fmtTimeLeft = (expiry: Date | null) => {
    if (!expiry) return 'n/a';
    const seconds = Math.max(
      0,
      Math.floor((expiry.getTime() - now.getTime()) / 1000)
    );
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Manage MFA — re-auth to trigger policies
  const handleManageMfa = () => {
    // Re-auth to trigger policies using Auth0 redirect
    login();
  };

  // Change Password — open Auth0 hosted reset
  const handleChangePassword = useCallback(() => {
    const cfg = getAuth0ConfigForEnvironment();
    const url = `https://${cfg.domain}/u/reset-password?client_id=${encodeURIComponent(cfg.clientId)}`;
    window.open(url, '_blank', 'noopener');
  }, []);

  if (isLoading || !user) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-16 w-16 rounded-full bg-gray-200"></div>
            <div className="h-4 w-3/4 rounded bg-gray-200"></div>
            <div className="h-4 w-1/2 rounded bg-gray-200"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRoleColor = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'destructive';
      case USER_ROLES.HEALTHCARE_PROVIDER:
        return 'default';
      default:
        return 'outline';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return <Crown className="h-3 w-3" />;
      case USER_ROLES.HEALTHCARE_PROVIDER:
        return <Shield className="h-3 w-3" />;
      default:
        return <User className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* User Information Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            <span>User Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
            <div className="flex items-center gap-4">
              <Avatar className="h-16 w-16">
                {user.picture && (
                  <AvatarImage src={user.picture} alt={user.name} />
                )}
                <AvatarFallback className="text-lg">{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <h3 className="text-lg font-semibold">{user.name}</h3>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Mail className="h-4 w-4" />
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    Last login: {new Date(user.lastLogin).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-xs">User ID</span>
              <code className="bg-muted rounded px-2 py-1 text-xs">
                {user.id.slice(0, 12)}…
              </code>
              <Button variant="ghost" size="sm" onClick={handleCopyUserId}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Roles */}
          <div>
            <h4 className="mb-2 text-sm font-medium text-gray-700">Roles</h4>
            <div className="flex flex-wrap gap-2">
              {user.roles.map((role) => (
                <Badge
                  key={role}
                  variant={getRoleColor(role)}
                  className="flex items-center space-x-1"
                >
                  {getRoleIcon(role)}
                  <span>{role.replace('_', ' ')}</span>
                </Badge>
              ))}
            </div>
          </div>

          {/* Permissions (if present) */}
          {user.permissions && user.permissions.length > 0 && (
            <div>
              <h4 className="mb-2 text-sm font-medium text-gray-700">
                Permissions
              </h4>
              <div className="flex flex-wrap gap-2">
                {user.permissions.map((perm) => (
                  <Badge key={perm} variant="outline" className="text-xs">
                    {perm}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Security Status */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Security Status
            </h4>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* MFA Status */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center space-x-2">
                  <Lock className="h-4 w-4" />
                  <span className="text-sm">Multi-Factor Authentication</span>
                </div>
                {user.mfaEnabled ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>

              {/* HIPAA Consent */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center space-x-2">
                  <Shield className="h-4 w-4" />
                  <span className="text-sm">HIPAA Consent</span>
                </div>
                {user.hipaaConsent ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </div>

          {/* Security Alerts */}
          {!user.mfaEnabled &&
            (user.roles.includes(USER_ROLES.HEALTHCARE_PROVIDER) ||
              user.roles.includes(USER_ROLES.ADMIN)) && (
              <Alert>
                <Shield className="h-4 w-4" />
                <AlertDescription>
                  Your role requires multi-factor authentication. Please enable
                  MFA to ensure secure access to health data.
                </AlertDescription>
              </Alert>
            )}

          {!user.hipaaConsent && (
            <Alert variant="destructive">
              <Shield className="h-4 w-4" />
              <AlertDescription>
                HIPAA consent is required to access health data. Please complete
                the consent process.
              </AlertDescription>
            </Alert>
          )}

          {/* Emergency Contacts */}
          {/* Token Expiry */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Token Expiry</h4>
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>ID token</span>
                <span className="font-mono">{fmtTimeLeft(idTokenExpiry)}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg border p-3 text-sm">
                <span>API token</span>
                <span className="font-mono">{fmtTimeLeft(apiTokenExpiry)}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1">
              <Switch checked={autoRefresh} onCheckedChange={setAutoRefresh} />
              <span className="text-xs text-gray-600">
                Auto-refresh before expiry
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Session & Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <span>Session & Account Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button
              variant="outline"
              onClick={handleRefreshSession}
              disabled={isRefreshing}
              className="flex items-center gap-2"
            >
              {isRefreshing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              <span>Refresh Session</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleValidateSession}
              disabled={isValidating}
              className="flex items-center gap-2"
            >
              {isValidating ? (
                <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-current" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              <span>Validate Session</span>
            </Button>

            <div className="hidden sm:block">
              <Separator orientation="vertical" className="h-9" />
            </div>

            <Button
              variant="outline"
              onClick={handleManageMfa}
              className="flex items-center gap-2"
            >
              <KeyRound className="h-4 w-4" />
              <span>Manage MFA</span>
            </Button>

            <Button
              variant="outline"
              onClick={handleChangePassword}
              className="flex items-center gap-2"
            >
              <Lock className="h-4 w-4" />
              <span>Change Password</span>
            </Button>

            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center gap-2"
            >
              {isLoggingOut ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                  <span>Signing Out...</span>
                </>
              ) : (
                <>
                  <LogOut className="h-4 w-4" />
                  <span>Sign Out</span>
                </>
              )}
            </Button>
          </div>

          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription className="text-xs">
              All actions are logged for security and compliance purposes. Your
              session will automatically expire after a period of inactivity.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
