# DNS Issues Resolution Plan - Priority #2

## Current Status ✅

**Working Domains:**

- ✅ `health.andernet.dev` - Resolves correctly, serving main VitalSense app
- ✅ `vitalsense-websocket-advanced-prod.andernet.workers.dev` - Advanced WebSocket Worker deployed and working

**Broken/Missing Domains:**

- ❌ `vitalsense-advanced.andernet.dev` - DNS record doesn't exist
- ❌ References to advanced WebSocket domain in configurations

## Root Cause Analysis

1. **Advanced WebSocket Worker**: Successfully deployed but lacks custom domain
2. **DNS Configuration**: Missing CNAME record for `vitalsense-advanced.andernet.dev`
3. **Configuration Inconsistency**: Some configs reference non-existent custom domain

## Solution Options

### Option A: Quick Fix - Use Workers.dev Domain (Immediate)

**Pros:** No DNS changes needed, works immediately
**Cons:** Uses workers.dev subdomain instead of custom domain

**Steps:**

1. Update configurations to use `vitalsense-websocket-advanced-prod.andernet.workers.dev`
2. Test all WebSocket connections
3. Deploy updated configurations

### Option B: Complete Fix - Add Custom Domain (Requires API Token)

**Pros:** Clean custom domain, matches existing architecture
**Cons:** Requires Cloudflare API access

**Steps:**

1. Run DNS quick fix script with API token
2. Add CNAME: `vitalsense-advanced.andernet.dev` → `vitalsense-websocket-advanced-prod.andernet.workers.dev`
3. Update Worker routes in wrangler configuration
4. Test DNS propagation and connectivity

### Option C: Consolidation - Use Main Domain (Architectural Change)

**Pros:** Simplifies DNS, reduces complexity
**Cons:** Changes existing WebSocket URL patterns

**Steps:**

1. Update advanced WebSocket to use `ws.health.andernet.dev`
2. Consolidate WebSocket services under main domain
3. Update all configuration references

## Recommended Implementation: Option A (Quick Fix)

Since we need immediate resolution and API tokens may not be available, let's implement Option A first.

## Files to Update for Option A:

### 1. wrangler.toml (Development Environment)

```toml
# Line 27 & 57: Update WebSocket URL
WEBSOCKET_URL = "wss://vitalsense-websocket-advanced-prod.andernet.workers.dev/ws"
```

### 2. wrangler.production.toml (Production Environment)

```toml
# Add advanced WebSocket URL
WEBSOCKET_URL_ADVANCED = "wss://vitalsense-websocket-advanced-prod.andernet.workers.dev/ws"
```

### 3. Update Documentation References

- `docs/VitalSense-Advanced-ML-WebSocket-Complete.md`
- `scripts/deploy-vitalsense-advanced-websocket.js`

## Testing Plan

1. **WebSocket Connectivity Test:**

   ```bash
   node scripts/test-vitalsense-ml-websocket.js wss://vitalsense-websocket-advanced-prod.andernet.workers.dev
   ```

2. **End-to-End Integration Test:**

   ```bash
   node scripts/test-quickfix-ml-server.js  # Should work with Quick Fix A
   ```

3. **Production Deployment Test:**
   ```bash
   wrangler deploy --env production --dry-run
   ```

## Next Priority After DNS Fix

Once DNS issues are resolved, proceed to:

- **Priority #3**: Frontend Integration (dependency warnings, full-stack testing)
- **WebSocket Connection Handler Fix**: Return to resolve the original connection issue
- **ML Algorithm Enhancement**: Upgrade from mock responses to real ML processing

## Manual DNS Fix Instructions (If API Token Available)

```bash
# Step 1: Get Cloudflare API token from dashboard
# Step 2: Run DNS quick fix
node scripts/dns-quick-fix.js YOUR_API_TOKEN

# Step 3: Verify DNS propagation
nslookup vitalsense-advanced.andernet.dev
curl -I https://vitalsense-advanced.andernet.dev

# Step 4: Update Worker routes (requires wrangler.advanced-websocket.toml update)
```

## Status Tracking

- [x] Advanced WebSocket Worker deployed
- [x] Workers.dev domain functional
- [ ] Custom domain DNS record (pending API token)
- [ ] Configuration updates (ready to implement)
- [ ] Integration testing (ready to execute)

## Implementation Scripts Ready

- `scripts/dns-quick-fix.js` - Complete DNS automation script
- `scripts/test-quickfix-ml-server.js` - ML functionality verification
- Configuration update templates prepared
