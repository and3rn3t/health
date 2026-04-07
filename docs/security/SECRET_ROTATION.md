# Secret Rotation Playbook

> **Consolidated**: This content has been merged into [SECRET_MANAGEMENT.md](SECRET_MANAGEMENT.md#rotation). See the Rotation section there for the complete playbook including cadence, procedure, CI enforcement, and emergency rotation.

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
