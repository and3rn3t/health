/**
 * Authenticated App Wrapper
 *
 * Handles routing between login, callback, and main application
 */

import CallbackPage from '@/components/auth/CallbackPage';
import LoginPage from '@/components/auth/LoginPage';
import ProtectedRoute from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/hooks/useAuth';
import { PERMISSIONS } from '@/lib/authTypes';
import { useEffect, useMemo, useState } from 'react';

// Import the original App component
import OriginalApp from '../../App';

export default function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Development mode bypass - always bypass auth in development
  const isDevelopment = import.meta.env.DEV;

  // Check for demo mode - can be set by worker injection
  const isDemoMode = useMemo(() => {
    if (typeof window === 'undefined') return false;

    return (
      (window as typeof window & { VITALSENSE_DEMO_MODE?: boolean })
        .VITALSENSE_DEMO_MODE === true ||
      (window as typeof window & { vitalsense_bypass_auth?: boolean })
        .vitalsense_bypass_auth === true ||
      (typeof localStorage !== 'undefined' &&
        localStorage.getItem('vitalsense_demo_mode') === 'true')
    );
  }, []);

  useEffect(() => {
    // Listen for navigation changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    // Normalize Auth0 redirect: if code/state appear on a non-callback path, move to /callback
    try {
      const url = new URL(window.location.href);
      const hasCode = url.searchParams.has('code');
      const hasState = url.searchParams.has('state');
      if (hasCode && hasState && url.pathname !== '/callback') {
        const newUrl = `/callback${url.search}`;
        window.history.replaceState(null, '', newUrl);
        setCurrentPath('/callback');
      }
    } catch {
      // noop
    }
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // If SDK finished and we're authenticated while on /callback with no auth params, move home
  useEffect(() => {
    try {
      const url = new URL(window.location.href);
      const onCallback = url.pathname === '/callback';
      const hasAuthParams =
        url.searchParams.has('code') || url.searchParams.has('state');
      if (onCallback && !hasAuthParams && isAuthenticated) {
        window.history.replaceState(null, '', '/');
        window.dispatchEvent(new PopStateEvent('popstate'));
        setCurrentPath('/');
      }
    } catch {
      // ignore
    }
  }, [isAuthenticated]);

  // If OAuth params are present on a non-callback path, show callback progress immediately
  try {
    const u = new URL(window.location.href);
    const hasAuthParams =
      u.searchParams.has('code') || u.searchParams.has('state');
    if (hasAuthParams && u.pathname !== '/callback') {
      return <CallbackPage />;
    }
  } catch {
    // ignore
  }

  // Handle Auth0 callback: always show progress page; it will redirect once auth completes
  if (currentPath === '/callback') {
    if (isAuthenticated) {
      window.history.replaceState(null, '', '/');
      // sync internal state and notify listeners
      window.dispatchEvent(new PopStateEvent('popstate'));
      setCurrentPath('/');
      return <OriginalApp />; // Do not gate on permissions during callback redirect
    }
    return <CallbackPage />;
  }

  // Development mode: always bypass auth
  if (isDevelopment) {
    console.log('🔓 Development mode: bypassing authentication');
    return <OriginalApp />;
  }

  // Demo mode: bypass auth when demo mode is enabled
  if (isDemoMode) {
    console.log('🎯 Demo mode: bypassing authentication');
    return <OriginalApp />;
  }

  // Show login page if not authenticated
  if (!isLoading && !isAuthenticated) {
    return <LoginPage />;
  }

  // Show main application if authenticated
  return (
    <ProtectedRoute
      requiredPermissions={[PERMISSIONS.READ_HEALTH_DATA]}
      requireAll={false}
    >
      <OriginalApp />
    </ProtectedRoute>
  );
}
