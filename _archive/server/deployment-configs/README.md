# Archived Server Deployment Configurations

This directory contains deployment configurations for platforms that are not currently in use.

## Archived Configs

- `vercel.json` - Vercel deployment configuration
- `railway.json` - Railway deployment configuration  
- `fly.toml` - Fly.io deployment configuration

## Current Deployment

The project currently uses:
- **Docker** - Primary containerization (see `server/Dockerfile` and root `Dockerfile`)
- **Cloudflare Workers** - Primary hosting platform (see `wrangler.toml`)

## Date Archived

2025-01-20 - Phase 2 Structure Optimization

## Note

These configs are kept for reference in case we need to deploy to these platforms in the future. The server implementation (`vitalsense-enhanced-server.js`) is platform-agnostic and can be deployed to any of these platforms with appropriate configuration.
