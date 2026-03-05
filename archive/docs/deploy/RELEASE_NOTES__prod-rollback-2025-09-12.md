# VitalSense Release Notes — prod-rollback-2025-09-12

Date: 2025-09-12
Environment: Production

## Summary

This release tags a production rollback to a previously verified clean build. The deployment restores the VitalSense application and API to the stable state from September 9, 2025.

- Release tag: prod-rollback-2025-09-12
- Rollback branch: rollback/production-2025-09-09
- Commit: 2b6ea7063a7de60442fbce86d42587691c4901c3
  - Subject: feat: Add LiveConnectionStatus component for WebSocket monitoring
  - Date: 2025-09-09 10:12:52 -0500
- Worker: health-app-prod
- Cloudflare Version ID: a7c85974-8df9-4472-b9fd-941768f0740f

## Verification

- Health (workers.dev): https://health-app-prod.andernet.workers.dev/health → healthy
- Health (custom domain): https://health.andernet.dev/health → healthy

Endpoints (expected):
- App: https://health.andernet.dev/
- API base: https://health.andernet.dev/api
- Self test: https://health.andernet.dev/api/_selftest
- WebSocket: wss://health.andernet.dev/ws

## Notes

- This rollback corresponds to the timeframe documented as successful in prior deployment verification.
- Use this tag as the reference point for incident audit and for any hotfixes that must be based on the stable build.

## Roll Forward / Back

- Roll forward: merge desired fixes into main, deploy as usual (wrangler deploy --env production), then create a new annotated tag.
- Roll back again: redeploy this tag’s commit or use Wrangler’s deployment rollback if applicable.

## Change Scope

- No schema or storage changes included in this rollback.
- UI and sensor integrations reflect the stable implementation as of 2025-09-09.

---
VitalSense