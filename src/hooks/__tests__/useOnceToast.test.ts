/**
 * Unit tests for useOnceToast hook
 * Tests deduplication, rate limiting, and toast suppression
 */

import { act, renderHook } from '@testing-library/react';
import { toast } from 'sonner';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOnceToast } from '../useOnceToast';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    warning: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(),
  },
}));

describe('useOnceToast', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear window globals
    if (globalThis.window !== undefined) {
      const w = globalThis.window as unknown as Record<string, unknown>;
      delete w.__VS_TOAST_SHOWN__;
      delete w.__VS_TOAST_TIME__;
      delete w.__VS_TOAST_LAST_TS;
      delete w.__DISABLE_TOASTS;
    }
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Functionality', () => {
    it('should show a toast on first call', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('test-id', 'success', 'Test message');
      });

      expect(toast.success).toHaveBeenCalledWith('Test message', undefined);
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('should support all toast types', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('success-id', 'success', 'Success');
        result.current.showOnce('error-id', 'error', 'Error');
        result.current.showOnce('warning-id', 'warning', 'Warning');
        result.current.showOnce('info-id', 'info', 'Info');
        result.current.showOnce('loading-id', 'loading', 'Loading');
      });

      expect(toast.success).toHaveBeenCalledWith('Success', undefined);
      expect(toast.error).toHaveBeenCalledWith('Error', undefined);
      expect(toast.warning).toHaveBeenCalledWith('Warning', undefined);
      expect(toast.info).toHaveBeenCalledWith('Info', undefined);
      expect(toast.loading).toHaveBeenCalledWith('Loading', undefined);
    });

    it('should pass options to toast', () => {
      const { result } = renderHook(() => useOnceToast());
      const options = { duration: 5000, description: 'Test description' };

      act(() => {
        result.current.showOnce('test-id', 'success', 'Test message', options);
      });

      expect(toast.success).toHaveBeenCalledWith('Test message', options);
    });
  });

  describe('Deduplication', () => {
    it('should prevent duplicate toasts with same ID within 5 seconds', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('duplicate-id', 'success', 'First message');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Try to show same toast again immediately
      act(() => {
        result.current.showOnce('duplicate-id', 'success', 'Second message');
      });

      // Should not show again
      expect(toast.success).toHaveBeenCalledTimes(1);
    });

    it('should allow same toast after 5 seconds', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('timeout-id', 'success', 'First message');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Advance time by 5.1 seconds
      act(() => {
        vi.advanceTimersByTime(5100);
        result.current.showOnce('timeout-id', 'success', 'Second message');
      });

      // Should show again after timeout
      expect(toast.success).toHaveBeenCalledTimes(2);
    });

    it('should allow different IDs to show independently', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('id-1', 'success', 'Message 1');
        result.current.showOnce('id-2', 'success', 'Message 2');
        result.current.showOnce('id-3', 'success', 'Message 3');
      });

      expect(toast.success).toHaveBeenCalledTimes(3);
    });
  });

  describe('Global Rate Limiting', () => {
    it('should prevent toasts if last toast was less than 500ms ago', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('id-1', 'success', 'First');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Try to show another toast within 500ms
      act(() => {
        vi.advanceTimersByTime(400);
        result.current.showOnce('id-2', 'error', 'Second');
      });

      // Should be blocked by global rate limit
      expect(toast.error).not.toHaveBeenCalled();
    });

    it('should allow toasts after 500ms global rate limit', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('id-1', 'success', 'First');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Advance time past rate limit
      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('id-2', 'error', 'Second');
      });

      // Should be allowed
      expect(toast.error).toHaveBeenCalledTimes(1);
    });
  });

  describe('Global Kill Switch', () => {
    it('should suppress all toasts when __DISABLE_TOASTS is true', () => {
      if (globalThis.window !== undefined) {
        const w = globalThis.window as unknown as Record<string, unknown>;
        w.__DISABLE_TOASTS = true;
      }

      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('test-id', 'success', 'Should not show');
      });

      expect(toast.success).not.toHaveBeenCalled();

      // Clean up
      if (globalThis.window !== undefined) {
        const w = globalThis.window as unknown as Record<string, unknown>;
        delete w.__DISABLE_TOASTS;
      }
    });
  });

  describe('resetOnce', () => {
    it('should reset a specific toast ID', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('reset-id', 'success', 'First');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Try to show again - should be blocked
      act(() => {
        result.current.showOnce('reset-id', 'success', 'Second');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Reset the ID
      act(() => {
        result.current.resetOnce('reset-id');
        result.current.showOnce('reset-id', 'success', 'Third');
      });

      // Should show again after reset
      expect(toast.success).toHaveBeenCalledTimes(2);
    });

    it('should reset all toasts when called without ID', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('id-1', 'success', 'First');
        result.current.showOnce('id-2', 'success', 'Second');
        result.current.showOnce('id-3', 'success', 'Third');
      });

      expect(toast.success).toHaveBeenCalledTimes(3);

      // Try to show all again - should be blocked
      act(() => {
        result.current.showOnce('id-1', 'success', 'First again');
        result.current.showOnce('id-2', 'success', 'Second again');
        result.current.showOnce('id-3', 'success', 'Third again');
      });

      expect(toast.success).toHaveBeenCalledTimes(3);

      // Reset all
      act(() => {
        result.current.resetOnce();
        result.current.showOnce('id-1', 'success', 'First reset');
        result.current.showOnce('id-2', 'success', 'Second reset');
        result.current.showOnce('id-3', 'success', 'Third reset');
      });

      // All should show again
      expect(toast.success).toHaveBeenCalledTimes(6);
    });
  });

  describe('SSR Safety', () => {
    it('should handle SSR environment gracefully', () => {
      // Mock window as undefined (SSR)
      const originalWindow = globalThis.window;
      // @ts-expect-error - intentionally setting to undefined for SSR test
      globalThis.window = undefined;

      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('ssr-id', 'success', 'SSR message');
      });

      // Should not crash, but also won't show toast in SSR
      expect(toast.success).not.toHaveBeenCalled();

      // Restore window
      globalThis.window = originalWindow;
    });
  });

  describe('Multiple Hook Instances', () => {
    it('should share state across multiple hook instances', () => {
      const { result: result1 } = renderHook(() => useOnceToast());
      const { result: result2 } = renderHook(() => useOnceToast());

      act(() => {
        result1.current.showOnce('shared-id', 'success', 'From hook 1');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);

      // Second hook should respect the same ID
      act(() => {
        result2.current.showOnce('shared-id', 'success', 'From hook 2');
      });

      // Should be blocked because ID was already shown
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });
});
