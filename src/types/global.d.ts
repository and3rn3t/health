// Global type declarations for VitalSense app

declare global {
  interface Window {
    __VITALSENSE_CONFIG__?: {
      environment?: string;
      version?: string;
      auth0?: {
        domain?: string;
        clientId?: string;
        redirectUri?: string;
        audience?: string;
        scope?: string;
      };
      api?: {
        baseUrl?: string;
        timeout?: number;
      };
      features?: {
        enableAuth?: boolean;
        enableWebSocket?: boolean;
        enableOfflineMode?: boolean;
        enableAnalytics?: boolean;
      };
    };
    __VITALSENSE_CONFIG_LOADED__?: boolean;
  }
}

export {};
