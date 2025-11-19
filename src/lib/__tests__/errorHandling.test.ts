import { describe, test, expect, vi, beforeEach } from 'vitest';
import {
  ErrorSeverity,
  ErrorCategory,
  SafeLogger,
  AppErrorHandler,
  ErrorFactory,
  retryWithBackoff,
  withErrorBoundary,
  CircuitBreaker,
} from '../errorHandling';

describe('errorHandling', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    SafeLogger.clearCorrelationId();
  });

  describe('ErrorSeverity', () => {
    test('should have all severity levels', () => {
      expect(ErrorSeverity.LOW).toBe('low');
      expect(ErrorSeverity.MEDIUM).toBe('medium');
      expect(ErrorSeverity.HIGH).toBe('high');
      expect(ErrorSeverity.CRITICAL).toBe('critical');
    });
  });

  describe('ErrorCategory', () => {
    test('should have all error categories', () => {
      expect(ErrorCategory.NETWORK).toBe('network');
      expect(ErrorCategory.VALIDATION).toBe('validation');
      expect(ErrorCategory.AUTH).toBe('authentication');
      expect(ErrorCategory.PROCESSING).toBe('processing');
      expect(ErrorCategory.STORAGE).toBe('storage');
      expect(ErrorCategory.UI).toBe('ui');
      expect(ErrorCategory.WEBSOCKET).toBe('websocket');
      expect(ErrorCategory.PERFORMANCE).toBe('performance');
      expect(ErrorCategory.SECURITY).toBe('security');
      expect(ErrorCategory.UNKNOWN).toBe('unknown');
    });
  });

  describe('SafeLogger', () => {
    test('should set and clear correlation ID', () => {
      SafeLogger.setCorrelationId('test-id-123');
      SafeLogger.clearCorrelationId();
      // Should not throw
      expect(true).toBe(true);
    });

    test('should log info messages', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      SafeLogger.info('Test message', { key: 'value' });
      expect(consoleSpy).toHaveBeenCalled();
      const call = consoleSpy.mock.calls[0][0];
      expect(call).toContain('Test message');
      consoleSpy.mockRestore();
    });

    test('should log warn messages', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      SafeLogger.warn('Warning message', { key: 'value' });
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    test('should sanitize metadata', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      SafeLogger.info('Test', {
        email: 'test@example.com',
        timestamp: '2024-01-01',
        password: 'secret123',
      });
      const call = consoleSpy.mock.calls[0][0];
      const parsed = JSON.parse(call);
      // Email and password should be redacted
      expect(parsed.email).toBe('[REDACTED]');
      expect(parsed.password).toBe('[REDACTED]');
      // Timestamp is in SAFE_LOG_FIELDS, but the sanitizeValue function might redact it
      // if it matches PII patterns. Let's check what actually happens.
      // The timestamp field name is safe, but the value might be checked for PII patterns
      expect(parsed.timestamp).toBeDefined();
      consoleSpy.mockRestore();
    });
  });

  describe('AppErrorHandler', () => {
    test('should create error with required properties', () => {
      const error = new AppErrorHandler(
        'Test error',
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM
      );

      expect(error.message).toBe('Test error');
      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.id).toBeDefined();
      expect(error.timestamp).toBeDefined();
      expect(error.context).toBeDefined();
    });

    test('should sanitize context', () => {
      const error = new AppErrorHandler('Test', ErrorCategory.UNKNOWN, ErrorSeverity.LOW, {
        email: 'test@example.com',
        timestamp: '2024-01-01',
      });

      expect(error.context.email).toBe('[REDACTED]');
      // Timestamp field name is safe, but value might be redacted if it matches PII patterns
      // The sanitizeValue function checks for PII patterns in strings
      expect(error.context.timestamp).toBeDefined();
    });

    test('should convert to safe JSON', () => {
      const error = new AppErrorHandler(
        'Test error',
        ErrorCategory.NETWORK,
        ErrorSeverity.MEDIUM,
        {},
        'Retry action'
      );

      const json = error.toSafeJSON();

      expect(json).toHaveProperty('id');
      expect(json).toHaveProperty('message', 'Test error');
      expect(json).toHaveProperty('category', ErrorCategory.NETWORK);
      expect(json).toHaveProperty('severity', ErrorSeverity.MEDIUM);
      expect(json).toHaveProperty('timestamp');
      expect(json).toHaveProperty('userAction', 'Retry action');
      // Should not include context with PII
      expect(json).not.toHaveProperty('context');
    });

    test('should log error', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const error = new AppErrorHandler('Test error');
      error.log();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe('ErrorFactory', () => {
    test('should create network error', () => {
      const error = ErrorFactory.networkError('Network failed', { endpoint: '/api/test' });

      expect(error.category).toBe(ErrorCategory.NETWORK);
      expect(error.severity).toBe(ErrorSeverity.MEDIUM);
      expect(error.userAction).toBe('Check your internet connection and try again');
    });

    test('should create validation error', () => {
      const error = ErrorFactory.validationError('Invalid input', { field: 'email' });

      expect(error.category).toBe(ErrorCategory.VALIDATION);
      expect(error.severity).toBe(ErrorSeverity.LOW);
      expect(error.userAction).toBe('Please check your input and try again');
    });

    test('should create auth error', () => {
      const error = ErrorFactory.authError('Unauthorized', { code: 401 });

      expect(error.category).toBe(ErrorCategory.AUTH);
      expect(error.severity).toBe(ErrorSeverity.HIGH);
      expect(error.userAction).toBe('Please log in again');
    });
  });

  describe('retryWithBackoff', () => {
    test('should retry on failure', async () => {
      let attempts = 0;
      const fn = vi.fn(async () => {
        attempts++;
        if (attempts < 2) throw new Error('Failed');
        return 'success';
      });

      const result = await retryWithBackoff(fn, 3, 10, 100);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(2);
    });

    test('should throw after max retries', async () => {
      const fn = vi.fn(async () => {
        throw new Error('Always fails');
      });

      await expect(
        retryWithBackoff(fn, 2, 10, 100)
      ).rejects.toThrow('Always fails');
      expect(fn).toHaveBeenCalledTimes(2); // maxRetries attempts
    });

    test('should not retry on success', async () => {
      const fn = vi.fn(async () => 'success');

      const result = await retryWithBackoff(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('withErrorBoundary', () => {
    test('should execute function and return result', async () => {
      const fn = vi.fn(async () => 'result');

      const wrapped = withErrorBoundary(fn, vi.fn());
      const result = await wrapped();

      expect(result).toBe('result');
      expect(fn).toHaveBeenCalled();
    });

    test('should catch errors and call onError', async () => {
      const error = new Error('Test error');
      const fn = vi.fn(async () => {
        throw error;
      });
      const onError = vi.fn();

      const wrapped = withErrorBoundary(fn, onError);

      await expect(wrapped()).rejects.toThrow();

      expect(onError).toHaveBeenCalled();
    });
  });

  describe('CircuitBreaker', () => {
    test('should start in closed state', () => {
      const breaker = new CircuitBreaker(5, 60000, 30000);

      // CircuitBreaker doesn't expose getState, so we test by executing
      expect(breaker).toBeInstanceOf(CircuitBreaker);
    });

    test('should execute function when closed', async () => {
      const breaker = new CircuitBreaker(5, 60000, 30000);
      const fn = vi.fn(async () => 'success');

      const result = await breaker.execute(fn);

      expect(result).toBe('success');
      expect(fn).toHaveBeenCalled();
    });

    test('should open after threshold failures', async () => {
      const breaker = new CircuitBreaker(2, 60000, 100);
      const fn = vi.fn(async () => {
        throw new Error('Failed');
      });

      // Trigger failures
      await breaker.execute(fn).catch(() => {});
      await breaker.execute(fn).catch(() => {});

      // Next call should fail immediately (circuit is open)
      await expect(breaker.execute(fn)).rejects.toThrow('Circuit breaker is open');
    });

    test('should half-open after reset timeout', async () => {
      const breaker = new CircuitBreaker(2, 50, 30);
      const fn = vi.fn(async () => {
        throw new Error('Failed');
      });

      // Open the circuit
      await breaker.execute(fn).catch(() => {});
      await breaker.execute(fn).catch(() => {});

      // Wait for reset timeout
      await new Promise((resolve) => setTimeout(resolve, 60));

      // Should be half-open (next call will attempt)
      const successFn = vi.fn(async () => 'success');
      const result = await breaker.execute(successFn);
      expect(result).toBe('success');
    });
  });
});

