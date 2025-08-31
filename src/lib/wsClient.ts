import { z } from 'zod';
import {
  messageEnvelopeSchema,
  processedHealthDataSchema,
  type MessageEnvelope,
} from '@/schemas/health';

const historicalPageSchema = z.object({
  items: z.array(processedHealthDataSchema),
  nextCursor: z.string().optional(),
});

export type WSHandlers = {
  connection_established?: (data: unknown, raw: MessageEnvelope) => void;
  live_health_update?: (data: unknown, raw: MessageEnvelope) => void;
  historical_data_update?: (
    page: z.infer<typeof historicalPageSchema>,
    raw: MessageEnvelope
  ) => void;
  emergency_alert?: (data: unknown, raw: MessageEnvelope) => void;
  error?: (data: unknown, raw: MessageEnvelope) => void;
};

export type WSClientOptions = {
  url: string;
  token?: string; // optional device JWT passed via query param
  handlers?: WSHandlers;
  onOpen?: (ws: WebSocket) => void;
  onClose?: (ev: CloseEvent) => void;
  onError?: (ev: Event) => void;
  heartbeatMs?: number;
  maxBackoffMs?: number;
};

export function createWSClient(opts: WSClientOptions) {
  let ws: WebSocket | null = null;
  let retry = 0;
  let heartbeat: number | undefined;

  const connect = () => {
    const url = new URL(opts.url);
    if (opts.token) url.searchParams.set('token', opts.token);
    ws = new WebSocket(url.toString());

    ws.addEventListener('open', () => {
      retry = 0;
      if (opts.heartbeatMs && opts.heartbeatMs > 0) {
        clearInterval(heartbeat);
        heartbeat = setInterval(() => {
          try {
            ws?.send(
              JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString(),
              })
            );
          } catch {
            console.debug('ws heartbeat send failed');
          }
        }, opts.heartbeatMs) as unknown as number;
      }
      opts.onOpen?.(ws!);
    });

    ws.addEventListener('message', (ev) => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(ev.data as string);
      } catch {
        return; // drop invalid JSON
      }
      const env = messageEnvelopeSchema.safeParse(parsed);
      if (!env.success) return;
      const m = env.data;
      if (m.type === 'historical_data_update') {
        const page = historicalPageSchema.safeParse(m.data);
        if (page.success) opts.handlers?.historical_data_update?.(page.data, m);
        return;
      }
      // dispatch other types explicitly to keep types narrow
      if (m.type === 'connection_established')
        opts.handlers?.connection_established?.(m.data, m);
      if (m.type === 'live_health_update')
        opts.handlers?.live_health_update?.(m.data, m);
      if (m.type === 'emergency_alert')
        opts.handlers?.emergency_alert?.(m.data, m);
      if (m.type === 'error') opts.handlers?.error?.(m.data, m);
    });

    ws.addEventListener('close', (ev) => {
      clearInterval(heartbeat);
      opts.onClose?.(ev);
      const backoff = Math.min(
        2 ** retry * 250 + Math.random() * 250,
        opts.maxBackoffMs ?? 10_000
      );
      retry += 1;
      setTimeout(connect, backoff);
    });

    ws.addEventListener('error', (ev) => {
      opts.onError?.(ev);
      try {
        ws?.close();
      } catch {
        console.debug('ws close failed');
      }
    });
  };

  connect();

  return {
    send: (msg: unknown) => {
      try {
        ws?.send(JSON.stringify(msg));
      } catch {
        console.debug('ws send failed');
      }
    },
    close: () => {
      clearInterval(heartbeat);
      ws?.close();
    },
  };
}

export default createWSClient;
