/**
 * Typed API client for VitalSense backend.
 *
 * Centralises all fetch calls, attaches auth headers when available,
 * and provides typed request/response shapes from the generated OpenAPI types.
 */
import type { components, operations } from './api-types.generated';

// ---------------------------------------------------------------------------
// Convenience aliases from generated types
// ---------------------------------------------------------------------------

export type DeviceAuthRequest =
  operations['postDeviceAuth']['requestBody']['content']['application/json'];

export type DeviceAuthResponse = NonNullable<
  operations['postDeviceAuth']['responses']['200']['content']
>['application/json'];

export type TwoFactorStatusResponse = NonNullable<
  operations['get2FAStatus']['responses']['200']['content']
>['application/json'];

export type TwoFactorToggleResponse = NonNullable<
  operations['enable2FA']['responses']['200']['content']
>['application/json'];

export type WsUrlResponse = NonNullable<
  operations['getWsUrl']['responses']['200']['content']
>['application/json'];

export type WsTelemetryPayload = components['schemas']['WebSocketTelemetry'];

export type ClientErrorPayload = components['schemas']['ClientError'];

export interface PushSubscribePayload {
  endpoint: string;
  keys: { p256dh: string; auth: string };
  [key: string]: unknown;
}

// ---------------------------------------------------------------------------
// Error class
// ---------------------------------------------------------------------------

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly statusText: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ---------------------------------------------------------------------------
// Token accessor type (supplied by the auth layer at runtime)
// ---------------------------------------------------------------------------

type GetAccessToken = () => Promise<string | undefined>;

// ---------------------------------------------------------------------------
// Client factory
// ---------------------------------------------------------------------------

export interface ApiClientOptions {
  /** Auth0 (or device) JWT accessor – called per-request */
  getAccessToken?: GetAccessToken;
}

export function createApiClient(opts: ApiClientOptions = {}) {
  // -- Internal helpers ----------------------------------------------------

  async function authHeaders(): Promise<Record<string, string>> {
    const token = await opts.getAccessToken?.();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async function request<T>(
    path: string,
    init: RequestInit = {},
  ): Promise<T> {
    const auth = await authHeaders();
    const headers: Record<string, string> = {
      ...auth,
      ...(init.headers as Record<string, string> | undefined),
    };

    const res = await fetch(path, { ...init, headers });

    if (!res.ok) {
      throw new ApiError(
        `${init.method ?? 'GET'} ${path} failed`,
        res.status,
        res.statusText,
      );
    }

    // Return the raw Response for blob endpoints
    if (headers['Accept'] === 'application/octet-stream') {
      return res as unknown as T;
    }

    return (await res.json()) as T;
  }

  async function post<TBody, TRes>(
    path: string,
    body: TBody,
    extra: RequestInit = {},
  ): Promise<TRes> {
    return request<TRes>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...extra.headers as Record<string, string> | undefined },
      body: JSON.stringify(body),
      ...extra,
    });
  }

  // -- Public API ----------------------------------------------------------

  return {
    /** POST /api/device/auth — issue a short-lived device JWT (no auth required) */
    deviceAuth(body: DeviceAuthRequest): Promise<DeviceAuthResponse> {
      return post<DeviceAuthRequest, DeviceAuthResponse>(
        '/api/device/auth',
        body,
      );
    },

    /** GET /api/user/2fa/status */
    get2FAStatus(): Promise<TwoFactorStatusResponse> {
      return request<TwoFactorStatusResponse>('/api/user/2fa/status', {
        headers: { 'cache-control': 'no-store' },
      });
    },

    /** POST /api/user/2fa/enable */
    enable2FA(): Promise<TwoFactorToggleResponse> {
      return request<TwoFactorToggleResponse>('/api/user/2fa/enable', {
        method: 'POST',
        headers: { 'cache-control': 'no-store' },
      });
    },

    /** POST /api/user/2fa/disable */
    disable2FA(): Promise<TwoFactorToggleResponse> {
      return request<TwoFactorToggleResponse>('/api/user/2fa/disable', {
        method: 'POST',
        headers: { 'cache-control': 'no-store' },
      });
    },

    /** GET /api/user/export — returns raw Response for blob download */
    async exportUserData(): Promise<Response> {
      const auth = await authHeaders();
      const res = await fetch('/api/user/export', {
        headers: { 'cache-control': 'no-store', ...auth },
      });
      if (!res.ok) {
        throw new ApiError('Export failed', res.status, res.statusText);
      }
      return res;
    },

    /** GET /api/ws-url (public) */
    getWsUrl(): Promise<WsUrlResponse> {
      return request<WsUrlResponse>('/api/ws-url', {
        headers: { 'cache-control': 'no-store' },
      });
    },

    /** POST /api/ws-telemetry */
    sendWsTelemetry(payload: WsTelemetryPayload): Promise<void> {
      // Fire-and-forget with keepalive — no auth required on this route
      fetch('/api/ws-telemetry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
      return Promise.resolve();
    },

    /** POST /api/client-error */
    reportClientError(payload: ClientErrorPayload): Promise<void> {
      fetch('/api/client-error', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
      return Promise.resolve();
    },

    /** POST /api/push/subscribe */
    pushSubscribe(subscription: PushSubscribePayload): Promise<void> {
      return post<PushSubscribePayload, void>('/api/push/subscribe', subscription).catch(() => {});
    },
  };
}

// ---------------------------------------------------------------------------
// Singleton (initialised once auth context is ready, see ApiProvider)
// ---------------------------------------------------------------------------

let _client: ReturnType<typeof createApiClient> | null = null;

export function getApiClient(): ReturnType<typeof createApiClient> {
  if (!_client) {
    // Fallback: create without auth (public routes still work)
    _client = createApiClient();
  }
  return _client;
}

export function initApiClient(opts: ApiClientOptions): ReturnType<typeof createApiClient> {
  _client = createApiClient(opts);
  return _client;
}
