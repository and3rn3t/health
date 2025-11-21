/**
 * Tests for PredictiveHealthAlerts toast usage with useOnceToast
 */

import type { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { act, render, screen, waitFor } from '@testing-library/react';
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
    // The button might have text like "Generate Trends" or "Analyze"
    const allButtons = screen.getAllByRole('button');
    const analyzeButton = allButtons.find(
      (btn) =>
        !btn.hasAttribute('disabled') &&
        (btn.textContent?.toLowerCase().includes('analyze') ||
          btn.textContent?.toLowerCase().includes('generate') ||
          btn.textContent?.toLowerCase().includes('trend'))
    );

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
      // If no button found, try clicking the first enabled button
      const enabledButton = allButtons.find(
        (btn) => !btn.hasAttribute('disabled')
      );
      if (enabledButton) {
        enabledButton.click();
        await waitFor(
          () => {
            expect(mockShowOnce).toHaveBeenCalled();
          },
          { timeout: 5000 }
        );
      } else {
        // Fallback: wait for any toast call (in case analysis runs automatically)
        await waitFor(
          () => {
            expect(mockShowOnce).toHaveBeenCalled();
          },
          { timeout: 5000 }
        );
      }
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
      // Use getAllByText since there might be multiple instances
      const elements = screen.getAllByText(/Predictive Health Alerts/i);
      expect(elements.length).toBeGreaterThan(0);
    });

    // Wait for alerts to be rendered
    await waitFor(
      () => {
        // Check if alert is displayed
        const alertElements = screen.queryAllByText(/Test Alert/i);
        expect(alertElements.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );

    // Find acknowledge button - try multiple ways
    let acknowledgeButton: HTMLElement | null = null;

    // Try finding by text (case insensitive)
    const buttonsByText = screen.queryAllByText(/acknowledge/i);
    if (buttonsByText.length > 0) {
      acknowledgeButton = buttonsByText[0];
    } else {
      // Try finding by role and accessible name
      const buttonsByRole = screen.queryAllByRole('button');
      acknowledgeButton =
        buttonsByRole.find((btn) =>
          btn.textContent?.toLowerCase().includes('acknowledge')
        ) || null;
    }

    if (acknowledgeButton) {
      // Click the acknowledge button
      await act(async () => {
        acknowledgeButton!.click();
      });

      // Wait for the toast to be called
      await waitFor(
        () => {
          // Verify useOnceToast was called with unique ID for acknowledgment
          expect(mockShowOnce).toHaveBeenCalledWith(
            'alert-acknowledged-alert-1',
            'success',
            'Alert acknowledged'
          );
        },
        { timeout: 3000 }
      );
    } else {
      // If no acknowledge button found, the alerts might not be displayed
      // or the component structure changed. In this case, we can't test acknowledgment,
      // but we should at least verify the component renders with alerts
      const alertElements = screen.queryAllByText(/Test Alert/i);
      expect(alertElements.length).toBeGreaterThan(0);
      // Note: This test requires the acknowledge button to be present
      // If it's not found, the test scenario cannot be completed
      throw new Error(
        'Acknowledge button not found - cannot test acknowledgment toast'
      );
    }
  });
});
