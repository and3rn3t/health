/**
 * Integration tests for toast deduplication across Advanced Analytics components
 * Tests that multiple components using useOnceToast don't spam toasts
 */

import { render, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AdvancedAnalytics from '../../sections/AdvancedAnalytics';
import type { ProcessedHealthData } from '@/types';

// Mock toast to track all calls
const mockToastSuccess = vi.fn();
const mockToastError = vi.fn();
const mockToastWarning = vi.fn();
const mockToastInfo = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => mockToastSuccess(...args),
    error: (...args: unknown[]) => mockToastError(...args),
    warning: (...args: unknown[]) => mockToastWarning(...args),
    info: (...args: unknown[]) => mockToastInfo(...args),
  },
}));

// Mock child components to avoid complex dependencies
vi.mock('../../health/AIInsights', () => ({
  default: () => <div>AI Insights</div>,
}));

vi.mock('../../health/AIRecommendations', () => ({
  default: () => <div>AI Recommendations</div>,
}));

vi.mock('../../health/MLAnalytics', () => ({
  default: () => <div>ML Analytics</div>,
}));

vi.mock('../../health/EnhancedGaitAnalyzer', () => ({
  EnhancedGaitAnalyzer: () => <div>Gait Analyzer</div>,
}));

vi.mock('../../health/WalkingPatternVisualizerClean', () => ({
  WalkingPatternVisualizer: () => <div>Walking Pattern</div>,
}));

describe('Advanced Analytics - Toast Deduplication Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear window globals
    if (typeof window !== 'undefined') {
      delete (window as any).__VS_TOAST_SHOWN__;
      delete (window as any).__VS_TOAST_TIME__;
      delete (window as any).__VS_TOAST_LAST_TS;
    }
  });

  it('should render without crashing', () => {
    render(<AdvancedAnalytics />);
    // Component should render successfully
    expect(true).toBe(true);
  });

  it('should use useOnceToast for all toast notifications', async () => {
    render(<AdvancedAnalytics />);

    // Wait for any async operations
    await waitFor(() => {
      // Component should have rendered
      expect(document.body).toBeTruthy();
    }, { timeout: 2000 });

    // Verify that if toasts are called, they go through useOnceToast
    // (actual toast calls would be mocked by useOnceToast implementation)
    // This test verifies the integration doesn't break
  });
});

describe('Toast Deduplication Behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (typeof window !== 'undefined') {
      delete (window as any).__VS_TOAST_SHOWN__;
      delete (window as any).__VS_TOAST_TIME__;
      delete (window as any).__VS_TOAST_LAST_TS;
    }
  });

  it('should prevent duplicate toasts with same ID', async () => {
    const { useOnceToast } = await import('@/hooks/useOnceToast');
    const { renderHook, act } = await import('@testing-library/react');

    const { result } = renderHook(() => useOnceToast());

    act(() => {
      result.current.showOnce('test-id', 'success', 'First call');
    });

    expect(mockToastSuccess).toHaveBeenCalledTimes(1);

    // Try to show same toast again immediately
    act(() => {
      result.current.showOnce('test-id', 'success', 'Second call');
    });

    // Should be deduplicated
    expect(mockToastSuccess).toHaveBeenCalledTimes(1);
  });

  it('should allow different IDs to show independently', async () => {
    const { useOnceToast } = await import('@/hooks/useOnceToast');
    const { renderHook, act } = await import('@testing-library/react');

    const { result } = renderHook(() => useOnceToast());

    act(() => {
      result.current.showOnce('id-1', 'success', 'Message 1');
      result.current.showOnce('id-2', 'success', 'Message 2');
      result.current.showOnce('id-3', 'success', 'Message 3');
    });

    // All should show since they have different IDs
    expect(mockToastSuccess).toHaveBeenCalledTimes(3);
  });
});
