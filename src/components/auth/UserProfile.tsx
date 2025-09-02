/**
 * User Profile Component
 *
 * Displays user information and security settings
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { USER_ROLES } from '@/lib/authTypes';
import {
  CheckCircle,
  Clock,
  Crown,
  Lock,
  LogOut,
  Mail,
  Settings,
  Shield,
  User,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';

export default function UserProfile() {
  const { user, logout, isLoading } = useAuth();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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

  const handleLogout = async () => {
    setIsLoggingOut(true);
    await logout();
    // setIsLoggingOut will be reset when component unmounts
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case USER_ROLES.ADMIN:
        return 'destructive';
      case USER_ROLES.HEALTHCARE_PROVIDER:
        return 'default';
      case USER_ROLES.CAREGIVER:
        return 'secondary';
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
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>User Profile</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Profile Picture and Basic Info */}
          <div className="flex items-center space-x-4">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="h-16 w-16 rounded-full border-2 border-gray-200"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
                <User className="h-8 w-8 text-white" />
              </div>
            )}
            <div className="space-y-1">
              <h3 className="text-lg font-semibold">{user.name}</h3>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{user.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                <span>
                  Last login: {new Date(user.lastLogin).toLocaleString()}
                </span>
              </div>
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
        </CardContent>
      </Card>

      {/* Actions Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Settings className="h-5 w-5" />
            <span>Account Actions</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Security Settings</span>
            </Button>

            <Button
              variant="destructive"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex items-center space-x-2"
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
