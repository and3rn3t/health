/**
 * Error handling hooks and context
 */

import { AppErrorHandler, ErrorFactory } from '@/lib/errorHandling';
import React from 'react';

export interface ErrorContextType {
  reportError: (error: Error, context?: Record<string, unknown>) => void;
  clearError: () => void;
}

// Create error context for manual error reporting
export const ErrorContext = React.createContext<ErrorContextType>({
  reportError: () => {},
  clearError: () => {},
});

/**
 * Hook for manual error reporting
 */
export const useErrorReporting = () => {
  const context = React.useContext(ErrorContext);

  if (!context) {
    throw new Error('useErrorReporting must be used within AppErrorBoundary');
  }

  return context;
};

/**
 * Safely extracts error message
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Async operation failed';
}

/**
 * Hook for safe async operations with error handling
 */
export const useSafeAsync = <T>(asyncFn: () => Promise<T>) => {
  const [state, setState] = React.useState<{
    data: T | null;
    loading: boolean;
    error: AppErrorHandler | null;
  }>({
    data: null,
    loading: false,
    error: null,
  });

  const { reportError } = useErrorReporting();

  const execute = React.useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const result = await asyncFn();
      setState({ data: result, loading: false, error: null });
      return result;
    } catch (error) {
      const appError =
        error instanceof AppErrorHandler
          ? error
          : ErrorFactory.processingError(getErrorMessage(error));

      setState({ data: null, loading: false, error: appError });
      reportError(appError);
      throw appError;
    }
  }, [asyncFn, reportError]);

  return {
    ...state,
    execute,
  };
};
