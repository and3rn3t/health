/**
 * WebSocket Message Batcher
 *
 * Groups high-frequency messages (e.g. gait samples at 50Hz) into batched
 * payloads sent at a configurable interval, reducing WebSocket frame overhead.
 *
 * Usage:
 *   const batcher = createMessageBatcher(ws.send, { intervalMs: 100 });
 *   batcher.enqueue({ type: 'gait_sample', data: sample });
 *   // ... later
 *   batcher.flush();
 *   batcher.destroy();
 */

import type { WebSocketMessage } from '@/hooks/useWebSocket';

export interface BatcherConfig {
  /** Ms between automatic flushes (default: 100 = 10 batches/sec) */
  intervalMs?: number;
  /** Max messages per batch before force-flush (default: 50) */
  maxBatchSize?: number;
  /** Max total queued bytes before dropping oldest (backpressure, default: 64KB) */
  maxQueueBytes?: number;
}

export interface MessageBatcher {
  /** Add a message to the current batch */
  enqueue: (message: WebSocketMessage) => void;
  /** Send all queued messages immediately */
  flush: () => void;
  /** Stop the batcher and flush remaining messages */
  destroy: () => void;
  /** Current queue depth */
  readonly pending: number;
}

export function createMessageBatcher(
  send: (message: WebSocketMessage) => void,
  config: BatcherConfig = {},
): MessageBatcher {
  const {
    intervalMs = 100,
    maxBatchSize = 50,
    maxQueueBytes = 65_536,
  } = config;

  let queue: WebSocketMessage[] = [];
  let queueBytes = 0;
  let timer: ReturnType<typeof setInterval> | null = null;

  const estimateSize = (msg: WebSocketMessage): number => {
    // Rough byte estimate without full serialization
    try {
      return JSON.stringify(msg).length;
    } catch {
      return 256;
    }
  };

  const flush = () => {
    if (queue.length === 0) return;

    if (queue.length === 1) {
      const msg = queue[0];
      if (msg) send(msg);
    } else {
      // Send as a batch envelope
      send({
        type: 'batch',
        data: queue,
        timestamp: new Date().toISOString(),
      });
    }

    queue = [];
    queueBytes = 0;
  };

  const enqueue = (message: WebSocketMessage) => {
    const size = estimateSize(message);

    // Backpressure: drop oldest if queue is too large
    while (queueBytes + size > maxQueueBytes && queue.length > 0) {
      const dropped = queue.shift();
      if (dropped) queueBytes -= estimateSize(dropped);
    }

    queue.push(message);
    queueBytes += size;

    // Force-flush if batch is full
    if (queue.length >= maxBatchSize) {
      flush();
    }
  };

  // Start periodic flush
  timer = setInterval(flush, intervalMs);

  const destroy = () => {
    if (timer) {
      clearInterval(timer);
      timer = null;
    }
    flush(); // Send remaining
  };

  return {
    enqueue,
    flush,
    destroy,
    get pending() {
      return queue.length;
    },
  };
}
