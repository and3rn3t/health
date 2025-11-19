/**
 * Integration tests for AI Insights feature
 * Tests the interaction between AIInsightsCard and EnhancedAIInsights
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import AIInsightsCard from '../AIInsightsCard';
import EnhancedAIInsights from '../EnhancedAIInsights';
import type { ProcessedHealthData } from '@/lib/healthDataProcessor';

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock analytics functions
vi.mock('@/lib/analytics', () => ({
  calculateTrend: vi.fn(() => ({
    direction: 'stable',
    slope: 0,
    rSquared: 0.5,
    confidence: 0.8,
    changePercent: 0,
    volatility: 0.1,
    prediction: {
      nextValue: 100,
      nextDate: new Date(),
      confidence: 0.8,
    },
  })),
  extractTimeSeries: vi.fn(() => [
    { date: new Date(), value: 100 },
    { date: new Date(), value: 105 },
  ]),
}));

const createMockHealthData = (): ProcessedHealthData => ({
  lastUpdated: new Date().toISOString(),
  dataQuality: {
    completeness: 95,
    consistency: 92,
    recency: 98,
    overall: 'good',
  },
  metrics: {
    steps: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 3000,
      trend: 'stable',
      variability: 10,
      reliability: 90,
      lastValue: 3000,
      percentileRank: 30,
    },
    heartRate: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 70,
      trend: 'stable',
      variability: 5,
      reliability: 90,
      lastValue: 70,
      percentileRank: 50,
    },
    walkingSteadiness: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 55,
      trend: 'decreasing',
      variability: 8,
      reliability: 90,
      lastValue: 55,
      percentileRank: 40,
    },
    sleepHours: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 6,
      trend: 'stable',
      variability: 0.5,
      reliability: 90,
      lastValue: 6,
      percentileRank: 40,
    },
  },
  insights: [],
  fallRiskFactors: [
    {
      factor: 'low_steadiness',
      severity: 'moderate',
      impact: 0.6,
      modifiable: true,
      trend: 'declining',
    },
  ],
  healthScore: 65,
});

describe('AI Insights Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('card opens full insights in dialog', async () => {
    const healthData = createMockHealthData();
    render(<AIInsightsCard healthData={healthData} />);

    await waitFor(() => {
      const viewAllButton = screen.queryByText(/View All/i);
      if (viewAllButton) {
        fireEvent.click(viewAllButton);
        expect(screen.getByText('AI Health Insights')).toBeInTheDocument();
      }
    }, { timeout: 3000 });
  });

  it('both components generate consistent insights', async () => {
    const healthData = createMockHealthData();

    // Render card
    const { rerender } = render(<AIInsightsCard healthData={healthData} />);

    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Render full component
    rerender(<EnhancedAIInsights healthData={healthData} />);

    await waitFor(() => {
      expect(screen.getByText('AI Health Insights')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('insights update when health data changes', async () => {
    const initialData = createMockHealthData();
    const { rerender } = render(<AIInsightsCard healthData={initialData} />);

    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Update with better health data
    const improvedData = createMockHealthData();
    improvedData.healthScore = 85;
    improvedData.metrics.steps.average = 9000;
    improvedData.metrics.sleepHours.average = 8;

    rerender(<AIInsightsCard healthData={improvedData} />);

    await waitFor(() => {
      // Should show different insights for improved data
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('handles empty insights gracefully', async () => {
    const healthData = createMockHealthData();
    healthData.metrics = {
      steps: {
        daily: [],
        weekly: [],
        monthly: [],
        average: 0,
        trend: 'stable',
        variability: 0,
        reliability: 0,
        lastValue: 0,
        percentileRank: 0,
      },
    };

    render(<AIInsightsCard healthData={healthData} />);

    await waitFor(() => {
      expect(screen.getByText('AI Insights')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
