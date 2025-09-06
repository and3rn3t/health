import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import React from 'react';

// Mock AuthProvider for testing
const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
  return <div data-testid="mock-auth-provider">{children}</div>;
};

// Mock AuthContext
const mockAuthContext = {
  user: {
    id: 'test-user',
    email: 'test@vitalsense.com',
    name: 'Test User',
  },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  getAccessToken: jest.fn().mockResolvedValue('mock-token'),
};

// Test wrapper with providers
export const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <MockAuthProvider>{children}</MockAuthProvider>
    </QueryClientProvider>
  );
};

// Custom render function with providers
export const renderWithProviders = (ui: React.ReactElement) => {
  return render(ui, { wrapper: TestWrapper });
};

// Mock useAuth hook
export const mockUseAuth = () => mockAuthContext;

// Mock the useAuth hook globally for tests
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => mockAuthContext,
}));

export { mockAuthContext };
