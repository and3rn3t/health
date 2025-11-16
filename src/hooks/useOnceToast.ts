import { useCallback } from 'react';
import { toast } from 'sonner';

/**
 * Prevent duplicate toasts from being shown repeatedly (e.g., in effects or polling loops).
 * Uses a window-scoped Set so multiple components can share suppression for the same id.
 */
export function useOnceToast() {
  // Ensure global set exists (non-SSR safe check)
  const getShownSet = () => {
    if (typeof window === 'undefined') return new Set<string>();
    const w = window as unknown as Record<string, unknown>;
    if (!w.__VS_TOAST_SHOWN__) {
      w.__VS_TOAST_SHOWN__ = new Set<string>();
    }
    return w.__VS_TOAST_SHOWN__ as Set<string>;
  };
  const getTimeMap = () => {
    if (typeof window === 'undefined') return new Map<string, number>();
    const w = window as unknown as Record<string, unknown>;
    if (!w.__VS_TOAST_TIME__) {
      w.__VS_TOAST_TIME__ = new Map<string, number>();
    }
    return w.__VS_TOAST_TIME__ as Map<string, number>;
  };

  const showOnce = useCallback(
    (
      id: string,
      type: 'success' | 'error' | 'info' | 'warning' | 'loading' = 'info',
      message: string,
      options?: Parameters<typeof toast>[1]
    ) => {
      // Global kill switch (set window.__DISABLE_TOASTS = true to suppress toasts)
      if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__DISABLE_TOASTS) {
        return;
      }
      // Basic global rate limit to avoid storms
      const now = Date.now();
      const w = (typeof window !== 'undefined' ? (window as unknown as Record<string, unknown>) : {}) as Record<string, unknown>;
      const lastGlobal = (w.__VS_TOAST_LAST_TS as number | undefined) ?? 0;
      if (now - lastGlobal < 500) {
        // Drop if last toast was <500ms ago
        return;
      }
      const set = getShownSet();
      const timeMap = getTimeMap();
      const lastIdTs = timeMap.get(id) ?? 0;
      if (set.has(id) || now - lastIdTs < 5000) {
        return;
      }
      set.add(id);
      timeMap.set(id, now);
      (w as Record<string, unknown>).__VS_TOAST_LAST_TS = now;
      switch (type) {
        case 'success':
          toast.success(message, options);
          break;
        case 'error':
          toast.error(message, options);
          break;
        case 'warning':
          toast.warning(message, options);
          break;
        case 'loading':
          toast.loading(message, options);
          break;
        default:
          toast.info(message, options);
      }
    },
    []
  );

  const resetOnce = useCallback((id?: string) => {
    const set = getShownSet();
    if (id) {
      set.delete(id);
    } else {
      // Clear all
      set.clear();
    }
  }, []);

  return { showOnce, resetOnce };
}
