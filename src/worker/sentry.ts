/**
 * Lightweight Sentry error tracking for Cloudflare Workers.
 *
 * Zero dependencies — uses Sentry's Envelope API directly.
 * Non-blocking via `waitUntil()`. Graceful no-op if DSN is unset.
 */

interface SentryDsn {
  publicKey: string;
  host: string;
  projectId: string;
}

interface SentryFrame {
  filename: string;
  lineno: number;
  colno: number;
  function: string;
}

function parseDsn(dsn: string): SentryDsn | null {
  try {
    const url = new URL(dsn);
    const publicKey = url.username;
    const host = url.host;
    const projectId = url.pathname.slice(1);
    if (!publicKey || !host || !projectId) return null;
    return { publicKey, host, projectId };
  } catch {
    return null;
  }
}

function parseStackFrames(stack: string): SentryFrame[] {
  return stack
    .split('\n')
    .slice(1)
    .map((line) => {
      const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
      if (match) {
        return {
          function: match[1]!,
          filename: match[2]!,
          lineno: parseInt(match[3]!, 10),
          colno: parseInt(match[4]!, 10),
        };
      }
      const match2 = line.match(/at\s+(.+?):(\d+):(\d+)/);
      if (match2) {
        return {
          function: '<anonymous>',
          filename: match2[1]!,
          lineno: parseInt(match2[2]!, 10),
          colno: parseInt(match2[3]!, 10),
        };
      }
      return null;
    })
    .filter((f): f is SentryFrame => f !== null)
    .reverse(); // Sentry expects oldest-to-newest frame order
}

function sanitizeHeaders(headers: Headers): Record<string, string> {
  const safe: Record<string, string> = {};
  const allowList = [
    'content-type',
    'user-agent',
    'accept',
    'accept-language',
    'referer',
    'x-correlation-id',
  ];
  for (const key of allowList) {
    const value = headers.get(key);
    if (value) safe[key] = value;
  }
  return safe;
}

/**
 * Report an error to Sentry via the Envelope HTTP API.
 *
 * Returns a promise that resolves after the report is sent (or fails silently).
 * Use with `ctx.waitUntil()` to avoid blocking the response.
 */
export async function captureException(
  error: Error,
  opts: {
    dsn: string;
    environment: string;
    release?: string;
    request?: Request;
    tags?: Record<string, string>;
  }
): Promise<void> {
  const parsed = parseDsn(opts.dsn);
  if (!parsed) return;

  const eventId = crypto.randomUUID().replace(/-/g, '');
  const timestamp = Date.now() / 1000;

  const envelope = [
    JSON.stringify({
      event_id: eventId,
      dsn: opts.dsn,
      sdk: { name: 'vitalsense-worker', version: '1.0.0' },
    }),
    JSON.stringify({ type: 'event', content_type: 'application/json' }),
    JSON.stringify({
      event_id: eventId,
      timestamp,
      platform: 'javascript',
      environment: opts.environment,
      release: opts.release,
      exception: {
        values: [
          {
            type: error.name,
            value: error.message,
            stacktrace: error.stack
              ? { frames: parseStackFrames(error.stack) }
              : undefined,
          },
        ],
      },
      request: opts.request
        ? {
            url: opts.request.url,
            method: opts.request.method,
            headers: sanitizeHeaders(opts.request.headers),
          }
        : undefined,
      tags: {
        worker: 'health-app',
        runtime: 'cloudflare-workers',
        ...opts.tags,
      },
    }),
  ].join('\n');

  const url = `https://${parsed.host}/api/${parsed.projectId}/envelope/`;
  await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-sentry-envelope',
      'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=vitalsense-worker/1.0.0, sentry_key=${parsed.publicKey}`,
    },
    body: envelope,
  }).catch(() => {
    // Swallow — error tracking must never break the app
  });
}
