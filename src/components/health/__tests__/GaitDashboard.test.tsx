import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('../LiDARGaitAnalyzerClean', () => ({
  LiDARGaitAnalyzer: () => <div data-testid="lidar-analyzer" />,
}));

vi.mock('../WalkingPatternVisualizerClean', () => ({
  WalkingPatternVisualizer: () => <div data-testid="walking-visualizer" />,
}));

const { GaitDashboard } = await import('../GaitDashboardClean');

describe('GaitDashboard', () => {
  it('renders mode selection buttons', () => {
    render(<GaitDashboard />);
    expect(
      screen.getByRole('button', { name: 'Overview' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'LiDAR Analysis' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Walking Tracker' })
    ).toBeInTheDocument();
  });

  it('shows overview mode by default', () => {
    render(<GaitDashboard />);
    const overviewBtn = screen.getByRole('button', { name: 'Overview' });
    expect(overviewBtn).toHaveAttribute('aria-pressed', 'true');
  });

  it('displays quick stats in overview', () => {
    render(<GaitDashboard />);
    expect(screen.getByText('Gait Quality')).toBeInTheDocument();
    expect(screen.getByText('Balance Score')).toBeInTheDocument();
  });
});
