/**
 * Stub AuthProvider for backwards compatibility
 * Auth0 has been removed from the project
 */
import React from 'react';

export const AuthProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <>{children}</>;
};
