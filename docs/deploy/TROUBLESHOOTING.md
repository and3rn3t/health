# Production Troubleshooting Guide

## Common Issues and Solutions

### Blank Screen / App Not Loading

**Symptoms:**
- Browser shows blank white screen
- Console shows JavaScript errors
- React app doesn't mount

**Debugging Steps:**

1. **Check Browser Console:**
   ```javascript
   // Look for:
   // - Module loading errors
   // - Initialization errors (e.g., "Cannot access 'z' before initialization")
   // - CSP violations
   // - Network errors
   ```

2. **Verify app-config.js is being served correctly:**
   ```bash
   curl https://health.andernet.dev/app-config.js
   # Should show environment: 'production' (not 'development')
   ```

3. **Check if static file is being served instead of worker route:**
   - The worker route `/app-config.js` should take precedence
   - If you see the static file content, the middleware order may be wrong

4. **Verify React is mounting:**
   - Check if `main.tsx` console logs appear
   - Check if error boundaries are catching errors

### Cloudflare Insights Beacon Error

**Error:**
```
GET https://static.cloudflareinsights.com/beacon.min.js/... net::ERR_CERT_AUTHORITY_INVALID
```

**Solutions:**

1. **Disable in wrangler.toml:**
   ```toml
   [observability]
   enabled = false
   ```

2. **Disable in Cloudflare Dashboard:**
   - Go to Workers & Pages → Your Worker → Settings
   - Find "Observability" or "Real User Monitoring"
   - Disable it

3. **CSP should block it:**
   - Current CSP: `script-src 'self'` (blocks external scripts)
   - If it still loads, Cloudflare may inject it before CSP is applied

### 'z' Initialization Error

**Error:**
```
Uncaught ReferenceError: Cannot access 'z' before initialization
at EnhancedFallRiskSystem.tsx:151:1
```

**Cause:**
- Temporal Dead Zone (TDZ) error in object literal
- Variable used before declaration in destructuring or object creation
- Circular dependency in module exports

**Solutions:**

1. **Pre-calculate all values before object creation:**
   ```typescript
   // ❌ Bad - uses z before it's fully initialized
   const data = { z: 9.8 + Math.random() * 0.5 };
   
   // ✅ Good - calculate first, then use
   const zValue = 9.8 + Math.random() * 0.5;
   const data = { z: zValue };
   ```

2. **Check for circular dependencies:**
   - Use direct re-exports instead of importing and re-exporting
   - Avoid importing from files that import back

3. **Verify source maps:**
   - Line numbers may be off due to minification
   - Check the actual error stack trace

### Environment Showing as 'development' in Production

**Cause:**
- Static `public/app-config.js` being served instead of worker route
- Worker route not taking precedence

**Solution:**
- Ensure `/app-config.js` route is defined before `app.use('/*')` middleware
- Add check in middleware to skip `/app-config.js`:
  ```typescript
  if (p === '/app-config.js') {
    return next();
  }
  ```

## Verification Commands

```bash
# Check app-config.js
curl https://health.andernet.dev/app-config.js | grep environment

# Check health endpoint
curl https://health.andernet.dev/health

# Check if HTML is being served
curl -I https://health.andernet.dev/

# Check worker logs (via Cloudflare Dashboard)
# Workers & Pages → Your Worker → Logs
```

## Next Steps if Issues Persist

1. **Check Cloudflare Dashboard:**
   - Worker logs for runtime errors
   - Analytics for request patterns
   - Observability settings

2. **Verify Build Output:**
   - Check `dist/` and `dist-worker/` directories
   - Verify all files are built correctly

3. **Test Locally:**
   ```bash
   pnpm run build
   pnpm run preview
   # Test at http://localhost:4173
   ```

4. **Check Browser Network Tab:**
   - Verify all assets are loading (200 status)
   - Check for blocked requests (CSP violations)
   - Verify WebSocket connections
