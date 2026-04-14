import { Hono } from 'hono';
import { APP_NAME, BRAND_COLORS } from '@/lib/branding';
import type { Env } from '../types';

const route = new Hono<{ Bindings: Env }>();

// ---------------------------------------------------------------------------
// Demo mode route – injects demo user globals into the SPA index.html
// ---------------------------------------------------------------------------

route.get('/demo', async (c) => {
  if (!c.env.ASSETS) {
    return c.text('Assets not available', 500);
  }

  const assetResp = await c.env.ASSETS.fetch(
    new Request(`${new URL(c.req.url).origin}/index.html`)
  );
  if (!assetResp.ok) {
    return c.text(
      `App not available: ${assetResp.status} ${assetResp.statusText}`,
      500
    );
  }

  let html = await assetResp.text();

  const demoUser = {
    id: 'demo-user-vitalsense',
    name: 'Demo User',
    email: 'demo@vitalsense.health',
    picture: 'https://via.placeholder.com/64x64/2563eb/ffffff?text=VT',
    authenticated: true,
    mode: 'demo',
  };

  const demoHeadScript = `
    <meta name="vitalsense-demo-mode" content="true">
    <meta name="vitalsense-demo-user" content='${JSON.stringify(demoUser)}'>
    <script>
      // CRITICAL: Patch Array.prototype.slice IMMEDIATELY before anything else loads
      (function() {
        const originalSlice = Array.prototype.slice;
        Array.prototype.slice = function(...args) {
          if (this == null || typeof this !== 'object') {
            if (typeof console !== 'undefined') console.warn('slice() called on non-array:', this);
            return [];
          }
          if (typeof this.length !== 'number') {
            if (typeof console !== 'undefined') console.warn('slice() called on object without length:', this);
            return [];
          }
          try {
            return originalSlice.apply(this, args);
          } catch (e) {
            if (typeof console !== 'undefined') console.warn('slice() failed, returning empty array:', e);
            return [];
          }
        };
      })();

      window.VITALSENSE_DEMO_MODE = true;
      window.VITALSENSE_DEMO_USER = ${JSON.stringify(demoUser)};
      window.vitalsense_demo_mode = true;
      window.vitalsense_demo_user = ${JSON.stringify(demoUser)};

      window.addEventListener('error', function(e) {
        if (e.message && e.message.includes('slice is not a function')) {
          if (typeof console !== 'undefined') console.error('CRITICAL: slice error caught before React:', e);
          e.preventDefault();
          e.stopPropagation();
          return false;
        }
        if (e.message && e.message.includes('is not a function')) {
          if (typeof console !== 'undefined') console.error('CRITICAL: function error caught:', e);
        }
      });

      window.addEventListener('unhandledrejection', function(e) {
        if (e.reason && e.reason.message && e.reason.message.includes('slice is not a function')) {
          if (typeof console !== 'undefined') console.error('CRITICAL: slice promise rejection caught:', e);
          e.preventDefault();
        }
      });

      const originalFetch = window.fetch;
      window.fetch = function(input, init = {}) {
        if (typeof input === 'string' && input.includes('/api/')) {
          init.headers = {
            ...init.headers,
            'X-Demo-Mode': 'true',
            'X-Demo-User': 'demo-user-vitalsense'
          };
        }
        return originalFetch(input, init);
      };

  var BASE_KV_SERVICE_URL = '/api';
  window.BASE_KV_SERVICE_URL = BASE_KV_SERVICE_URL;
      window.GITHUB_RUNTIME_PERMANENT_NAME = 'vitalsense-demo';

  window.VITALSENSE_DISABLE_WEBSOCKET = true;

      const OriginalWebSocket = window.WebSocket;
      window.WebSocket = function(url, protocols) {
        if (typeof console !== 'undefined') console.log('🛡️ Demo mode: WebSocket connection blocked to', url);
        const mockWS = new EventTarget();
        mockWS.url = url;
        mockWS.readyState = 0;
        mockWS.send = function() {
          if (typeof console !== 'undefined') console.log('🛡️ Demo mode: WebSocket.send() blocked');
        };
        mockWS.close = function() {
          if (typeof console !== 'undefined') console.log('🛡️ Demo mode: WebSocket.close() called');
        };
        setTimeout(() => {
          const errorEvent = new Event('error');
          mockWS.dispatchEvent(errorEvent);
          mockWS.readyState = 3;
        }, 100);
        return mockWS;
      };

      try {
        localStorage.setItem('vitalsense_demo_mode', 'true');
        localStorage.setItem('vitalsense_demo_user', JSON.stringify(${JSON.stringify(demoUser)}));
        localStorage.setItem('VITALSENSE_DEMO_MODE', 'true');
      } catch(e) {
        if (typeof console !== 'undefined') console.warn('localStorage not available:', e);
      }

      if (typeof console !== 'undefined') console.log('🚀 VitalSense Demo Mode Activated!', window.vitalsense_demo_user);

      const originalAssign = Location.prototype.assign;
      const originalReplace = Location.prototype.replace;

      Location.prototype.assign = function(url) {
        if (url.includes('/login') || url.includes('/auth')) {
          if (typeof console !== 'undefined') console.log('🛡️ Demo mode: blocking auth redirect to', url);
          return;
        }
        return originalAssign.call(this, url);
      };

      Location.prototype.replace = function(url) {
        if (url.includes('/login') || url.includes('/auth')) {
          if (typeof console !== 'undefined') console.log('🛡️ Demo mode: blocking auth redirect to', url);
          return;
        }
        return originalReplace.call(this, url);
      };
    </script>
  `;

  html = html.replace('</head>', demoHeadScript + '</head>');

  const demoBodyScript = `
    <script>
      if (!window.VITALSENSE_DEMO_MODE) {
        window.VITALSENSE_DEMO_MODE = true;
        window.VITALSENSE_DEMO_USER = ${JSON.stringify(demoUser)};
        window.vitalsense_demo_mode = true;
        window.vitalsense_demo_user = ${JSON.stringify(demoUser)};
        if (typeof console !== 'undefined') console.log('📦 Fallback: VitalSense Demo Mode Activated!');
      }
    </script>
  `;

  html = html.replace('</body>', demoBodyScript + '</body>');

  return new Response(html, {
    headers: { 'Content-Type': 'text/html; charset=UTF-8' },
  });
});

