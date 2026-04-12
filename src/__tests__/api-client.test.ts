import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  ApiError,
  createApiClient,
  getApiClient,
  initApiClient,
} from '../lib/api-client';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

describe('api-client', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // createApiClient
  // -----------------------------------------------------------------------

  describe('createApiClient', () => {
    it('attaches Authorization header when getAccessToken returns a token', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true, token: 'tok' }), { status: 200 }),
      );

      const client = createApiClient({
        getAccessToken: () => Promise.resolve('jwt-123'),
      });

      await client.deviceAuth({ userId: 'u1', clientType: 'web_dashboard' });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Authorization']).toBe(
        'Bearer jwt-123',
      );
    });

    it('omits Authorization header when getAccessToken returns undefined', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true, token: 'tok' }), { status: 200 }),
      );

      const client = createApiClient({
        getAccessToken: () => Promise.resolve(undefined),
      });

      await client.deviceAuth({ userId: 'u1', clientType: 'web_dashboard' });

      const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
      expect((init.headers as Record<string, string>)['Authorization']).toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // deviceAuth
  // -----------------------------------------------------------------------

  describe('deviceAuth', () => {
    it('posts to /api/device/auth with correct body', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({ ok: true, token: 'abc', expiresIn: 600 }),
          { status: 200 },
        ),
      );

      const client = createApiClient();
      const result = await client.deviceAuth({
        userId: 'user-1',
        clientType: 'ios_app',
        ttlSec: 600,
      });

      expect(fetchSpy).toHaveBeenCalledWith('/api/device/auth', expect.objectContaining({
        method: 'POST',
      }));
      expect(result).toEqual({ ok: true, token: 'abc', expiresIn: 600 });
    });

    it('throws ApiError on non-OK response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Unauthorized', { status: 401, statusText: 'Unauthorized' }),
      );

      const client = createApiClient();
      await expect(
        client.deviceAuth({ userId: 'u', clientType: 'web_dashboard' }),
      ).rejects.toThrow(ApiError);
    });
  });

  // -----------------------------------------------------------------------
  // 2FA methods
  // -----------------------------------------------------------------------

  describe('2FA', () => {
    it('get2FAStatus sends GET with no-store cache', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ enabled: true }), { status: 200 }),
      );

      const client = createApiClient();
      const result = await client.get2FAStatus();

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/user/2fa/status',
        expect.objectContaining({
          headers: expect.objectContaining({ 'cache-control': 'no-store' }),
        }),
      );
      expect(result.enabled).toBe(true);
    });

    it('enable2FA sends POST to /api/user/2fa/enable', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true, enabled: true }), { status: 200 }),
      );

      const client = createApiClient();
      const result = await client.enable2FA();

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/user/2fa/enable',
        expect.objectContaining({ method: 'POST' }),
      );
      expect(result.enabled).toBe(true);
    });

    it('disable2FA sends POST to /api/user/2fa/disable', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ ok: true, enabled: false }), { status: 200 }),
      );

      const client = createApiClient();
      const result = await client.disable2FA();
      expect(result.enabled).toBe(false);
    });
  });

  // -----------------------------------------------------------------------
  // exportUserData
  // -----------------------------------------------------------------------

  describe('exportUserData', () => {
    it('returns raw Response', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('file-data', { status: 200 }),
      );

      const client = createApiClient();
      const res = await client.exportUserData();
      expect(res).toBeInstanceOf(Response);
    });

    it('throws ApiError when export fails', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('Not Found', { status: 404, statusText: 'Not Found' }),
      );

      const client = createApiClient();
      await expect(client.exportUserData()).rejects.toThrow(ApiError);
    });
  });

  // -----------------------------------------------------------------------
  // fire-and-forget methods
  // -----------------------------------------------------------------------

  describe('sendWsTelemetry', () => {
    it('fires POST to /api/ws-telemetry with keepalive', async () => {
      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('', { status: 200 }),
      );

      const client = createApiClient();
      await client.sendWsTelemetry({ event: 'connect', readyState: 1 });

      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/ws-telemetry',
        expect.objectContaining({ keepalive: true }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // Singleton management
  // -----------------------------------------------------------------------

  describe('singleton', () => {
    it('getApiClient returns a client even without init', () => {
      const client = getApiClient();
      expect(client).toBeDefined();
      expect(typeof client.deviceAuth).toBe('function');
    });

    it('initApiClient replaces the singleton', () => {
      const tokenFn = () => Promise.resolve('tok');
      const client = initApiClient({ getAccessToken: tokenFn });
      expect(client).toBe(getApiClient());
    });
  });
});
