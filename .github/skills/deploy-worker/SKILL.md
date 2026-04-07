---
name: deploy-worker
description: "Build and deploy Cloudflare Worker to development or production. Use when deploying, previewing, or troubleshooting Worker deployments. Covers build validation, environment selection, and post-deploy verification."
argument-hint: "Environment: dev or prod"
---

# Deploy Cloudflare Worker

## When to Use
- Deploy Worker to development or production
- Verify Worker build before deployment
- Troubleshoot deployment failures
- Preview Worker changes locally

## Procedure

### 1. Validate Build
Run type-check and lint before building:
```bash
pnpm run type-check && pnpm run lint
```

### 2. Build Worker
```bash
pnpm run build:worker
```
Verify output exists at `dist-worker/index.js`.

### 3. Local Preview
Test locally with Wrangler dev:
```bash
pnpm run cf:dev
```
Verify `/health` endpoint returns 200 and static assets are served.

### 4. Deploy

**Development:**
```bash
pnpm run cf:deploy
```

**Production:**
```bash
pnpm run deploy:prod
```

### 5. Post-Deploy Verification
- Check `/health` endpoint on deployed URL
- Verify WebSocket upgrade at `/ws`
- Confirm KV/R2 bindings are accessible
- Check Analytics Engine is receiving events

## Environment Config
- Development: `wrangler.toml` → `[env.development]`
- Production: `wrangler.toml` → `[env.production]` (custom domain: `health.andernet.dev`)

## Troubleshooting
- Bundle too large → check for Node API imports, use dynamic imports
- Binding errors → verify `wrangler.toml` has correct KV/R2/DO bindings
- Auth failures → check Auth0 secrets in Wrangler dashboard
