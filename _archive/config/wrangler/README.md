# Archived Wrangler Configurations

This directory contains archived Wrangler configuration files that have been consolidated into the main `wrangler.toml` file.

## Archived Files

- `wrangler.production.toml` - Production-specific config (merged into `wrangler.toml` as `[env.production]`)
- `wrangler.advanced-websocket.toml` - Advanced WebSocket config (merged into `wrangler.toml` as `[env.advanced-websocket-dev]` and `[env.advanced-websocket-prod]`)
- `wrangler.enhanced-websocket.toml` - Enhanced WebSocket config (merged into `wrangler.toml` as `[env.enhanced-websocket-dev]` and `[env.enhanced-websocket-prod]`)
- `wrangler.websocket.toml` - Basic WebSocket config (merged into `wrangler.toml` as `[env.websocket]`)

## Migration

All configurations have been consolidated into a single `wrangler.toml` file with environment-specific sections. Use the `--env` flag to select the appropriate environment:

```bash
# Main app
wrangler deploy --env development
wrangler deploy --env production

# WebSocket services
wrangler deploy --env websocket
wrangler deploy --env advanced-websocket-dev
wrangler deploy --env advanced-websocket-prod
wrangler deploy --env enhanced-websocket-dev
wrangler deploy --env enhanced-websocket-prod
```

## Date Archived

2025-01-20 - Phase 1 Structure Optimization
