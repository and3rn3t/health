/**
 * Health Data Logging Utilities with HIPAA Compliance
 *
 * Specialized logging for health data operations that ensures
 * no PII or PHI is ever captured in logs.
 */

import { ErrorFactory, SafeLogger } from '@/lib/errorHandling';
import { z } from 'zod';

// Health operation types for logging context
export enum HealthOperationType {
  DATA_UPLOAD = 'data_upload',
  DATA_PROCESSING = 'data_processing',
  DATA_EXPORT = 'data_export',
  DATA_SYNC = 'data_sync',
  ANALYTICS_GENERATION = 'analytics_generation',
  ML_PREDICTION = 'ml_prediction',
  REAL_TIME_STREAM = 'real_time_stream',
  DATA_VALIDATION = 'data_validation',
  USER_ACTION = 'user_action',
}

// Safe metadata schema for health operations
const SafeHealthMetadataSchema = z.object({
  operationType: z.nativeEnum(HealthOperationType),
  metricType: z.string().optional(), // e.g., 'heart_rate', 'steps', not the actual value
  recordCount: z.number().optional(),
  processingTimeMs: z.number().optional(),
  statusCode: z.number().optional(),
  correlationId: z.string().optional(),
  sessionId: z.string().optional(),
  deviceType: z.string().optional(),
  apiEndpoint: z.string().optional(),
  fileSize: z.number().optional(),
  batchSize: z.number().optional(),
  errorType: z.string().optional(),
  retryAttempt: z.number().optional(),
  connectionState: z.string().optional(),
  cacheHit: z.boolean().optional(),
  mlModelVersion: z.string().optional(),
  dataSource: z.string().optional(), // e.g., 'apple_health', 'manual_entry'
  validationResult: z.string().optional(),
  alertLevel: z.string().optional(),
});

export type SafeHealthMetadata = z.infer<typeof SafeHealthMetadataSchema>;

/**
 * HIPAA-compliant health data logger
 */
export class HealthDataLogger {
  /**
   * Log successful health data operation
   */
  static logHealthOperation(
    message: string,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata(metadata);
    SafeLogger.info(`[HEALTH] ${message}`, safeMeta);
  }

  /**
   * Log health data processing error
   */
  static logHealthError(
    message: string,
    error: Error,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata({
      ...metadata,
      errorType: error.constructor.name,
    });

    const healthError = ErrorFactory.processingError(
      `Health data error: ${message}`,
      safeMeta
    );

    healthError.log();
  }

  /**
   * Log health data validation issues
   */
  static logValidationError(
    message: string,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata({
      ...metadata,
      operationType: HealthOperationType.DATA_VALIDATION,
    });

    const validationError = ErrorFactory.validationError(
      `Health data validation: ${message}`,
      safeMeta
    );

    validationError.log();
  }

  /**
   * Log performance metrics for health operations
   */
  static logPerformanceMetric(
    operationName: string,
    durationMs: number,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata({
      ...metadata,
      processingTimeMs: durationMs,
    });

    if (durationMs > 5000) {
      // Log slow operations
      SafeLogger.warn(
        `[HEALTH PERF] Slow operation: ${operationName}`,
        safeMeta
      );
    } else {
      SafeLogger.debug(`[HEALTH PERF] ${operationName}`, safeMeta);
    }
  }

  /**
   * Log health data sync operations
   */
  static logSyncOperation(
    syncType: string,
    success: boolean,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata({
      ...metadata,
      operationType: HealthOperationType.DATA_SYNC,
    });

    const message = success
      ? `Health data sync completed: ${syncType}`
      : `Health data sync failed: ${syncType}`;

    if (success) {
      SafeLogger.info(`[HEALTH SYNC] ${message}`, safeMeta);
    } else {
      SafeLogger.error(`[HEALTH SYNC] ${message}`, safeMeta);
    }
  }

  /**
   * Log real-time health data streaming
   */
  static logRealtimeOperation(
    operation: string,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata({
      ...metadata,
      operationType: HealthOperationType.REAL_TIME_STREAM,
    });

    SafeLogger.debug(`[HEALTH REALTIME] ${operation}`, safeMeta);
  }

  /**
   * Log ML/Analytics operations
   */
  static logAnalyticsOperation(
    operation: string,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata({
      ...metadata,
      operationType: HealthOperationType.ML_PREDICTION,
    });

    SafeLogger.info(`[HEALTH ML] ${operation}`, safeMeta);
  }

