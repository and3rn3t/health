import { describe, expect, it, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import React from 'react';
import {
  useErrorReporting,
  ErrorContext,
  type ErrorContextType,
} from '../useErrorHandling';

describe('useErrorReporting', () => {
  it('should return context value when wrapped in provider', () => {
    const mockCtx: ErrorContextType = {
      reportError: vi.fn(),
      clearError: vi.fn(),
    };
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <ErrorContext.Provider value={mockCtx}>{children}</ErrorContext.Provider>
    );

    const { result } = renderHook(() => useErrorReporting(), { wrapper });
    expect(result.current.reportError).toBe(mockCtx.reportError);
    expect(result.current.clearError).toBe(mockCtx.clearError);
  });

  it('should use default no-op context when no provider', () => {
    // Default context has no-op functions; no throw expected
    const { result } = renderHook(() => useErrorReporting());
    expect(typeof result.current.reportError).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });
});
