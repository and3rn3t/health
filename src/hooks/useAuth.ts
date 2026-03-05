/**
 * Stub useAuth hook for components that still reference auth
 * Returns demo/unauthenticated state since Auth0 was removed
 */
export function useAuth() {
  return {
    user: null,
    isAuthenticated: false,
    isLoading: false,
    login: () => console.log('Auth removed - login not available'),
    logout: () => console.log('Auth removed - logout not available'),
  };
}
