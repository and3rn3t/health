import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { WalkingPatternVisualizer } from '../WalkingPatternVisualizerClean';

describe('WalkingPatternVisualizer', () => {
  it('renders the heading', () => {
    render(<WalkingPatternVisualizer />);
    expect(screen.getByText('Walking Pattern Visualizer')).toBeInTheDocument();
  });

  it('shows start tracking button', () => {
    render(<WalkingPatternVisualizer />);
    expect(
      screen.getByRole('button', { name: /start tracking/i })
    ).toBeInTheDocument();
  });
});