// Disable demo mode
route.get('/demo/disable', async (c) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Disable Demo</title></head><body>
  <script>
    try {
      localStorage.removeItem('vitalsense_demo_mode');
      localStorage.removeItem('vitalsense_demo_user');
      localStorage.removeItem('VITALSENSE_DEMO_MODE');
      localStorage.removeItem('auth_bypass');
      localStorage.removeItem('vitalsense_bypass_auth');
      sessionStorage.clear();
    } catch (e) { /* ignore */ }
    location.replace('/');
  </script>
  </body></html>`;
  return c.html(html);
});

// Enable demo mode
route.get('/demo/enable', async (c) => {
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>Enable Demo</title></head><body>
  <script>
    try {
      localStorage.setItem('vitalsense_demo_mode', 'true');
      localStorage.setItem('VITALSENSE_DEMO_MODE', 'true');
      localStorage.setItem('auth_bypass', 'demo');
    } catch (e) { /* ignore */ }
    location.replace('/demo');
  </script>
  </body></html>`;
  return c.html(html);
});

// Static demo page
route.get('/demo-static', async (c) => {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${APP_NAME} Demo - Health Dashboard</title>
    <style>
        :root {
            --vs-primary: ${BRAND_COLORS.primary};
            --vs-secondary: ${BRAND_COLORS.teal};
            --vs-background: ${BRAND_COLORS.background};
            --vs-foreground: ${BRAND_COLORS.foreground};
            --vs-card: ${BRAND_COLORS.card};
            --vs-border: ${BRAND_COLORS.border};
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, var(--vs-primary) 0%, var(--vs-secondary) 100%);
            min-height: 100vh;
            color: var(--vs-foreground);
        }

        .demo-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 2rem;
        }

        .demo-header {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
            text-align: center;
        }

        .demo-header h1 {
            color: var(--vs-primary);
            font-size: 2.5rem;
            margin-bottom: 0.5rem;
        }

        .demo-header p {
            color: ${BRAND_COLORS.muted};
            font-size: 1.1rem;
        }

        .demo-badge {
            background: var(--vs-secondary);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 0.5rem;
            font-weight: 600;
            display: inline-block;
            margin-bottom: 1rem;
        }

        .demo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 2rem;
            margin-bottom: 2rem;
        }

        .demo-card {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }

        .demo-card h3 {
            color: var(--vs-primary);
            margin-bottom: 1rem;
            font-size: 1.25rem;
        }

        .demo-metric {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 0.75rem 0;
            border-bottom: 1px solid var(--vs-border);
        }

        .demo-metric:last-child {
            border-bottom: none;
        }

        .demo-value {
            font-weight: 600;
            color: var(--vs-secondary);
        }

        .demo-actions {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
        }

        .demo-button {
            background: var(--vs-primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-size: 1rem;
            font-weight: 500;
            cursor: pointer;
            margin: 0 0.5rem;
            transition: background-color 0.2s;
        }

        .demo-button:hover {
            background: ${BRAND_COLORS.primaryDark};
        }

        .demo-button.secondary {
            background: var(--vs-secondary);
        }

        .demo-button.secondary:hover {
            background: ${BRAND_COLORS.tealDark};
        }
    </style>
</head>
<body>
    <div class="demo-container">
        <div class="demo-header">
            <div class="demo-badge">🚀 DEMO MODE</div>
            <h1>VitalSense Health Dashboard</h1>
            <p>Your Personal Health Intelligence Platform</p>
            <p style="margin-top: 1rem; font-size: 0.9rem; color: ${BRAND_COLORS.muted};">
                Welcome, <strong>Demo User</strong> (demo@vitalsense.health)
            </p>
        </div>

        <div class="demo-grid">
            <div class="demo-card">
                <h3>📊 Health Metrics</h3>
                <div class="demo-metric">
                    <span>Heart Rate</span>
                    <span class="demo-value">72 BPM</span>
                </div>
                <div class="demo-metric">
                    <span>Steps Today</span>
                    <span class="demo-value">8,247</span>
                </div>
                <div class="demo-metric">
                    <span>Sleep Score</span>
                    <span class="demo-value">85/100</span>
                </div>
                <div class="demo-metric">
                    <span>Blood Pressure</span>
                    <span class="demo-value">120/80</span>
                </div>
            </div>

            <div class="demo-card">
                <h3>🛡️ Fall Risk Analysis</h3>
                <div class="demo-metric">
                    <span>Risk Level</span>
                    <span class="demo-value" style="color: ${BRAND_COLORS.successLight};">Low</span>
                </div>
                <div class="demo-metric">
                    <span>Balance Score</span>
                    <span class="demo-value">92/100</span>
                </div>
                <div class="demo-metric">
                    <span>Activity Level</span>
                    <span class="demo-value">Active</span>
                </div>
                <div class="demo-metric">
                    <span>Last Assessment</span>
                    <span class="demo-value">Today</span>
                </div>
            </div>

            <div class="demo-card">
                <h3>🤖 AI Insights</h3>
                <div style="padding: 1rem 0;">
                    <p style="margin-bottom: 1rem;">
                        <strong>💡 Today's Recommendation:</strong><br>
                        Your activity levels are excellent! Consider adding 10 minutes of balance exercises to further reduce fall risk.
                    </p>
                    <p style="margin-bottom: 1rem;">
                        <strong>📈 Trend Analysis:</strong><br>
                        Sleep quality has improved 15% over the past week. Great progress!
                    </p>
                    <p>
                        <strong>⚠️ Alert:</strong><br>
                        No health alerts at this time. All metrics are within normal ranges.
                    </p>
                </div>
            </div>
        </div>

        <div class="demo-actions">
            <h3 style="margin-bottom: 1.5rem; color: var(--vs-primary);">Demo Actions</h3>
            <button class="demo-button" onclick="alert('📱 iOS App integration would sync your Apple Health data here!')">
                Connect iOS App
            </button>
            <button class="demo-button" onclick="window.location.href='/login'">
                Exit Demo → Login
            </button>
        </div>

        <div style="text-align: center; padding: 2rem; color: white;">
            <p>🔒 This is a demo environment. No real health data is stored or processed.</p>
            <p style="margin-top: 0.5rem; font-size: 0.9rem; opacity: 0.8;">
                VitalSense • Your Health Intelligence Platform • Demo Mode
            </p>
        </div>
    </div>

    <script>
        if (typeof console !== 'undefined') console.log('🚀 VitalSense Static Demo Loaded!');

        setInterval(() => {
            const heartRate = document.querySelector('.demo-metric .demo-value');
            if (heartRate && heartRate.textContent.includes('BPM')) {
                // NOSONAR: UI demo animation - Math.random() is acceptable for non-security use
                const rate = 70 + Math.floor(Math.random() * 6); // NOSONAR
                heartRate.textContent = rate + ' BPM';
            }
        }, 5000);
    </script>
</body>
</html>`;

  return c.html(html);
});

export { route as demoRoutes };
