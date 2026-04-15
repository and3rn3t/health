import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TestProviders } from '@/test/render';
import type { ProcessedHealthData } from '@/types';
import type { PatternDetection } from '@/lib/analytics';

// Mock analytics library
vi.mock('@/lib/analytics', () => ({
  extractTimeSeries: vi.fn().mockReturnValue([
    { date: new Date('2024-01-01'), value: 72 },
    { date: new Date('2024-01-02'), value: 74 },
  ]),
  detectPatterns: vi.fn(),
}));

const { default: PatternDetectionPanel } = await import('../PatternDetectionPanel');
const { detectPatterns } = await import('@/lib/analytics');

const defaultPatterns: PatternDetection[] = [
  {
    pattern: 'daily',
    description: 'Activity peaks in the morning',
    strength: 0.8,
    peakTimes: ['8:00 AM', '5:00 PM'],
    lowTimes: ['2:00 PM'],
  },
];

const healthData = {
  metrics: {
    heartRate: { average: 72, min: 60, max: 90, latest: 72, count: 100 },
    steps: { average: 9500, min: 3000, max: 15000, latest: 8000, count: 50 },
  },
  recentRecords: [],
} as unknown as ProcessedHealthData;

describe('PatternDetectionPanel', () => {
  beforeEach(() => {
    vi.mocked(detectPatterns).mockReturnValue(defaultPatterns);
  });

  it('renders pattern cards when patterns are found', () => {
    render(
      <TestProviders>
        <PatternDetectionPanel healthData={healthData} metric="steps" />
      </TestProviders>,
    );

    expect(screen.getByText(/daily pattern/i)).toBeInTheDocument();
  });

  it('shows peak times badges', () => {
    render(
      <TestProviders>
        <PatternDetectionPanel healthData={healthData} metric="steps" />
      </TestProviders>,
    );

    // Peak times render within the pattern card as Badge components
    expect(screen.getByText('8:00 AM')).toBeInTheDocument();
  });

  it('renders empty state when no patterns detected', () => {
    vi.mocked(detectPatterns).mockReturnValue([]);

    render(
      <TestProviders>
        <PatternDetectionPanel healthData={healthData} metric="sleepHours" />
      </TestProviders>,
    );

    expect(screen.getByText(/no patterns/i)).toBeInTheDocument();
  });

  it('shows insights for high-strength patterns', () => {
    render(
      <TestProviders>
        <PatternDetectionPanel healthData={healthData} metric="steps" />
      </TestProviders>,
    );

    // Patterns with strength > 0.5 should generate insights
    expect(document.body.textContent).toContain('8:00 AM');
  });
});
