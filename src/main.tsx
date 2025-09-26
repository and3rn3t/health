import { Toaster } from '@/components/ui/sonner';
// RUM metrics (must be imported very early before app renders)
import { CoachingControlPanel } from '@/components/coaching/CoachingControlPanel';
import { AppWebSocketProvider } from '@/contexts/AppWebSocketProvider';
import { AuthProvider } from '@/contexts/AuthProvider';
import '@/polyfills/importMetaEnv';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import App from './App';
import './main.css';
import './monitor/rum';
import './types/global.d.ts';

// Declare global augmentation for RUM hydration marker
declare global {
  interface Window {
    __rumHydration?: () => void;
  }
}

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
export function ErrorFallback({ error }: Readonly<{ error?: Error | null }>) {
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
export function LoadingFallback() {
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
export function AppWrapper() {
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
// Lightweight client error reporter
function initClientErrorReporter() {
  try {
    const send = (payload: Record<string, unknown>) => {
      try {
        fetch('/api/client-error', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            ...payload,
            route: window.location.pathname,
            ua: navigator.userAgent,
          }),
          keepalive: true,
        }).catch(() => void 0);
      } catch {
        /* noop */
      }
    };
    window.addEventListener('error', (ev) => {
      try {
        const message = ev.message || 'window_error';
        const stack = ev.error?.stack ? String(ev.error?.stack) : undefined;
        send({ source: 'window.onerror', message, stack });
      } catch {
        /* noop */
      }
    });
    window.addEventListener(
      'unhandledrejection',
      (ev: PromiseRejectionEvent) => {
        try {
          const reason = ev.reason as unknown;
          let message = 'unhandledrejection';
          let stack: string | undefined;
          if (typeof reason === 'string') {
            message = reason;
          } else if (reason instanceof Error) {
            message = reason.message || message;
            stack = reason.stack ? String(reason.stack) : undefined;
          } else if (typeof reason === 'object' && reason) {
            try {
              message = JSON.stringify(reason);
            } catch {
              /* noop */
            }
          }
          send({ source: 'unhandledrejection', message, stack });
        } catch {
          /* noop */
        }
      }
    );
  } catch {
    /* noop */
  }
}
initClientErrorReporter();
root.render(
  <StrictMode>
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingFallback />}>
          <AppWebSocketProvider>
            <AppWrapper />
            <CoachingControlPanel />
          </AppWebSocketProvider>
        </Suspense>
        <Toaster position="top-right" richColors />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>
);
// Trigger hydration timing marker (defined in rum.ts)
try {
  window.__rumHydration?.();
} catch {
  /* noop */
}
