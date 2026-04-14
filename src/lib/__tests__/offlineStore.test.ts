import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import 'fake-indexeddb/auto';

// The offlineStore module caches the DB promise, so we need a fresh module per test.
// We'll dynamically import after resetting the module registry.

describe('offlineStore', () => {
  let store: typeof import('../offlineStore');

  beforeEach(async () => {
    vi.resetModules();
    store = await import('../offlineStore');
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // Settings cache
  // ---------------------------------------------------------------------------

  describe('settings cache', () => {
    it('returns undefined for an unset key', async () => {
      const val = await store.getCachedSetting('nonexistent');
      expect(val).toBeUndefined();
    });

    it('round-trips a value through set + get', async () => {
      await store.setCachedSetting('theme', 'dark');
      const val = await store.getCachedSetting<string>('theme');
      expect(val).toBe('dark');
    });

    it('stores complex objects', async () => {
      const config = { interval: 30, notifications: true };
      await store.setCachedSetting('prefs', config);
      const val = await store.getCachedSetting<typeof config>('prefs');
      expect(val).toEqual(config);
    });

    it('overwrites existing key', async () => {
      await store.setCachedSetting('key1', 'a');
      await store.setCachedSetting('key1', 'b');
      expect(await store.getCachedSetting('key1')).toBe('b');
    });

    it('deleteCachedSetting removes the key', async () => {
      await store.setCachedSetting('del-me', 123);
      await store.deleteCachedSetting('del-me');
      expect(await store.getCachedSetting('del-me')).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Sync queue
  // ---------------------------------------------------------------------------

  describe('sync queue', () => {
    it('enqueue increases queue size', async () => {
      const before = await store.getSyncQueueSize();
      await store.enqueueSync({
        url: '/api/health',
        method: 'POST',
        body: '{"hr":72}',
      });
      const after = await store.getSyncQueueSize();
      expect(after).toBe(before + 1);
    });

    it('drainSyncQueue replays queued fetches', async () => {
      await store.enqueueSync({
        url: '/api/sync',
        method: 'POST',
        body: '{}',
      });

      const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response('ok', { status: 200 }),
      );

      const { succeeded, failed } = await store.drainSyncQueue();

      expect(succeeded).toBeGreaterThanOrEqual(1);
      expect(failed).toBe(0);
      expect(fetchSpy).toHaveBeenCalled();
    });

    it('drainSyncQueue counts failures', async () => {
      await store.enqueueSync({
        url: '/api/fail',
        method: 'POST',
        body: '{}',
      });

      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('network'));

      const { succeeded, failed } = await store.drainSyncQueue();

      expect(failed).toBeGreaterThanOrEqual(1);
      expect(succeeded).toBe(0);
    });
  });

  // ---------------------------------------------------------------------------
  // startOfflineSync
  // ---------------------------------------------------------------------------

  describe('startOfflineSync', () => {
    it('registers an online event listener', () => {
      const addSpy = vi.spyOn(globalThis, 'addEventListener');
      store.startOfflineSync();
      expect(addSpy).toHaveBeenCalledWith('online', expect.any(Function));
    });
  });
});
