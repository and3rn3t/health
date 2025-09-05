import { useErrorReporting } from '@/hooks/useErrorReporting';
import { AppErrorHandler, ErrorFactory } from '@/lib/errorHandling';
import React from 'react';

export const useSafeAsync = <T,>(asyncFn: () => Promise<T>) => {
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
          : ErrorFactory.processingError(
              error instanceof Error ? error.message : 'Async operation failed'
            );

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

export default useSafeAsync;
