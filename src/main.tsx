import { AuthProvider } from '@/contexts/AuthProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import './main.css';
import './types/global.d.ts';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 3,
    },
  },
});

// Error boundary fallback component
function ErrorFallback({ error }: { error?: Error | null }) {
  const isDev =
    typeof window !== 'undefined' && window.location.hostname === 'localhost';

  // Safe error message extraction
  const errorMessage =
    error?.message ||
    'An unexpected error occurred while starting the application.';
  const errorStack = error?.stack || 'No stack trace available';

  return (
    <div className="bg-gray-50 flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <div className="text-6xl mb-4">⚠️</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          VitalSense Initialization Error
        </h1>
        <p className="text-gray-600 mb-4">{errorMessage}</p>
        {isDev && error && (
          <details className="mt-4 text-left">
            <summary className="hover:text-gray-700 cursor-pointer text-sm text-gray-500">
              Development Details
            </summary>
            <pre className="text-xs max-h-32 mt-2 overflow-auto rounded bg-gray-100 p-2">
              {errorStack}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="bg-teal-600 hover:bg-teal-700 rounded-lg px-4 py-2 text-white transition-colors"
        >
          Reload Application
        </button>
      </div>
    </div>
  );
}

// Loading component
function LoadingFallback() {
  return (
    <div className="bg-gray-50 flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="animate-spin border-teal-500 mx-auto mb-4 h-8 w-8 rounded-full border-4 border-t-transparent"></div>
        <p className="text-gray-600">Loading VitalSense...</p>
      </div>
    </div>
  );
}

// App wrapper component that always includes AuthProvider for compatibility
function AppWrapper() {
  // Always provide AuthProvider to prevent "useAuth must be used within an AuthProvider" errors
  // The useAuth hook itself handles the auth enabled/disabled logic
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

// Get the root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Create and render the React app with error handling
const root = createRoot(rootElement);
root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingFallback />}>
          <AppWrapper />
        </Suspense>
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
