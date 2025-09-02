/**
 * HIPAA-Compliant Error Handling and Logging System
 *
 * This module provides comprehensive error handling with PII-safe logging.
 * All logging is designed to be compliant with HIPAA regulations and
 * never captures personally identifiable information (PII) or protected
 * health information (PHI).
 */

// Error severity levels for proper categorization
export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

// Error categories for better organization
export enum ErrorCategory {
  NETWORK = 'network',
  VALIDATION = 'validation',
  AUTH = 'authentication',
  PROCESSING = 'processing',
  STORAGE = 'storage',
  UI = 'ui',
  WEBSOCKET = 'websocket',
  PERFORMANCE = 'performance',
  SECURITY = 'security',
  UNKNOWN = 'unknown',
}

// Base error interface
export interface AppError {
  id: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
  stack?: string;
  userAction?: string;
  correlationId?: string;
}

// PII-safe metadata that can be logged
const SAFE_LOG_FIELDS = new Set([
  'timestamp',
  'severity',
  'category',
  'errorType',
  'statusCode',
  'method',
  'endpoint',
  'correlationId',
  'sessionId',
  'deviceType',
  'userAgent',
  'retryCount',
  'processingTime',
  'componentName',
  'actionType',
  'metricType',
  'recordCount',
  'fileSize',
  'connectionState',
]);

// Fields that should NEVER be logged (PII/PHI)
const BLOCKED_LOG_FIELDS = new Set([
  'name',
  'email',
  'phone',
  'address',
  'ssn',
  'dob',
  'value',
  'healthData',
  'userData',
  'personalInfo',
  'patientId',
  'medicalRecord',
  'biometric',
  'location',
  'coordinates',
  'ip',
  'password',
  'token',
  'secret',
  'key',
  'jwt',
  'auth',
  'body',
  'payload',
  'data',
]);

/**
 * Sanitizes metadata for safe logging by removing PII/PHI
 */
function sanitizeMetadata(
  meta: Record<string, unknown>
): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(meta)) {
    const lowerKey = key.toLowerCase();

    // Block known PII/PHI fields
    if (BLOCKED_LOG_FIELDS.has(lowerKey)) {
      sanitized[key] = '[REDACTED]';
      continue;
    }

    // Allow only safe fields
    if (SAFE_LOG_FIELDS.has(lowerKey)) {
      sanitized[key] = sanitizeValue(value);
      continue;
    }

    // Default to redacting unknown fields to be safe
    sanitized[key] = '[FILTERED]';
  }

  return sanitized;
}

/**
 * Recursively sanitizes values to prevent PII leakage
 */
function sanitizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    // Redact if string looks like PII patterns
    if (isPotentialPII(value)) return '[REDACTED]';
    return value;
  }

  if (typeof value === 'object' && !Array.isArray(value)) {
    return sanitizeMetadata(value as Record<string, unknown>);
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  return value;
}

/**
 * Detects potential PII patterns in strings
 */
function isPotentialPII(str: string): boolean {
  if (str.length < 3) return false;

  // Email pattern
  if (/@/.test(str) && /\.[a-z]{2,}$/i.test(str)) return true;

  // Phone number pattern
  if (/^\+?[\d\s-()]{10,}$/.test(str)) return true;

  // SSN pattern
  if (/^\d{3}-?\d{2}-?\d{4}$/.test(str)) return true;

  // Credit card pattern
  if (/^\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}$/.test(str)) return true;

  return false;
}

/**
 * Enhanced logger with PII protection
 */
export class SafeLogger {
  private static correlationId: string | null = null;

  static setCorrelationId(id: string): void {
    this.correlationId = id;
  }

  static clearCorrelationId(): void {
    this.correlationId = null;
  }

  private static formatMessage(
    level: string,
    message: string,
    meta: Record<string, unknown> = {}
  ): void {
    const timestamp = new Date().toISOString();
    const sanitizedMeta = sanitizeMetadata(meta);

    if (this.correlationId) {
      sanitizedMeta.correlationId = this.correlationId;
    }

    const logEntry = {
      timestamp,
      level,
      message,
      ...sanitizedMeta,
    };

    // Use appropriate console method
    let consoleMethod: typeof console.log;
    if (level === 'error') {
      consoleMethod = console.error;
    } else if (level === 'warn') {
      consoleMethod = console.warn;
    } else {
      consoleMethod = console.log;
    }

    consoleMethod(JSON.stringify(logEntry));
  }

  static info(message: string, meta?: Record<string, unknown>): void {
    this.formatMessage('info', message, meta);
  }

  static warn(message: string, meta?: Record<string, unknown>): void {
    this.formatMessage('warn', message, meta);
  }

  static error(message: string, meta?: Record<string, unknown>): void {
    this.formatMessage('error', message, meta);
  }

  static debug(message: string, meta?: Record<string, unknown>): void {
    if (import.meta.env.DEV) {
      this.formatMessage('debug', message, meta);
    }
  }
}

/**
 * Application error class with safe logging
 */
export class AppErrorHandler extends Error {
  public readonly id: string;
  public readonly category: ErrorCategory;
  public readonly severity: ErrorSeverity;
  public readonly timestamp: string;
  public readonly context: Record<string, unknown>;
  public readonly userAction?: string;
  public readonly correlationId?: string;

  constructor(
    message: string,
    category: ErrorCategory = ErrorCategory.UNKNOWN,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    context: Record<string, unknown> = {},
    userAction?: string
  ) {
    super(message);
    this.name = 'AppError';
    this.id = crypto.randomUUID();
    this.category = category;
    this.severity = severity;
    this.timestamp = new Date().toISOString();
    this.context = sanitizeMetadata(context);
    this.userAction = userAction;

    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppErrorHandler);
    }
  }

  /**
   * Logs the error safely without PII
   */
  log(): void {
    SafeLogger.error(this.message, {
      errorId: this.id,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      userAction: this.userAction,
      ...this.context,
    });
  }

  /**
   * Converts error to safe JSON for API responses
   */
  toSafeJSON(): Record<string, unknown> {
    return {
      id: this.id,
      message: this.message,
      category: this.category,
      severity: this.severity,
      timestamp: this.timestamp,
      userAction: this.userAction,
    };
  }
}

