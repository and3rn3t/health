# Infrastructure Hardening (Cloudflare)

This doc captures defense-in-depth steps to complement the in-app security.

## Cloudflare WAF and Rate Limiting

- Enable WAF managed rules for the Worker route (e.g., example.com/\*) in your zone.
- Add a custom rule to challenge or block suspicious traffic to /api/\*.
- Add a rate limiting rule for /api/\* (e.g., 100 requests per minute per IP) to back up the Durable Object limiter.
- Exclude your CI IPs or authenticated S2S origins as needed.

## Bot Management (optional)

- If licensed, enable Bot Management scoring; set an action (managed challenge) for high-risk scores on /api/\*.

## TLS and HSTS

- Force HTTPS; set HSTS with includeSubDomains and preload. Ensure the zone HSTS matches app headers.

## R2 Object Lock for Audits (immutability)

- Create an R2 bucket with Object Lock enabled (compliance mode if required).
- Write audit events to a prefix (e.g., audit/events/...) with a retention period set on the bucket or per object.
- Keep application-level encryption for audit payloads; avoid storing PHI.

## KV and Secrets

- Use Wrangler secrets for ENC_KEY, API_JWKS_URL, API_ISS, API_AUD.
- Do not log secret values; rotate quarterly or per policy.

## Change Management

- Track infra changes in this repo or a companion repo. Link tickets and approvals.
