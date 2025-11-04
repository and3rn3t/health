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
import './lib/pwa'; // Initialize PWA functionality
import './main.css';
import './vitalsense.css'; // VitalSense iOS 26 enhanced styles
import './monitor/rum';
import './types/global.d.ts';

console.log('🚀 main.tsx: Starting app initialization...');

// Global error handler for ALL errors
window.addEventListener('error', (event) => {
  console.error('🚨 Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('🚨 Unhandled rejection:', event.reason);
  if (event.reason?.message?.includes('Failed to parse KV key response')) {
    console.warn('🚨 Caught KV parsing error, preventing crash:', event.reason);
    event.preventDefault(); // Prevent the error from crashing the app
  }
});

// Mobile button styling override - run after DOM loads
function applyMobileButtonStyling() {
  console.log('🔍 Checking for mobile mode and buttons to style...');

  // Debug: Check what mobile mode elements exist
  const mobileElements = document.querySelectorAll(
    '.mobile-forced, [class*="mobile"]'
  );
  console.log(
    '📱 Mobile elements found:',
    mobileElements.length,
    Array.from(mobileElements).map((el) => el.className)
  );

  // Check if we're in mobile mode by looking for the debug banner
  const hasMobileMode =
    document.querySelector('[class*="mobile"]') ||
    document.body.textContent?.includes('MOBILE MODE ACTIVE') ||
    window.location.href.includes('8789');

  if (hasMobileMode) {
    console.log(
      '🎨 Mobile mode detected - applying VitalSense button styling...'
    );

    // Find ALL buttons and log them
    const allButtons = document.querySelectorAll('button');
    console.log('🔍 Found', allButtons.length, 'buttons total');

    allButtons.forEach((button, index) => {
      const text = button.textContent?.trim();
      const classes = button.className;
      console.log(`Button ${index + 1}: "${text}" (classes: ${classes})`);

      // Style ANY button that looks like navigation (has text content)
      if (text && text.length > 0 && text.length < 20) {
        console.log('🎯 Styling button:', text);

        // Force VitalSense styling with !important equivalent
        button.style.setProperty(
          'background',
          'linear-gradient(135deg, rgba(5, 150, 105, 0.15), rgba(5, 150, 105, 0.05))',
          'important'
        );
        button.style.setProperty('color', 'rgb(5, 150, 105)', 'important');
        button.style.setProperty(
          'border',
          '1px solid rgba(5, 150, 105, 0.2)',
          'important'
        );
        button.style.setProperty('border-radius', '0.75rem', 'important');
        button.style.setProperty('font-weight', '600', 'important');
        button.style.setProperty(
          'box-shadow',
          '0 2px 4px rgba(5, 150, 105, 0.1)',
          'important'
        );
        button.style.setProperty('padding', '0.5rem 1rem', 'important');
        button.style.setProperty('transition', 'all 0.3s ease', 'important');

        // Add a visual indicator that styling was applied
        button.style.setProperty(
          'outline',
          '2px solid rgba(5, 150, 105, 0.3)',
          'important'
        );

        // Remove existing event listeners and add new ones
        const newButton = button.cloneNode(true) as HTMLButtonElement;
        button.parentNode?.replaceChild(newButton, button);

        // Add hover effects to the new button
        newButton.addEventListener('mouseenter', () => {
          newButton.style.setProperty(
            'background',
            'linear-gradient(135deg, rgba(5, 150, 105, 0.25), rgba(5, 150, 105, 0.1))',
            'important'
          );
          newButton.style.setProperty('transform', 'scale(1.05)', 'important');
          newButton.style.setProperty(
            'box-shadow',
            '0 4px 8px rgba(5, 150, 105, 0.2)',
            'important'
          );
        });

        newButton.addEventListener('mouseleave', () => {
          newButton.style.setProperty(
            'background',
            'linear-gradient(135deg, rgba(5, 150, 105, 0.15), rgba(5, 150, 105, 0.05))',
            'important'
          );
          newButton.style.setProperty('transform', 'scale(1)', 'important');
          newButton.style.setProperty(
            'box-shadow',
            '0 2px 4px rgba(5, 150, 105, 0.1)',
            'important'
          );
        });
      }
    });
  } else {
    console.log('❌ Mobile mode not detected');
  }
}

// Run the styling function multiple times to catch React components
setTimeout(applyMobileButtonStyling, 500);
setTimeout(applyMobileButtonStyling, 1000);
setTimeout(applyMobileButtonStyling, 2000);
setTimeout(applyMobileButtonStyling, 3000);

// Also run it when the DOM changes
const observer = new MutationObserver(() => {
  setTimeout(applyMobileButtonStyling, 100);
});
observer.observe(document.body, { childList: true, subtree: true });

// Run it when the page is fully loaded
window.addEventListener('load', () => {
  setTimeout(applyMobileButtonStyling, 200);
  setTimeout(applyMobileButtonStyling, 500);
});

// Run it periodically for the first 10 seconds to catch any late-rendering components
let attempts = 0;
const periodicStyling = () => {
  if (attempts < 20) {
    // Try for 10 seconds (20 * 500ms)
    applyMobileButtonStyling();
    attempts++;
    setTimeout(periodicStyling, 500);
  }
};
setTimeout(periodicStyling, 1000);

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
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md text-center">
        <div className="mb-4 text-6xl">⚠️</div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">
          VitalSense Initialization Error
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

console.log('🎯 main.tsx: About to render React app...');
try {
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
  console.log('✅ main.tsx: React app rendered successfully!');
} catch (error) {
  console.error('❌ main.tsx: React render failed:', error);
}
// Trigger hydration timing marker (defined in rum.ts)
try {
  window.__rumHydration?.();
} catch {
  /* noop */
}
