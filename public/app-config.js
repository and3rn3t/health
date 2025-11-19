// VitalSense App Configuration
// This file provides runtime configuration for the VitalSense health monitoring app
// NOTE: This is a fallback. The worker endpoint /app-config.js should be used in production.

(function() {
  // Detect environment based on hostname
  const isProduction = typeof window !== 'undefined' && 
    window.location.hostname === 'health.andernet.dev';
  
  const environment = isProduction ? 'production' : 'development';
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  
  window.__VITALSENSE_CONFIG__ = {
    environment: environment,
    version: '1.0.0',
    auth0: {
      domain: isProduction 
        ? 'dev-qjdpc81dzr7xrnlu.us.auth0.com'  // Production Auth0 domain
        : 'vitalsense-dev.auth0.com',          // Development Auth0 domain
      clientId: isProduction
        ? 'YyCHkHZ11713YG7QsB518lHrCFE3bW1s'   // Production client ID
        : 'dev-client-id',                      // Development client ID
      redirectUri: origin + '/callback',
      audience: 'https://vitalsense-health-api',
      scope: 'openid profile email read:health_data write:health_data manage:emergency_contacts',
    },
    api: {
      baseUrl: origin,
      timeout: 10000,
    },
    // WebSocket base URL - use ws.health.andernet.dev for production
    wsBaseUrl: isProduction
      ? 'wss://ws.health.andernet.dev/ws'
      : (typeof window !== 'undefined'
          ? (window.location.protocol === 'https:' ? 'wss://' : 'ws://') +
            window.location.host +
            '/ws'
          : ''),
    features: {
      enableAuth: isProduction, // Enable auth in production
      enableWebSocket: true,
      enableOfflineMode: true,
      enableAnalytics: isProduction, // Enable analytics in production
    },
  };
})();

// Mark configuration as loaded
window.__VITALSENSE_CONFIG_LOADED__ = true;

if (typeof console !== 'undefined') {
  console.log(
    '✅ VitalSense configuration loaded',
    window.__VITALSENSE_CONFIG__
  );
}
