# Secret Rotation Playbook

This document defines how VitalSense secrets are rotated, tracked, and enforced.

## Scope

Current tracked secrets:

| Name | Location | Purpose | Notes |
|------|----------|---------|-------|
| `DEVICE_JWT_SECRET` | Cloudflare Worker env var (`wrangler secret put`) | Signs device / iOS integration JWTs | Dev secret stored locally, prod managed via Cloudflare |

## Rotation Cadence

- Standard: every 90 days (max age enforced in CI).
- Early rotation triggers: suspected leak, role change, scope change, incident.

## Procedure (Cloudflare Workers)

1. Generate new value (32+ random bytes base64 or hex):

```bash
openssl rand -hex 32
```

1. Set secret for target environment:

```bash
wrangler secret put DEVICE_JWT_SECRET --env production
```

1. (If multi-env) Repeat for development / staging.
1. Update rotation metadata file `.secrets/rotation.json` with new ISO timestamp.
1. Deploy Worker (`wrangler deploy --env production`).
1. Monitor logs for auth errors for 15 minutes.

## Metadata Tracking

File: `.secrets/rotation.json`

Each entry:

```json
{
   "name": "DEVICE_JWT_SECRET",
   "lastRotated": "2025-09-18T00:00:00.000Z",
   "notes": "reason / ticket id"
}
```

## CI Enforcement

Job runs `node scripts/ci/secret-rotation-check.mjs --max-age-days=90`.
Fails if any secret exceeds threshold. Use `--fail-soft` only on exploratory branches.

## Emergency Rotation

1. Invalidate old tokens server-side (add short-term dual-validation window if required).
2. Rotate secret immediately.
3. Force redeploy.
4. Investigate root cause & document in incident log.

## Future Enhancements

- Automate creation of GitHub issue when age > 80 days.
- Support per-secret max age.
- Integrate with a secrets manager (Vault or Cloudflare Secrets KV) for centralized reporting.
