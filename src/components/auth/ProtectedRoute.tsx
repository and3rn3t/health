/**
 * Protected Route Component
 *
 * Wraps components that require authentication and specific permissions
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
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

export default function ProtectedRoute({
  children,
  requiredRoles = [],
  requiredPermissions = [],
  requireAll = false,
  fallback,
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user, hasRole, hasPermission, login } =
    useAuth();

  // Show loading state
  if (isLoading) {
    return (
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
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated) {
    return (
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
            <Button onClick={login} className="w-full">
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
  }

  // Check role requirements
  if (requiredRoles.length > 0 && user) {
    const hasRequiredRoles = requireAll
      ? requiredRoles.every((role) => hasRole(role))
      : requiredRoles.some((role) => hasRole(role));

    if (!hasRequiredRoles) {
      return (
        fallback || (
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <CardTitle>Access Denied</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-gray-600">
                  You don't have the required role to access this area.
                </p>
                <Alert>
                  <AlertDescription>
                    <strong>Required roles:</strong> {requiredRoles.join(', ')}
                    <br />
                    <strong>Your roles:</strong>{' '}
                    {user.roles.join(', ') || 'None'}
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-500">
                  Contact your administrator if you believe you should have
                  access.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      );
    }
  }

  // Check permission requirements
  if (requiredPermissions.length > 0 && user) {
    const hasRequiredPermissions = requireAll
      ? requiredPermissions.every((permission) => hasPermission(permission))
      : requiredPermissions.some((permission) => hasPermission(permission));

    if (!hasRequiredPermissions) {
      return (
        fallback || (
          <div className="flex min-h-screen items-center justify-center bg-gray-50">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
                <CardTitle>Access Denied</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-center">
                <p className="text-gray-600">
                  You don't have the required permissions to access this area.
                </p>
                <Alert>
                  <AlertDescription>
                    <strong>Required permissions:</strong>{' '}
                    {requiredPermissions.join(', ')}
                    <br />
                    <strong>Your permissions:</strong>{' '}
                    {user.permissions.join(', ') || 'None'}
                  </AlertDescription>
                </Alert>
                <p className="text-sm text-gray-500">
                  Contact your administrator if you believe you should have
                  access.
                </p>
              </CardContent>
            </Card>
          </div>
        )
      );
    }
  }

  // Render children if all checks pass
  return <>{children}</>;
}
