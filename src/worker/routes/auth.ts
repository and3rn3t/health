import { Hono } from 'hono';
import { z } from 'zod';
import {
  decryptJSON,
  encryptJSON,
  getAesKey,
  signJwtHS256,
  writeAudit,
} from '@/lib/security';
import { getVerifiedAuthSub, log } from '../helpers';
import type { Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Two-Factor Authentication (2FA) helpers
// ---------------------------------------------------------------------------

async function readTwoFactor(
  c: { env: Env },
  sub: string
) {
  const kv = c.env.HEALTH_KV;
  if (!kv || typeof kv.get !== 'function')
    return { enabled: false, updatedAt: null as string | null };
  const key = `user:2fa:${encodeURIComponent(sub)}`;
  const raw = await kv.get(key);
  if (!raw) return { enabled: false, updatedAt: null as string | null };
  try {
    const encKeyB64 = c.env.ENC_KEY;
    let obj: { enabled?: boolean; updatedAt?: string } | null = null;
    if (encKeyB64) {
      const k = await getAesKey(encKeyB64);
      obj = await decryptJSON(k, raw);
    } else {
      obj = JSON.parse(raw);
    }
    let updatedAt: string | null = null;
    if (obj && typeof obj.updatedAt === 'string') updatedAt = obj.updatedAt;
    return { enabled: Boolean(obj?.enabled), updatedAt };
  } catch {
    return { enabled: false, updatedAt: null as string | null };
  }
}

async function writeTwoFactor(
  c: { env: Env },
  sub: string,
  enabled: boolean
) {
  const kv = c.env.HEALTH_KV;
  if (!kv || typeof kv.put !== 'function') return false;
  const key = `user:2fa:${encodeURIComponent(sub)}`;
  const value = { version: 1, enabled, updatedAt: new Date().toISOString() };
  const encKeyB64 = c.env.ENC_KEY;
  let toStore: string;
  if (encKeyB64) {
    const k = await getAesKey(encKeyB64);
    toStore = await encryptJSON(k, value);
  } else {
    toStore = JSON.stringify(value);
  }
  await kv.put(key, toStore);
  await writeAudit(c.env, {
    type: enabled ? '2fa_enabled' : '2fa_disabled',
    resource: 'kv:user:2fa',
    actor: sub,
  }).catch(() => void 0);
  return true;
}

// 2FA: status
route.get('/api/user/2fa/status', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const s = await readTwoFactor(c, sub);
  return c.json({ enabled: s.enabled, updatedAt: s.updatedAt });
});

// 2FA: enable
route.post('/api/user/2fa/enable', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const ok = await writeTwoFactor(c, sub, true);
  return c.json({ ok, enabled: true });
});

// 2FA: disable
route.post('/api/user/2fa/disable', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  const ok = await writeTwoFactor(c, sub, false);
  return c.json({ ok, enabled: false });
});

// ---------------------------------------------------------------------------
// User data export
// ---------------------------------------------------------------------------

async function buildUserExport(c: { env: Env }, sub: string) {
  const twoFactor = await readTwoFactor(c, sub);
  return {
    exportVersion: 1,
    exportedAt: new Date().toISOString(),
    userId: sub,
    twoFactor,
    notes:
      'This export includes server-held data only. App settings and health analytics are stored client-side and can be exported from the app UI.',
  } as const;
}

route.get('/api/user/export', async (c) => {
  const sub = await getVerifiedAuthSub(c);
  if (!sub) return c.json({ error: 'unauthorized' }, 401);
  try {
    const bundle = await buildUserExport(c, sub);
    const headers = new Headers({ 'content-type': 'application/json' });
    const fileName = `vitalsense-export-${new Date()
      .toISOString()
      .split(':')
      .join('-')}.json`;
    headers.set('Content-Disposition', `attachment; filename="${fileName}"`);
    return new Response(JSON.stringify(bundle, null, 2), {
      status: 200,
      headers,
    });
  } catch (e) {
    log.error('export_failed', { error: (e as Error).message });
    return c.json(
      { error: 'export_failed' },
      500
    );
  }
});

// ---------------------------------------------------------------------------
// Auth callback
// ---------------------------------------------------------------------------

