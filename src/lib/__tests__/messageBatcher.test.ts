import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createMessageBatcher } from '../messageBatcher';
import type { MessageBatcher } from '../messageBatcher';

describe('createMessageBatcher', () => {
  let sendMock: ReturnType<typeof vi.fn>;
  let batcher: MessageBatcher;

  beforeEach(() => {
    vi.useFakeTimers();
    sendMock = vi.fn();
  });
  afterEach(() => {
    batcher?.destroy();
    vi.useRealTimers();
  });

  it('sends single messages directly (no batch envelope)', () => {
    batcher = createMessageBatcher(sendMock, { intervalMs: 100 });
    batcher.enqueue({ type: 'ping' });

    batcher.flush();
    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith({ type: 'ping' });
  });

  it('wraps multiple messages in a batch envelope', () => {
    batcher = createMessageBatcher(sendMock, { intervalMs: 100 });
    batcher.enqueue({ type: 'a' });
    batcher.enqueue({ type: 'b' });

    batcher.flush();
    expect(sendMock).toHaveBeenCalledTimes(1);
    const msg = sendMock.mock.calls[0]![0];
    expect(msg.type).toBe('batch');
    expect(msg.data).toHaveLength(2);
    expect(msg.timestamp).toBeDefined();
  });

  it('auto-flushes on interval', () => {
    batcher = createMessageBatcher(sendMock, { intervalMs: 50 });
    batcher.enqueue({ type: 'tick' });

    vi.advanceTimersByTime(50);
    expect(sendMock).toHaveBeenCalledTimes(1);
  });

  it('force-flushes when maxBatchSize is reached', () => {
    batcher = createMessageBatcher(sendMock, { maxBatchSize: 3, intervalMs: 10_000 });
    batcher.enqueue({ type: '1' });
    batcher.enqueue({ type: '2' });
    batcher.enqueue({ type: '3' });

    // Should have auto-flushed at 3
    expect(sendMock).toHaveBeenCalledTimes(1);
    const msg = sendMock.mock.calls[0]![0];
    expect(msg.type).toBe('batch');
    expect(msg.data).toHaveLength(3);
  });

  it('tracks pending count', () => {
    batcher = createMessageBatcher(sendMock, { intervalMs: 10_000 });
    expect(batcher.pending).toBe(0);

    batcher.enqueue({ type: 'a' });
    batcher.enqueue({ type: 'b' });
    expect(batcher.pending).toBe(2);

    batcher.flush();
    expect(batcher.pending).toBe(0);
  });

  it('drops oldest messages on backpressure', () => {
    // maxQueueBytes very small so we trigger backpressure quickly
    batcher = createMessageBatcher(sendMock, {
      intervalMs: 10_000,
      maxBatchSize: 100,
      maxQueueBytes: 50, // ~50 bytes
    });

    // Each message is ~15+ bytes as JSON, so a few will fill the queue
    for (let i = 0; i < 10; i++) {
      batcher.enqueue({ type: `msg-${i}` });
    }

    // Queue should not exceed maxQueueBytes — some messages were dropped
    expect(batcher.pending).toBeLessThan(10);
  });

  it('flush is a no-op when queue is empty', () => {
    batcher = createMessageBatcher(sendMock, { intervalMs: 100 });
    batcher.flush();
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('destroy flushes remaining and stops timer', () => {
    batcher = createMessageBatcher(sendMock, { intervalMs: 10_000 });
    batcher.enqueue({ type: 'last' });
    batcher.destroy();

    expect(sendMock).toHaveBeenCalledTimes(1);

    // Further timer ticks should not cause additional sends
    sendMock.mockClear();
    vi.advanceTimersByTime(20_000);
    expect(sendMock).not.toHaveBeenCalled();
  });

  it('uses default config values', () => {
    batcher = createMessageBatcher(sendMock);
    // Should not throw; defaults are intervalMs=100, maxBatchSize=50, maxQueueBytes=65536
    batcher.enqueue({ type: 'ok' });
    vi.advanceTimersByTime(100);
    expect(sendMock).toHaveBeenCalled();
  });
});
