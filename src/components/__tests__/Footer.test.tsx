import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/health/WSTokenSettings', () => ({
  __esModule: true,
  default: () => <div data-testid="ws-token-settings" />,
}));

const { default: Footer } = await import('../Footer');

describe('Footer', () => {
  const defaultProps = {
    onNavigate: vi.fn(),
  };

  it('renders VitalSense branding', () => {
    render(<Footer {...defaultProps} />);
    expect(screen.getByText('VitalSense')).toBeInTheDocument();
  });

  it('shows connection status text', () => {
    render(<Footer {...defaultProps} connectionStatus="connected" />);
    expect(screen.getByText('Connected')).toBeInTheDocument();
  });

  it('shows disconnected status', () => {
    render(<Footer {...defaultProps} connectionStatus="disconnected" />);
    expect(screen.getByText('Disconnected')).toBeInTheDocument();
  });

  it('displays health score when provided', () => {
    render(<Footer {...defaultProps} healthScore={85} />);
    expect(screen.getByText('85/100')).toBeInTheDocument();
  });

  it('renders quick link buttons', () => {
    render(<Footer {...defaultProps} />);
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('Setup')).toBeInTheDocument();
    expect(screen.getByText('Emergency')).toBeInTheDocument();
  });
});
