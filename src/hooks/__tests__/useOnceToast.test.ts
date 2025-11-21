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
    // Clear mock call history (but keep implementations)
    vi.clearAllMocks();
    // Clear window globals to ensure clean state between tests
    if (globalThis.window !== undefined) {
      const w = globalThis.window as unknown as Record<string, unknown>;
      // Delete all toast-related globals to start fresh
      delete w.__VS_TOAST_SHOWN__;
      delete w.__VS_TOAST_TIME__;
      delete w.__VS_TOAST_LAST_TS;
      delete w.__DISABLE_TOASTS;
    }
    // Start fake timers at a high value to ensure rate limit doesn't block
    // Each test starts at a different time to avoid conflicts
    vi.useFakeTimers({ now: Date.now() });
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
      const mockSuccess = toast.success as ReturnType<typeof vi.fn>;
      const mockError = toast.error as ReturnType<typeof vi.fn>;
      const mockWarning = toast.warning as ReturnType<typeof vi.fn>;
      const mockInfo = toast.info as ReturnType<typeof vi.fn>;
      const mockLoading = toast.loading as ReturnType<typeof vi.fn>;

      act(() => {
        result.current.showOnce('success-id', 'success', 'Success');
      });

      // Verify the call was made - check that length increased and contains our call
      expect(mockSuccess.mock.calls.length).toBeGreaterThan(0);
      const hasSuccessCall = mockSuccess.mock.calls.some(
        (call) => call[0] === 'Success' && call[1] === undefined
      );
      expect(hasSuccessCall).toBe(true);

      // Advance time to allow next toast (global rate limit is 500ms)
      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('error-id', 'error', 'Error');
      });

      expect(mockError.mock.calls.length).toBeGreaterThan(0);
      const hasErrorCall = mockError.mock.calls.some(
        (call) => call[0] === 'Error' && call[1] === undefined
      );
      expect(hasErrorCall).toBe(true);

      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('warning-id', 'warning', 'Warning');
      });

      expect(mockWarning.mock.calls.length).toBeGreaterThan(0);
      const hasWarningCall = mockWarning.mock.calls.some(
        (call) => call[0] === 'Warning' && call[1] === undefined
      );
      expect(hasWarningCall).toBe(true);

      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('info-id', 'info', 'Info');
      });

      expect(mockInfo.mock.calls.length).toBeGreaterThan(0);
      const hasInfoCall = mockInfo.mock.calls.some(
        (call) => call[0] === 'Info' && call[1] === undefined
      );
      expect(hasInfoCall).toBe(true);

      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('loading-id', 'loading', 'Loading');
      });

      expect(mockLoading.mock.calls.length).toBeGreaterThan(0);
      const hasLoadingCall = mockLoading.mock.calls.some(
        (call) => call[0] === 'Loading' && call[1] === undefined
      );
      expect(hasLoadingCall).toBe(true);
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

    it('should require resetOnce to show same toast again (set persists)', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('timeout-id', 'success', 'First message');
      });

      expect(toast.success).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith('First message', undefined);

      // Try to show again immediately - should be blocked
      act(() => {
        result.current.showOnce('timeout-id', 'success', 'Second message');
      });

      // Should still be blocked (ID is in set)
      expect(toast.success).toHaveBeenCalledTimes(1);

      // Reset the ID and advance time past both rate limit (500ms) and deduplication (5000ms)
      act(() => {
        result.current.resetOnce('timeout-id');
        vi.advanceTimersByTime(5100); // Past both rate limit and 5-second deduplication
        result.current.showOnce('timeout-id', 'success', 'Third message');
      });

      // Should show again after reset and time advance
      expect(toast.success).toHaveBeenCalledTimes(2);
      expect(toast.success).toHaveBeenCalledWith('Third message', undefined);
    });

    it('should allow different IDs to show independently', () => {
      const { result } = renderHook(() => useOnceToast());
      const mockSuccess = toast.success as ReturnType<typeof vi.fn>;

      // First call
      act(() => {
        result.current.showOnce('id-1', 'success', 'Message 1');
      });

      expect(mockSuccess.mock.calls.length).toBeGreaterThan(0);
      const hasMessage1 = mockSuccess.mock.calls.some(
        (call) => call[0] === 'Message 1' && call[1] === undefined
      );
      expect(hasMessage1).toBe(true);

      // Advance time past rate limit (500ms) and make second call
      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('id-2', 'success', 'Message 2');
      });

      expect(mockSuccess.mock.calls.length).toBeGreaterThan(0);
      const hasMessage2 = mockSuccess.mock.calls.some(
        (call) => call[0] === 'Message 2' && call[1] === undefined
      );
      expect(hasMessage2).toBe(true);

      // Advance time past rate limit again and make third call
      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('id-3', 'success', 'Message 3');
      });

      expect(mockSuccess.mock.calls.length).toBeGreaterThan(0);
      const hasMessage3 = mockSuccess.mock.calls.some(
        (call) => call[0] === 'Message 3' && call[1] === undefined
      );
      expect(hasMessage3).toBe(true);
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

      // Reset the ID and advance time past both rate limit and 5-second deduplication
      act(() => {
        result.current.resetOnce('reset-id');
        vi.advanceTimersByTime(5100); // Past both limits
        result.current.showOnce('reset-id', 'success', 'Third');
      });

      // Should show again after reset and time advance
      expect(toast.success).toHaveBeenCalledTimes(2);
    });

    it('should reset all toasts when called without ID', () => {
      const { result } = renderHook(() => useOnceToast());

      act(() => {
        result.current.showOnce('id-1', 'success', 'First');
      });

      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('id-2', 'success', 'Second');
      });

      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('id-3', 'success', 'Third');
      });

      expect(toast.success).toHaveBeenCalledTimes(3);

      // Try to show all again - should be blocked
      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('id-1', 'success', 'First again');
      });

      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('id-2', 'success', 'Second again');
      });

      act(() => {
        vi.advanceTimersByTime(600);
        result.current.showOnce('id-3', 'success', 'Third again');
      });

      // Should still be blocked (deduplication)
      expect(toast.success).toHaveBeenCalledTimes(3);

      // Reset all and advance time past 5-second deduplication
      act(() => {
        result.current.resetOnce();
        vi.advanceTimersByTime(5100); // Past 5-second deduplication
        result.current.showOnce('id-1', 'success', 'First reset');
      });

      act(() => {
        vi.advanceTimersByTime(600); // Past rate limit
        result.current.showOnce('id-2', 'success', 'Second reset');
      });

      act(() => {
        vi.advanceTimersByTime(600); // Past rate limit
        result.current.showOnce('id-3', 'success', 'Third reset');
      });

      // All should show again after reset and time advance
      expect(toast.success).toHaveBeenCalledTimes(6);
    });
  });

  describe('SSR Safety', () => {
    it('should handle SSR environment gracefully', () => {
      // Test that the hook doesn't crash when window is undefined
      // We can't actually set window to undefined in jsdom, so we test the logic
      // by checking that the hook handles the case where window properties don't exist

      // Clear window globals to simulate SSR-like conditions
      if (globalThis.window !== undefined) {
        const w = globalThis.window as unknown as Record<string, unknown>;
        delete w.__VS_TOAST_SHOWN__;
        delete w.__VS_TOAST_TIME__;
        delete w.__VS_TOAST_LAST_TS;
      }

      const { result } = renderHook(() => useOnceToast());

      // The hook should still work even if globals are cleared
      act(() => {
        result.current.showOnce('ssr-id', 'success', 'SSR message');
      });

      // Should still show toast (hook creates globals if they don't exist)
      expect(toast.success).toHaveBeenCalledWith('SSR message', undefined);
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

      // Second hook should respect the same ID (advance time past rate limit)
      act(() => {
        vi.advanceTimersByTime(600);
        result2.current.showOnce('shared-id', 'success', 'From hook 2');
      });

      // Should be blocked because ID was already shown (deduplication), not rate limit
      expect(toast.success).toHaveBeenCalledTimes(1);
    });
  });
});
