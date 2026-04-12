/**
 * VitalSense Offline Store — IndexedDB-backed persistence for offline-first UX.
 *
 * Provides:
 * - Settings & dashboard layout caching (survives page reload)
 * - Sync queue for pending writes (drained when online)
 * - Coordination with the service worker's background sync
 */

const DB_NAME = 'vitalsense-offline';
const DB_VERSION = 1;

/** Store names */
const SETTINGS_STORE = 'settings';
const SYNC_QUEUE_STORE = 'sync-queue';

// ---------------------------------------------------------------------------
// Database lifecycle
// ---------------------------------------------------------------------------

let dbPromise: Promise<IDBDatabase> | null = null;

function getDB(): Promise<IDBDatabase> {
  if (dbPromise !== null) return dbPromise;

  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE);
      }
      if (!db.objectStoreNames.contains(SYNC_QUEUE_STORE)) {
        db.createObjectStore(SYNC_QUEUE_STORE, { keyPath: 'id', autoIncrement: true });
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Settings cache (key-value, mirrors KV keys)
// ---------------------------------------------------------------------------

export async function getCachedSetting<T = unknown>(key: string): Promise<T | undefined> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readonly');
    const req = tx.objectStore(SETTINGS_STORE).get(key);
    req.onsuccess = () => resolve(req.result as T | undefined);
    req.onerror = () => reject(req.error);
  });
}

export async function setCachedSetting(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    tx.objectStore(SETTINGS_STORE).put(value, key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteCachedSetting(key: string): Promise<void> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SETTINGS_STORE, 'readwrite');
    tx.objectStore(SETTINGS_STORE).delete(key);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ---------------------------------------------------------------------------
// Sync queue (pending writes to replay when online)
// ---------------------------------------------------------------------------

export interface SyncQueueEntry {
  id?: number;
  url: string;
  method: string;
  body: string;
  createdAt: number;
}

export async function enqueueSync(entry: Omit<SyncQueueEntry, 'id' | 'createdAt'>): Promise<void> {
  const db = await getDB();

  const record: Omit<SyncQueueEntry, 'id'> = {
    ...entry,
    createdAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
    tx.objectStore(SYNC_QUEUE_STORE).add(record);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function drainSyncQueue(): Promise<{ succeeded: number; failed: number }> {
  const db = await getDB();

  const entries = await new Promise<SyncQueueEntry[]>((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
    const req = tx.objectStore(SYNC_QUEUE_STORE).getAll();
    req.onsuccess = () => resolve(req.result as SyncQueueEntry[]);
    req.onerror = () => reject(req.error);
  });

  let succeeded = 0;
  let failed = 0;

  for (const entry of entries) {
    try {
      const response = await fetch(entry.url, {
        method: entry.method,
        headers: { 'Content-Type': 'application/json' },
        body: entry.body,
      });

      if (response.ok && entry.id != null) {
        const tx = db.transaction(SYNC_QUEUE_STORE, 'readwrite');
        tx.objectStore(SYNC_QUEUE_STORE).delete(entry.id);
        await new Promise<void>((res, rej) => {
          tx.oncomplete = () => res();
          tx.onerror = () => rej(tx.error);
        });
        succeeded++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return { succeeded, failed };
}

export async function getSyncQueueSize(): Promise<number> {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SYNC_QUEUE_STORE, 'readonly');
    const req = tx.objectStore(SYNC_QUEUE_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

// ---------------------------------------------------------------------------
// Online/offline coordination
// ---------------------------------------------------------------------------

let isListening = false;

/** Start listening for online events and auto-drain the sync queue */
export function startOfflineSync(): void {
  if (isListening || globalThis.window === undefined) return;
  isListening = true;

  const onOnline = () => {
    void drainSyncQueue().then(({ succeeded, failed }) => {
      if (succeeded > 0 || failed > 0) {
        console.info(`[OfflineSync] Drained queue: ${succeeded} ok, ${failed} failed`);
      }
    });

    // Also trigger SW background sync if available
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.ready
        .then((reg) => {
          if ('sync' in reg) {
            return (reg as unknown as { sync: { register: (tag: string) => Promise<void> } }).sync.register('health-data-sync');
          }
        })
        .catch(() => { /* no-op */ });
    }
  };

  globalThis.addEventListener('online', onOnline);
}
