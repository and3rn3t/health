import type { KVNamespaceLite } from '@/lib/retention';

/**
 * Cloudflare Workers runtime provides accept(); standard lib typing may not expose it.
 * Structural alias to avoid @cloudflare/workers-types dependency.
 */
export interface CloudflareWebSocket extends WebSocket {
  accept(): void;
}

export type Env = {
  ENVIRONMENT?: string;
  ALLOWED_ORIGINS?: string; // comma-separated
  LOG_SAMPLE_RATE?: string; // e.g. "0.1" for 10% sampling in production
  ENC_KEY?: string; // base64 32 bytes
  API_ISS?: string;
  API_AUD?: string;
  API_JWKS_URL?: string;
  DEVICE_JWT_SECRET?: string; // HS256 secret for device-issued tokens (dev/edge)
  HEALTH_KV?: {
    put: (
      key: string,
      value: string,
      options?: { expirationTtl?: number }
    ) => Promise<void>;
    get?: (key: string) => Promise<string | null>;
    list?: (opts: {
      prefix?: string;
      limit?: number;
      cursor?: string;
    }) => Promise<{
      keys: Array<{ name: string }>;
      list_complete?: boolean;
      cursor?: string;
    }>;
    delete?: (key: string) => Promise<void>;
  };
  HEALTH_STORAGE?: {
    put: (
      key: string,
      data: string | ReadableStream | ArrayBuffer,
      opts?: { httpMetadata?: { contentType?: string } }
    ) => Promise<unknown>;
    get: (
      key: string,
      opts?: { range?: { offset: number; length?: number } }
    ) => Promise<{ body?: ReadableStream | null } | null>;
    list: (opts?: { prefix?: string; limit?: number }) => Promise<{
      objects: Array<{ key: string; uploaded?: string | Date }>;
    }>;
  };
  ASSETS?: {
    fetch: (req: Request) => Promise<Response>;
  };
  RATE_LIMITER?: {
    idFromName: (name: string) => unknown;
    get: (id: unknown) => {
      fetch: (req: Request | string) => Promise<Response>;
    };
  };
  AUTH0_DOMAIN?: string;
  AUTH0_CLIENT_ID?: string;
  BASE_URL?: string;
  WEBSOCKET_URL?: string;
  HEALTH_WEBSOCKET?: DurableObjectNamespace; // Durable Object namespace
  ANALYTICS?: AnalyticsEngineDataset;
  HEALTH_ANALYTICS?: AnalyticsEngineDataset;
  SECURITY_ANALYTICS?: AnalyticsEngineDataset;
  PERFORMANCE_ANALYTICS?: AnalyticsEngineDataset;
};

export type BroadKV = KVNamespaceLite & {
  get?: (key: string) => Promise<string | null>;
  list?: (opts: {
    prefix?: string;
    limit?: number;
  }) => Promise<{ keys: { name: string }[] }>;
};
