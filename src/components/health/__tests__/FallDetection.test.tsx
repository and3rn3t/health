import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import FallDetection from '../FallDetection';

describe('FallDetection', () => {
  it('renders the heading and description', () => {
    render(<FallDetection />);
    expect(
      screen.getByRole('heading', { name: /fall detection system/i })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ai-powered fall detection with automatic emergency alerts/i)
    ).toBeInTheDocument();
  });

  it('shows system status active', () => {
    render(<FallDetection />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('24/7 Monitoring Enabled')).toBeInTheDocument();
  });

  it('displays all three status cards', () => {
    render(<FallDetection />);
    expect(screen.getByText('System Status')).toBeInTheDocument();
    expect(screen.getByText('Last Check')).toBeInTheDocument();
    expect(screen.getByText('Risk Level')).toBeInTheDocument();
  });

  it('displays the risk level as Low', () => {
    render(<FallDetection />);
    expect(screen.getByText('Low')).toBeInTheDocument();
    expect(screen.getByText('Based on Activity')).toBeInTheDocument();
  });

  it('renders detection settings section', () => {
    render(<FallDetection />);
    expect(
      screen.getByRole('heading', { name: /detection settings/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Automatic Detection')).toBeInTheDocument();
    expect(screen.getByText('Emergency Alerts')).toBeInTheDocument();
    expect(screen.getByText('Apple Watch Integration')).toBeInTheDocument();
  });

  it('renders recent activity log', () => {
    render(<FallDetection />);
    expect(
      screen.getByRole('heading', { name: /recent activity/i })
    ).toBeInTheDocument();
    expect(screen.getByText('Normal Activity Detected')).toBeInTheDocument();
    expect(screen.getByText('Exercise Session Started')).toBeInTheDocument();
    expect(screen.getByText('System Check Completed')).toBeInTheDocument();
  });

  it('renders action buttons', () => {
    render(<FallDetection />);
    expect(
      screen.getByRole('button', { name: /test alert system/i })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /configure contacts/i })
    ).toBeInTheDocument();
  });

  it('shows coming soon notice', () => {
    render(<FallDetection />);
    expect(
      screen.getByText(/advanced ai fall detection coming soon/i)
    ).toBeInTheDocument();
  });
});