route.get('/callback', async (c) => {
  try {
    const current = new URL(c.req.url);
    const hasCode = current.searchParams.has('code');
    const hasState = current.searchParams.has('state');
    if (!hasCode && !hasState) {
      const cookie = c.req.header('Cookie') || '';
      if (cookie.includes('auth0.is.authenticated=true')) {
        return c.redirect('/', 302);
      }
      return c.redirect('/', 302);
    }
    const url = new URL(c.req.url);
    const indexUrl = new URL('/index.html', url.origin);
    const req = new Request(indexUrl.toString(), { method: 'GET' });
    const res = await c.env.ASSETS?.fetch(req);
    if (!res || res.status === 404) {
      return c.text('Callback handler unavailable (index.html not found)', 500);
    }
    return res;
  } catch (_err) {
    try {
      log.error('callback_handler_error', {
        error: _err instanceof Error ? _err.message : String(_err),
      });
    } catch {
      /* noop */
    }
    return c.text('Callback handler error', 500);
  }
});

// ---------------------------------------------------------------------------
// Device JWT auth
// ---------------------------------------------------------------------------

route.post('/api/device/auth', async (c) => {
  const secret = c.env.DEVICE_JWT_SECRET;
  if (!secret) return c.json({ error: 'not_configured' }, 500);

  const bodySchema = z.object({
    userId: z.string().min(1),
    clientType: z.enum(['ios_app', 'web_dashboard']).default('ios_app'),
    ttlSec: z.coerce
      .number()
      .min(60)
      .max(60 * 60)
      .optional(),
  });
  let parsed: z.infer<typeof bodySchema>;
  try {
    const json = await c.req.json();
    const res = bodySchema.safeParse(json);
    if (!res.success) {
      return c.json(
        { error: 'validation_error', details: res.error.flatten() },
        400
      );
    }
    parsed = res.data;
  } catch (error) {
    log.error('device_token_parse_failed', {
      error: (error as Error).message,
    });
    return c.json({ error: 'invalid_json' }, 400);
  }

  // In production, the caller must be authenticated and can only mint tokens for themselves
  if (c.env.ENVIRONMENT === 'production') {
    const callerSub = await getVerifiedAuthSub(c);
    if (!callerSub || callerSub !== parsed.userId) {
      return c.json({ error: 'forbidden' }, 403);
    }
  }

  const now = Math.floor(Date.now() / 1000);
  const ttl = parsed.ttlSec ?? 10 * 60;
  const claims = {
    iss: c.env.API_ISS || 'health-app',
    aud: c.env.API_AUD || 'ws-device',
    sub: parsed.userId,
    iat: now,
    nbf: now,
    exp: now + ttl,
    scope: `device:${parsed.clientType}`,
  } as const;

  try {
    const token = await signJwtHS256(
      claims as unknown as Record<string, unknown>,
      secret
    );
    return c.json({ ok: true, token, expiresIn: ttl });
  } catch (e) {
    log.error('device_token_sign_failed', { error: (e as Error).message });
    return c.json({ error: 'server_error' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Login page (inline VitalSense branding)
// ---------------------------------------------------------------------------

route.get('/login', async (c) => {
  const auth0Domain = c.env.AUTH0_DOMAIN || '';
  const auth0ClientId = c.env.AUTH0_CLIENT_ID || '';
  const baseUrl =
    c.env.BASE_URL ||
    new URL(c.req.url).origin ||
    'https://health.andernet.dev';
  const redirectUri = `${baseUrl}/callback`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>VitalSense Health - Secure Sign In</title>
    <style>
        :root {
            --vs-primary: #2563eb;
            --vs-primary-foreground: #ffffff;
            --vs-secondary: #0891b2;
            --vs-background: #ffffff;
            --vs-foreground: #0f172a;
            --vs-card: #f8fafc;
            --vs-border: #e2e8f0;
            --vs-input: #ffffff;
            --vs-ring: #2563eb;
            --vs-radius: 0.5rem;
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--vs-primary) 0%, var(--vs-secondary) 100%);
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--vs-foreground);
        }

        .login-container {
            background: var(--vs-background);
            padding: 2rem;
            border-radius: var(--vs-radius);
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
            width: 100%;
            max-width: 400px;
            border: 1px solid var(--vs-border);
        }

        .logo { text-align: center; margin-bottom: 2rem; }
        .logo h1 { color: var(--vs-primary); font-size: 2rem; font-weight: 700; margin-bottom: 0.5rem; }
        .logo p { color: #64748b; font-size: 0.875rem; }

        .login-button {
            width: 100%;
            background: var(--vs-primary);
            color: var(--vs-primary-foreground);
            border: none;
            padding: 0.75rem 1rem;
            border-radius: calc(var(--vs-radius) - 2px);
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s ease;
            margin-bottom: 1rem;
        }

        .login-button:hover { background: #1d4ed8; }
        .login-button:focus { outline: 2px solid var(--vs-ring); outline-offset: 2px; }

        .divider {
            text-align: center;
            margin: 1.5rem 0;
            position: relative;
            color: #64748b;
            font-size: 0.875rem;
        }

        .divider::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 0;
            right: 0;
            height: 1px;
            background: var(--vs-border);
        }

        .divider span { background: var(--vs-background); padding: 0 1rem; }

        .features { text-align: center; font-size: 0.875rem; color: #64748b; line-height: 1.5; }

        .security-note {
            margin-top: 1rem;
            padding: 0.75rem;
            background: var(--vs-card);
            border-radius: calc(var(--vs-radius) - 2px);
            font-size: 0.75rem;
            color: #64748b;
            border: 1px solid var(--vs-border);
        }

        @media (max-width: 480px) { .login-container { margin: 1rem; padding: 1.5rem; } }
    </style>
</head>
<body>
    <div class="login-container">
        <div class="logo">
            <h1>VitalSense</h1>
            <p>Your Health Intelligence Platform</p>
        </div>

        <button class="login-button" onclick="loginWithAuth0()">Sign In with VitalSense</button>

        <div class="divider"><span>or</span></div>

        <button class="login-button" onclick="loginDemo()" style="background: var(--vs-secondary);">Try Demo Mode</button>

        <button class="login-button" onclick="window.open('/demo-static', '_blank')" style="background: #059669; margin-top: 0.5rem;">Quick Demo Access (New Tab)</button>

        <button class="login-button" onclick="alert('Redirecting to static demo...'); setTimeout(() => window.location.href='/demo-static', 1000);" style="background: #dc2626; margin-top: 0.5rem;">Debug Demo Redirect</button>

        <div class="divider"><span>Secure Authentication</span></div>

        <div class="features">
            <p>• Privacy-first health monitoring</p>
            <p>• AI-powered insights</p>
            <p>• Emergency fall detection</p>
        </div>

        <div class="security-note">
            🔒 Your health data is encrypted and secure. We use industry-standard authentication.
        </div>
    </div>

    <script src="https://cdn.auth0.com/js/auth0/9.23.2/auth0.min.js" integrity="sha384-..." crossorigin="anonymous"></script>
    <script>
        const _auth0Domain = ${JSON.stringify(auth0Domain)};
        const _auth0ClientId = ${JSON.stringify(auth0ClientId)};
        const _redirectUri = ${JSON.stringify(redirectUri)};

        function initializeAuth0() {
            if (typeof auth0 === 'undefined') {
                setTimeout(initializeAuth0, 100);
                return;
            }
            window.vitalsenseAuth = new auth0.WebAuth({
                domain: _auth0Domain,
                clientID: _auth0ClientId,
                redirectUri: _redirectUri,
                responseType: 'code',
                scope: 'openid profile email'
            });
        }

        initializeAuth0();

    function loginWithAuth0() {
      if (!_auth0Domain || !_auth0ClientId) { loginDemo(); return; }
      if (!window.vitalsenseAuth) { loginDemo(); return; }
      fetch('https://' + _auth0Domain + '/.well-known/openid-configuration')
        .then(response => {
          if (response.ok) { window.vitalsenseAuth.authorize(); }
          else { loginDemo(); }
        })
        .catch(() => { loginDemo(); });
    }

        function loginDemo() {
            const button = event.target;
            button.textContent = 'Launching Demo...';
            button.disabled = true;
            setTimeout(() => { window.location.href = '/demo-static'; }, 500);
        }

        function checkExistingAuth() {
            if (window.vitalsenseAuth) {
                window.vitalsenseAuth.parseHash((err, authResult) => {
                    if (authResult && authResult.accessToken) { window.location.href = '/'; }
                });
            }
        }

        setTimeout(checkExistingAuth, 1000);
    </script>
    <div style="text-align:center;margin-top:1rem;color:#94a3b8;font-size:10px;">Custom Login Page</div>
</body>
</html>`;
  return new Response(html, {
    headers: {
      'content-type': 'text/html; charset=utf-8',
      'cache-control': 'no-store, no-cache, must-revalidate, max-age=0',
      pragma: 'no-cache',
      'x-robots-tag': 'noindex',
      'x-page-id': 'vs-custom-login',
    },
  });
});

// ---------------------------------------------------------------------------
// Auth0 health diagnostics
// ---------------------------------------------------------------------------

route.get('/api/auth0/health', async (c) => {
  const domain = c.env.AUTH0_DOMAIN || '';
  const clientId = c.env.AUTH0_CLIENT_ID || '';
  const issuerUrl = domain ? `https://${domain}/` : null;
  const openIdCfgUrl = domain
    ? `https://${domain}/.well-known/openid-configuration`
    : null;
  const out: Record<string, unknown> = {
    ok: false,
    domain,
    clientIdSet: Boolean(clientId),
    issuer: null,
    jwks_uri: null,
    authorization_endpoint: null,
    error: null as string | null,
  };
  try {
    if (!openIdCfgUrl) throw new Error('AUTH0_DOMAIN not set');
    const res = await fetch(openIdCfgUrl);
    if (!res.ok) throw new Error(`openid-configuration ${res.status}`);
    const openIdSchema = z.object({
      issuer: z.string().optional(),
      jwks_uri: z.string().optional(),
      authorization_endpoint: z.string().optional(),
    });
    const parsed = openIdSchema.safeParse(await res.json());
    out.ok = true;
    out.issuer =
      (parsed.success ? parsed.data.issuer : undefined) || issuerUrl;
    out.jwks_uri =
      (parsed.success ? parsed.data.jwks_uri : undefined) || null;
    out.authorization_endpoint =
      (parsed.success ? parsed.data.authorization_endpoint : undefined) || null;
    return c.json(out, 200);
  } catch (e) {
    out.ok = false;
    out.error = (e as Error).message;
    return c.json(out, 200);
  }
});

// Public auth0 health (non-API, no auth middleware)
route.get('/auth0/health', async (c) => {
  const domain = c.env.AUTH0_DOMAIN || '';
  const clientId = c.env.AUTH0_CLIENT_ID || '';
  const issuerUrl = domain ? `https://${domain}/` : null;
  const openIdCfgUrl = domain
    ? `https://${domain}/.well-known/openid-configuration`
    : null;
  const out: Record<string, unknown> = {
    ok: false,
    domain,
    clientIdSet: Boolean(clientId),
    issuer: null,
    jwks_uri: null,
    authorization_endpoint: null,
    error: null as string | null,
  };
  try {
    if (!openIdCfgUrl) throw new Error('AUTH0_DOMAIN not set');
    const res = await fetch(openIdCfgUrl);
    if (!res.ok) throw new Error(`openid-configuration ${res.status}`);
    const openIdSchema = z.object({
      issuer: z.string().optional(),
      jwks_uri: z.string().optional(),
      authorization_endpoint: z.string().optional(),
    });
    const parsed = openIdSchema.safeParse(await res.json());
    out.ok = true;
    out.issuer =
      (parsed.success ? parsed.data.issuer : undefined) || issuerUrl;
    out.jwks_uri =
      (parsed.success ? parsed.data.jwks_uri : undefined) || null;
    out.authorization_endpoint =
      (parsed.success ? parsed.data.authorization_endpoint : undefined) || null;
    return c.json(out, 200);
  } catch (e) {
    out.ok = false;
    out.error = (e as Error).message;
    return c.json(out, 200);
  }
});

// Backward-compatible auth paths
route.get('/auth/login', async (c) => c.redirect('/login', 302));
route.get('/_force-login', async (c) => {
  const ts = Date.now();
  return c.redirect(`/login?ts=${ts}`, 302);
});

export { route as authRoutes };
