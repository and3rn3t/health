import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useDiagnostics', () => ({
  useDiagnostics: () => ({
    health: null,
    ping: null,
    worker: null,
    wsProbe: null,
    loading: false,
    error: null,
    lastRefresh: null,
    refresh: vi.fn(),
    pingWorker: vi.fn(),
    probeWebSocket: vi.fn(),
  }),
}));

vi.mock('@/hooks/useWebSocket', () => ({
  useWebSocket: () => ({
    connectionState: 'disconnected',
  }),
}));

vi.mock('@/lib/env', () => ({
  isDev: () => true,
}));

const { default: DiagnosticsPanel } = await import('../DiagnosticsPanel');

describe('DiagnosticsPanel', () => {
  it('renders Refresh All button', () => {
    render(<DiagnosticsPanel />);
    expect(
      screen.getByRole('button', { name: /refresh all/i })
    ).toBeInTheDocument();
  });

  it('shows diagnostic section cards', () => {
    render(<DiagnosticsPanel />);
    expect(screen.getByText('API / Worker Health')).toBeInTheDocument();
    expect(screen.getByText('Authentication')).toBeInTheDocument();
    expect(screen.getAllByText('Environment').length).toBeGreaterThan(0);
  });
});
