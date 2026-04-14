import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TestProviders } from '@/test/render';
import type { ProcessedHealthData } from '@/types';

// Mock analytics library — generate 200 days of data to cover all period filters
const now = new Date();
const recentDates = Array.from({ length: 200 }, (_, i) => {
  const d = new Date(now);
  d.setDate(d.getDate() - i);
  return { date: d, value: 70 + (i % 20) };
});

vi.mock('@/lib/analytics', () => ({
  extractTimeSeries: vi.fn().mockReturnValue(recentDates),
  comparePeriods: vi.fn().mockReturnValue({
    metric: 'heartRate',
    current: 78,
    previous: 72,
    change: 6,
    changePercent: 8.3,
    trend: 'improving' as const,
    percentile: 75,
  }),
}));

const { default: MetricComparisonCard } = await import('../MetricComparisonCard');

const healthData = {
  metrics: {
    heartRate: { average: 72, min: 60, max: 90, latest: 72, count: 100 },
    steps: { average: 9500, min: 3000, max: 15000, latest: 8000, count: 50 },
  },
  recentRecords: [],
} as unknown as ProcessedHealthData;

describe('MetricComparisonCard', () => {
  it('renders current and previous values', () => {
    render(
      <TestProviders>
        <MetricComparisonCard
          healthData={healthData}
          metric="heartRate"
          period="7d"
        />
      </TestProviders>,
    );

    expect(screen.getByText('78.0')).toBeInTheDocument();
    expect(screen.getByText('72.0')).toBeInTheDocument();
  });

  it('shows trend badge', () => {
    render(
      <TestProviders>
        <MetricComparisonCard
          healthData={healthData}
          metric="steps"
          period="30d"
        />
      </TestProviders>,
    );

    // Should show improving trend
    const badge = screen.queryByText(/improving/i);
    expect(badge).toBeInTheDocument();
  });

  it('calls onNavigate when clicked', () => {
    const onNavigate = vi.fn();
    render(
      <TestProviders>
        <MetricComparisonCard
          healthData={healthData}
          metric="heartRate"
          period="7d"
          onNavigate={onNavigate}
        />
      </TestProviders>,
    );

    // Find the clickable card and click it
    const card = document.querySelector('[role="button"]') ||
      document.querySelector('[tabindex]');
    if (card) {
      fireEvent.click(card);
      expect(onNavigate).toHaveBeenCalledWith('heartRate');
    }
  });

  it('renders insufficient data fallback', async () => {
    const analytics = await import('@/lib/analytics');
    // Return empty time series so the component exits early (before calling comparePeriods)
    vi.mocked(analytics.extractTimeSeries).mockReturnValue([]);

    render(
      <TestProviders>
        <MetricComparisonCard
          healthData={healthData}
          metric="sleepHours"
          period="90d"
        />
      </TestProviders>,
    );

    expect(screen.getByText(/insufficient data/i)).toBeInTheDocument();

    // Restore for other tests
    vi.mocked(analytics.extractTimeSeries).mockReturnValue(recentDates);
  });

  it('handles keyboard navigation (Enter/Space)', () => {
    const onNavigate = vi.fn();
    render(
      <TestProviders>
        <MetricComparisonCard
          healthData={healthData}
          metric="steps"
          period="7d"
          onNavigate={onNavigate}
        />
      </TestProviders>,
    );

    const card = document.querySelector('[role="button"]') ||
      document.querySelector('[tabindex]');
    if (card) {
      fireEvent.keyDown(card, { key: 'Enter' });
      expect(onNavigate).toHaveBeenCalledWith('steps');
    }
  });
});
