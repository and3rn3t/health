# Error Handling and Logging System

## Overview

The Health App implements a comprehensive, HIPAA-compliant error handling and logging system that ensures no personally identifiable information (PII) or protected health information (PHI) is ever captured in logs. The system provides robust error recovery, performance monitoring, and audit trails while maintaining strict privacy compliance.

## Key Features

### 🔒 HIPAA Compliance

- **PII/PHI Protection**: Automatic redaction of sensitive data
- **Safe Logging**: Only approved metadata fields are logged
- **Audit Trails**: Secure audit logging with hashed identifiers
- **Data Sanitization**: Multi-layer sanitization of all logged data

### 🚨 Error Handling

- **Categorized Errors**: Structured error types (Network, Validation, Auth, etc.)
- **Severity Levels**: Low, Medium, High, Critical classification
- **Error Boundaries**: React error boundaries with graceful fallbacks
- **Recovery Mechanisms**: Automatic retry with exponential backoff
- **Circuit Breaker**: Prevents cascade failures

### 📊 Performance Monitoring

- **Operation Timing**: Automatic performance measurement
- **Slow Operation Detection**: Alerts for operations exceeding thresholds
- **Resource Monitoring**: Memory and processing time tracking
- **Health Data Specific**: Specialized monitoring for health operations

## Architecture

### Core Components

```
src/lib/
├── errorHandling.ts          # Core error handling system
├── healthDataLogging.ts      # Health-specific logging utilities
└── security.ts              # Security utilities (existing)

src/components/error/
├── ErrorBoundaryComponents.tsx  # React error boundary components
└── ErrorFallback.tsx           # Legacy fallback (to be replaced)

src/hooks/
└── useErrorHandling.ts      # Error handling hooks and context
```

### Error Classification

```typescript
enum ErrorCategory {
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

enum ErrorSeverity {
  LOW = 'low', // User input errors, validation failures
  MEDIUM = 'medium', // Network issues, processing errors
  HIGH = 'high', // Storage failures, auth issues
  CRITICAL = 'critical', // Security breaches, system failures
}
```

## Usage Examples

### Basic Error Logging

```typescript
import { SafeLogger } from '@/lib/errorHandling';

// Safe logging with automatic PII redaction
SafeLogger.info('User logged in', {
  sessionId: 'sess_123',
  deviceType: 'mobile',
  // email: 'user@example.com' // ❌ This would be redacted
});

SafeLogger.error('API request failed', {
  endpoint: '/api/health-data',
  statusCode: 500,
  correlationId: 'req_456',
});
```

### Health Data Logging

```typescript
import { HealthDataLogger, HealthOperationType } from '@/lib/healthDataLogging';

// Log health data operations safely
HealthDataLogger.logHealthOperation('Processing heart rate data', {
  operationType: HealthOperationType.DATA_PROCESSING,
  metricType: 'heart_rate', // ✅ Type only, not values
  recordCount: 150,
  processingTimeMs: 1250,
  dataSource: 'apple_health',
});

// Log validation errors
HealthDataLogger.logValidationError('Invalid heart rate range', {
  metricType: 'heart_rate',
  validationResult: 'out_of_range',
});

// Performance monitoring
HealthDataLogger.logPerformanceMetric('generateAnalytics', 3400, {
  operationType: HealthOperationType.ANALYTICS_GENERATION,
  recordCount: 1000,
});
```

### Error Factories

```typescript
import { ErrorFactory } from '@/lib/errorHandling';

// Create categorized errors
const networkError = ErrorFactory.networkError('Failed to sync with server', {
  endpoint: '/api/sync',
  retryCount: 3,
});

const validationError = ErrorFactory.validationError(
  'Invalid health metric format',
  { metricType: 'heart_rate', expectedFormat: 'number' }
);

// Errors automatically log themselves
networkError.log();
```

### Performance Monitoring

```typescript
import {
  withHealthDataLogging,
  HealthOperationType,
} from '@/lib/healthDataLogging';

// Wrap functions for automatic performance monitoring
const processHealthData = withHealthDataLogging(
  'processHealthData',
  HealthOperationType.DATA_PROCESSING,
  async (data: HealthMetric[]) => {
    // Process health data
    return processedData;
  },
  // Extract safe metadata from arguments
  (data) => ({
    recordCount: data.length,
    metricType: data[0]?.type,
  })
);
```

### Error Boundaries

```typescript
import { ComponentErrorBoundary, HealthDataErrorFallback } from '@/components/error/ErrorBoundaryComponents';

// Wrap components with error boundaries
function HealthDashboard() {
  return (
    <ComponentErrorBoundary
      fallback={HealthDataErrorFallback}
      onError={(error, errorInfo) => {
        // Custom error handling
        console.log('Dashboard error:', error.message);
      }}
    >
      <HealthMetricsChart />
      <HealthDataTable />
    </ComponentErrorBoundary>
  );
}
```

### Async Error Handling

```typescript
import { useErrorReporting, useSafeAsync } from '@/hooks/useErrorHandling';

function useHealthDataSync() {
  const { reportError } = useErrorReporting();

  const { data, loading, error, execute } = useSafeAsync(async () => {
    const response = await fetch('/api/health-data/sync');
    if (!response.ok) throw new Error('Sync failed');
    return response.json();
  });

  const handleManualError = (error: Error) => {
    reportError(error, {
      operation: 'manual_sync',
      timestamp: new Date().toISOString(),
    });
  };

  return {
    data,
    loading,
    error,
    sync: execute,
    reportError: handleManualError,
  };
}
```

### Retry Logic

