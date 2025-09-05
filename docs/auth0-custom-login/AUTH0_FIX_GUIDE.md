# Auth0 Custom Domain Fix and Validation

This project uses Auth0 for authentication and serves a custom login at `/login` on your Worker domain (e.g., <https://health.andernet.dev/login>). If login is failing or falling back to demo mode, follow these steps.

## Checklist

- Update Worker Auth0 variables:
  - `AUTH0_DOMAIN` (e.g., your-tenant.us.auth0.com)
  - `AUTH0_CLIENT_ID` (SPA client)
- Ensure BASE_URL matches the deployed domain (e.g., <https://health.andernet.dev>)
- In Auth0 Application Settings:
  - Allowed Callback URLs: `https://health.andernet.dev/callback`
  - Allowed Logout URLs: `https://health.andernet.dev/login`
  - Allowed Web Origins: `https://health.andernet.dev`
- If you enabled an Auth0 Custom Domain, make sure its issuer matches what your tokens use. For Workers, using the tenant domain is simplest.

## Validate configuration

- Open: `https://health.andernet.dev/api/auth0/health`
  - ok=true means the OpenID configuration was retrieved.
  - You should see `issuer`, `authorization_endpoint`, and `jwks_uri`.
- Open: `https://health.andernet.dev/login`
  - Clicking “Sign In with VitalSense” should redirect to Auth0 if domain and client ID are set.
  - If config is missing/invalid, the page will fall back to demo mode.

## Environment configuration

Set production variables in `wrangler.production.toml` under `[env.production.vars]`:

- `AUTH0_DOMAIN = "your-tenant.auth0.com"`
- `AUTH0_CLIENT_ID = "your-spa-client-id"`

Set secrets (if using API verification):

- `API_ISS = "https://your-tenant.auth0.com/"`
- `API_AUD = "https://vitalsense-health-api"` (or your API identifier)
- Alternatively, set `API_JWKS_URL = "https://your-tenant.auth0.com/.well-known/jwks.json"`

The Worker will automatically derive `API_ISS` and `API_JWKS_URL` from `AUTH0_DOMAIN` if those aren’t set.

## Common custom domain pitfalls

- Using an Auth0 “Custom Domain” as issuer requires that tokens also use that issuer. If tokens are issued by the tenant domain (e.g., `https://your-tenant.us.auth0.com/`) but the app expects the custom domain issuer, claim checks will fail. Align `API_ISS` with the issuer your tokens actually use.
- Ensure DNS and TLS for the custom domain are fully provisioned in Auth0 before switching issuer in production.

## Tools

- Node helper: `scripts/node/auth/auth0-setup.js` can update wrangler and .env with your Auth0 settings.
- PowerShell helper: `scripts/quick-deploy-auth0.ps1 -TestMode` validates the custom login page contents.

## Support

If issues persist, capture the JSON from `/api/auth0/health` and the Worker response headers from `/login` (CSP) and share in an issue.