  /**
   * Log user actions on health data
   */
  static logUserAction(
    action: string,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata({
      ...metadata,
      operationType: HealthOperationType.USER_ACTION,
    });

    SafeLogger.info(`[HEALTH USER] ${action}`, safeMeta);
  }

  /**
   * Log health data export operations
   */
  static logExportOperation(
    format: string,
    success: boolean,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const safeMeta = this.validateAndSanitizeMetadata({
      ...metadata,
      operationType: HealthOperationType.DATA_EXPORT,
    });

    const message = success
      ? `Health data export completed: ${format}`
      : `Health data export failed: ${format}`;

    if (success) {
      SafeLogger.info(`[HEALTH EXPORT] ${message}`, safeMeta);
    } else {
      SafeLogger.error(`[HEALTH EXPORT] ${message}`, safeMeta);
    }
  }

  /**
   * Validate and sanitize metadata before logging
   */
  private static validateAndSanitizeMetadata(
    metadata: Partial<SafeHealthMetadata>
  ): Record<string, unknown> {
    try {
      // Parse with our safe schema to ensure only allowed fields
      const parsed = SafeHealthMetadataSchema.partial().parse(metadata);

      // Additional sanitization for string fields
      const sanitized: Record<string, unknown> = {};

      for (const [key, value] of Object.entries(parsed)) {
        if (typeof value === 'string') {
          // Ensure no PII patterns in string values
          sanitized[key] = this.sanitizeStringValue(value);
        } else {
          sanitized[key] = value;
        }
      }

      return sanitized;
    } catch (error) {
      // If validation fails, log the issue and return safe fallback
      SafeLogger.warn('Health metadata validation failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        providedKeys: Object.keys(metadata),
      });

      return {
        operationType: metadata.operationType || 'unknown',
        metricType: metadata.metricType || 'unknown',
      };
    }
  }

  /**
   * Sanitize string values to prevent PII leakage
   */
  private static sanitizeStringValue(value: string): string {
    // Remove potential identifiers
    return value
      .replace(/\b[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, '[EMAIL]')
      .replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
      .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CARD]')
      .replace(/\b\+?[\d\s()-]{10,}\b/g, '[PHONE]')
      .trim();
  }
}

/**
 * Performance monitoring wrapper for health data operations
 */
export function withHealthDataLogging<T extends unknown[], R>(
  operationName: string,
  operationType: HealthOperationType,
  fn: (...args: T) => Promise<R>,
  extractMetadata?: (...args: T) => Partial<SafeHealthMetadata>
) {
  return async (...args: T): Promise<R> => {
    const startTime = performance.now();
    const baseMetadata: Partial<SafeHealthMetadata> = {
      operationType,
    };

    const metadata = extractMetadata
      ? { ...baseMetadata, ...extractMetadata(...args) }
      : baseMetadata;

    try {
      HealthDataLogger.logHealthOperation(
        `Starting ${operationName}`,
        metadata
      );

      const result = await fn(...args);
      const duration = performance.now() - startTime;

      HealthDataLogger.logPerformanceMetric(operationName, duration, metadata);

      HealthDataLogger.logHealthOperation(`Completed ${operationName}`, {
        ...metadata,
        processingTimeMs: duration,
      });

      return result;
    } catch (error) {
      const duration = performance.now() - startTime;

      HealthDataLogger.logHealthError(
        `Failed ${operationName}`,
        error as Error,
        { ...metadata, processingTimeMs: duration }
      );

      throw error;
    }
  };
}

/**
 * Audit log for critical health data operations
 */
export class HealthDataAuditLogger {
  /**
   * Log critical health data access
   */
  static logDataAccess(
    userId: string, // Hash or sanitized identifier, not actual user ID
    operation: string,
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      operation,
      userHash: this.hashUserId(userId),
      ...HealthDataLogger['validateAndSanitizeMetadata'](metadata),
    };

    SafeLogger.info('[HEALTH AUDIT] Data access', auditEntry);
  }

  /**
   * Log health data modifications
   */
  static logDataModification(
    userId: string,
    action: 'create' | 'update' | 'delete',
    metadata: Partial<SafeHealthMetadata> = {}
  ): void {
    const auditEntry = {
      timestamp: new Date().toISOString(),
      action,
      userHash: this.hashUserId(userId),
      ...HealthDataLogger['validateAndSanitizeMetadata'](metadata),
    };

    SafeLogger.info('[HEALTH AUDIT] Data modification', auditEntry);
  }

  /**
   * Hash user ID for audit logging
   */
  private static hashUserId(userId: string): string {
    // Simple hash for audit purposes (not cryptographic)
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return `user_${Math.abs(hash).toString(16)}`;
  }
}
