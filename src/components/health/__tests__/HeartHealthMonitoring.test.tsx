import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import HeartHealthMonitoring from '../HeartHealthMonitoring';

describe('HeartHealthMonitoring', () => {
  it('renders the heading', () => {
    render(<HeartHealthMonitoring />);
    expect(
      screen.getByRole('heading', { name: /heart health monitoring/i })
    ).toBeInTheDocument();
  });

  it('displays heart rate metrics', () => {
    render(<HeartHealthMonitoring />);
    expect(screen.getByText('Current HR')).toBeInTheDocument();
    expect(screen.getByText('Resting HR')).toBeInTheDocument();
  });

  it('displays HRV and health score', () => {
    render(<HeartHealthMonitoring />);
    expect(screen.getByText('HRV')).toBeInTheDocument();
    expect(screen.getByText('Health Score')).toBeInTheDocument();
  });
});
