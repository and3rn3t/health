import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';
import {
  AppWsContext,
  type AppWsContextValue,
} from '@/contexts/AppWebSocketContext';
import { useAppWebSocket } from '@/contexts/useAppWebSocket';

function wrapper(value: AppWsContextValue) {
  return ({ children }: { children: ReactNode }) => (
    <AppWsContext.Provider value={value}>{children}</AppWsContext.Provider>
  );
}

describe('useAppWebSocket', () => {
  it('returns context value when used inside provider', () => {
    const value: AppWsContextValue = {
      client: null,
      socket: null,
      lastMetrics: { heart_rate: 72 },
    };

    const { result } = renderHook(() => useAppWebSocket(), {
      wrapper: wrapper(value),
    });

    expect(result.current.lastMetrics).toEqual({ heart_rate: 72 });
    expect(result.current.client).toBeNull();
    expect(result.current.socket).toBeNull();
  });

  it('throws when used outside provider', () => {
    expect(() => {
      renderHook(() => useAppWebSocket());
    }).toThrow('useAppWebSocket must be used within AppWebSocketProvider');
  });
});
