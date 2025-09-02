/**
 * Authentication hook - separated for Fast Refresh compatibility
 */

import { AuthContext } from '@/contexts/AuthProvider';
import type { AuthContextType } from '@/lib/authTypes';
import { useContext } from 'react';

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
