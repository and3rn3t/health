import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render } from '@testing-library/react';
import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { GaitTrendsPanel } from '../GaitTrendsPanel';

// We mock the hook so we can drive deterministic UI states for snapshotting.
// The component only depends on: { data, isLoading, error }
interface MockTrendMetric {
  direction: 'improving' | 'stable' | 'declining' | null;
  slope: number | null;
  confidence: number | null;
  sampleCount?: number;
  relativeSlope?: number | null;
  severity?:
    | 'strong_improvement'
    | 'moderate_improvement'
    | 'mild_improvement'
    | 'stable'
    | 'mild_decline'
    | 'moderate_decline'
    | 'strong_decline'
    | 'insufficient_data';
}

type MockScenario = {
  trends?: Record<string, MockTrendMetric>;
  rolling?: Record<string, number | null>;
  trend?: MockTrendMetric; // legacy single metric path
};

let scenario: MockScenario = {};

vi.mock('@/hooks/useRecentGait', () => ({
  useRecentGait: () => ({
    data:
      scenario.trends || scenario.trend
        ? { ok: true, userId: 'u1', count: 10, snapshots: [], ...scenario }
        : undefined,
    isLoading: false,
    error: null,
  }),
}));

function renderWithClient(ui: React.ReactElement) {
  const client = new QueryClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}

describe('GaitTrendsPanel snapshots', () => {
  beforeEach(() => {
    cleanup();
  });

  it('renders populated multi-metric trends (relative view default) consistently', () => {
    scenario = {
      trends: {
        speed: {
          direction: 'improving',
          // Pronounced improvement
          slope: 0.012345,
          relativeSlope: 0.0456,
          confidence: 0.92,
          sampleCount: 18,
          severity: 'strong_improvement',
        },
        cadence: {
          direction: 'improving',
          slope: 0.0088,
          relativeSlope: 0.0321,
          confidence: 0.81,
          sampleCount: 18,
          severity: 'moderate_improvement',
        },
        asymmetry: {
          direction: 'improving',
          slope: -0.0012,
          relativeSlope: 0.014,
          confidence: 0.74,
          sampleCount: 18,
          severity: 'mild_improvement',
        },
        variability: {
          direction: 'stable',
          slope: 0.0,
          relativeSlope: 0.004,
          confidence: 0.55,
          sampleCount: 18,
          severity: 'stable',
        },
      },
      rolling: {
        speedAvg: 1.23456,
        speedVar: 0.0123,
        cadenceAvg: 102.4,
        asymAvg: 0.0345,
        variabilityAvg: 0.0567,
      },
    };
    const { container } = renderWithClient(<GaitTrendsPanel />);
    expect(container).toMatchSnapshot();
  });

  it('renders absolute slope view after toggle click', () => {
    // Reuse prior populated scenario (unchanged)
    const { container, getByRole } = renderWithClient(<GaitTrendsPanel />);
    // Toggle button labelled by current state ('Rel' showing means clicking switches to Abs)
    const toggle = getByRole('button', { name: 'Rel' });
    fireEvent.click(toggle);
    expect(container).toMatchSnapshot();
  });

  it('renders empty state (no trend data)', () => {
    scenario = {}; // clears trends
    const { container } = renderWithClient(<GaitTrendsPanel />);
    expect(container).toMatchSnapshot();
  });

  it('momentum borderline stable vs upward snapshots', () => {
    scenario = {
      trends: {
        speed: {
          direction: 'improving',
          slope: 0.001,
          relativeSlope: 0.05,
          confidence: 0.9,
          sampleCount: 10,
          severity: 'mild_improvement',
        },
        cadence: {
          direction: 'stable',
          slope: 0,
          relativeSlope: 0.05,
          confidence: 0.9,
          sampleCount: 10,
          severity: 'stable',
        },
        variability: {
          direction: 'stable',
          slope: 0,
          relativeSlope: 0.05,
          confidence: 0.9,
          sampleCount: 10,
          severity: 'stable',
        },
      },
    };
    const stableContainer = renderWithClient(<GaitTrendsPanel />).container;
    expect(stableContainer).toMatchSnapshot();
    scenario = {
      trends: {
        speed: {
          direction: 'improving',
          slope: 0.001,
          relativeSlope: 0.05,
          confidence: 0.9,
          sampleCount: 10,
          severity: 'mild_improvement',
        },
        cadence: {
          direction: 'stable',
          slope: 0,
          relativeSlope: 0.005,
          confidence: 0.3,
          sampleCount: 10,
          severity: 'stable',
        },
        variability: {
          direction: 'stable',
          slope: 0,
          relativeSlope: 0.005,
          confidence: 0.3,
          sampleCount: 10,
          severity: 'stable',
        },
      },
    };
    const upwardRender = renderWithClient(<GaitTrendsPanel />);
    expect(upwardRender.getByText('Upward')).toBeInTheDocument();
    expect(upwardRender.container).toMatchSnapshot();
  });
});
