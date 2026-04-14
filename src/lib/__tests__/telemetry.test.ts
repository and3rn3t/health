import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

describe('telemetry', () => {
  let recordTelemetry: typeof import('../telemetry').recordTelemetry;
  let getTelemetryBuffer: typeof import('../telemetry').getTelemetryBuffer;
  let subscribeTelemetry: typeof import('../telemetry').subscribeTelemetry;
  let registerNormalizationStatsProvider: typeof import('../telemetry').registerNormalizationStatsProvider;
  let getNormalizationStats: typeof import('../telemetry').getNormalizationStats;
  type NormalizationCacheStats = import('../telemetry').NormalizationCacheStats;

  beforeEach(async () => {
    vi.resetModules();
    const mod = await import('../telemetry');
    recordTelemetry = mod.recordTelemetry;
    getTelemetryBuffer = mod.getTelemetryBuffer;
    subscribeTelemetry = mod.subscribeTelemetry;
    registerNormalizationStatsProvider = mod.registerNormalizationStatsProvider;
    getNormalizationStats = mod.getNormalizationStats;
    vi.spyOn(console, 'debug').mockImplementation(() => {});
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('recordTelemetry', () => {
    it('adds events to the buffer', () => {
      const before = getTelemetryBuffer().length;
      recordTelemetry('test_event', { action: 'click' });
      const after = getTelemetryBuffer().length;

      expect(after).toBe(before + 1);
      const last = getTelemetryBuffer().at(-1)!;
      expect(last.name).toBe('test_event');
      expect(last.data).toEqual({ action: 'click' });
      expect(last.timestamp).toBeDefined();
    });

    it('caps buffer at MAX_BUFFER (200)', () => {
      // Ensure we exceed the buffer cap
      for (let i = 0; i < 210; i++) {
        recordTelemetry(`overflow_${i}`, { idx: i });
      }
      expect(getTelemetryBuffer().length).toBeLessThanOrEqual(200);
    });
  });

  describe('getTelemetryBuffer', () => {
    it('returns a copy (not the internal array)', () => {
      recordTelemetry('copy_test', { a: 1 });
      const buf1 = getTelemetryBuffer();
      const buf2 = getTelemetryBuffer();
      expect(buf1).not.toBe(buf2);
      expect(buf1).toEqual(buf2);
    });

    it('filters by name when provided', () => {
      recordTelemetry('filter_target', { x: 1 });
      recordTelemetry('filter_other', { x: 2 });

      const filtered = getTelemetryBuffer('filter_target');
      expect(filtered.every((e) => e.name === 'filter_target')).toBe(true);
    });
  });

  describe('subscribeTelemetry', () => {
    it('calls listener on new events', () => {
      const listener = vi.fn();
      const unsub = subscribeTelemetry(listener);

      recordTelemetry('sub_event', { ok: true });
      expect(listener).toHaveBeenCalledTimes(1);
      expect(listener.mock.calls[0]![0]!.name).toBe('sub_event');

      unsub();
    });

    it('unsubscribe stops notifications', () => {
      const listener = vi.fn();
      const unsub = subscribeTelemetry(listener);

      recordTelemetry('before', {});
      unsub();
      recordTelemetry('after', {});

      expect(listener).toHaveBeenCalledOnce();
    });

    it('swallows listener errors', () => {
      const bad = vi.fn().mockImplementation(() => {
        throw new Error('listener broke');
      });
      const good = vi.fn();
      const unsub1 = subscribeTelemetry(bad);
      const unsub2 = subscribeTelemetry(good);

      // Should not throw despite bad listener
      expect(() => recordTelemetry('safe', {})).not.toThrow();
      expect(good).toHaveBeenCalled();

      unsub1();
      unsub2();
    });
  });

  describe('normalization stats provider', () => {
    it('returns null when no provider registered', () => {
      expect(getNormalizationStats()).toBeNull();
    });

    it('returns stats from registered provider', () => {
      const stats: NormalizationCacheStats = {
        size: 10,
        hits: 80,
        misses: 20,
        entries: [{ key: 'hr', hits: 50, lastAccess: Date.now() }],
        hitRate: 0.8,
      };
      registerNormalizationStatsProvider(() => stats);

      expect(getNormalizationStats()).toEqual(stats);
    });
  });
});
