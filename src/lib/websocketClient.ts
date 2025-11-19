/*
 * Resilient WebSocket client with telemetry reporting to the Worker.
 * - Auto-reconnect with exponential backoff
 * - Soft heartbeat (app-level ping/pong)
 * - Minimal subscribe API by message.type
 * - Optional zod schema enforcement for message envelopes
 */
import { messageEnvelopeSchema } from '@/schemas/health';

export type WsEventName =
  | 'connect_start'
  | 'connect_success'
  | 'connect_error'
  | 'close'
  | 'retry'
  | 'ping_timeout'
  | 'pong_received'
  | 'message_error';

export interface WsTelemetry {
  event: WsEventName;
  url?: string;
  attempt?: number;
  code?: number;
  reason?: string;
  backoffMs?: number;
  sinceMs?: number;
  rttMs?: number;
  readyState?: number;
}

export interface WsClientOptions {
  url?: string; // if omitted, fetched from /api/ws-url
  maxBackoffMs?: number; // cap backoff
  baseBackoffMs?: number; // initial backoff
  heartbeatMs?: number; // send app-level ping every interval
  pingPayload?: unknown; // app ping message
  pongMatcher?: (data: unknown) => boolean; // identifies pong response
  // Optional callbacks for UI wiring
  onOpen?: () => void;
  onClose?: (ev: CloseEvent) => void;
  onRetry?: (attempt: number, backoffMs: number) => void;
  onError?: () => void;
  onPong?: (rttMs: number) => void;
}

