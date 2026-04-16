import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useDiagnostics } from '../useDiagnostics';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  );
}

const healthPayload = {
  status: 'healthy',
  timestamp: '2025-01-01T00:00:00Z',
  environment: 'development',
};

const diagnosticsPayload = {
  ok: true,
  env: 'development',
  logSampleRate: '1',
  logSampleRates: { ws: '1', clientError: '0.5' },
  datasets: { HEALTH_ANALYTICS: true, SECURITY_ANALYTICS: false },
  hasKV: true,
  hasR2: true,
  hasRateLimiter: true,
  now: '2025-01-01T00:00:00Z',
  endpoints: ['/health', '/api/_diagnostics'],
};

const pingPayload = { pong: true, ts: '2025-01-01T00:00:00Z' };

const wsUrlPayload = { url: 'wss://ws.example.com/ws' };

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useDiagnostics', () => {
  test('initial state is idle', () => {
    const { result } = renderHook(() => useDiagnostics());

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.health).toBeNull();
    expect(result.current.worker).toBeNull();
    expect(result.current.ping).toBeNull();
    expect(result.current.wsProbe).toBeNull();
    expect(result.current.lastRefresh).toBeNull();
  });

  test('refresh fetches all diagnostic data', async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockImplementationOnce(() => jsonResponse(healthPayload)) // /health
      .mockImplementationOnce(() => jsonResponse(diagnosticsPayload)) // /api/_diagnostics
      .mockImplementationOnce(() => jsonResponse(pingPayload)) // /api/_diagnostics/ping
      .mockImplementationOnce(() => jsonResponse(wsUrlPayload)); // /api/ws-url

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDiagnostics());

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Health data populated
    expect(result.current.health).not.toBeNull();
    expect(result.current.health?.status).toBe('healthy');
    expect(result.current.health?.environment).toBe('development');
    expect(result.current.health?.latencyMs).toBeGreaterThanOrEqual(0);

    // Worker diagnostics populated
    expect(result.current.worker).not.toBeNull();
    expect(result.current.worker?.ok).toBe(true);
    expect(result.current.worker?.hasKV).toBe(true);
    expect(result.current.worker?.datasets.HEALTH_ANALYTICS).toBe(true);

    // Ping populated
    expect(result.current.ping).not.toBeNull();
    expect(result.current.ping?.ok).toBe(true);

    // WS probe populated
    expect(result.current.wsProbe).not.toBeNull();
    expect(result.current.wsProbe?.reachable).toBe(true);

    // Timestamp set
    expect(result.current.lastRefresh).toBeInstanceOf(Date);

    // All 4 endpoints called
    expect(fetchMock).toHaveBeenCalledTimes(4);
  });

  test('pingWorker returns latency result', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => jsonResponse(pingPayload))
    );

    const { result } = renderHook(() => useDiagnostics());

    let pingResult;
    await act(async () => {
      pingResult = await result.current.pingWorker();
    });

    expect(pingResult).toEqual(
      expect.objectContaining({ ok: true, latencyMs: expect.any(Number) })
    );
    expect(result.current.ping?.ok).toBe(true);
  });

  test('pingWorker handles fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.reject(new Error('network')))
    );

    const { result } = renderHook(() => useDiagnostics());

    let pingResult;
    await act(async () => {
      pingResult = await result.current.pingWorker();
    });

    expect(pingResult).toEqual(
      expect.objectContaining({ ok: false, latencyMs: expect.any(Number) })
    );
  });

  test('probeWebSocket returns reachability', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => jsonResponse(wsUrlPayload))
    );

    const { result } = renderHook(() => useDiagnostics());

    let probe;
    await act(async () => {
      probe = await result.current.probeWebSocket();
    });

    expect(probe).toEqual(
      expect.objectContaining({
        reachable: true,
        latencyMs: expect.any(Number),
        error: null,
      })
    );
  });

  test('probeWebSocket reports unreachable on error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.reject(new Error('ECONNREFUSED')))
    );

    const { result } = renderHook(() => useDiagnostics());

    let probe;
    await act(async () => {
      probe = await result.current.probeWebSocket();
    });

    expect(probe).toEqual(
      expect.objectContaining({
        reachable: false,
        error: 'ECONNREFUSED',
      })
    );
  });

  test('refresh sets error on health fetch failure', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockImplementation(() => Promise.reject(new Error('server down')))
    );

    const { result } = renderHook(() => useDiagnostics());

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBe('server down');
  });

  test('refresh continues when diagnostics endpoint 403s', async () => {
    const fetchMock = vi.fn();
    fetchMock
      .mockImplementationOnce(() => jsonResponse(healthPayload)) // /health
      .mockImplementationOnce(() =>
        Promise.resolve(new Response('Forbidden', { status: 403 }))
      ) // /api/_diagnostics → 403
      .mockImplementationOnce(() => jsonResponse(pingPayload)) // ping
      .mockImplementationOnce(() => jsonResponse(wsUrlPayload)); // ws-url

    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useDiagnostics());

    await act(async () => {
      await result.current.refresh();
    });

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Health still populates even though diagnostics failed
    expect(result.current.health?.status).toBe('healthy');
    // Worker is null because diagnostics failed
    expect(result.current.worker).toBeNull();
    // Ping still works
    expect(result.current.ping?.ok).toBe(true);
  });
});
