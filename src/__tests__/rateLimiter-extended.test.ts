import { describe, expect, it, vi } from 'vitest';
import RateLimiterDO from '../rateLimiter';

// ---------------------------------------------------------------------------
// Minimal DO storage mocks
// ---------------------------------------------------------------------------

type DOStorage = {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
};

class MemoryDOStorage implements DOStorage {
  private map = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | undefined> {
    return this.map.get(key) as T | undefined;
  }
  async put<T>(key: string, value: T): Promise<void> {
    this.map.set(key, value);
  }
}

/** Storage that always throws on get — simulates durable storage failure. */
class FailingDOStorage implements DOStorage {
  async get<T>(_key: string): Promise<T | undefined> {
    throw new Error('storage unavailable');
  }
  async put<T>(_key: string, _value: T): Promise<void> {
    // put may also fail but we keep it silent to test the fallback path
  }
}

type RateLimiterCtor = new (state: { storage: DOStorage }) => {
  fetch(request: Request): Promise<Response>;
};
const RateLimiter = RateLimiterDO as unknown as RateLimiterCtor;

function mkReq(url: string) {
  return new Request(url);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('RateLimiter DO — extended', () => {
  it('probe does not consume tokens', async () => {
    const rl = new RateLimiter({ storage: new MemoryDOStorage() });
    // Probe with limit=1
    const probeRes = await rl.fetch(
      mkReq('https://do.local/consume?key=p1&limit=1&intervalMs=60000&probe=1')
    );
    expect(probeRes.status).toBe(200);

    // Real request should still succeed (token not consumed by probe)
    const r1 = await rl.fetch(
      mkReq('https://do.local/consume?key=p1&limit=1&intervalMs=60000')
    );
    expect(r1.status).toBe(200);

    // Now the token IS consumed — next real request rejects
    const r2 = await rl.fetch(
      mkReq('https://do.local/consume?key=p1&limit=1&intervalMs=60000')
    );
    expect(r2.status).toBe(429);
  });

  it('recovers gracefully when storage.get fails', async () => {
    const rl = new RateLimiter({ storage: new FailingDOStorage() });
    // Should start with fresh bucket (limit tokens) even when storage fails
    const res = await rl.fetch(
      mkReq('https://do.local/consume?key=f1&limit=2&intervalMs=60000')
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; remaining: number };
    expect(body.ok).toBe(true);
    expect(body.remaining).toBe(1);
  });

  it('refills tokens after elapsed interval', async () => {
    const storage = new MemoryDOStorage();
    const rl = new RateLimiter({ storage });

    const now = Date.now();
    vi.spyOn(Date, 'now').mockReturnValue(now);

    // Exhaust the single token
    const r1 = await rl.fetch(
      mkReq('https://do.local/consume?key=r1&limit=1&intervalMs=1000')
    );
    expect(r1.status).toBe(200);

    const r2 = await rl.fetch(
      mkReq('https://do.local/consume?key=r1&limit=1&intervalMs=1000')
    );
    expect(r2.status).toBe(429);

    // Advance past the interval
    vi.spyOn(Date, 'now').mockReturnValue(now + 1_001);
    const r3 = await rl.fetch(
      mkReq('https://do.local/consume?key=r1&limit=1&intervalMs=1000')
    );
    expect(r3.status).toBe(200);

    vi.restoreAllMocks();
  });

  it('uses defaults when query params are missing', async () => {
    const rl = new RateLimiter({ storage: new MemoryDOStorage() });
    const res = await rl.fetch(mkReq('https://do.local/consume'));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; remaining: number };
    expect(body.ok).toBe(true);
    // Default limit is 60, so remaining should be 59
    expect(body.remaining).toBe(59);
  });
});
