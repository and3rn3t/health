# 🚀 VitalSense Production Infrastructure Deployment Guide

## Overview

This guide walks you through deploying VitalSense to production with comprehensive Cloudflare observability features including Analytics Engine, security monitoring, and performance tracking.

## 🎯 What We're Building

**Production-Grade Health Platform** with:

- **Enterprise Security**: WAF, rate limiting, DDoS protection
- **Real-time Analytics**: Health data insights, user behavior tracking
- **Security Monitoring**: Threat detection, audit logging, compliance
- **Performance Monitoring**: Response times, error rates, uptime tracking
- **HIPAA Compliance**: Encrypted storage, audit trails, access controls

## 📋 Prerequisites

1. **Cloudflare Account** with Workers Paid plan ($5/month minimum)
2. **Domain** configured in Cloudflare (andernet.dev)
3. **Auth0 Production Tenant** set up
4. **Node.js 18+** and **npm** installed
5. **Wrangler CLI** authenticated

## 🚀 Quick Start (15 Minutes)

### Step 1: Run the Setup Script

```powershell
# Run the complete infrastructure setup
./scripts/setup-production-infrastructure.ps1 -All

# Or run individual components:
./scripts/setup-production-infrastructure.ps1 -EnableObservability -Deploy
```

### Step 2: Configure Production Secrets

```powershell
# Set up Auth0 production secrets
wrangler secret put AUTH0_CLIENT_SECRET --env production
# Enter your Auth0 production client secret

wrangler secret put DEVICE_JWT_SECRET --env production
# Enter a secure JWT secret (32+ characters)

wrangler secret put ENCRYPTION_KEY --env production
# Enter a secure encryption key (32+ characters)
```

### Step 3: Update DNS Records

The script automatically creates DNS records, but verify in Cloudflare Dashboard:

- `health.andernet.dev` → Points to your Worker
- `vitalsense.andernet.dev` → Alternative domain
- SSL/TLS set to "Full (strict)"

### Step 4: Verify Deployment

```powershell
# Test all endpoints
./scripts/setup-production-infrastructure.ps1 -Verify

# Check specific endpoints
curl https://health.andernet.dev/health
curl https://health.andernet.dev/api/health
```

## 🎛️ Observability Features Enabled

### 📊 Analytics Engine Datasets

1. **HEALTH_ANALYTICS**
   - Health data synchronization events
   - Fall detection incidents
   - User engagement metrics
   - Data export activities

2. **SECURITY_ANALYTICS**
   - Authentication attempts
   - Rate limiting violations
   - Suspicious activity detection
   - Access control events

3. **PERFORMANCE_ANALYTICS**
   - Response time tracking
   - Error rate monitoring
   - Endpoint usage statistics
   - User journey analytics

### 🗄️ Storage Infrastructure

1. **KV Namespaces**
   - `HEALTH_KV`: Health data storage
   - `SESSION_KV`: User session management
   - `CACHE_KV`: Performance caching

2. **R2 Buckets**
   - `vitalsense-health-files`: File uploads
   - `vitalsense-audit-logs`: Compliance logs with Object Lock

### 🛡️ Security Features

1. **Web Application Firewall (WAF)**
   - Managed security rules
   - Custom rate limiting (100 req/min per IP)
   - Bot protection
   - DDoS mitigation

2. **Security Headers**
   - HSTS with preload
   - Content Security Policy
   - XSS protection
   - Frame options

3. **Durable Objects**
   - Rate limiting enforcement
   - WebSocket room management
   - Health session tracking

## 📈 Monitoring Dashboard

Access your production monitoring at: `https://health.andernet.dev/monitoring`

**Real-time Metrics**:

- System health status
- Active user count
- Response time averages
- Error rate tracking
- Security event monitoring
- Performance analytics

## 🔧 Configuration Details

### Environment Variables (Production)

```toml
[env.production.vars]
ENVIRONMENT = "production"
ALLOWED_ORIGINS = "https://health.andernet.dev,https://vitalsense.andernet.dev"
BASE_URL = "https://health.andernet.dev"
API_BASE_URL = "https://health.andernet.dev/api"
WEBSOCKET_URL = "wss://health.andernet.dev/ws"
LOG_LEVEL = "info"
ENABLE_ANALYTICS = "true"
ENABLE_SECURITY_LOGGING = "true"
ENABLE_PERFORMANCE_MONITORING = "true"
```

### Analytics Engine Configuration

```javascript
// Health event tracking
const healthEvent = {
  timestamp: Date.now(),
  userId: 'user-123',
  eventType: 'health_data_sync',
  metadata: {
    dataType: 'heart_rate',
    source: 'apple_health',
    metrics: ['bpm', 'variability'],
  },
  value: 72,
};

// Write to Analytics Engine
env.HEALTH_ANALYTICS.writeDataPoint(healthEvent);
```

### Security Event Tracking

```javascript
// Security event monitoring
const securityEvent = {
  timestamp: Date.now(),
  ip: '192.168.1.100',
  userAgent: 'Mozilla/5.0...',
  eventType: 'auth_attempt',
  userId: 'user-123',
  metadata: {
    success: true,
    method: 'auth0',
    location: 'US',
  },
  severity: 'low',
};

env.SECURITY_ANALYTICS.writeDataPoint(securityEvent);
```

