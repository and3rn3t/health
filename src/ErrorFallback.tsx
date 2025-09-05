import { Alert, AlertDescription, AlertTitle } from './components/ui/alert';
import { Button } from './components/ui/button';

import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export const ErrorFallback: React.FC<ErrorFallbackProps> = ({
  error,
  resetErrorBoundary,
}) => {
  // When encountering an error in the development mode, rethrow it and don't display the boundary.
  // The parent UI will take care of showing a more helpful dialog.
  if (import.meta.env.DEV) throw error;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Alert variant="destructive" className="mb-6">
          <AlertTriangle />
          <AlertTitle>This spark has encountered a runtime error</AlertTitle>
          <AlertDescription>
            Something unexpected happened while running the application. The
            error details are shown below. Contact the spark author and let them
            know about this issue.
          </AlertDescription>
        </Alert>

        <div className="bg-card mb-6 rounded-lg border p-4">
          <h3 className="text-muted-foreground mb-2 text-sm font-semibold">
            Error Details:
          </h3>
          <pre className="text-destructive bg-muted/50 max-h-32 overflow-auto rounded border p-3 text-xs">
            {error.message}
          </pre>
        </div>

        <Button
          onClick={resetErrorBoundary}
          className="w-full"
          variant="outline"
        >
          <RefreshCw />
          Try Again
        </Button>
      </div>
    </div>
  );
};
