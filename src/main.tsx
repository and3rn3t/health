import { Toaster } from '@/components/ui/sonner';
import '@github/spark/spark';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import AuthenticatedApp from '@/components/auth/AuthenticatedApp';
import { AppErrorBoundary } from '@/components/error/ErrorBoundaryComponents.tsx';
import { AuthProvider } from '@/contexts/AuthProvider';
import { setupGlobalErrorHandling } from '@/lib/errorHandling';

import './index.css';
import './main.css';
import './styles/theme.css';

// Initialize global error handling
setupGlobalErrorHandling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors
        if (error instanceof Error && error.message.includes('40')) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
    mutations: {
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <AuthenticatedApp />
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </AuthProvider>
  </AppErrorBoundary>
);