```typescript
import { retryWithBackoff } from '@/lib/errorHandling';

// Automatic retry with exponential backoff
const syncData = await retryWithBackoff(
  async () => {
    const response = await fetch('/api/health-data/sync');
    if (!response.ok) throw new Error('Sync failed');
    return response.json();
  },
  3, // maxRetries
  1000, // baseDelay (1 second)
  10000 // maxDelay (10 seconds)
);
```

### Circuit Breaker

```typescript
import { CircuitBreaker } from '@/lib/errorHandling';

const circuitBreaker = new CircuitBreaker(
  5, // failure threshold
  60000, // timeout (1 minute)
  30000 // reset timeout (30 seconds)
);

const safeApiCall = async () => {
  return circuitBreaker.execute(async () => {
    const response = await fetch('/api/health-data');
    if (!response.ok) throw new Error('API call failed');
    return response.json();
  });
};
```

## PII/PHI Protection

### Blocked Fields

The system automatically blocks these fields from being logged:

- `name`, `email`, `phone`, `address`
- `value`, `healthData`, `userData`, `personalInfo`
- `patientId`, `medicalRecord`, `biometric`
- `password`, `token`, `secret`, `key`, `jwt`
- `body`, `payload`, `data` (raw data fields)

### Safe Fields

Only these fields are allowed in logs:

- `timestamp`, `severity`, `category`, `errorType`
- `statusCode`, `method`, `endpoint`, `correlationId`
- `recordCount`, `fileSize`, `processingTime`
- `metricType` (type only, not values)
- `operationType`, `deviceType`, `connectionState`

### Automatic Sanitization

- Email addresses → `[EMAIL]`
- Phone numbers → `[PHONE]`
- SSN patterns → `[SSN]`
- Credit card numbers → `[CARD]`
- Unknown fields → `[FILTERED]`

## Audit Logging

```typescript
import { HealthDataAuditLogger } from '@/lib/healthDataLogging';

// Log critical operations with hashed user identifiers
HealthDataAuditLogger.logDataAccess(
  userId, // Automatically hashed
  'export_health_data',
  {
    operationType: HealthOperationType.DATA_EXPORT,
    recordCount: 500,
    fileSize: 1024000,
  }
);

HealthDataAuditLogger.logDataModification(userId, 'create', {
  metricType: 'heart_rate',
  recordCount: 1,
});
```

## Configuration

### Global Setup

The error handling system is initialized in `main.tsx`:

```typescript
import { setupGlobalErrorHandling } from '@/lib/errorHandling';

// Initialize global error handling
setupGlobalErrorHandling();
```

### Query Client Configuration

React Query is configured with error-aware defaults:

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
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
```

## Best Practices

### DO ✅

- Use `HealthDataLogger` for all health-related operations
- Wrap async operations with error boundaries
- Use retry logic for network operations
- Log performance metrics for slow operations
- Provide user-friendly error messages
- Use circuit breakers for external services

### DON'T ❌

- Log actual health values or user data
- Include PII/PHI in error messages
- Ignore validation errors
- Skip error boundaries on critical components
- Use generic error messages for user-facing errors
- Log sensitive authentication tokens

## Monitoring and Alerting

### Key Metrics to Monitor

- Error rates by category and severity
- Performance metrics for health operations
- Circuit breaker state changes
- Failed authentication attempts
- Data validation failure rates

### Log Analysis

Logs are structured JSON for easy parsing:

```json
{
  "timestamp": "2025-09-02T10:30:00.000Z",
  "level": "error",
  "message": "[HEALTH] Health data processing failed",
  "errorId": "err_abc123",
  "category": "processing",
  "severity": "medium",
  "operationType": "data_processing",
  "metricType": "heart_rate",
  "recordCount": 150,
  "processingTimeMs": 5000,
  "correlationId": "req_def456"
}
```

## Testing Error Handling

### Unit Tests

```typescript
import { ErrorFactory, SafeLogger } from '@/lib/errorHandling';

describe('Error Handling', () => {
  it('should redact PII from logs', () => {
    const consoleSpy = jest.spyOn(console, 'log');

    SafeLogger.info('Test message', {
      email: 'user@example.com', // Should be redacted
      recordCount: 5, // Should be preserved
    });

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[REDACTED]')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('recordCount')
    );
  });
});
```

### Integration Tests

Test error boundaries and recovery mechanisms:

```typescript
import { render } from '@testing-library/react';
import { ComponentErrorBoundary } from '@/components/error/ErrorBoundaryComponents';

const ThrowingComponent = () => {
  throw new Error('Test error');
};

test('error boundary catches and displays error', () => {
  const { getByText } = render(
    <ComponentErrorBoundary>
      <ThrowingComponent />
    </ComponentErrorBoundary>
  );

  expect(getByText(/Health Data Error/)).toBeInTheDocument();
});
```

## Migration from Old System

### Replace Existing Error Handling

1. Replace `ErrorFallback` with `AppErrorBoundary`
2. Replace console.log with `SafeLogger`
3. Use `HealthDataLogger` for health operations
4. Wrap API calls with retry logic
5. Add performance monitoring

### Gradual Migration

The new system is designed to coexist with existing error handling. You can migrate components incrementally by wrapping them with new error boundaries and updating their logging calls.

## Security Considerations

- All logs are sanitized before output
- User identifiers are hashed in audit logs
- No sensitive data is ever persisted in logs
- Error messages are safe for user display
- Circuit breakers prevent denial of service
- Performance monitoring helps detect attacks

This error handling and logging system provides enterprise-grade reliability while maintaining strict HIPAA compliance for health data applications.
