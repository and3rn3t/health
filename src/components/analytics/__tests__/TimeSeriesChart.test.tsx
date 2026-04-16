import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/analytics', () => ({
  calculateTrend: vi.fn().mockReturnValue({
    direction: 'stable',
    slope: 0,
    rSquared: 0.5,
    confidence: 0.5,
    changePercent: 1,
    volatility: 0.1,
    prediction: { nextValue: 72, nextDate: new Date(), confidence: 0.5 },
  }),
}));

const { default: TimeSeriesChart } = await import('../TimeSeriesChart');

const mockData = [
  { date: new Date('2026-04-01'), value: 72 },
  { date: new Date('2026-04-02'), value: 75 },
  { date: new Date('2026-04-03'), value: 70 },
  { date: new Date('2026-04-04'), value: 73 },
  { date: new Date('2026-04-05'), value: 74 },
];

describe('TimeSeriesChart', () => {
  it('renders the chart title', () => {
    render(<TimeSeriesChart title="Heart Rate" data={mockData} />);
    expect(screen.getByText('Heart Rate')).toBeInTheDocument();
  });

  it('renders with unit label', () => {
    render(<TimeSeriesChart title="Steps" data={mockData} unit="steps" />);
    expect(screen.getByText('Steps')).toBeInTheDocument();
  });

  it('renders SVG element', () => {
    const { container } = render(
      <TimeSeriesChart title="Test" data={mockData} />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
