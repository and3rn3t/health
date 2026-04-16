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

const { MobileHeader } = await import('../MobileHeader');

describe('MobileHeader', () => {
  it('renders the page title', () => {
    render(<MobileHeader />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(<MobileHeader />);
    expect(
      screen.getByRole('button', { name: /switch to dark mode/i })
    ).toBeInTheDocument();
  });
});
