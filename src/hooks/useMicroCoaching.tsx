import { useEffect, useState } from 'react';

export interface MicroCoachMessage {
  id: string;
  severity: 'info' | 'warn' | 'critical';
  message: string;
  metric: string;
  value: number;
  ts: string;
  cooldownSec: number;
}

/**
 * Hook that listens on an existing WebSocket for micro coaching events (type: micro_coach)
 * Caller must pass an already-open WebSocket instance.
 */
export function useMicroCoaching(ws: WebSocket | null) {
  const [messages, setMessages] = useState<MicroCoachMessage[]>([]);

  useEffect(() => {
    if (!ws) return;
    const handler = (ev: MessageEvent) => {
      try {
        const data = JSON.parse(ev.data);
        if (data && data.type === 'micro_coach') {
          setMessages((prev) =>
            [data as MicroCoachMessage, ...prev].slice(0, 20)
          );
        }
      } catch {
        /* ignore */
      }
    };
    ws.addEventListener('message', handler);
    return () => ws.removeEventListener('message', handler);
  }, [ws]);

  return messages;
}
