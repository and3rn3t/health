import { describe, expect, it, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useIsMobile } from '../use-mobile';

describe('useIsMobile', () => {
  it('should return false for desktop-width viewport', () => {
    // Default matchMedia mock in vitest.setup.ts returns { matches: false }
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it('should update when media query changes', () => {
    let changeHandler: ((e: MediaQueryListEvent) => void) | undefined;
    const mql = {
      matches: false,
      addEventListener: (_: string, fn: (e: MediaQueryListEvent) => void) => {
        changeHandler = fn;
      },
      removeEventListener: () => {},
    };
    const origMatchMedia = window.matchMedia;
    window.matchMedia = () => mql as unknown as MediaQueryList;

    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate viewport narrowing
    act(() => {
      changeHandler?.({ matches: true } as MediaQueryListEvent);
    });
    expect(result.current).toBe(true);

    window.matchMedia = origMatchMedia;
  });

  it('should clean up event listener on unmount', () => {
    const removeEventListener = vi.fn();
    const mql = {
      matches: false,
      addEventListener: () => {},
      removeEventListener,
    };
    const origMatchMedia = window.matchMedia;
    window.matchMedia = () => mql as unknown as MediaQueryList;

    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(removeEventListener).toHaveBeenCalledWith('change', expect.any(Function));

    window.matchMedia = origMatchMedia;
  });
});
