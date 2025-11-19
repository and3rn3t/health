# Cloudflare Durable Object Migrations - Deployment Guide

## Issue

When deploying Workers with Durable Object migrations, Cloudflare requires that migrations be fully applied using a non-gradual deployment. The error you may see:

```
Version upload failed. You attempted to upload a version of a Worker that includes a Durable Object migration, but migrations must be fully applied by running "wrangler deploy".
```

## Solution

### Option 1: Use --no-gradual Flag (Recommended)

When deploying with migrations, use the `--no-gradual` flag:

```bash
wrangler deploy --env advanced-websocket-dev --no-gradual
```

This ensures the migration is fully applied immediately.

### Option 2: Remove Migration After First Deploy

If the migration has already been applied, you can remove it from `wrangler.toml`:

```toml
# Migration already applied - can be removed
# [[env.advanced-websocket-dev.migrations]]
# tag = "v1"
# new_sqlite_classes = ["VitalSenseAdvancedWebSocketDO"]
```

### Option 3: Apply Migration Separately

1. First deploy with migration using `--no-gradual`:
   ```bash
   wrangler deploy --env advanced-websocket-dev --no-gradual
   ```

2. After migration is applied, remove migration from config and use normal deployments:
   ```bash
   wrangler deploy --env advanced-websocket-dev
   ```

## Current Configuration

The `advanced-websocket-dev` and `advanced-websocket-prod` environments have migrations commented out in `wrangler.toml` to prevent this error. If you need to apply a new migration:

1. Uncomment the migration in `wrangler.toml`
2. Deploy with `--no-gradual` flag
3. After successful deployment, comment out the migration again

## CI/CD Integration

The deployment scripts have been updated to use `--no-gradual`:

- `package.json` scripts: `deploy:advanced-websocket:dev` and `deploy:advanced-websocket:prod`
- `scripts/deploy-vitalsense-advanced-websocket.js`: Updated to use `--no-gradual`

## Verification

After deploying, verify the migration was applied:

```bash
wrangler deployments list --env advanced-websocket-dev
```

Check that the deployment shows the migration was applied successfully.

## Best Practices

1. **First Deployment**: Always use `--no-gradual` for first deployment with migrations
2. **Subsequent Deployments**: After migration is applied, you can use gradual deployments
3. **Remove Migrations**: Once applied, remove or comment out migrations to avoid conflicts
4. **Documentation**: Document when migrations were applied

## Troubleshooting

### Migration Already Applied

If you see an error that migration is already applied, remove the migration from `wrangler.toml`:

```toml
# Migration already applied - removed
```

### Migration Failed

If migration fails:

1. Check Cloudflare dashboard for error details
2. Verify Durable Object class names match
3. Ensure `--no-gradual` flag is used
4. Check worker logs: `wrangler tail --env advanced-websocket-dev`

### Gradual Deployment After Migration

After migration is applied, you can use gradual deployments for future updates:

```bash
wrangler deploy --env advanced-websocket-dev
# No --no-gradual needed after migration is applied
```

---

*Last Updated: January 2024*
