# Advanced WebSocket Worker Migration Fix

## Problem

The `vitalsense-websocket-advanced-dev` worker deployment fails with:
```
Version upload failed. You attempted to upload a version of a Worker that includes a Durable Object migration, but migrations must be fully applied by running "wrangler deploy". [code: 10211]
```

## Root Cause

1. **Worker is in use**: The advanced websocket worker is actively used:
   - Dev environment: `WEBSOCKET_URL = "wss://vitalsense-websocket-advanced-dev.andernet.workers.dev/ws"`
   - iOS apps connect to it
   - Deployed in CI/CD

2. **Migration state issue**: Cloudflare detects the `VitalSenseAdvancedWebSocketDO` Durable Object class in the worker code and expects a migration. Even though:
   - The migration (v1) was already applied
   - Migration configs were removed from `wrangler.toml`
   - Cloudflare may have a stuck/pending migration state

## Solution Applied

### 1. Updated CI/CD Workflow
Modified `.github/workflows/deploy-production.yml` to use `--no-gradual` flag:
```bash
npx wrangler deploy --env advanced-websocket-dev --no-gradual
npx wrangler deploy --env advanced-websocket-prod --no-gradual
```

This forces Cloudflare to complete any pending migration state.

### 2. Migration Configurations
All migration configurations remain commented out in `wrangler.toml`:
- `[[env.advanced-websocket-dev.migrations]]` - Commented out
- `[[env.advanced-websocket-prod.migrations]]` - Commented out
- Removed from global migrations
- Removed from production migrations

## Why This Worker is Needed

The advanced websocket worker provides:
- Real-time health data processing
- ML-powered analytics (predictive analytics, anomaly detection)
- Personalized health insights
- Emergency alert system
- Used by iOS apps and web dashboard

**Do not skip this worker** - it's a critical component.

## Alternative Solutions (if --no-gradual doesn't work)

### Option 1: Check Cloudflare Dashboard
1. Go to Cloudflare Dashboard → Workers → vitalsense-websocket-advanced-dev
2. Check "Migrations" tab
3. If migration shows as "pending" or "failed", you may need to:
   - Contact Cloudflare support
   - Or manually clear the migration state

### Option 2: Temporary Migration Re-add
If `--no-gradual` doesn't work, temporarily add migration back:
```toml
[[env.advanced-websocket-dev.migrations]]
tag = "v1"
new_sqlite_classes = ["VitalSenseAdvancedWebSocketDO"]
```

Then deploy with `--no-gradual`, then remove the migration again.

### Option 3: Skip Deployment (Temporary)
If the worker is not critical for current deployment:
```yaml
# In .github/workflows/deploy-production.yml
# Temporarily comment out:
# npx wrangler deploy --env advanced-websocket-dev --no-gradual
```

**Note**: This should only be temporary as the worker is actively used.

## Verification

After successful deployment:
```bash
wrangler deployments list --env advanced-websocket-dev
```

Should show successful deployment without migration errors.

## Current Status

- ✅ Migration configs removed from wrangler.toml
- ✅ CI/CD updated to use `--no-gradual`
- ⚠️  Waiting for next deployment to verify fix
