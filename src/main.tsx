import { Toaster } from '@/components/ui/sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRoot } from 'react-dom/client';

import App from '@/App'; // Switch to main App
import { AppErrorBoundary } from '@/components/error/ErrorBoundaryComponents.tsx';
import { AuthProvider } from '@/contexts/AuthProvider';
import { setupGlobalErrorHandling } from '@/lib/errorHandling';

// CSS files are now built separately and linked in HTML

// Initialize global error handling
console.log('🚀 VitalSense: Starting app initialization...');
setupGlobalErrorHandling();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount: number, error: any) => {
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

console.log('🔍 VitalSense: Looking for root element...');
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('❌ VitalSense: Root element not found!');
  throw new Error(
    'Root element not found. Make sure you have a <div id="root"></div> in your HTML.'
  );
}

console.log('✅ VitalSense: Root element found, creating React app...');

// Show a loading indicator first
rootElement.innerHTML = `
  <div style="min-height: 100vh; background: #f3f4f6; display: flex; align-items: center; justify-content: center;">
    <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 1rem;">🔄</div>
      <h1 style="font-size: 1.5rem; font-weight: bold; color: #1e40af; margin-bottom: 0.5rem;">
        VitalSense Loading...
      </h1>
      <p style="color: #6b7280;">
        Initializing your health dashboard
      </p>
    </div>
  </div>
`;

// Render React app
try {
  createRoot(rootElement).render(
    <AppErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <App />
          <Toaster position="top-right" richColors />
        </QueryClientProvider>
      </AuthProvider>
    </AppErrorBoundary>
  );
  console.log('🎉 VitalSense: React app rendered successfully!');
} catch (error) {
  console.error('❌ VitalSense: Error rendering React app:', error);

  // Show error page
  rootElement.innerHTML = `
    <div style="min-height: 100vh; background: #fef2f2; display: flex; align-items: center; justify-content: center;">
      <div style="background: white; padding: 2rem; border-radius: 0.5rem; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1); max-width: 500px;">
        <h1 style="font-size: 2rem; font-weight: bold; color: #dc2626; margin-bottom: 1rem;">
          ❌ VitalSense Error
        </h1>
        <p style="color: #6b7280; margin-bottom: 1rem;">
          Sorry, there was an error loading your health dashboard.
        </p>
        <p style="color: #6b7280; font-size: 0.875rem;">
          Error: ${error instanceof Error ? error.message : 'Unknown error'}
        </p>
        <button onclick="window.location.reload()" style="margin-top: 1rem; background: #2563eb; color: white; padding: 0.5rem 1rem; border: none; border-radius: 0.375rem; cursor: pointer;">
          Reload Page
        </button>
      </div>
    </div>
  `;
}
