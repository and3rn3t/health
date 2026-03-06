import { Hono } from 'hono';
import {
  FALL_RISK_ANALYTICS_VERSION,
  fallRiskConfig,
} from '@/lib/fallRiskConfig';
import { GAIT_ANALYTICS_VERSION, gaitConfig } from '@/lib/gaitConfig';
import type { Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

// Health check
route.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'unknown',
  });
});

// Gait analytics configuration version (read-only)
route.get('/api/gait-config-version', (c) => {
  return c.json({
    version: GAIT_ANALYTICS_VERSION,
    config: gaitConfig,
  });
});

// Fall risk analytics configuration version (read-only)
route.get('/api/fall-risk-config-version', (c) => {
  return c.json({
    version: FALL_RISK_ANALYTICS_VERSION,
    config: fallRiskConfig,
  });
});

// Combined analytics versions for single round-trip parity checks
route.get('/api/analytics-config-versions', (c) => {
  return c.json({
    gait: { version: GAIT_ANALYTICS_VERSION, config: gaitConfig },
    fallRisk: { version: FALL_RISK_ANALYTICS_VERSION, config: fallRiskConfig },
  });
});

// Runtime config for SPA: exposes safe public variables
route.get('/app-config.js', (c) => {
  const domain = c.env.AUTH0_DOMAIN || '';
  const clientId = c.env.AUTH0_CLIENT_ID || '';
  const baseUrl = c.env.BASE_URL || new URL(c.req.url).origin;
  const redirectUri = `${baseUrl}/callback`;
  const kvMode =
    (c.env.ENVIRONMENT || 'unknown') === 'production' ? 'local' : 'network';
  const js = `// Runtime app config (loaded before app bundle)
window.__VITALSENSE_CONFIG__ = ${JSON.stringify({
    environment: c.env.ENVIRONMENT || 'unknown',
    version: '1.0.0',
    auth0: {
      domain,
      clientId,
      redirectUri,
      audience: 'https://vitalsense-health-api',
      scope: 'openid profile email read:health_data write:health_data',
    },
    api: {
      baseUrl: baseUrl,
      timeout: 10000,
    },
    wsBaseUrl:
      c.env.WEBSOCKET_URL ||
      baseUrl.replace('https://', 'wss://').replace('http://', 'ws://') + '/ws',
    features: {
      enableAuth: (c.env.ENVIRONMENT || 'development') === 'production',
      enableWebSocket: true,
      enableOfflineMode: true,
      enableAnalytics: (c.env.ENVIRONMENT || 'development') === 'production',
    },
  })};

// KV mode hint: 'local' => client-only storage; 'network' => use server endpoint
window.__VITALSENSE_KV_MODE = ${JSON.stringify(kvMode)};

// Compatibility for @github/spark/hooks (expects a global var, not just window prop)
var BASE_KV_SERVICE_URL = ${JSON.stringify(kvMode === 'network' ? '/api' : '')};
// also expose on window for code that reads from window
window.BASE_KV_SERVICE_URL = BASE_KV_SERVICE_URL;
`;
  const dev = (c.env.ENVIRONMENT || 'development') !== 'production';
  const headers = new Headers({
    'content-type': 'application/javascript; charset=utf-8',
  });
  if (dev) {
    headers.set('Cache-Control', 'no-store, must-revalidate');
  }
  return new Response(js, { headers });
});

export { route as configRoutes };
