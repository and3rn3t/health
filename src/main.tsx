import { AppToaster } from '@/components/ui/sonner';
import { AppWebSocketProvider } from '@/contexts/AppWebSocketProvider';
import { getApiClient } from '@/lib/api-client';
import { APP_NAME } from '@/lib/branding';
import '@/polyfills/importMetaEnv';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRouter, RouterProvider } from '@tanstack/react-router';
import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';
import { routeTree } from './routeTree.gen';
import './lib/pwa'; // Initialize PWA functionality
import { startOfflineSync } from './lib/offlineStore';
import './main.css';
import './monitor/rum';
import './types/global.d.ts';

// Create TanStack Router instance
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
});

// Register router types for full type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

if (import.meta.env.DEV) console.log('🚀 main.tsx: Starting app initialization...');

// Global error handler for ALL errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error, event.filename, event.lineno, event.colno);
  // Don't prevent default - let React error boundary handle it
  // But log detailed info for debugging
  if (event.error?.message?.includes('z') || event.error?.message?.includes('initialization')) {
    console.error('🚨 Potential initialization error detected:', {
      message: event.error?.message,
      stack: event.error?.stack,
      filename: event.filename,
      line: event.lineno,
      col: event.colno
    });
  }
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled rejection:', event.reason);
  if (event.reason?.message?.includes('Failed to parse KV key response')) {
    console.warn('🚨 Caught KV parsing error, preventing crash:', event.reason);
    event.preventDefault(); // Prevent the error from crashing the app
  }
  if (event.reason?.message?.includes('z') || event.reason?.message?.includes('initialization')) {
    console.error('🚨 Potential initialization error in promise:', event.reason);
  }
});

// Note: Mobile button styling is handled via CSS in main.css using .mobile-forced button rules
// Removed JavaScript-based button styling that was cloning/replacing buttons and breaking React event handlers

// Clean up any corrupted localStorage KV data on startup
try {
  const keysToRemove: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith('kv:') || key?.startsWith('spark-kv-')) {
      try {
        const value = localStorage.getItem(key);
        if (value) {
          JSON.parse(value); // Test if it's valid JSON
        }
      } catch {
        console.warn('🧹 Removing corrupted KV data for key:', key);
        keysToRemove.push(key);
      }
    }
  }
  keysToRemove.forEach((key) => localStorage.removeItem(key));
} catch (error) {
  console.warn('🚨 Error during KV cleanup:', error);
}

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
      gcTime: 1000 * 60 * 10, // 10 minutes before garbage collection
      retry: 3,
    },
    mutations: {
      retry: 1,
      retryDelay: (attempt: number) => Math.min(1000 * 2 ** attempt, 10_000),
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          {APP_NAME} Initialization Error
        </h1>
        <p className="mb-4 text-gray-600">{errorMessage}</p>
        {isDev && error && (
          <details className="mt-4 text-left">
            <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
              Development Details
            </summary>
            <pre className="mt-2 max-h-32 overflow-auto rounded bg-gray-100 p-2 text-xs">
              {errorStack}
            </pre>
          </details>
        )}
        <button
          onClick={() => window.location.reload()}
          className="rounded-lg bg-teal-600 px-4 py-2 text-white transition-colors hover:bg-teal-700"
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
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent"></div>
        <p className="text-gray-600">Loading {APP_NAME}...</p>
      </div>
    </div>
  );
}

// App wrapper component
export function AppWrapper() {
  return <RouterProvider router={router} />;
}

// Get the root element
const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Failed to find the root element');

// Create and render the React app with error handling
const root = createRoot(rootElement);
// Lightweight client error reporter with rate limiting
function initClientErrorReporter() {
  try {
    let lastErrorTime = 0;
    const ERROR_THROTTLE_MS = 5000; // Only send one error per 5 seconds

    const send = (payload: Record<string, unknown>) => {
      try {
        const now = Date.now();
        if (now - lastErrorTime < ERROR_THROTTLE_MS) {
          return; // Skip sending if too frequent
        }
        lastErrorTime = now;

        void getApiClient().reportClientError({
          ...payload,
          message: String(payload.message ?? 'unknown'),
          source: (payload.source as 'window.onerror' | 'unhandledrejection' | 'console.error') ?? 'window.onerror',
          route: window.location.pathname,
          ua: navigator.userAgent,
        });
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

if (import.meta.env.DEV) console.log('🎯 main.tsx: About to render React app...');
try {
  const AppTree = (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      <QueryClientProvider client={queryClient}>
        <Suspense fallback={<LoadingFallback />}>
          <AppWebSocketProvider>
            <AppWrapper />
          </AppWebSocketProvider>
        </Suspense>
        {/* Disable toasts in development to avoid StrictMode effect loops */}
        {!import.meta.env.DEV && <AppToaster position="top-right" richColors />}
      </QueryClientProvider>
    </ErrorBoundary>
  );

  if (import.meta.env.DEV) {
    // Render without StrictMode in development to avoid double-invocation of effects
    root.render(AppTree);
  } else {
    root.render(<StrictMode>{AppTree}</StrictMode>);
  }
  if (import.meta.env.DEV) console.log('✅ main.tsx: React app rendered successfully!');
} catch (error) {
  console.error('❌ main.tsx: React render failed:', error);
}
// Trigger hydration timing marker (defined in rum.ts)
try {
  window.__rumHydration?.();
} catch {
  /* noop */
}
// Start IndexedDB offline sync (drains pending writes when online)
startOfflineSync();
