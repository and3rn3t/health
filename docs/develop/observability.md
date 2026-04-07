# Observability & Production Readiness

## Overview

VitalSense uses structured logging, health checks, and Cloudflare Analytics Engine for production monitoring.

## Health Check

The Worker exposes `GET /health` returning:

```json
{
  "status": "healthy",
  "timestamp": "2026-04-07T12:00:00.000Z",
  "environment": "production"
}
```

Additional dev-only diagnostics:

- `GET /api/_audit` — list recent audit objects
- `GET /api/_ratelimit` — probe remaining rate-limit tokens
- `GET /api/_diagnostics` — environment diagnostics

## Logging

- **No PII or raw health data in logs.** Structured logs include request IDs and coarse metadata only.
- Log level configured via `LOG_LEVEL` environment variable (default: `info`).
- Correlation IDs thread through request → Worker → Durable Object for traceability.

## Cloudflare Analytics Engine

Production uses three Analytics Engine datasets (configured in `wrangler.toml`):

| Dataset | Purpose |
|---------|---------|
| `HEALTH_ANALYTICS` | Health data sync events, fall detection, user engagement |
| `SECURITY_ANALYTICS` | Auth attempts, rate limiting, suspicious activity |
| `PERFORMANCE_ANALYTICS` | Response times, error rates, endpoint usage |

## Monitoring Dashboard

Access at `https://health.andernet.dev/monitoring` (production).

Tracks:

- System health status
- Active user count
- Response time averages
- Error rate
- Security events

## Alerts

- Rate limiting violations trigger `429` responses and are logged to `SECURITY_ANALYTICS`.
- Fall detection events emit to `HEALTH_ANALYTICS` and trigger the emergency alert flow.
- Bundle size and latency are validated in CI via `pnpm ci:perf-slo`.

## Related

- [Security Baseline](../security/SECURITY_BASELINE.md) — audit logging requirements
- [Production Infrastructure Guide](../deploy/PRODUCTION_INFRASTRUCTURE_GUIDE.md) — full observability setup
- [Troubleshooting](../TROUBLESHOOTING.md) — debugging Worker issues
- Analysis timing for analysis endpoints

## Key Metrics to Monitor

1. **Request Rate**: Requests over time via `PERFORMANCE_ANALYTICS`
2. **Error Rate**: 4xx/5xx ratio
3. **Response Times**: P95 and P99 percentiles
4. **Health Data Sync**: Events tracked in `HEALTH_ANALYTICS`
5. **Security Events**: Auth failures and rate limit violations in `SECURITY_ANALYTICS`

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

   ```typescript
   // Structured log — no PII or raw health data
   console.info('Health data sync', {
     requestId,
     metric: 'steps',
     recordCount: items.length,
     durationMs: Date.now() - start,
   });
   ```

3. **Error Handling**: Always log errors with context

   ```typescript
   catch (error) {
     console.error('Sync failed', {
       requestId,
       endpoint: url.pathname,
       error: error instanceof Error ? error.message : 'unknown',
     });
   }
   ```

4. **Metrics**: Record metrics for all critical operations
   - Health data sync operations
   - Auth and rate-limiting events
   - WebSocket connections and reconnects

## Future Enhancements

- [ ] Distributed tracing (OpenTelemetry)
- [ ] Metrics export (Prometheus format)
- [ ] Log aggregation (ELK stack)
- [ ] Performance profiling
- [ ] Cost tracking per operation
- [ ] SLO monitoring and alerting
