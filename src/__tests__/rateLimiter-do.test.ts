import { describe, expect, it } from 'vitest';
import RateLimiterDO from '../rateLimiter';

type DOStorage = {
  get<T>(key: string): Promise<T | undefined>;
  put<T>(key: string, value: T): Promise<void>;
};

type DOState = { storage: DOStorage };

class MemoryDOStorage implements DOStorage {
  private map = new Map<string, unknown>();
  async get<T>(key: string): Promise<T | undefined> {
    return this.map.get(key) as T | undefined;
  }
  async put<T>(key: string, value: T): Promise<void> {
    this.map.set(key, value);
  }
}

class MemoryDOState implements DOState {
  storage: DOStorage;
  constructor() {
    this.storage = new MemoryDOStorage();
  }
}

function mkReq(url: string) {
  return new Request(url);
}

type RateLimiterCtor = new (state: DOState) => {
  fetch(request: Request): Promise<Response>;
};
const RateLimiter: RateLimiterCtor =
  RateLimiterDO as unknown as RateLimiterCtor;

describe('Durable Object RateLimiter', () => {
  it('consumes tokens and responds with remaining count', async () => {
    const state = new MemoryDOState();
    const rl = new RateLimiter(state);
    const res = await rl.fetch(
      mkReq('https://do.local/consume?key=k1&limit=2&intervalMs=60000')
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { ok: boolean; remaining: number };
    expect(body.ok).toBe(true);
    expect(body.remaining).toBe(1);
  });

  it('returns 429 when tokens exhausted', async () => {
    const state = new MemoryDOState();
    const rl = new RateLimiter(state);
    // Limit 1: first ok, second 429
    const r1 = await rl.fetch(
      mkReq('https://do.local/consume?key=k2&limit=1&intervalMs=60000')
    );
    expect(r1.status).toBe(200);
    const r2 = await rl.fetch(
      mkReq('https://do.local/consume?key=k2&limit=1&intervalMs=60000')
    );
    expect(r2.status).toBe(429);
  });
});
