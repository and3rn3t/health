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
| `ENC_KEY` | AES-256 base64 key for encrypting 2FA state and health data at rest | `wrangler secret put ENC_KEY` |
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

1. Generate a new secret value.
2. Update via `wrangler secret put` (zero-downtime — Workers pick up new value on next request).
3. For `DEVICE_JWT_SECRET`: existing device tokens signed with the old key will fail auth. Devices must re-authenticate.
4. For `ENC_KEY`: data encrypted with the old key cannot be decrypted. Plan a migration if rotating.