## 🎯 Cloudflare Dashboard Configuration

### 1. Analytics & Logs

**Navigate to**: Cloudflare Dashboard → Workers → Analytics

**Configure**:

- **Workers Analytics**: Enable for performance tracking
- **Real User Monitoring**: Enable for user experience insights
- **Logpush**: Set up for external analytics (optional)

### 2. Security Settings

**Navigate to**: Cloudflare Dashboard → Security

**Configure WAF Rules**:

```
Rule Name: VitalSense API Protection
Expression: (http.request.uri.path matches "/api/.*")
Action: Rate Limit (100 requests per minute)
```

**Bot Fight Mode**: Enable for enhanced protection

### 3. Performance Optimization

**Navigate to**: Cloudflare Dashboard → Speed

**Configure**:

- **Auto Minify**: Enable for JS, CSS, HTML
- **Brotli Compression**: Enable
- **Early Hints**: Enable for faster page loads

### 4. R2 Object Storage

**Navigate to**: Cloudflare Dashboard → R2 Object Storage

**Verify Buckets**:

- `vitalsense-health-files`: File storage
- `vitalsense-audit-logs`: Audit logs with Object Lock enabled

## 📊 Analytics Queries

### Health Data Insights

```sql
-- Query health event trends
SELECT
  eventType,
  COUNT(*) as event_count,
  AVG(value) as avg_value
FROM HEALTH_ANALYTICS
WHERE timestamp >= now() - INTERVAL '24' HOUR
GROUP BY eventType
ORDER BY event_count DESC
```

### Security Monitoring

```sql
-- Query security events by severity
SELECT
  severity,
  eventType,
  COUNT(*) as incident_count
FROM SECURITY_ANALYTICS
WHERE timestamp >= now() - INTERVAL '24' HOUR
GROUP BY severity, eventType
ORDER BY
  CASE severity
    WHEN 'critical' THEN 1
    WHEN 'high' THEN 2
    WHEN 'medium' THEN 3
    WHEN 'low' THEN 4
  END
```

### Performance Analysis

```sql
-- Query endpoint performance
SELECT
  endpoint,
  AVG(responseTime) as avg_response_time,
  MAX(responseTime) as max_response_time,
  COUNT(*) as request_count
FROM PERFORMANCE_ANALYTICS
WHERE timestamp >= now() - INTERVAL '1' HOUR
GROUP BY endpoint
ORDER BY avg_response_time DESC
```

## 🔍 Troubleshooting

### Common Issues

1. **DNS Not Resolving**

   ```powershell
   # Check DNS configuration
   nslookup health.andernet.dev
   # Should return Cloudflare IPs
   ```

2. **Analytics Not Recording**

   ```powershell
   # Verify datasets exist
   wrangler analytics-engine list-datasets --env production
   ```

3. **High Error Rates**
   ```powershell
   # Check Worker logs
   wrangler tail --env production
   ```

### Performance Optimization

1. **Enable Caching**
   - Static assets: 24-hour cache
   - API responses: 5-minute cache for non-sensitive data

2. **Optimize Bundle Size**

   ```powershell
   # Analyze bundle
   npm run build:analyze
   ```

3. **Monitor Core Web Vitals**
   - Use Cloudflare Web Analytics
   - Set up alerts for performance degradation

## 📱 Next Steps

After successful production deployment:

1. **🎯 User Testing**: Deploy to limited user group
2. **📊 Monitor Metrics**: Watch for 24-48 hours
3. **🔒 Security Audit**: Run security scan
4. **📱 iOS App Store**: Submit iOS companion app
5. **🚀 Marketing Launch**: Public announcement

## 🆘 Support & Monitoring

### 24/7 Monitoring URLs

- **Main App**: https://health.andernet.dev
- **Health Check**: https://health.andernet.dev/health
- **API Status**: https://health.andernet.dev/api/health
- **Monitoring Dashboard**: https://health.andernet.dev/monitoring

### Cloudflare Dashboard Links

- **Workers**: https://dash.cloudflare.com → Workers & Pages
- **Analytics**: https://dash.cloudflare.com → Analytics & Logs
- **Security**: https://dash.cloudflare.com → Security
- **R2 Storage**: https://dash.cloudflare.com → R2 Object Storage

## 🎉 Success Criteria

Your production deployment is successful when:

✅ **Health endpoint returns "healthy" status**
✅ **Analytics Engine receiving events**
✅ **Security monitoring active**
✅ **Performance metrics within targets**
✅ **SSL certificate valid**
✅ **CDN caching working**
✅ **Rate limiting enforced**
✅ **Audit logging functional**

**🎯 Target Performance**:

- Response time: < 200ms
- Error rate: < 1%
- Uptime: > 99.9%
- Security events: Properly logged and alerted

---

## 🔐 Security Checklist

- [ ] All secrets stored in Wrangler secrets (not environment variables)
- [ ] WAF rules configured and tested
- [ ] Rate limiting active on all API endpoints
- [ ] HTTPS enforced with HSTS
- [ ] CSP headers preventing XSS
- [ ] Audit logging capturing all sensitive operations
- [ ] R2 buckets with proper access controls
- [ ] Auth0 production tenant configured with MFA
- [ ] Security headers tested with security scanners

**Your VitalSense production infrastructure is now enterprise-ready with comprehensive observability! 🚀**
