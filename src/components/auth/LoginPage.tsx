/**
 * Login Page Component
 */

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { isValidAuth0Config } from '@/lib/auth0Config';
import {
  AlertTriangle,
  CheckCircle,
  Heart,
  Lock,
  Shield,
  Users,
} from 'lucide-react';
import { useEffect } from 'react';

export default function LoginPage() {
  const { login, isLoading } = useAuth();

  // Check if Auth0 is properly configured
  const isConfigured = isValidAuth0Config();

  useEffect(() => {
    // Auto-redirect if already authenticated
    // This will be handled by the AuthProvider
  }, []);

  const handleLogin = async () => {
    if (!isConfigured) {
      console.error('Auth0 configuration is missing');
      return;
    }
    await login();
  };

  if (!isConfigured) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <AlertTriangle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <CardTitle>Configuration Required</CardTitle>
            <CardDescription>
              Auth0 configuration is missing. Please set up your environment
              variables.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Alert>
              <AlertDescription>
                Please configure VITE_AUTH0_DOMAIN and VITE_AUTH0_CLIENT_ID in
                your environment variables.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="w-full max-w-lg space-y-8 p-8">
        {/* Header */}
        <div className="text-center">
          <div className="mb-6 flex justify-center">
            <div className="rounded-full bg-blue-600 p-3">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            VitalSense Health
          </h1>
          <p className="text-gray-600">
            Secure health data management platform
          </p>
        </div>

        {/* Login Card */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="pb-6 text-center">
            <CardTitle className="text-xl">Secure Access</CardTitle>
            <CardDescription>
              Sign in to access your health dashboard with enterprise-grade
              security
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Security Features */}
            <div className="space-y-4">
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Shield className="h-5 w-5 text-green-500" />
                <span>HIPAA-compliant authentication</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Lock className="h-5 w-5 text-green-500" />
                <span>End-to-end encrypted data protection</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>Multi-factor authentication support</span>
              </div>
              <div className="flex items-center space-x-3 text-sm text-gray-600">
                <Users className="h-5 w-5 text-green-500" />
                <span>Role-based access control</span>
              </div>
            </div>

            {/* Login Button */}
            <Button
              onClick={handleLogin}
              disabled={isLoading}
              className="h-12 w-full text-lg font-medium"
              size="lg"
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-b-2 border-white"></div>
                  <span>Connecting...</span>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>Sign In Securely</span>
                </div>
              )}
            </Button>

            {/* Security Notice */}
            <Alert>
              <Lock className="h-4 w-4" />
              <AlertDescription className="text-xs">
                Your health data is protected by industry-leading security
                measures including encryption at rest and in transit, HIPAA
                compliance, and zero-trust architecture.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500">
          <p>
            By signing in, you agree to our{' '}
            <a href="/terms" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
          <p className="mt-2">
            This application is compliant with HIPAA and SOC 2 Type II
            standards.
          </p>
        </div>
      </div>
    </div>
  );
}
