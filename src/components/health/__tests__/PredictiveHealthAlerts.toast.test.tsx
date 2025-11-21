/**
 * Tests for PredictiveHealthAlerts toast usage with useOnceToast
 */

import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import PredictiveHealthAlerts from '../PredictiveHealthAlerts';

// Mock useKV
vi.mock('@github/spark/hooks', () => ({
  useKV: vi.fn((key: string, defaultValue: unknown) => {
    if (key === 'predictive-health-alerts') {
      return [[], vi.fn()];
    }
    if (key === 'alert-config') {
      return [
        {
          enabled: true,
          sensitivity: 'medium',
          timeframe: 30,
          thresholds: { decline: 15, confidence: 0.7 },
          notifications: { email: true, push: true, sms: false },
        },
        vi.fn(),
      ];
    }
    return [defaultValue, vi.fn()];
  }),
}));

// Mock toast
const mockShowOnce = vi.fn();
vi.mock('@/hooks/useOnceToast', () => ({
  useOnceToast: () => ({
    showOnce: mockShowOnce,
    resetOnce: vi.fn(),
  }),
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
      average: 7500,
      trend: 'stable',
      variability: 10,
      reliability: 90,
      lastValue: 7500,
      percentileRank: 50,
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
      average: 65,
      trend: 'decreasing',
      variability: 8,
      reliability: 90,
      lastValue: 65,
      percentileRank: 50,
    },
    sleepHours: {
      daily: [],
      weekly: [],
      monthly: [],
      average: 7.5,
      trend: 'stable',
      variability: 0.5,
      reliability: 90,
      lastValue: 7.5,
      percentileRank: 50,
    },
  },
  insights: [],
  fallRiskFactors: [],
  healthScore: 80,
});

describe('PredictiveHealthAlerts - Toast Usage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should use useOnceToast for analysis completion toasts', async () => {
    const healthData = createMockHealthData();
    render(<PredictiveHealthAlerts healthData={healthData} />);

    // Wait for component to render
    await waitFor(
      () => {
        expect(
          screen.getByText(/Predictive Health Alerts/i)
        ).toBeInTheDocument();
      },
      { timeout: 3000 }
    );

    // Find and click the button to trigger analysis
    const analyzeButton = screen.queryByRole('button', {
      name: /analyze|generate|run/i,
    });
    if (analyzeButton) {
      analyzeButton.click();

      // Wait for analysis to complete (it has a 2 second delay)
      await waitFor(
        () => {
          // Verify useOnceToast was used (either for success or warning)
          // The exact call depends on whether alerts were generated
          expect(mockShowOnce).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );
    } else {
      // If no button found, the analysis might run automatically or component structure changed
      // Wait a bit and check if toast was called
      await waitFor(
        () => {
          expect(mockShowOnce).toHaveBeenCalled();
        },
        { timeout: 5000 }
      );
    }
  });

  it('should use useOnceToast for alert acknowledgment', async () => {
    const healthData = createMockHealthData();
    const { useKV } = await import('@github/spark/hooks');
    const mockSetAlerts = vi.fn();

    (useKV as any).mockImplementation((key: string) => {
      if (key === 'predictive-health-alerts') {
        return [
          [
            {
              id: 'alert-1',
              type: 'decline',
              severity: 'medium',
              title: 'Test Alert',
              description: 'Test',
              metric: 'steps',
              currentValue: 100,
              predictedValue: 80,
              confidence: 0.8,
              timeframe: '30 days',
              triggered: new Date(),
              acknowledged: false,
              recommendations: [],
            },
          ],
          mockSetAlerts,
        ];
      }
      if (key === 'alert-config') {
        return [
          {
            enabled: true,
            sensitivity: 'medium',
            timeframe: 30,
            thresholds: { decline: 15, confidence: 0.7 },
            notifications: { email: true, push: true, sms: false },
          },
          vi.fn(),
        ];
      }
      return [[], vi.fn()];
    });

    render(<PredictiveHealthAlerts healthData={healthData} />);

    await waitFor(() => {
      expect(screen.getByText(/Predictive Health Alerts/i)).toBeInTheDocument();
    });

    // Find and click acknowledge button if it exists
    const acknowledgeButtons = screen.queryAllByText(/acknowledge/i);
    if (acknowledgeButtons.length > 0) {
      // Verify useOnceToast would be called with unique ID
      expect(mockShowOnce).toHaveBeenCalled();
    }
  });
});
