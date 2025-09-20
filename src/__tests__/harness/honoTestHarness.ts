import { app } from '../../worker';

// Lightweight in-process Hono test harness to avoid needing wrangler dev.
// Provides helper to invoke a route with optional env overrides and automatic JSON parsing.

export interface HarnessCallOptions extends RequestInit {
  env?: Record<string, unknown>;
  json?: unknown; // body payload (auto JSON stringified + content-type)
  asJson?: boolean; // if true attempt to parse JSON response
  baseUrl?: string; // override base (default http://localhost)
}

const DEFAULT_ENV: Record<string, unknown> = {
  ENVIRONMENT: 'development',
  ASSETS: { fetch: () => Promise.resolve(new Response(null, { status: 404 })) },
};

export interface InvokeResult<T = unknown> {
  res: Response;
  json?: T;
}

export async function invoke<T = unknown>(
  path: string,
  opts: HarnessCallOptions = {}
): Promise<InvokeResult<T>> {
  const base = opts.baseUrl || 'http://localhost';
  const headers = new Headers(opts.headers || {});
  let body: BodyInit | undefined = opts.body as BodyInit | undefined;
  if (opts.json !== undefined) {
    body = JSON.stringify(opts.json);
    if (!headers.has('content-type'))
      headers.set('content-type', 'application/json');
  }
  const req = new Request(`${base}${path}`, {
    ...opts,
    headers,
    body,
  });
  const env: Record<string, unknown> = { ...DEFAULT_ENV, ...(opts.env || {}) };
  const res = (await app.fetch(req, env)) as Response;
  let data: T | undefined = undefined;
  if (opts.asJson) {
    try {
      data = await res.clone().json();
    } catch {
      /* ignore */
    }
  }
  return { res, json: data };
}

export function makeEnv(overrides: Record<string, unknown> = {}) {
  return { ...DEFAULT_ENV, ...overrides };
}
