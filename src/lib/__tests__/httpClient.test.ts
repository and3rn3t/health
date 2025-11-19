import { describe, test, expect, vi, beforeEach } from 'vitest';
import { HttpClient } from '../httpClient';

// Mock fetch globally
global.fetch = vi.fn();

describe('HttpClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset window object
    delete (window as any).__VITALSENSE_CONFIG__;
  });

  describe('constructor', () => {
    test('should use provided baseUrl', () => {
      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      expect(client).toBeInstanceOf(HttpClient);
    });

    test('should use window config baseUrl when available', () => {
      (window as any).__VITALSENSE_CONFIG__ = {
        api: { baseUrl: 'https://config.example.com' },
      };
      const client = new HttpClient();
      expect(client).toBeInstanceOf(HttpClient);
    });

    test('should use window.location.origin as fallback', () => {
      const client = new HttpClient();
      expect(client).toBeInstanceOf(HttpClient);
    });

    test('should use custom timeout', () => {
      const client = new HttpClient({ defaultTimeoutMs: 5000 });
      expect(client).toBeInstanceOf(HttpClient);
    });

    test('should use auth token getter', () => {
      const getToken = vi.fn(() => 'token123');
      const client = new HttpClient({ getAuthToken: getToken });
      expect(client).toBeInstanceOf(HttpClient);
    });
  });

  describe('get', () => {
    test('should make GET request', async () => {
      const mockResponse = { data: 'test' };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      const result = await client.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'GET',
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should include auth token in headers', async () => {
      const getToken = vi.fn(() => 'bearer-token');
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      const client = new HttpClient({
        baseUrl: 'https://api.example.com',
        getAuthToken: getToken,
      });
      await client.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          headers: expect.objectContaining({
            authorization: 'Bearer bearer-token',
          }),
        })
      );
    });

    test('should handle absolute URLs', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      await client.get('https://other.com/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://other.com/test',
        expect.anything()
      );
    });

    test('should handle relative paths', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      await client.get('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.anything()
      );
    });

    test('should handle non-absolute paths', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      await client.get('test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.anything()
      );
    });
  });

  describe('post', () => {
    test('should make POST request with body', async () => {
      const mockResponse = { success: true };
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => mockResponse,
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      const payload = { name: 'test' };
      const result = await client.post('/test', payload);

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify(payload),
          headers: expect.objectContaining({
            'content-type': 'application/json',
          }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    test('should handle undefined body', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      await client.post('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'POST',
          body: undefined,
        })
      );
    });
  });

  describe('put', () => {
    test('should make PUT request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      await client.put('/test', { data: 'test' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PUT',
        })
      );
    });
  });

  describe('patch', () => {
    test('should make PATCH request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      await client.patch('/test', { data: 'test' });

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'PATCH',
        })
      );
    });
  });

  describe('delete', () => {
    test('should make DELETE request', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({}),
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      await client.delete('/test');

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/test',
        expect.objectContaining({
          method: 'DELETE',
        })
      );
    });
  });

  describe('error handling', () => {
    test('should throw error on non-ok response', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: false,
        status: 404,
        headers: new Headers({ 'content-type': 'application/json' }),
        json: async () => ({ error: 'Not found' }),
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });

      await expect(client.get('/test')).rejects.toThrow();
    });

    test('should handle timeout', async () => {
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({}),
              } as Response);
            }, 100);
          })
      );

      const client = new HttpClient({
        baseUrl: 'https://api.example.com',
        defaultTimeoutMs: 50,
      });

      await expect(client.get('/test')).rejects.toThrow('request_timeout');
    });

    test('should handle custom timeout', async () => {
      vi.mocked(fetch).mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(() => {
              resolve({
                ok: true,
                headers: new Headers({ 'content-type': 'application/json' }),
                json: async () => ({}),
              } as Response);
            }, 100);
          })
      );

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });

      await expect(
        client.get('/test', { timeoutMs: 50 })
      ).rejects.toThrow('request_timeout');
    });

    test('should handle text response when content-type is not JSON', async () => {
      vi.mocked(fetch).mockResolvedValue({
        ok: true,
        headers: new Headers({ 'content-type': 'text/plain' }),
        text: async () => 'plain text response',
      } as Response);

      const client = new HttpClient({ baseUrl: 'https://api.example.com' });
      const result = await client.get('/test');

      expect(result).toBe('plain text response');
    });
  });
});

