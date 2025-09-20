import { useCallback, useEffect, useRef } from 'react';

/**
 * Simple ARIA live region announcer hook.
 * Creates (or reuses) a visually hidden polite live region node and
 * exposes an announce() function to push status updates for screen readers.
 */
export function useLiveRegion(id: string = 'vs-live-region') {
  const regionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    let node = document.getElementById(id);
    if (!node) {
      node = document.createElement('div');
      node.id = id;
      node.setAttribute('role', 'status');
      node.setAttribute('aria-live', 'polite');
      node.setAttribute('aria-atomic', 'true');
      node.style.position = 'absolute';
      node.style.width = '1px';
      node.style.height = '1px';
      node.style.padding = '0';
      node.style.margin = '-1px';
      node.style.overflow = 'hidden';
      node.style.clip = 'rect(0 0 0 0)';
      node.style.whiteSpace = 'nowrap';
      node.style.border = '0';
      document.body.appendChild(node);
    }
    regionRef.current = node;
    return () => {
      // Leave region for reuse across mounts to avoid churn.
    };
  }, [id]);

  const announce = useCallback((message: string) => {
    const el = regionRef.current;
    if (!el) return;
    // Clear then set to ensure SR re-announces identical messages
    el.textContent = '';
    window.requestAnimationFrame(() => {
      el.textContent = message;
    });
  }, []);

  return announce;
}
