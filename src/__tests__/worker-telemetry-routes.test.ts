import { describe, expect, it, vi, beforeEach } from 'vitest';
import app from '@/worker';
import { buildWorkerEnv } from '@/test/factories';

function makeEnv(overrides: Record<string, unknown> = {}) {
  return buildWorkerEnv(overrides);
}

describe('telemetry routes', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  // ----- POST /api/_perf_ingest -----

  describe('POST /api/_perf_ingest', () => {
    it('accepts valid performance metrics', async () => {
      const req = new Request('https://x.test/api/_perf_ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ metrics: { lcp: 2500, ttfb: 300 } }),
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { ok: boolean };
      expect(json.ok).toBe(true);
    });

    it('rejects payload with no valid metrics', async () => {
      const req = new Request('https://x.test/api/_perf_ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ metrics: { invalid: 'not_a_number' } }),
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('no_metrics');
    });

    it('rejects non-object payload', async () => {
      const req = new Request('https://x.test/api/_perf_ingest', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '"string"',
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
    });
  });

  // ----- POST /api/client-error -----

  describe('POST /api/client-error', () => {
    it('accepts valid client error report', async () => {
      const req = new Request('https://x.test/api/client-error', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: 'Uncaught TypeError: null is not an object',
          source: 'window.onerror',
          route: '/dashboard',
        }),
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { ok: boolean; correlationId: string };
      expect(json.ok).toBe(true);
      expect(json.correlationId).toBeTruthy();
    });

    it('rejects empty message', async () => {
      const req = new Request('https://x.test/api/client-error', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ message: '' }),
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('validation_error');
    });
  });

  // ----- POST /api/ws-telemetry -----

  describe('POST /api/ws-telemetry', () => {
    it('accepts valid WebSocket telemetry event', async () => {
      const req = new Request('https://x.test/api/ws-telemetry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          event: 'connect_success',
          rttMs: 45,
          attempt: 0,
        }),
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { ok: boolean; correlationId: string };
      expect(json.ok).toBe(true);
      expect(json.correlationId).toBeTruthy();
    });

    it('rejects invalid event type', async () => {
      const req = new Request('https://x.test/api/ws-telemetry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ event: 'not_a_valid_event' }),
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
      const json = (await res.json()) as { error: string };
      expect(json.error).toBe('validation_error');
    });

    it('rejects malformed JSON', async () => {
      const req = new Request('https://x.test/api/ws-telemetry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{bad-json',
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
    });
  });

  // ----- GET /api/ws-url -----

  describe('GET /api/ws-url', () => {
    it('returns WebSocket URL', async () => {
      const req = new Request('https://x.test/api/ws-url');
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { url: string; fallback: string };
      expect(json.url).toMatch(/^wss?:\/\//);
      expect(json.fallback).toBeTruthy();
    });
  });

  // ----- GET /api/ws-live-enabled -----

  describe('GET /api/ws-live-enabled', () => {
    it('returns enabled status', async () => {
      const req = new Request('https://x.test/api/ws-live-enabled');
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { enabled: boolean };
      expect(json.enabled).toBe(true);
    });
  });

  // ----- GET /api/ws-user-id -----

  describe('GET /api/ws-user-id', () => {
    it('returns a placeholder user id', async () => {
      const req = new Request('https://x.test/api/ws-user-id');
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { userId: string };
      expect(json.userId).toBeTruthy();
    });

    it('returns demo user id for demo referer', async () => {
      const req = new Request('https://x.test/api/ws-user-id', {
        headers: { Referer: 'https://x.test/demo' },
      });
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { userId: string };
      expect(json.userId).toBe('demo-user-vitalsense');
    });
  });

  // ----- POST /api/client-analytics/version-mismatch -----

  describe('POST /api/client-analytics/version-mismatch', () => {
    it('accepts valid mismatch report', async () => {
      const req = new Request(
        'https://x.test/api/client-analytics/version-mismatch',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({
            gaitLocal: '1.0.0',
            gaitRemote: '1.0.1',
            sample: 1,
            seq: 0,
          }),
        }
      );
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { ok: boolean };
      expect(json.ok).toBe(true);
    });

    it('rejects invalid payload', async () => {
      const req = new Request(
        'https://x.test/api/client-analytics/version-mismatch',
        {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ bad: true }),
        }
      );
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(400);
    });
  });

  // ----- GET /api/_debug/version-mismatch-events -----

  describe('GET /api/_debug/version-mismatch-events', () => {
    it('returns events in non-production', async () => {
      const req = new Request(
        'https://x.test/api/_debug/version-mismatch-events'
      );
      const res = await app.fetch(req, makeEnv());
      expect(res.status).toBe(200);
      const json = (await res.json()) as { ok: boolean; events: unknown[] };
      expect(json.ok).toBe(true);
      expect(Array.isArray(json.events)).toBe(true);
    });

    it('blocks unauthenticated access in production', async () => {
      const req = new Request(
        'https://x.test/api/_debug/version-mismatch-events'
      );
      const res = await app.fetch(req, makeEnv({ ENVIRONMENT: 'production' }));
      expect(res.status).toBe(401);
    });
  });
});
