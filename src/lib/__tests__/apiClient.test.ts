import { describe, test, expect, vi, beforeEach } from 'vitest';
import { apiClient } from '../apiClient';
import { httpClient } from '../httpClient';
import { processedHealthDataSchema } from '@/schemas/health';

// Mock httpClient
vi.mock('../httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock SafeLogger
vi.mock('@/lib/errorHandling', () => ({
  SafeLogger: {
    warn: vi.fn(),
  },
}));

describe('apiClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getHealthData', () => {
    test('should fetch and return health data array', async () => {
      const mockData = [
        {
          id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
          type: 'heart_rate' as const,
          value: 72,
          timestamp: '2024-01-01T00:00:00.000Z', // ISO datetime format
          processedAt: '2024-01-01T00:00:00.000Z',
          validated: true,
          source: {
            userId: 'user-1',
            collectedAt: '2024-01-01T00:00:00.000Z',
          },
        },
      ];

      vi.mocked(httpClient.get).mockResolvedValue(mockData);

      const result = await apiClient.getHealthData();

      expect(httpClient.get).toHaveBeenCalledWith('/api/health-data?');
      expect(result).toEqual(mockData);
    });

    test('should handle query parameters', async () => {
      const mockData: unknown[] = [];
      vi.mocked(httpClient.get).mockResolvedValue(mockData);

      await apiClient.getHealthData({
        from: '2024-01-01',
        to: '2024-01-31',
        limit: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/api/health-data?from=2024-01-01&to=2024-01-31&limit=10'
      );
    });

    test('should filter out undefined and empty string params', async () => {
      vi.mocked(httpClient.get).mockResolvedValue([]);

      await apiClient.getHealthData({
        from: '2024-01-01',
        to: undefined,
        metric: undefined,
        limit: 10,
      });

      expect(httpClient.get).toHaveBeenCalledWith(
        '/api/health-data?from=2024-01-01&limit=10'
      );
    });

    test('should handle wrapped data response', async () => {
      const mockData = {
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000', // Valid UUID
            type: 'heart_rate' as const,
            value: 72,
            timestamp: '2024-01-01T00:00:00.000Z', // ISO datetime format
            processedAt: '2024-01-01T00:00:00.000Z',
            validated: true,
            source: {
              userId: 'user-1',
              collectedAt: '2024-01-01T00:00:00.000Z',
            },
          },
        ],
      };

      vi.mocked(httpClient.get).mockResolvedValue(mockData);

      const result = await apiClient.getHealthData();

      expect(result).toEqual(mockData.data);
    });

    test('should return empty array when response is not an array', async () => {
      vi.mocked(httpClient.get).mockResolvedValue({});

      const result = await apiClient.getHealthData();

      expect(result).toEqual([]);
    });

    test('should handle schema validation errors gracefully', async () => {
      const invalidData = [{ invalid: 'data' }];
      vi.mocked(httpClient.get).mockResolvedValue(invalidData);

      const result = await apiClient.getHealthData();

      expect(result).toEqual([]);
    });
  });

  describe('createHealthData', () => {
    test('should post health data', async () => {
      const payload = {
        id: '1',
        type: 'heart_rate' as const,
        value: 72,
        timestamp: '2024-01-01T00:00:00Z',
        processedAt: '2024-01-01T00:00:00Z',
        validated: true,
        source: { userId: 'user-1', collectedAt: '2024-01-01T00:00:00Z' },
      };

      vi.mocked(httpClient.post).mockResolvedValue({ success: true });

      await apiClient.createHealthData(payload);

      expect(httpClient.post).toHaveBeenCalledWith('/api/health-data', payload);
    });
  });

  describe('getWsUrl', () => {
    test('should return WebSocket URL from response', async () => {
      vi.mocked(httpClient.get).mockResolvedValue({
        url: 'wss://example.com/ws',
      });

      const result = await apiClient.getWsUrl();

      expect(httpClient.get).toHaveBeenCalledWith('/api/ws-url', {
        headers: { 'cache-control': 'no-store' },
      });
      expect(result).toBe('wss://example.com/ws');
    });

    test('should return fallback URL when url is missing', async () => {
      vi.mocked(httpClient.get).mockResolvedValue({
        fallback: 'wss://fallback.com/ws',
      });

      const result = await apiClient.getWsUrl();

      expect(result).toBe('wss://fallback.com/ws');
    });

    test('should return empty string when both url and fallback are missing', async () => {
      vi.mocked(httpClient.get).mockResolvedValue({});

      const result = await apiClient.getWsUrl();

      expect(result).toBe('');
    });
  });
});
