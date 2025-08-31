## Security baseline for PHI (HIPAA-aligned)

This repo handles health-related data. The following baseline safeguards help align with HIPAA Security Rule (45 CFR Part 164 Subpart C). Use this as a starting point and collaborate with compliance counsel/auditors for a full program (policies, procedures, BAAs, risk analysis, training).

### Administrative safeguards

- Risk management: maintain an up-to-date risk register, threat model, and Data Flow Diagram (see `docs/ARCHITECTURE.md`).
- Access control: least-privilege IAM for Cloudflare (Workers/KV/R2) and CI. No shared accounts.
- Workforce training: ensure anyone with access to PHI understands handling, incident reporting, and minimal logging.
- Contingency plan: backups, key escrow, disaster recovery procedures documented and tested.
- Business Associate Agreements (BAAs): sign BAAs with all vendors that may handle PHI.

### Physical safeguards

- This app runs in Cloudflare’s managed environment. Restrict access to management consoles with SSO + MFA.

### Technical safeguards

1) Authentication and authorization

- APIs require Bearer JWT in production (`Authorization: Bearer <token>`). Claims are checked for issuer, audience, `exp`, `nbf`.
- Local/dev can optionally allow anonymous for rapid iteration. Production refuses anonymous.
- WebSocket bridge validates Origin and optional API key. Prefer replacing with an authenticated edge channel for production.

2) Encryption

- In transit: HTTPS/WSS only (enforced via HSTS, CSP connect-src https: wss:).
- At rest: Cloudflare provides encryption at rest; additionally, sensitive records written to KV/R2 should be application-encrypted using AES-GCM with a 256-bit key in `ENC_KEY` (Workers secret). Keys are not committed—use Wrangler secrets with rotation procedures.

3) Data minimization and retention

- Do not log PHI; structured logs include request IDs and coarse metadata only.
- Default Worker KV TTL for demo data is short; production retention must be explicitly set per record type and documented.
- Provide selective deletion/portability endpoints if required by policy.

4) Input validation and output sanitization

- All external inputs validated using zod at boundaries (HTTP, WebSocket). Fail closed with 400 responses.
- Outputs omit identifiers not needed by the client.

5) Secure headers and CSP

- Strict security headers (HSTS, X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy, COOP/COEP optional) and a CSP that restricts sources to self and required endpoints.

6) Monitoring and auditing

- Add structured, redacted logs with correlation IDs. Keep audit logs tamper-evident and restricted.
- Enable Cloudflare WAF and rate limiting for `/api/*`.

### Environment and secrets

- Configure secrets via Wrangler, not in code or `wrangler.toml`:
  - `ENC_KEY` (base64 32 bytes) – AES-GCM app-encryption key.
  - `API_AUD`, `API_ISS` – JWT audience and issuer.
  - Optionally `WS_API_KEY` for local WebSocket.
- Non-secret variables (safe in `wrangler.toml`): `ALLOWED_ORIGINS`, `ENVIRONMENT`.

### Incident response

- Maintain an incident runbook: detection, containment, eradication, recovery, and post-mortem.
- Breach notification timelines per HIPAA Breach Notification Rule.

### Next steps

- Replace the local Node WebSocket bridge with an authenticated Durable Object or Cloudflare Socket Worker.
- Add audit log storage with write-once properties (e.g., R2 + Object Lock or external provider with immutability).
- Implement per-user access controls and consent management.
- Add automated security testing (dependency scanning, SAST) and supply-chain protections (pin dependencies, provenance).
