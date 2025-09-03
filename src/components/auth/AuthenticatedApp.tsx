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
import { useEffect, useState } from 'react';

// Import the original App component
import OriginalApp from '../../App';

export default function AuthenticatedApp() {
  const { isAuthenticated, isLoading } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);

  // Development mode bypass - always bypass auth in development
  const isDevelopment = import.meta.env.DEV;

  useEffect(() => {
    // Listen for navigation changes
    const handlePopState = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Handle Auth0 callback
  if (currentPath === '/callback') {
    return <CallbackPage />;
  }

  // Development mode: always bypass auth
  if (isDevelopment) {
    console.log('🔓 Development mode: bypassing authentication');
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
