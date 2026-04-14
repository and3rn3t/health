import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTokenRefresh } from '../useTokenRefresh';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function fakeJwt(expSec: number): string {
  const payload = { sub: 'user-1', exp: expSec };
  return `header.${btoa(JSON.stringify(payload))}.sig`;
}

function futureExp(secs: number): number {
  return Math.floor(Date.now() / 1000) + secs;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useTokenRefresh', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  describe('refreshToken', () => {
    it('calls getAccessTokenSilently with cacheMode off', async () => {
      const getSilently = vi.fn().mockResolvedValue('new-token');
      const { result } = renderHook(() =>
        useTokenRefresh({ getAccessTokenSilently: getSilently }),
      );

      let token: string | null = null;
      await act(async () => {
        token = await result.current.refreshToken();
      });

      expect(getSilently).toHaveBeenCalledWith({ cacheMode: 'off' });
      expect(token).toBe('new-token');
    });

    it('returns null when disabled', async () => {
      const getSilently = vi.fn();
      const { result } = renderHook(() =>
        useTokenRefresh({ getAccessTokenSilently: getSilently, enabled: false }),
      );

      let token: string | null = null;
      await act(async () => {
        token = await result.current.refreshToken();
      });

      expect(token).toBeNull();
      expect(getSilently).not.toHaveBeenCalled();
    });

    it('returns null when getAccessTokenSilently is not provided', async () => {
      const { result } = renderHook(() => useTokenRefresh());

      let token: string | null = null;
      await act(async () => {
        token = await result.current.refreshToken();
      });

      expect(token).toBeNull();
    });

    it('deduplicates concurrent refresh calls', async () => {
      let resolveToken: (v: string) => void;
      const getSilently = vi.fn().mockImplementation(
        () => new Promise<string>((resolve) => { resolveToken = resolve; }),
      );
      const { result } = renderHook(() =>
        useTokenRefresh({ getAccessTokenSilently: getSilently }),
      );

      let p1: Promise<string | null>;
      let p2: Promise<string | null>;
      await act(async () => {
        p1 = result.current.refreshToken();
        p2 = result.current.refreshToken();
        resolveToken!('deduped');
        const [t1, t2] = await Promise.all([p1!, p2!]);
        expect(t1).toBe('deduped');
        expect(t2).toBe('deduped');
      });

      // The hook's useEffect also calls getAccessTokenSilently (for scheduling),
      // so check that the explicit refresh (with cacheMode 'off') was only invoked once.
      const offCalls = getSilently.mock.calls.filter(
        (c) => c[0]?.cacheMode === 'off',
      );
      expect(offCalls).toHaveLength(1);
    });

    it('returns null and logs error when refresh fails', async () => {
      const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      const getSilently = vi.fn().mockRejectedValue(new Error('auth down'));
      const { result } = renderHook(() =>
        useTokenRefresh({ getAccessTokenSilently: getSilently }),
      );

      let token: string | null = null;
      await act(async () => {
        token = await result.current.refreshToken();
      });

      expect(token).toBeNull();
      expect(errorSpy).toHaveBeenCalled();
    });
  });

  describe('fetchWithRefresh', () => {
    it('returns the response directly on non-401 status', async () => {
      const { result } = renderHook(() =>
        useTokenRefresh({ getAccessTokenSilently: vi.fn(), enabled: true }),
      );

      const mockResponse = new Response('ok', { status: 200 });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

      let resp: Response | undefined;
      await act(async () => {
        resp = await result.current.fetchWithRefresh('http://api/test');
      });

      expect(resp!.status).toBe(200);
    });

    it('retries with new token on 401', async () => {
      const getSilently = vi.fn()
        .mockResolvedValueOnce('cached-token')
        .mockResolvedValue('fresh-token');

      const { result } = renderHook(() =>
        useTokenRefresh({ getAccessTokenSilently: getSilently }),
      );

      const fetch401 = new Response('Unauthorized', { status: 401 });
      const fetch200 = new Response('ok', { status: 200 });
      const fetchMock = vi.fn()
        .mockResolvedValueOnce(fetch401)
        .mockResolvedValueOnce(fetch200);
      vi.stubGlobal('fetch', fetchMock);

      let resp: Response | undefined;
      await act(async () => {
        resp = await result.current.fetchWithRefresh('http://api/test', {
          headers: { 'X-Custom': 'value' },
        });
      });

      expect(resp!.status).toBe(200);
      // Second call should have the refreshed token
      const retryHeaders = fetchMock.mock.calls[1]?.[1]?.headers;
      expect(retryHeaders?.Authorization).toBe('Bearer fresh-token');
    });

    it('returns 401 response when refresh fails', async () => {
      const getSilently = vi.fn()
        .mockResolvedValueOnce('cached')
        .mockRejectedValue(new Error('fail'));

      const { result } = renderHook(() =>
        useTokenRefresh({ getAccessTokenSilently: getSilently }),
      );
      vi.spyOn(console, 'error').mockImplementation(() => {});

      const fetch401 = new Response('Unauthorized', { status: 401 });
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(fetch401));

      let resp: Response | undefined;
      await act(async () => {
        resp = await result.current.fetchWithRefresh('http://api/test');
      });

      expect(resp!.status).toBe(401);
    });
  });

  describe('proactive scheduling', () => {
    it('schedules a refresh before token expiry', async () => {
      const expSec = futureExp(120); // expires in 120s
      const getSilently = vi.fn().mockResolvedValue(fakeJwt(expSec));

      renderHook(() =>
        useTokenRefresh({
          getAccessTokenSilently: getSilently,
          refreshBufferMs: 60_000, // refresh 60s before
        }),
      );

      // First call is the schedule call to read expiry
      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      expect(getSilently).toHaveBeenCalledTimes(1);

      // Advance to ~60s before expiry (i.e. about 60s from now)
      await act(async () => {
        await vi.advanceTimersByTimeAsync(61_000);
      });

      // Should have triggered a refresh
      expect(getSilently).toHaveBeenCalledTimes(2);
    });

    it('refreshes immediately when token is already near expiry', async () => {
      const expSec = futureExp(10); // expires in 10s, buffer is 60s → already past
      const getSilently = vi.fn().mockResolvedValue(fakeJwt(expSec));

      renderHook(() =>
        useTokenRefresh({
          getAccessTokenSilently: getSilently,
          refreshBufferMs: 60_000,
        }),
      );

      await act(async () => {
        await vi.advanceTimersByTimeAsync(0);
      });

      // Should call twice: once for schedule read, once for immediate refresh
      expect(getSilently).toHaveBeenCalledTimes(2);
    });
  });
});
