import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { TestProviders } from '@/test/render';
import type { ProcessedHealthData } from '@/types';
import type { AnalyticsSummary } from '@/lib/analytics';

vi.mock('@/hooks/useOnceToast', () => ({
  useOnceToast: () => vi.fn(),
}));

const { default: AnalyticsExporter } = await import('../AnalyticsExporter');

const healthData = {
  healthScore: 82,
  metrics: {
    heartRate: { average: 72, min: 60, max: 90, latest: 72, count: 100 },
    steps: { average: 9500, min: 3000, max: 15000, latest: 8000, count: 50 },
  },
  recentRecords: [],
} as unknown as ProcessedHealthData;

const analyticsSummary = {
  overallScore: 82,
  trendDirection: 'improving' as const,
  anomalyCount: 2,
  recommendations: ['Keep walking'],
} as unknown as AnalyticsSummary;

describe('AnalyticsExporter', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders export button', () => {
    render(
      <TestProviders>
        <AnalyticsExporter
          healthData={healthData}
          analyticsSummary={analyticsSummary}
        />
      </TestProviders>,
    );

    expect(screen.getByText(/export/i)).toBeInTheDocument();
  });

  it('opens dialog when export button is clicked', async () => {
    render(
      <TestProviders>
        <AnalyticsExporter
          healthData={healthData}
          analyticsSummary={analyticsSummary}
        />
      </TestProviders>,
    );

    fireEvent.click(screen.getByText(/export/i));

    await waitFor(() => {
      const dialog = document.querySelector('[role="dialog"]');
      expect(dialog || screen.queryByText(/export analytics report/i)).toBeTruthy();
    });
  });

  it('renders without crashing with null healthData', () => {
    const { container } = render(
      <TestProviders>
        <AnalyticsExporter
          healthData={null}
          analyticsSummary={analyticsSummary}
        />
      </TestProviders>,
    );
    expect(container).toBeTruthy();
  });
});
