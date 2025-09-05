import { ErrorContext } from '@/hooks/useErrorHandling';
import React from 'react';

export const useErrorReporting = () => {
  const context = React.useContext(ErrorContext);

  if (!context) {
    throw new Error('useErrorReporting must be used within AppErrorBoundary');
  }

  return context;
};

export default useErrorReporting;
