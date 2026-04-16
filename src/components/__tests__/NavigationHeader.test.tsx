import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@tanstack/react-router', () => ({
  useRouterState: ({
    select,
  }: {
    select: (s: { location: { pathname: string } }) => string;
  }) => select({ location: { pathname: '/' } }),
  Link: ({
    children,
    to,
    ...props
  }: {
    children: React.ReactNode;
    to: string;
    [key: string]: unknown;
  }) => (
    <a href={to} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/hooks/useThemeMode', () => ({
  useThemeMode: () => ({
    themeMode: 'light',
    toggleThemeMode: vi.fn(),
    effectiveTheme: 'light',
  }),
}));

vi.mock('@/hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

vi.mock('@/components/health/DeviceStatusIndicator', () => ({
  DeviceStatusIndicator: () => <div data-testid="device-status" />,
}));

vi.mock('@/components/live/LiveConnectionStatus', () => ({
  LiveConnectionStatus: () => <div data-testid="live-status" />,
}));

vi.mock('@/components/nav/AppleSidebar', () => ({
  AppleSidebarTrigger: () => <button data-testid="sidebar-trigger" />,
}));

const { default: NavigationHeader } = await import('../NavigationHeader');

describe('NavigationHeader', () => {
  it('renders breadcrumb with Home', () => {
    render(<NavigationHeader />);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });
});
