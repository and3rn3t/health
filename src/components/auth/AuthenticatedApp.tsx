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
