# Cloudflare Durable Object Migration Fix

## Problem

Error: `Version upload failed. You attempted to upload a version of a Worker that includes a Durable Object migration, but migrations must be fully applied by running "wrangler deploy". [code: 10211]`

## Root Cause

The `VitalSenseAdvancedWebSocketDO` migration was already applied to Cloudflare, but the migration configuration was still present in `wrangler.toml`. Cloudflare detects this and rejects the deployment to prevent re-applying migrations.

## Solution Applied

### 1. Removed from Environment-Specific Migrations
- Commented out `[[env.advanced-websocket-dev.migrations]]` 
- Commented out `[[env.advanced-websocket-prod.migrations]]`

### 2. Removed from Global Migrations
- Removed `VitalSenseAdvancedWebSocketDO` from global `[[migrations]]` v1
- Removed `VitalSenseAdvancedWebSocketDO` from production `[[env.production.migrations]]` v1

### 3. Updated Deployment Scripts
- Removed `--no-gradual` flags (no longer needed since migration is applied)
- Updated comments to reflect normal deployment is fine

## Current State

All migrations for `VitalSenseAdvancedWebSocketDO` have been removed from `wrangler.toml`:
- ✅ Environment-specific migrations: Commented out
- ✅ Global migrations: Removed from v1
- ✅ Production migrations: Removed from v1

## If Error Persists

If you still see the error after these changes, it may indicate:

1. **Migration in Partial State**: The migration might be partially applied in Cloudflare
   - **Solution**: Check Cloudflare dashboard → Workers → vitalsense-websocket-advanced-dev → Migrations
   - If migration shows as "pending" or "failed", you may need to contact Cloudflare support

2. **Cached Configuration**: Wrangler might be using cached config
   - **Solution**: Clear wrangler cache: `rm -rf .wrangler` or `wrangler deployments list --env advanced-websocket-dev` to refresh

3. **Migration Needs Explicit Completion**: 
   - **Solution**: Try deploying once with `--no-gradual` to force completion, then remove migration config

## Verification

After deployment succeeds, verify:
```bash
wrangler deployments list --env advanced-websocket-dev
```

Should show successful deployment without migration errors.

## Future Migrations

If you need to add a new Durable Object class:
1. Add migration with new tag (e.g., v2) to environment-specific section
2. Deploy once with `--no-gradual`
3. After successful deployment, comment out the migration again
