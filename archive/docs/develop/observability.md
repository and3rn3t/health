# Observability & Production Readiness

## Overview

Phase 6 observability features provide structured logging, metrics collection, error tracking, and enhanced health checks for the geospatial health platform.

## Features

### 1. Structured Logging

**Location**: `scripts/observability/logger.js`

Structured JSON logging with configurable log levels:

```javascript
const logger = require('../observability/logger.js');

logger.info('Operation completed', { userId: 'user-1', operation: 'ndvi' });
logger.error('Analysis failed', error, { endpoint: '/analysis/ndvi' });
```

**Log Levels**:
- `DEBUG`: Detailed debugging information
- `INFO`: General informational messages
- `WARN`: Warning messages
- `ERROR`: Error messages

**Configuration**:
- Set `LOG_LEVEL` environment variable (default: `INFO`)
- Logs include: timestamp, level, message, context, service name, environment

**Example Log Output**:
```json
{
  "timestamp": "2024-01-15T10:30:00.000Z",
  "level": "INFO",
  "message": "Request completed",
  "method": "POST",
  "path": "/analysis/ndvi",
  "statusCode": 200,
  "duration": "45ms",
  "service": "catalog-api",
  "env": "production"
}
```

### 2. Metrics Collection

**Location**: `scripts/observability/metrics.cjs`

Tracks:
- **Request metrics**: Total requests, by method, by path, by status code
- **Response times**: P50, P95, P99 percentiles, average
- **Error metrics**: Total errors, by type, by path
- **Analysis metrics**: Count, average time, error rate per analysis type
- **Cache metrics**: Hits, misses, evictions, hit rate
- **Uptime**: Service uptime in various units

**Access Metrics**:
```bash
GET /metrics
```

**Example Response**:
```json
{
  "requests": {
    "total": 1250,
    "byMethod": { "GET": 800, "POST": 450 },
    "byPath": { "/analysis/ndvi": 200, "/health": 50 },
    "byStatus": { "200": 1200, "400": 30, "500": 20 }
  },
  "responseTime": {
    "p50": 25,
    "p95": 150,
    "p99": 300,
    "avg": 45
  },
  "errors": {
    "total": 50,
    "byType": { "ValidationError": 30, "AnalysisError": 20 }
  },
  "analysis": {
    "ndvi": { "count": 200, "avgTime": 45, "errorRate": 0.05 },
    "zonal": { "count": 150, "avgTime": 30, "errorRate": 0.02 }
  },
  "cache": {
    "hits": 500,
    "misses": 200,
    "evictions": 10,
    "hitRate": 71.43
  },
  "uptime": {
    "milliseconds": 3600000,
    "seconds": 3600,
    "minutes": 60,
    "hours": 1
  }
}
```

### 3. Enhanced Health Check

**Endpoint**: `GET /health`

Returns:
- Service status
- Timestamp
- Uptime
- Service name
- Version

**Example Response**:
```json
{
  "ok": true,
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": { "seconds": 3600 },
  "service": "catalog-api",
  "version": "1.0.0"
}
```

### 4. Error Handling

**Automatic Error Tracking**:
- All errors are logged with context
- Errors are recorded in metrics
- Stack traces included in development mode
- Proper HTTP status codes

**Error Middleware**:
- Catches unhandled errors
- Logs errors with full context
- Returns appropriate error responses
- Tracks error types and paths

### 5. Request Logging

**Automatic Request Logging**:
- All requests are logged with:
  - Method, path, status code
  - Response time
  - IP address
  - User agent
  - Content length

**Log Levels by Status**:
- 2xx: INFO
- 4xx: WARN
- 5xx: ERROR

## Usage

### Starting the API with Observability

```bash
# Default log level (INFO)
npm run catalog:api

# Debug logging
LOG_LEVEL=DEBUG npm run catalog:api

# Production logging (ERROR only)
LOG_LEVEL=ERROR npm run catalog:api
```

### Accessing Metrics

```bash
# Get all metrics
curl http://127.0.0.1:5055/metrics

# Health check
curl http://127.0.0.1:5055/health
```

### Programmatic Usage

```javascript
const logger = require('./scripts/observability/logger.js');
const metrics = require('./scripts/observability/metrics.js');

// Logging
logger.info('Analysis started', { type: 'ndvi', inputSize: 1000 });
logger.error('Analysis failed', error, { type: 'ndvi' });

// Metrics
metrics.recordAnalysis('ndvi', duration, true);
metrics.recordCacheHit();
metrics.recordError('ValidationError', '/analysis/ndvi');

// Get metrics
const allMetrics = metrics.getMetrics();
```

## Integration

### Automatic Integration

The observability middleware is automatically integrated into the catalog API:
- Request logging for all endpoints
- Error tracking for all errors
- Metrics collection for all requests
- Analysis timing for analysis endpoints

### Manual Integration

For custom endpoints or scripts:

```javascript
const logger = require('./scripts/observability/logger.js');
const metrics = require('./scripts/observability/metrics.js');

app.post('/custom/endpoint', (req, res) => {
  const startTime = Date.now();
  try {
    // Your logic
    const duration = Date.now() - startTime;
    metrics.recordAnalysis('custom', duration, true);
    res.json({ result: 'success' });
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Custom endpoint error', error, { endpoint: '/custom/endpoint' });
    metrics.recordAnalysis('custom', duration, false);
    metrics.recordError(error.name, '/custom/endpoint');
    res.status(500).json({ error: error.message });
  }
});
```

## Monitoring

### Key Metrics to Monitor

1. **Request Rate**: `requests.total` over time
2. **Error Rate**: `errors.total / requests.total`
3. **Response Times**: P95 and P99 percentiles
4. **Analysis Performance**: Average time per analysis type
5. **Cache Performance**: Hit rate should be > 70%
6. **Uptime**: Service availability

### Alerts

Recommended alerts:
- Error rate > 5%
- P95 response time > 1000ms
- Cache hit rate < 50%
- Service downtime

## Best Practices

1. **Log Levels**: Use appropriate log levels
   - DEBUG: Development debugging
   - INFO: Normal operations
   - WARN: Recoverable issues
   - ERROR: Failures requiring attention

2. **Context**: Always include relevant context in logs
   ```javascript
   logger.info('Analysis completed', {
     type: 'ndvi',
     inputSize: nir.length,
     duration: duration,
     userId: req.user?.id
   });
   ```

3. **Error Handling**: Always log errors with context
   ```javascript
   catch (error) {
     logger.error('Operation failed', error, {
       endpoint: req.path,
       userId: req.user?.id,
       input: sanitizedInput
     });
   }
   ```

4. **Metrics**: Record metrics for all critical operations
   - Analysis operations
   - Cache operations
   - External API calls
   - Database queries

## Future Enhancements

- [ ] Distributed tracing (OpenTelemetry)
- [ ] Metrics export (Prometheus format)
- [ ] Log aggregation (ELK stack)
- [ ] Performance profiling
- [ ] Cost tracking per operation
- [ ] SLO monitoring and alerting
