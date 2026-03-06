/**
 * Protected Route Component
 *
 * Wraps components that require authentication and specific permissions
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import type { Permission, UserRole } from '@/lib/authTypes';
import { AlertTriangle, Heart, Lock, Shield } from 'lucide-react';
import { ReactNode } from 'react';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRoles?: UserRole[];
  requiredPermissions?: Permission[];
  requireAll?: boolean; // If true, user must have ALL roles/permissions. If false, ANY will suffice.
  fallback?: ReactNode;
}

// Small helpers and presentational components kept outside to avoid nested components
const anyOrAll = <T,>(items: T[], all: boolean, pred: (t: T) => boolean) =>
  all ? items.every(pred) : items.some(pred);

const LoadingView = () => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-blue-600 p-3">
            <Heart className="h-8 w-8 animate-pulse text-white" />
          </div>
        </div>
        <CardTitle>VitalSense Health</CardTitle>
      </CardHeader>
      <CardContent className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600"></div>
        <p className="text-gray-600">Loading your secure session...</p>
      </CardContent>
    </Card>
  </div>
);

const LoginView = ({ onLogin }: { onLogin: () => void }) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <Shield className="mx-auto mb-4 h-12 w-12 text-blue-600" />
        <CardTitle>Authentication Required</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-gray-600">
          Please sign in to access this secure area of the application.
        </p>
        <Button onClick={onLogin} className="w-full">
          <Lock className="mr-2 h-4 w-4" />
          Sign In Securely
        </Button>
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Your session is protected by enterprise-grade security including
            HIPAA compliance and multi-factor authentication.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  </div>
);

type AccessDeniedViewProps = {
  title: string;
  message: string;
  requiredLabel: string;
  requiredItems: string[];
  userLabel: string;
  userItems: string[];
};

const AccessDeniedView = ({
  title,
  message,
  requiredLabel,
  requiredItems,
  userLabel,
  userItems,
}: AccessDeniedViewProps) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">
    <Card className="w-full max-w-md">
      <CardHeader className="text-center">
        <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-center">
        <p className="text-gray-600">{message}</p>
        <Alert>
          <AlertDescription>
            <strong>{requiredLabel}:</strong>{' '}
            {requiredItems.join(', ') || 'None'}
            <br />
            <strong>{userLabel}:</strong> {userItems.join(', ') || 'None'}
          </AlertDescription>
        </Alert>
        <p className="text-sm text-gray-500">
          Contact your administrator if you believe you should have access.
        </p>
      </CardContent>
    </Card>
  </div>
);

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback,
}: Readonly<ProtectedRouteProps>) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission, login } =
    useAuth();

  // Show loading state
  if (isLoading) return <LoadingView />;

  // Allow initial pass-through right after authentication while the profile hydrates
  if (isAuthenticated && !user) {
    return <>{children}</>;
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) return <LoginView onLogin={login} />;

  // Check role requirements
  if (requiredRoles.length > 0 && user) {
    const rolesOk = anyOrAll(requiredRoles, requireAll, hasRole);
    if (!rolesOk) {
      return (
        fallback || (
          <AccessDeniedView
            title="Access Denied"
            message="You don't have the required role to access this area."
            requiredLabel="Required roles"
            requiredItems={requiredRoles}
            userLabel="Your roles"
            userItems={user.roles}
          />
        )
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && user) {
    // If permissions haven't hydrated yet, allow access to avoid loops
    if (!user.permissions || user.permissions.length === 0)
      return <>{children}</>;
    const permsOk = anyOrAll(requiredPermissions, requireAll, hasPermission);
    if (!permsOk) {
      return (
        fallback || (
          <AccessDeniedView
            title="Access Denied"
            message="You don't have the required permissions to access this area."
            requiredLabel="Required permissions"
            requiredItems={requiredPermissions}
            userLabel="Your permissions"
            userItems={user.permissions}
          />
        )
      );
    }
  }

  // Render children if all checks pass, with a soft HIPAA banner if consent is missing
  return (
    <>
      {user && isAuthenticated && user.hipaaConsent === false && (
        <div className="mx-auto my-2 w-full max-w-5xl px-2">
          <Alert>
            <AlertDescription className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">HIPAA</Badge>
              HIPAA consent is not recorded. Some features may be limited until
              consent is granted.
            </AlertDescription>
          </Alert>
        </div>
      )}
      {children}
    </>
  );
}
