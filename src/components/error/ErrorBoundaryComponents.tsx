/**
 * Enhanced Error Boundary Components with HIPAA-compliant logging
 */

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ErrorContext } from '@/hooks/useErrorHandling';
import { isDev, isProd } from '@/lib/env';
import { AppErrorHandler, ErrorFactory, SafeLogger } from '@/lib/errorHandling';
import { AlertTriangle, Bug, RefreshCw } from 'lucide-react';
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

/**
 * Enhanced Error Fallback component with safe error display
 */
export const EnhancedErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  // Convert to our AppError format for consistent handling
  const appError =
    error instanceof AppErrorHandler
      ? error
      : ErrorFactory.processingError(
          error.message || 'Component error occurred',
          {
            errorName: error.name,
            errorStack: error.stack,
          }
        );

  // Log the error safely
  React.useEffect(() => {
    appError.log();
  }, [appError]);

  // Don't show error boundary in development - let React DevTools handle it
  if (isDev() && !(error instanceof AppErrorHandler)) {
    throw error;
  }

  const isProductionBuild = isProd();
  const showTechnicalDetails = !isProductionBuild;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Something went wrong</AlertTitle>
          <AlertDescription>
            {appError.userAction ||
              'An unexpected error occurred. Please try refreshing the page.'}
          </AlertDescription>
        </Alert>

        {showTechnicalDetails && (
          <div className="bg-card mb-6 rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-2">
              <Bug className="text-muted-foreground h-4 w-4" />
              <h3 className="text-muted-foreground text-sm font-semibold">
                Technical Details
              </h3>
            </div>
            <div className="text-muted-foreground space-y-2 text-xs">
              <div>
                <span className="font-medium">Error ID:</span> {appError.id}
              </div>
              <div>
                <span className="font-medium">Category:</span>{' '}
                {appError.category}
              </div>
              <div>
                <span className="font-medium">Severity:</span>{' '}
                {appError.severity}
              </div>
              <div>
                <span className="font-medium">Time:</span>{' '}
                {new Date(appError.timestamp).toLocaleString()}
              </div>
            </div>
            {error.message && (
              <div className="mt-3">
                <pre className="text-destructive bg-muted/50 max-h-32 overflow-auto whitespace-pre-wrap break-words rounded border p-3 text-xs">
                  {error.message}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Button
            onClick={resetErrorBoundary}
            className="w-full"
            variant="outline"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>

          {isProductionBuild && (
            <div className="text-center">
              <p className="text-muted-foreground text-xs">
                Error ID: {appError.id}
              </p>
              <p className="text-muted-foreground mt-1 text-xs">
                Please provide this ID when contacting support
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Health Data specific error fallback
 */
export const HealthDataErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const appError =
    error instanceof AppErrorHandler
      ? error
      : ErrorFactory.processingError('Health data processing error', {
          originalMessage: error.message,
        });

  React.useEffect(() => {
    appError.log();
  }, [appError]);

  return (
    <div className="rounded-lg border bg-background p-6">
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Health Data Error</AlertTitle>
        <AlertDescription>
          Unable to process health data. Your data is safe, but we encountered
          an issue displaying it.
        </AlertDescription>
      </Alert>

      <div className="space-y-3">
        <Button
          onClick={resetErrorBoundary}
          variant="outline"
          size="sm"
          className="w-full"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          Retry Loading Data
        </Button>

        <p className="text-muted-foreground text-center text-xs">
          If this problem persists, please refresh the page
        </p>
      </div>
    </div>
  );
};

/**
 * Network error fallback for API failures
 */
export const NetworkErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  const isNetworkError =
    error.message.includes('fetch') ||
    error.message.includes('network') ||
    error.message.includes('timeout');

  return (
    <div className="rounded-lg border bg-background p-6">
      <Alert variant="destructive" className="mb-4">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Connection Error</AlertTitle>
        <AlertDescription>
          {isNetworkError
            ? 'Unable to connect to our servers. Please check your internet connection.'
            : 'A network error occurred. Please try again.'}
        </AlertDescription>
      </Alert>

      <Button
        onClick={resetErrorBoundary}
        variant="outline"
        size="sm"
        className="w-full"
      >
        <RefreshCw className="mr-2 h-4 w-4" />
        Try Again
      </Button>
    </div>
  );
};

/**
 * Component-level error boundary wrapper
 */
export const ComponentErrorBoundary: React.FC<{
  children: React.ReactNode;
  fallback?: React.ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}> = ({
  children,
  fallback: FallbackComponent = HealthDataErrorFallback,
  onError,
}) => {
  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      // Log error with safe metadata
      const appError = ErrorFactory.processingError(
        'Component boundary error',
        {
          errorName: error.name,
          hasStack: !!error.stack,
          hasComponentStack: !!errorInfo.componentStack,
        }
      );
      appError.log();

      // Call custom error handler if provided
      if (onError) {
        onError(error, errorInfo);
      }
    },
    [onError]
  );

  return (
    <ReactErrorBoundary
      FallbackComponent={FallbackComponent}
      onError={handleError}
    >
      {children}
    </ReactErrorBoundary>
  );
};

/**
 * Application-level error boundary with context
 */
export const AppErrorBoundary: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  const [errorCount, setErrorCount] = React.useState(0);

  const reportError = React.useCallback(
    (error: Error, context?: Record<string, unknown>) => {
      const appError = ErrorFactory.processingError(error.message, context);
      appError.log();
      setErrorCount((prev) => prev + 1);
    },
    []
  );

  const clearError = React.useCallback(() => {
    setErrorCount(0);
  }, []);

  const handleError = React.useCallback(
    (error: Error, errorInfo: React.ErrorInfo) => {
      SafeLogger.error('Application error boundary triggered', {
        errorName: error.name,
        errorCount: errorCount + 1,
        hasComponentStack: !!errorInfo.componentStack,
      });

      setErrorCount((prev) => prev + 1);
    },
    [errorCount]
  );

  const contextValue = React.useMemo(
    () => ({
      reportError,
      clearError,
    }),
    [reportError, clearError]
  );

  return (
    <ErrorContext.Provider value={contextValue}>
      <ReactErrorBoundary
        FallbackComponent={EnhancedErrorFallback}
        onError={handleError}
        onReset={clearError}
      >
        {children}
      </ReactErrorBoundary>
    </ErrorContext.Provider>
  );
};