export type MessageHandler = (data: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any

export class WebSocketClient {
  private url: string | null = null;
  private ws: WebSocket | null = null;
  private readonly opts: Required<WsClientOptions>;
  private attempt = 0;
  private openedAt = 0;
  private heartbeatTimer: number | null = null;
  private lastPingAt = 0;
  private readonly listeners = new Map<string, Set<MessageHandler>>();
  private closedByUser = false;
  private maxRetries = 5; // Limit retries to prevent infinite loops
  private consecutiveFailures = 0;

  private readonly enforceSchema: boolean;

  constructor(options?: WsClientOptions & { enforceSchema?: boolean }) {
    this.opts = {
      url: options?.url ?? (null as unknown as string),
      maxBackoffMs: options?.maxBackoffMs ?? 30_000,
      baseBackoffMs: options?.baseBackoffMs ?? 1_000,
      heartbeatMs: options?.heartbeatMs ?? 15_000,
      pingPayload: options?.pingPayload ?? { type: 'ping' },
      pongMatcher:
        options?.pongMatcher ??
        ((d: unknown) => {
          if (
            d &&
            typeof d === 'object' &&
            'type' in (d as Record<string, unknown>)
          ) {
            return (d as Record<string, unknown>).type === 'pong';
          }
          return false;
        }),
    } as Required<WsClientOptions>;
    this.enforceSchema = !!options?.enforceSchema;
  }

  private telemetry(evt: WsTelemetry) {
    try {
      // Skip telemetry in local development to avoid 404 noise
      if (
        typeof window !== 'undefined' &&
        (window.location.hostname === 'localhost' ||
          window.location.hostname === '127.0.0.1')
      ) {
        return;
      }
      fetch('/api/ws-telemetry', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ...evt, readyState: this.ws?.readyState }),
        keepalive: true,
      })
        .then((res) => {
          // Silently ignore 401 (Unauthorized) and 429 (Too Many Requests) - expected when not authenticated or rate limited
          if (res.status === 401 || res.status === 429) {
            return;
          }
          // Only log other errors in development
          if (!res.ok && import.meta.env.DEV) {
            console.debug('WebSocket telemetry error:', res.status, res.statusText);
          }
        })
        .catch(() => {
          // Silently ignore network errors - they're expected in some scenarios
        });
    } catch {
      /* noop */
    }
  }

  private async resolveUrl(): Promise<string> {
    if (this.opts.url) return this.opts.url;
    const res = await fetch('/api/ws-url', {
      headers: { 'cache-control': 'no-store' },
    });
    const json = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;
    const url =
      (typeof json.url === 'string' && json.url) ||
      (typeof json.fallback === 'string' && json.fallback) ||
      '';
    if (!url) throw new Error('ws_url_unavailable');
    return url;
  }

  private scheduleHeartbeat() {
    this.clearHeartbeat();
    this.heartbeatTimer = setInterval(() => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
      try {
        this.lastPingAt = Date.now();
        this.ws.send(JSON.stringify(this.opts.pingPayload));
        // If no pong arrives within heartbeat window*2, consider timeout
        setTimeout(() => {
          if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
          if (Date.now() - this.lastPingAt > this.opts.heartbeatMs * 2) {
            this.telemetry({
              event: 'ping_timeout',
              sinceMs: Date.now() - this.openedAt,
            });
            try {
              this.ws.close(4000, 'ping_timeout');
            } catch {
              /* noop */
            }
          }
        }, this.opts.heartbeatMs * 2);
      } catch {
        /* noop */
      }
    }, this.opts.heartbeatMs) as unknown as number;
  }

  private clearHeartbeat() {
    if (this.heartbeatTimer !== null) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private dispatchMessage(raw: unknown) {
    if (!raw || typeof raw !== 'object') return;
    // Start with unknown and refine optionally via schema
    let data: unknown = raw;
    if (this.enforceSchema) {
      const parsed = messageEnvelopeSchema.safeParse(raw);
      if (!parsed.success) return; // drop invalid
      data = parsed.data;
    }
    const t = (data as { type?: unknown }).type;
    if (typeof t !== 'string') return;
    const set = this.listeners.get(t);
    if (!set) return;
    for (const h of set) {
      try {
        h(data);
      } catch {
        /* noop */
      }
    }
  }

  private readonly onMessage = (ev: MessageEvent) => {
    try {
      const raw = typeof ev.data === 'string' ? ev.data : String(ev.data);
      const data: unknown = JSON.parse(raw);
      if (this.opts.pongMatcher(data)) {
        const rttMs = Date.now() - this.lastPingAt;
        this.telemetry({
          event: 'pong_received',
          rttMs,
          sinceMs: Date.now() - this.openedAt,
        });
        try {
          this.opts.onPong?.(rttMs);
        } catch {
          /* noop */
        }
        return;
      }
      this.dispatchMessage(data);
    } catch {
      this.telemetry({ event: 'message_error' });
    }
  };

  private readonly onOpen = () => {
    this.openedAt = Date.now();
    this.attempt = 0;
    this.consecutiveFailures = 0; // Reset on successful connection
    this.telemetry({
      event: 'connect_success',
      attempt: this.attempt,
      url: this.url ?? undefined,
    });
    try {
      this.opts.onOpen?.();
    } catch {
      /* noop */
    }
    this.scheduleHeartbeat();
  };

  private readonly onClose = (ev: CloseEvent) => {
    this.clearHeartbeat();
    this.telemetry({
      event: 'close',
      code: ev.code,
      reason: ev.reason,
      sinceMs: Date.now() - this.openedAt,
    });
    try {
      this.opts.onClose?.(ev);
    } catch {
      /* noop */
    }
    if (this.closedByUser) return;
    this.retry();
  };

  private readonly onError = () => {
    this.telemetry({ event: 'connect_error', attempt: this.attempt });
    try {
      this.opts.onError?.();
    } catch {
      /* noop */
    }
  };

  private retry() {
    this.consecutiveFailures += 1;
    
    // Stop retrying after max retries to prevent infinite loops
    if (this.consecutiveFailures > this.maxRetries) {
      // Silently stop retrying - connection is likely not available
      return;
    }
    
    this.attempt += 1;
    const backoff = Math.min(
      this.opts.maxBackoffMs,
      this.opts.baseBackoffMs * 2 ** (this.attempt - 1)
    );
    this.telemetry({
      event: 'retry',
      attempt: this.attempt,
      backoffMs: backoff,
    });
    try {
      this.opts.onRetry?.(this.attempt, backoff);
    } catch {
      /* noop */
    }
    setTimeout(() => {
      void this.open(true);
    }, backoff);
  }

  async open(isRetry = false) {
    this.closedByUser = false;
    this.telemetry({ event: 'connect_start', attempt: this.attempt + 1 });
    if (!isRetry) this.attempt = 0;
    if (!this.url) this.url = await this.resolveUrl();
    try {
      this.ws = new WebSocket(this.url);
      this.ws.addEventListener('open', this.onOpen);
      this.ws.addEventListener('close', this.onClose);
      this.ws.addEventListener('error', this.onError);
      this.ws.addEventListener('message', this.onMessage);
    } catch {
      this.telemetry({ event: 'connect_error', attempt: this.attempt });
      this.retry();
    }
  }

  close(code?: number, reason?: string) {
    this.closedByUser = true;
    this.clearHeartbeat();
    try {
      this.ws?.close(code, reason);
    } catch {
      /* noop */
    }
  }

  send(payload: unknown): boolean {
    try {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify(payload));
        return true;
      }
    } catch {
      // noop
    }
    return false;
  }

  subscribe(type: string, handler: MessageHandler): () => void {
    if (!this.listeners.has(type)) this.listeners.set(type, new Set());
    const set = this.listeners.get(type)!;
    set.add(handler);
    return () => set.delete(handler);
  }

  /**
   * Convenience helper for micro coaching events. Consumers still get raw event shape
   * coming from server (coaching engine). This avoids hardcoding event shape elsewhere.
   */
  onMicroCoach(handler: (ev: any) => void) {
    // eslint-disable-line @typescript-eslint/no-explicit-any
    return this.subscribe('micro_coach', handler);
  }
}
