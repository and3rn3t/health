import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  EnhancedErrorFallback,
  HealthDataErrorFallback,
  NetworkErrorFallback,
  ComponentErrorBoundary,
} from '../ErrorBoundary';
import { AppErrorHandler, ErrorFactory } from '@/lib/errorHandling';

// Mock the error handling module
vi.mock('@/lib/errorHandling', () => ({
  AppErrorHandler: class MockAppErrorHandler {
    id = 'test-error-id';
    category = 'test';
    severity = 'error';
    timestamp = Date.now();
    userAction = 'Test action';
    log() {}
  },
  ErrorFactory: {
    processingError: vi.fn((message, context) => ({
      id: 'test-id',
      category: 'processing',
      severity: 'error',
      timestamp: Date.now(),
      userAction: message,
      log: vi.fn(),
    })),
  },
  SafeLogger: {
    error: vi.fn(),
  },
}));

describe('ErrorBoundary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('EnhancedErrorFallback', () => {
    test('should render error message', () => {
      const error = new Error('Test error');
      const resetErrorBoundary = vi.fn();

      render(
        <EnhancedErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );

      expect(screen.getByText(/Something went wrong/i)).toBeInTheDocument();
    });

    test('should show technical details in non-production', () => {
      const error = new Error('Test error');
      const resetErrorBoundary = vi.fn();

      // Mock non-production environment
      Object.defineProperty(window, 'location', {
        value: { hostname: 'localhost' },
        writable: true,
        configurable: true,
      });

      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <EnhancedErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );

      expect(screen.getByText(/Technical Details/i)).toBeInTheDocument();

      consoleError.mockRestore();
    });

    test('should call resetErrorBoundary when button clicked', () => {
      const error = new Error('Test error');
      const resetErrorBoundary = vi.fn();

      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <EnhancedErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );

      const button = screen.getByText(/Try Again/i);
      button.click();

      consoleError.mockRestore();

      expect(resetErrorBoundary).toHaveBeenCalled();
    });
  });

  describe('HealthDataErrorFallback', () => {
    test('should render health data specific message', () => {
      const error = new Error('Health data error');
      const resetErrorBoundary = vi.fn();

      render(
        <HealthDataErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );

      expect(screen.getByText(/Health Data Error/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to process health data/i)
      ).toBeInTheDocument();
    });

    test('should have retry button', () => {
      const error = new Error('Test');
      const resetErrorBoundary = vi.fn();

      render(
        <HealthDataErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );

      expect(screen.getByText(/Retry Loading Data/i)).toBeInTheDocument();
    });
  });

  describe('NetworkErrorFallback', () => {
    test('should detect network errors', () => {
      const error = new Error('fetch failed');
      const resetErrorBoundary = vi.fn();

      render(
        <NetworkErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );

      expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();
      expect(
        screen.getByText(/Unable to connect to our servers/i)
      ).toBeInTheDocument();
    });

    test('should show generic message for non-network errors', () => {
      const error = new Error('Other error');
      const resetErrorBoundary = vi.fn();

      render(
        <NetworkErrorFallback
          error={error}
          resetErrorBoundary={resetErrorBoundary}
        />
      );

      expect(screen.getByText(/Connection Error/i)).toBeInTheDocument();
    });
  });

  describe('ComponentErrorBoundary', () => {
    test('should render children when no error', () => {
      render(
        <ComponentErrorBoundary>
          <div>Test Content</div>
        </ComponentErrorBoundary>
      );

      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    test('should call onError callback when error occurs', () => {
      const onError = vi.fn();
      const ThrowError = () => {
        throw new Error('Test error');
      };

      render(
        <ComponentErrorBoundary onError={onError}>
          <ThrowError />
        </ComponentErrorBoundary>
      );

      // Error boundary should catch and call onError
      expect(onError).toHaveBeenCalled();
    });
  });
});

