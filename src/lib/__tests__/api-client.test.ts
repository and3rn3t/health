import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createApiClient, ApiError, getApiClient, initApiClient } from '../api-client';

// ---------------------------------------------------------------------------
// Mock global fetch
// ---------------------------------------------------------------------------

const fetchMock = vi.fn();

beforeEach(() => {
  vi.stubGlobal('fetch', fetchMock);
  fetchMock.mockReset();
});
afterEach(() => {
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// ApiError
// ---------------------------------------------------------------------------

describe('ApiError', () => {
  it('stores status and statusText', () => {
    const err = new ApiError('boom', 404, 'Not Found');
    expect(err.message).toBe('boom');
    expect(err.status).toBe(404);
    expect(err.statusText).toBe('Not Found');
    expect(err.name).toBe('ApiError');
    expect(err).toBeInstanceOf(Error);
  });
});

// ---------------------------------------------------------------------------
// createApiClient
// ---------------------------------------------------------------------------

describe('createApiClient', () => {
  describe('auth headers', () => {
    it('attaches Bearer token when getAccessToken returns a value', async () => {
      const client = createApiClient({
        getAccessToken: async () => 'my-jwt',
      });
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      await client.getWsUrl();

      const calledHeaders = fetchMock.mock.calls[0]?.[1]?.headers;
      expect(calledHeaders?.Authorization).toBe('Bearer my-jwt');
    });

    it('omits Authorization when getAccessToken returns undefined', async () => {
      const client = createApiClient({
        getAccessToken: async () => undefined,
      });
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      await client.getWsUrl();

      const calledHeaders = fetchMock.mock.calls[0]?.[1]?.headers;
      expect(calledHeaders?.Authorization).toBeUndefined();
    });

    it('omits Authorization when getAccessToken is not provided', async () => {
      const client = createApiClient();
      fetchMock.mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));

      await client.getWsUrl();

      const calledHeaders = fetchMock.mock.calls[0]?.[1]?.headers;
      expect(calledHeaders?.Authorization).toBeUndefined();
    });
  });

  describe('request helper', () => {
    it('throws ApiError on non-ok response', async () => {
      const client = createApiClient();
      fetchMock.mockResolvedValue(
        new Response('bad', { status: 500, statusText: 'Internal Server Error' }),
      );

      await expect(client.getWsUrl()).rejects.toThrow(ApiError);
      await expect(client.getWsUrl()).rejects.toMatchObject({
        status: 500,
        statusText: 'Internal Server Error',
      });
    });
  });

  describe('deviceAuth', () => {
    it('sends POST with body and returns response', async () => {
      const client = createApiClient();
      const body = { userId: 'u1', clientType: 'web_dashboard' as const, ttlSec: 600 };
      const expected = { token: 'jwt-abc', expiresIn: 600 };
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify(expected), { status: 200 }),
      );

      const result = await client.deviceAuth(body);
      expect(result).toEqual(expected);

      const [url, init] = fetchMock.mock.calls[0]!;
      expect(url).toBe('/api/device/auth');
      expect(init.method).toBe('POST');
      expect(JSON.parse(init.body as string)).toEqual(body);
    });
  });

  describe('get2FAStatus', () => {
    it('sends GET to /api/user/2fa/status', async () => {
      const client = createApiClient();
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ enabled: false }), { status: 200 }),
      );

      const data = await client.get2FAStatus();
      expect(data).toEqual({ enabled: false });
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/user/2fa/status');
    });
  });

  describe('enable2FA / disable2FA', () => {
    it('sends POST to enable/disable endpoints', async () => {
      const client = createApiClient();
      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ enabled: true }), { status: 200 }),
      );

      await client.enable2FA();
      expect(fetchMock.mock.calls[0]![1]?.method).toBe('POST');

      fetchMock.mockResolvedValue(
        new Response(JSON.stringify({ enabled: false }), { status: 200 }),
      );
      await client.disable2FA();
      expect(fetchMock.mock.calls[1]![1]?.method).toBe('POST');
    });
  });

  describe('exportUserData', () => {
    it('returns raw Response', async () => {
      const client = createApiClient();
      fetchMock.mockResolvedValue(new Response('csv-blob', { status: 200 }));

      const resp = await client.exportUserData();
      expect(resp).toBeInstanceOf(Response);
      expect(await resp.text()).toBe('csv-blob');
    });

    it('throws ApiError on failure', async () => {
      const client = createApiClient();
      fetchMock.mockResolvedValue(
        new Response('fail', { status: 403, statusText: 'Forbidden' }),
      );

      await expect(client.exportUserData()).rejects.toThrow(ApiError);
    });
  });

  describe('sendWsTelemetry', () => {
    it('fires and forgets (fire-and-forget POST)', async () => {
      const client = createApiClient();
      fetchMock.mockResolvedValue(new Response('ok', { status: 200 }));

      await client.sendWsTelemetry({ event: 'connect' } as never);
      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/ws-telemetry');
    });
  });

  describe('reportClientError', () => {
    it('posts error payload', async () => {
      const client = createApiClient();
      fetchMock.mockResolvedValue(new Response('ok', { status: 200 }));

      await client.reportClientError({ message: 'oops', stack: 'trace' } as never);
      expect(fetchMock.mock.calls[0]![0]).toBe('/api/client-error');
    });
  });
});

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

describe('getApiClient / initApiClient', () => {
  it('getApiClient returns a client even without init', () => {
    const client = getApiClient();
    expect(client).toBeDefined();
    expect(typeof client.getWsUrl).toBe('function');
  });

  it('initApiClient configures the singleton with auth', () => {
    const client = initApiClient({
      getAccessToken: async () => 'token-123',
    });
    expect(client).toBeDefined();
    // Subsequent getApiClient returns the same instance
    expect(getApiClient()).toBe(client);
  });
});