/**
 * Error factory for common error types
 */
export class ErrorFactory {
  static networkError(
    message: string,
    context: Record<string, unknown> = {}
  ): AppErrorHandler {
    return new AppErrorHandler(
      message,
      ErrorCategory.NETWORK,
      ErrorSeverity.MEDIUM,
      context,
      'Check your internet connection and try again'
    );
  }

  static validationError(
    message: string,
    context: Record<string, unknown> = {}
  ): AppErrorHandler {
    return new AppErrorHandler(
      message,
      ErrorCategory.VALIDATION,
      ErrorSeverity.LOW,
      context,
      'Please check your input and try again'
    );
  }

  static authError(
    message: string,
    context: Record<string, unknown> = {}
  ): AppErrorHandler {
    return new AppErrorHandler(
      message,
      ErrorCategory.AUTH,
      ErrorSeverity.HIGH,
      context,
      'Please log in again'
    );
  }

  static processingError(
    message: string,
    context: Record<string, unknown> = {}
  ): AppErrorHandler {
    return new AppErrorHandler(
      message,
      ErrorCategory.PROCESSING,
      ErrorSeverity.MEDIUM,
      context,
      'Processing failed. Please try again'
    );
  }

  static storageError(
    message: string,
    context: Record<string, unknown> = {}
  ): AppErrorHandler {
    return new AppErrorHandler(
      message,
      ErrorCategory.STORAGE,
      ErrorSeverity.HIGH,
      context,
      'Data storage issue. Please try again'
    );
  }

  static websocketError(
    message: string,
    context: Record<string, unknown> = {}
  ): AppErrorHandler {
    return new AppErrorHandler(
      message,
      ErrorCategory.WEBSOCKET,
      ErrorSeverity.MEDIUM,
      context,
      'Connection issue. Reconnecting...'
    );
  }

  static securityError(
    message: string,
    context: Record<string, unknown> = {}
  ): AppErrorHandler {
    return new AppErrorHandler(
      message,
      ErrorCategory.SECURITY,
      ErrorSeverity.CRITICAL,
      context,
      'Security issue detected. Please contact support'
    );
  }
}

/**
 * Global error handler for unhandled errors
 */
export function setupGlobalErrorHandling(): void {
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const error = ErrorFactory.processingError('Unhandled promise rejection', {
      reason: event.reason?.message || 'Unknown error',
      stack: event.reason?.stack,
    });
    error.log();

    // Prevent console error in development
    if (import.meta.env.DEV) {
      event.preventDefault();
    }
  });

  // Handle global errors
  window.addEventListener('error', (event) => {
    const error = ErrorFactory.processingError('Global error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
    });
    error.log();
  });

  SafeLogger.info('Global error handling initialized');
}

/**
 * Retry wrapper with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000,
  maxDelay: number = 10000
): Promise<T> {
  let lastError: Error = new Error('No attempts made');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxRetries - 1) {
        break; // Don't wait after the last attempt
      }

      const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);

      SafeLogger.warn('Operation failed, retrying', {
        attempt: attempt + 1,
        maxRetries,
        delayMs: delay,
        errorMessage: lastError.message,
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(lastError.message || 'Operation failed after retries');
}

/**
 * Safely extracts error message from unknown error
 */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'Unknown error';
}

/**
 * Async error boundary for promise-based operations
 */
export function withErrorBoundary<T extends unknown[], R>(
  fn: (...args: T) => Promise<R>,
  errorHandler?: (error: AppErrorHandler) => void
) {
  return async (...args: T): Promise<R> => {
    try {
      return await fn(...args);
    } catch (error) {
      const appError =
        error instanceof AppErrorHandler
          ? error
          : ErrorFactory.processingError(getErrorMessage(error), {
              originalError: error,
            });

      appError.log();

      if (errorHandler) {
        errorHandler(appError);
      }

      throw appError;
    }
  };
}

/**
 * Performance monitoring wrapper
 */
export function withPerformanceMonitoring<T extends unknown[], R>(
  name: string,
  fn: (...args: T) => Promise<R>,
  thresholdMs: number = 1000
) {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();

    try {
      const result = await fn(...args);
      const duration = performance.now() - startTime;

      if (duration > thresholdMs) {
        SafeLogger.warn('Slow operation detected', {
          operationName: name,
          durationMs: Math.round(duration),
          thresholdMs,
        });
      } else {
        SafeLogger.debug('Operation completed', {
          operationName: name,
          durationMs: Math.round(duration),
        });
      }

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;
      SafeLogger.error('Operation failed', {
        operationName: name,
        durationMs: Math.round(duration),
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  };
}

/**
 * Circuit breaker pattern for failing operations
 */
export class CircuitBreaker {
  private failures = 0;
  private lastFailureTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000, // 1 minute
    private resetTimeout: number = 30000 // 30 seconds
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailureTime < this.timeout) {
        throw ErrorFactory.processingError('Circuit breaker is open', {
          state: this.state,
          failures: this.failures,
        });
      }
      this.state = 'half-open';
    }

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess(): void {
    this.failures = 0;
    this.state = 'closed';
    SafeLogger.debug('Circuit breaker reset to closed state');
  }

  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
      SafeLogger.warn('Circuit breaker opened', {
        failures: this.failures,
        threshold: this.threshold,
      });
    }
  }
}
