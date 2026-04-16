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

const { MobileBottomTabs } = await import('../MobileBottomTabs');

describe('MobileBottomTabs', () => {
  it('renders navigation element', () => {
    render(<MobileBottomTabs />);
    expect(
      screen.getByRole('navigation', { name: /main navigation/i })
    ).toBeInTheDocument();
  });

  it('renders Dashboard tab', () => {
    render(<MobileBottomTabs />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('marks current route as active', () => {
    render(<MobileBottomTabs />);
    const dashboardLink = screen.getByText('Dashboard').closest('a');
    expect(dashboardLink).toHaveAttribute('aria-current', 'page');
  });
});
