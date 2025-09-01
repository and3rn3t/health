# Health App API Endpoint Testing Plan

## Environment Status

- ✅ **Production Worker**: Successfully deployed to `health-app-prod.workers.dev`
- ✅ **Custom Domain**: Configured at `health.andernet.dev`
- ✅ **Local Dev**: Running on `http://127.0.0.1:8790` (wrangler dev)
- ⚠️ **DNS Resolution**: PowerShell/curl failing, but browser access works

## Test Endpoints

### Core Health Endpoints

1. **Basic Health Check**
   - Production: <https://health-app-prod.workers.dev/health>
   - Custom Domain: <https://health.andernet.dev/health>
   - Local: <http://127.0.0.1:8790/health>
   - Expected: `{"status":"healthy","timestamp":"..."}`

2. **Detailed Health Status**
   - Production: <https://health-app-prod.workers.dev/api/health-data>
   - Custom Domain: <https://health.andernet.dev/api/health-data>
   - Local: <http://127.0.0.1:8790/api/health-data>
   - Expected: Comprehensive health data response

3. **Self Test Endpoint**
   - Production: <https://health-app-prod.workers.dev/api/_selftest>
   - Custom Domain: <https://health.andernet.dev/api/_selftest>
   - Local: <http://127.0.0.1:8790/api/_selftest>
   - Expected: System diagnostics and validation results

### API Endpoints

4. **User Registration**
   - POST <https://health-app-prod.workers.dev/api/register>
   - Expected: User creation flow

5. **User Authentication**
   - POST <https://health-app-prod.workers.dev/api/login>
   - Expected: JWT token response

6. **Device Registration**
   - POST <https://health-app-prod.workers.dev/api/devices/register>
   - Expected: Device pairing flow

7. **Health Data Submission**
   - POST <https://health-app-prod.workers.dev/api/health-data>
   - Expected: Data ingestion response

8. **Emergency Alerts**
   - POST <https://health-app-prod.workers.dev/api/emergency>
   - Expected: Alert processing

### Static Assets

9. **React App**
   - Production: <https://health-app-prod.workers.dev/>
   - Custom Domain: <https://health.andernet.dev/>
   - Local: <http://127.0.0.1:8790/>
   - Expected: Health app UI

10. **API Documentation**
    - Production: <https://health-app-prod.workers.dev/docs>
    - Expected: API documentation interface

## Testing Strategy

### Phase 1: Browser-Based Verification ✅

- Open all endpoints in Simple Browser
- Verify basic connectivity and responses
- Document any errors or unexpected responses

### Phase 2: Programmatic Testing (DNS Issues)

- PowerShell Invoke-RestMethod failing with DNS resolution
- curl.exe failing with "remote name could not be resolved"
- Need alternative testing approach or DNS troubleshooting

### Phase 3: Comprehensive API Testing

- Test POST endpoints with sample data
- Verify authentication flows
- Test error handling and edge cases

## Current Status

- **Deployment**: ✅ Successful (Exit Code: 0)
- **Worker Connectivity**: ✅ wrangler tail connected to "health-app-prod"
- **Browser Access**: ✅ Simple Browser can open all URLs
- **CLI Access**: ❌ DNS resolution failing in PowerShell/curl
- **Local Development**: ✅ wrangler dev running on port 8790

## Next Steps

1. Use browser-based testing for immediate verification
2. Investigate DNS resolution issues (local cache, corporate proxy, DNS servers)
3. Consider browser automation or headless testing for programmatic verification
4. Wait for DNS propagation if domain was recently configured
