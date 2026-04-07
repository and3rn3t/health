# Secret Management

## Principles

1. **Never commit secrets** to Git — not even "dev-local" values.
2. **Use environment-specific mechanisms** for each target:
   - **Local dev**: `.env.development.local` (gitignored)
   - **Cloudflare Workers**: `wrangler secret put <NAME>`
   - **Docker Compose**: `${VAR:-default}` syntax referencing a `.env` file
   - **CI/CD**: GitHub Actions secrets (`${{ secrets.NAME }}`)

## Required Secrets

| Secret | Purpose | Where to set |
|--------|---------|--------------|
| `DEVICE_JWT_SECRET` | HS256 signing key for iOS device auth tokens | `wrangler secret put DEVICE_JWT_SECRET` |
| `ENC_KEY` | AES-256 base64 key for encrypting health data at rest | `wrangler secret put ENC_KEY` |
| `CLOUDFLARE_API_TOKEN` | Deploy token for `wrangler deploy` | GitHub Actions secret |
| `SONAR_TOKEN` | SonarCloud analysis token | GitHub Actions secret |

## Local Development

```bash
# Create your local env file (already gitignored)
cp .env.development.local.example .env.development.local

# Or set secrets for local wrangler dev
echo "dev-local" | wrangler secret put DEVICE_JWT_SECRET --env development
```

## Production

```bash
# Generate a strong secret (32+ bytes)
openssl rand -base64 32

# Set via Wrangler CLI
wrangler secret put DEVICE_JWT_SECRET --env production
wrangler secret put ENC_KEY --env production
```

## Rotation

### Cadence

- Standard: every 90 days (max age enforced in CI via `scripts/ci/secret-rotation-check.mjs --max-age-days=90`).
- Early rotation triggers: suspected leak, role change, scope change, incident.

### Procedure

1. Generate a new value:
   ```bash
   openssl rand -hex 32
   ```
2. Set secret for target environment:
   ```bash
   wrangler secret put DEVICE_JWT_SECRET --env production
   ```
3. Repeat for development/staging if applicable.
4. Update rotation metadata in `.secrets/rotation.json`:
   ```json
   {
     "name": "DEVICE_JWT_SECRET",
     "lastRotated": "2026-04-07T00:00:00.000Z",
     "notes": "reason / ticket id"
   }
   ```
5. Deploy Worker: `wrangler deploy --env production`.
6. Monitor logs for auth errors for 15 minutes.

### Impact of Rotation

- **`DEVICE_JWT_SECRET`**: Existing device tokens signed with the old key fail auth. Devices must re-authenticate.
- **`ENC_KEY`**: Data encrypted with the old key cannot be decrypted. Plan a migration if rotating.

### Emergency Rotation

1. Invalidate old tokens server-side (add short-term dual-validation window if required).
2. Rotate secret immediately.
3. Force redeploy.
4. Investigate root cause and document in incident log.

### CI Enforcement

The CI job runs `node scripts/ci/secret-rotation-check.mjs --max-age-days=90` and fails if any secret exceeds the threshold. Use `--fail-soft` only on exploratory branches.
