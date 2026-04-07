# Security Policy — VitalSense

## Reporting Security Issues

If you discover a security vulnerability in VitalSense, please report it responsibly.

**Do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Instead, please send an email to **opensource-security[@]github.com** with the following details:

- The type of issue (e.g., injection, broken access control, cryptographic failure)
- Full paths of affected source files
- Steps to reproduce
- Potential impact and any proof-of-concept

We aim to acknowledge reports within 48 hours and provide a fix timeline within 5 business days.

## Scope

This policy covers:

- The VitalSense web application (`src/`)
- Cloudflare Worker API routes (`src/worker/`)
- iOS Swift application (`ios/`)
- Build and deployment infrastructure

## Security Practices

### Authentication & Authorization

- **Auth0** with JWKS-verified JWTs for web users.
- **HS256 device tokens** for iOS devices (secret stored in Wrangler secrets, never in source).
- All `/api/*` routes are auth-gated; health check endpoints require authenticated context.

### Data Protection

- **Health data is sensitive** — no raw metrics or PII in logs.
- All data in transit uses HTTPS/WSS (TLS 1.2+).
- HealthKit data stays on-device unless the user explicitly syncs via WebSocket.
- Cloudflare KV and R2 encrypt data at rest.

### Input Validation

- All API inputs validated with **zod** schemas at the boundary.
- WebSocket messages type-checked against defined message schemas.
- iOS-side validation before sending data to the server.

### Rate Limiting

- POST endpoints protected by Durable Object-based rate limiter (token bucket algorithm).
- In-memory fallback if the DO is unavailable.

### Dependencies

- `pnpm audit` runs in CI to catch vulnerable packages.
- `eslint-plugin-security` warnings are reviewed.
- Dependabot / Renovate keep dependencies current.

### Secrets Management

- Secrets stored via `wrangler secret put` — never hardcoded.
- See `docs/security/SECRET_MANAGEMENT.md` for the rotation procedure.
- Environment variables in `.env.development.local` (git-ignored) for local dev.

## Supported Versions

| Version | Supported |
| ------- | --------- |
| Latest `main` | Yes |
| Older commits | Best effort |

## Policy

See [GitHub's Safe Harbor Policy](https://docs.github.com/en/site-policy/security-policies/github-bug-bounty-program-legal-safe-harbor#1-safe-harbor-terms)
