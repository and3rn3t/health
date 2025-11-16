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

  const showOnce = useCallback(
    (
      id: string,
      type: 'success' | 'error' | 'info' | 'warning' | 'loading' = 'info',
      message: string,
      options?: Parameters<typeof toast>[1]
    ) => {
      const set = getShownSet();
      if (set.has(id)) return;
      set.add(id);
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
