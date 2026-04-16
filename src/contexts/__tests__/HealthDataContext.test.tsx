import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { HealthDataProvider, useHealthData } from '../HealthDataContext';
import { TestProviders } from '@/test/render';
import { useKV } from '@/hooks/useLocalKV';

// Mock dependencies
vi.mock('@/hooks/useLocalKV', () => ({
  useKV: vi.fn().mockReturnValue([null, vi.fn()]),
}));

vi.mock('@/lib/healthDataProcessor', () => ({
  HealthDataProcessor: {
    processHealthData: vi.fn().mockResolvedValue({
      metrics: { walkingSteadiness: { average: 80 } },
    }),
  },
}));

const mockedUseKV = vi.mocked(useKV);

describe('HealthDataContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset to default mock for each test
    mockedUseKV.mockReturnValue([null, vi.fn()]);
  });

  describe('HealthDataProvider', () => {
    it('renders children', () => {
      render(
        <TestProviders>
          <HealthDataProvider>
            <div data-testid="child">Hello</div>
          </HealthDataProvider>
        </TestProviders>,
      );
      expect(screen.getByTestId('child')).toBeInTheDocument();
    });

    it('provides healthData as null initially', () => {
      function Consumer() {
        const { healthData } = useHealthData();
        return <span data-testid="data">{healthData === null ? 'null' : 'set'}</span>;
      }

      render(
        <TestProviders>
          <HealthDataProvider>
            <Consumer />
          </HealthDataProvider>
        </TestProviders>,
      );
      expect(screen.getByTestId('data').textContent).toBe('null');
    });

    it('computes fallRiskScore from walkingSteadiness', () => {
      mockedUseKV.mockImplementation((key: string) => {
        if (key === 'health-data') {
          return [
            { metrics: { walkingSteadiness: { average: 60 } } },
            vi.fn(),
          ] as ReturnType<typeof useKV>;
        }
        return [null, vi.fn()] as ReturnType<typeof useKV>;
      });

      function Consumer() {
        const { fallRiskScore } = useHealthData();
        return <span data-testid="score">{fallRiskScore}</span>;
      }

      render(
        <TestProviders>
          <HealthDataProvider>
            <Consumer />
          </HealthDataProvider>
        </TestProviders>,
      );
      // (100 - 60) / 25 = 1.6 → rounded to 1.6
      const score = Number(screen.getByTestId('score').textContent);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(4);
    });

    it('returns 0 fallRiskScore when walkingSteadiness is null', () => {
      mockedUseKV.mockImplementation((key: string) => {
        if (key === 'health-data') {
          return [{ metrics: {} }, vi.fn()] as ReturnType<typeof useKV>;
        }
        return [null, vi.fn()] as ReturnType<typeof useKV>;
      });

      function Consumer() {
        const { fallRiskScore } = useHealthData();
        return <span data-testid="score">{fallRiskScore}</span>;
      }

      render(
        <TestProviders>
          <HealthDataProvider>
            <Consumer />
          </HealthDataProvider>
        </TestProviders>,
      );
      expect(screen.getByTestId('score').textContent).toBe('0');
    });
  });

  describe('useHealthData', () => {
    it('throws when used outside HealthDataProvider', () => {
      function Bad() {
        useHealthData();
        return null;
      }

      // Suppress React error boundary noise
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      expect(() =>
        render(
          <TestProviders>
            <Bad />
          </TestProviders>,
        ),
      ).toThrow('useHealthData must be used within HealthDataProvider');
      spy.mockRestore();
    });
  });
});
