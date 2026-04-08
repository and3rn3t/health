import { Miniflare } from 'miniflare';
import fs from 'node:fs';
import net from 'node:net';

const WORKER_SCRIPT = 'dist-worker/index.js';

/** Default bindings shared across all integration tests. */
const DEFAULT_BINDINGS = {
  ENVIRONMENT: 'development',
  ALLOWED_ORIGINS: 'https://health.andernet.dev,http://localhost:5173',
  ENC_KEY: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
  API_ISS: 'test-issuer',
  API_AUD: 'test-audience',
  DEVICE_JWT_SECRET: 'test-secret-key-for-jwt-signing',
} as const;

/** Find an available port to avoid conflicts between parallel test files. */
async function findAvailablePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(0, () => {
      const addr = server.address();
      if (addr && typeof addr === 'object') {
        const { port } = addr;
        server.close(() => resolve(port));
      } else {
        server.close(() => reject(new Error('Failed to get port')));
      }
    });
    server.on('error', reject);
  });
}

/** Poll the /health endpoint until the worker responds (max 5 s). */
async function waitForReady(mf: Miniflare, baseUrl: string): Promise<void> {
  const deadline = Date.now() + 5_000;
  while (Date.now() < deadline) {
    try {
      const res = await mf.dispatchFetch(`${baseUrl}/health`);
      if (res.ok) return;
    } catch {
      // not ready yet
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('Miniflare worker did not become ready within 5 s');
}

interface CreateMiniflareOptions {
  /** Extra bindings merged on top of defaults. */
  bindings?: Record<string, string>;
}

export interface MiniflareInstance {
  mf: Miniflare;
  baseUrl: string;
  dispose: () => Promise<void>;
}

/**
 * Create a Miniflare instance with auto-assigned port and health polling.
 *
 * Usage in integration test:
 * ```ts
 * let ctx: Awaited<ReturnType<typeof createMiniflareWorker>>;
 * beforeAll(async () => { ctx = await createMiniflareWorker(); });
 * afterAll(async () => { await ctx.dispose(); });
 * ```
 */
export async function createMiniflareWorker(
  opts: CreateMiniflareOptions = {},
): Promise<MiniflareInstance> {
  if (!fs.existsSync(WORKER_SCRIPT)) {
    throw new Error(
      `${WORKER_SCRIPT} not found. Run "pnpm build:worker" first.`,
    );
  }

  const port = await findAvailablePort();
  const baseUrl = `http://localhost:${port}`;

  const mf = new Miniflare({
    scriptPath: WORKER_SCRIPT,
    modules: true,
    compatibilityDate: '2024-05-01',
    port,
    bindings: {
      ...DEFAULT_BINDINGS,
      BASE_URL: baseUrl,
      ...opts.bindings,
    },
    kvNamespaces: ['HEALTH_KV'],
    r2Buckets: ['HEALTH_STORAGE'],
    durableObjects: {
      RATE_LIMITER: 'RateLimiter',
      HEALTH_WEBSOCKET: 'HealthWebSocket',
    },
  });

  await waitForReady(mf, baseUrl);

  return {
    mf,
    baseUrl,
    dispose: () => mf.dispose(),
  };
}
