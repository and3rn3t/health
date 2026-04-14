import { describe, expect, it, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { TestProviders } from '@/test/render';
import {
  apiKeys,
  staleTimes,
  use2FAStatus,
  useWsUrl,
  useDeviceAuth,
  useEnable2FA,
  useDisable2FA,
  useExportUserData,
} from '../useApi';

// Mock the api-client
vi.mock('@/lib/api-client', () => {
  const mockClient = {
    get2FAStatus: vi.fn(),
    getWsUrl: vi.fn(),
    deviceAuth: vi.fn(),
    enable2FA: vi.fn(),
    disable2FA: vi.fn(),
    exportUserData: vi.fn(),
  };
  return {
    getApiClient: () => mockClient,
    ApiError: class ApiError extends Error {
      constructor(message: string, public status: number, public statusText: string) {
        super(message);
      }
    },
  };
});

// ---------------------------------------------------------------------------
// Query keys & stale times
// ---------------------------------------------------------------------------

describe('apiKeys', () => {
  it('has expected key structures', () => {
    expect(apiKeys.twoFactor).toEqual(['user', '2fa']);
    expect(apiKeys.wsUrl).toEqual(['ws', 'url']);
    expect(apiKeys.healthData).toEqual(['health', 'data']);
    expect(apiKeys.gaitConfig).toEqual(['config', 'gait']);
    expect(apiKeys.fallRiskConfig).toEqual(['config', 'fallRisk']);
    expect(apiKeys.settings).toEqual(['user', 'settings']);
  });
});

describe('staleTimes', () => {
  it('realtime < dashboard < config', () => {
    expect(staleTimes.realtime).toBeLessThan(staleTimes.dashboard);
    expect(staleTimes.dashboard).toBeLessThan(staleTimes.config);
  });

  it('settings is Infinity', () => {
    expect(staleTimes.settings).toBe(Infinity);
  });
});

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

describe('use2FAStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls get2FAStatus and returns data', async () => {
    const { getApiClient } = await import('@/lib/api-client');
    const client = getApiClient();
    (client.get2FAStatus as ReturnType<typeof vi.fn>).mockResolvedValue({
      enabled: true,
      method: 'totp',
    });

    const { result } = renderHook(() => use2FAStatus(), {
      wrapper: TestProviders,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ enabled: true, method: 'totp' });
  });
});

describe('useWsUrl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls getWsUrl and returns data', async () => {
    const { getApiClient } = await import('@/lib/api-client');
    const client = getApiClient();
    (client.getWsUrl as ReturnType<typeof vi.fn>).mockResolvedValue({
      url: 'wss://api.vitalsense.dev/ws',
    });

    const { result } = renderHook(() => useWsUrl(), {
      wrapper: TestProviders,
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ url: 'wss://api.vitalsense.dev/ws' });
  });
});

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

describe('useDeviceAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls deviceAuth with body', async () => {
    const { getApiClient } = await import('@/lib/api-client');
    const client = getApiClient();
    (client.deviceAuth as ReturnType<typeof vi.fn>).mockResolvedValue({
      token: 'jwt-123',
      expiresIn: 600,
    });

    const { result } = renderHook(() => useDeviceAuth(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      result.current.mutate({
        userId: 'u1',
        clientType: 'web_dashboard',
        ttlSec: 600,
      });
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual({ token: 'jwt-123', expiresIn: 600 });
  });
});

describe('useEnable2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls enable2FA', async () => {
    const { getApiClient } = await import('@/lib/api-client');
    const client = getApiClient();
    (client.enable2FA as ReturnType<typeof vi.fn>).mockResolvedValue({
      enabled: true,
    });

    const { result } = renderHook(() => useEnable2FA(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useDisable2FA', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls disable2FA', async () => {
    const { getApiClient } = await import('@/lib/api-client');
    const client = getApiClient();
    (client.disable2FA as ReturnType<typeof vi.fn>).mockResolvedValue({
      enabled: false,
    });

    const { result } = renderHook(() => useDisable2FA(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});

describe('useExportUserData', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calls exportUserData and returns response', async () => {
    const { getApiClient } = await import('@/lib/api-client');
    const client = getApiClient();
    const mockResp = new Response('csv-data');
    (client.exportUserData as ReturnType<typeof vi.fn>).mockResolvedValue(mockResp);

    const { result } = renderHook(() => useExportUserData(), {
      wrapper: TestProviders,
    });

    await waitFor(() => {
      result.current.mutate();
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
