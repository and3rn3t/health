// VitalSense App Configuration
// This file provides runtime configuration for the VitalSense health monitoring app

globalThis.__VITALSENSE_CONFIG__ = {
  environment: 'development',
  version: '1.0.0',
  auth0: {
    domain: 'vitalsense-dev.auth0.com',
    clientId: 'dev-client-id',
    redirectUri:
      (globalThis.window === undefined ? '' : globalThis.location.origin) +
      '/callback',
    audience: 'vitalsense-api',
    scope:
      'openid profile email offline_access read:health_data write:health_data',
  },
  api: {
    baseUrl: globalThis.window === undefined ? '' : globalThis.location.origin,
    timeout: 10000,
  },
  features: {
    enableAuth: false, // Disable auth for development to prevent blank screens
    enableWebSocket: true,
    enableOfflineMode: true,
    enableAnalytics: false,
  },
};

// Mark configuration as loaded
globalThis.__VITALSENSE_CONFIG_LOADED__ = true;

if (typeof console !== 'undefined') {
  console.log(
    '✅ VitalSense configuration loaded',
    globalThis.__VITALSENSE_CONFIG__
  );
}
