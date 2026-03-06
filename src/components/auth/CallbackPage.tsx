/**
 * Auth0 Callback Page Component
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useAuth0 } from '@auth0/auth0-react';
import { CheckCircle, Heart, XCircle } from 'lucide-react';
import { useEffect } from 'react';

export default function CallbackPage() {
  const { error, isLoading, loginWithRedirect } = useAuth0();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    // Recover when Auth0 returned without a state param (some proxies strip it)
    try {
      const url = new URL(window.location.href);
      const hasCode = url.searchParams.has('code');
      const hasState = url.searchParams.has('state');
      const retried = sessionStorage.getItem('auth0_callback_retry') === '1';
      if (hasCode && !hasState && !retried) {
        sessionStorage.setItem('auth0_callback_retry', '1');
        const redirectUri = `${window.location.origin}/callback`;
        void loginWithRedirect({
          authorizationParams: {
            prompt: 'none',
            redirect_uri: redirectUri,
          },
        });
        return;
      }
    } catch {
      // ignore
    }

    // The Auth0Provider will handle the callback automatically
    // and redirect to the main app once authentication is complete
    let timeout: number | undefined;
    const navigateHome = () => {
      try {
        window.history.replaceState(null, '', '/');
        // Notify listeners (AuthenticatedApp) that the path changed
        window.dispatchEvent(new PopStateEvent('popstate'));
      } catch {
        window.location.replace('/');
      }
    };
    // Safety: if we’re authenticated but still on /callback, navigate home
    if (isAuthenticated) {
      navigateHome();
    } else {
      // Hard guard: if we’re stuck here for >6s, try navigating home
      timeout = window.setTimeout(() => {
        navigateHome();
      }, 6000);
    }
    return () => {
      if (timeout) window.clearTimeout(timeout);
    };
  }, [isAuthenticated, loginWithRedirect]);

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <XCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
            <CardTitle>Authentication Error</CardTitle>
          </CardHeader>
          <CardContent className="text-center">
            <p className="mb-4 text-gray-600">
              There was an error during authentication. Please try again.
            </p>
            <p className="text-sm text-red-600">{error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-blue-600 p-3">
              <Heart className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle>VitalSense Health</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-center">
          {isLoading ? (
            <>
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
              <h3 className="text-lg font-medium">Authenticating...</h3>
              <p className="text-gray-600">
                Securely verifying your credentials and setting up your session.
              </p>
            </>
          ) : (
            <>
              <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
              <h3 className="text-lg font-medium">Authentication Successful</h3>
              <p className="text-gray-600">
                Redirecting to your health dashboard...
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
