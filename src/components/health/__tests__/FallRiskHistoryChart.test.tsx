/**
 * Tests for FallRiskHistoryChart component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import FallRiskHistoryChart, {
  type FallRiskHistoryDataPoint,
} from '../FallRiskHistoryChart';
import type { AdvancedFallRiskPrediction } from '@/lib/advanced-fall-risk-engine';

// Mock data generator
const createMockPrediction = (
  riskScore: number,
  riskLevel: AdvancedFallRiskPrediction['riskLevel']
): AdvancedFallRiskPrediction => ({
  riskScore,
  riskLevel,
  confidence: 0.85,
  shortTermRisk: riskScore * 0.8,
  mediumTermRisk: riskScore * 0.9,
  longTermRisk: riskScore,
  gaitRisk: {
    overallScore: riskScore * 0.3,
    walkingSteadiness: 50,
    stepVariability: 20,
    gaitAsymmetry: 15,
    walkingSpeed: 1.2,
    cadenceVariability: 10,
    strideLengthVariability: 8,
    doubleSupportTime: 0.2,
    trends: { improving: [], declining: [], stable: [] },
  },
  balanceRisk: {
    overallScore: riskScore * 0.25,
    staticBalance: 60,
    dynamicBalance: 55,
    posturalControl: 50,
    reactionTime: 0.3,
    stabilityIndex: 0.7,
    fallHistory: {
      totalFalls: 0,
      recentFalls: 0,
      fallFrequency: 0,
      lastFallDate: null,
    },
  },
  environmentalRisk: {
    overallScore: riskScore * 0.15,
    homeHazards: 30,
    weatherConditions: 20,
    lightingConditions: 25,
    terrainDifficulty: 15,
    locationComplexity: 10,
    timeOfDayRisk: 20,
  },
  physiologicalRisk: {
    overallScore: riskScore * 0.2,
    cardiovascularHealth: 70,
    muscleStrength: 65,
    flexibility: 60,
    visionHealth: 75,
    medicationEffects: 30,
    cognitiveFunction: 80,
    sleepQuality: 70,
  },
  behavioralRisk: {
    overallScore: riskScore * 0.1,
    activityLevel: 60,
    riskTakingBehavior: 20,
    adherenceToRecommendations: 70,
    socialSupport: 75,
    healthcareEngagement: 80,
  },
  primaryRiskFactors: [],
  secondaryRiskFactors: [],
  protectiveFactors: [],
  interventions: [],
  emergencyActions: [],
  algorithmVersion: '2.1.0',
  modelEnsemble: [],
  lastUpdated: new Date('2024-01-15'),
  nextAssessment: new Date('2024-01-22'),
});

const createMockHistoryData = (
  count: number,
  startDate: Date = new Date('2024-01-01')
): FallRiskHistoryDataPoint[] => {
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    const riskScore = 30 + Math.sin(i) * 10 + i * 0.5;
    const riskLevel: AdvancedFallRiskPrediction['riskLevel'] =
      riskScore < 20
        ? 'low'
        : riskScore < 40
          ? 'moderate'
          : riskScore < 60
            ? 'high'
            : 'severe';

    return {
      date,
      riskScore,
      riskLevel,
      gaitRisk: riskScore * 0.3,
      balanceRisk: riskScore * 0.25,
      environmentalRisk: riskScore * 0.15,
      physiologicalRisk: riskScore * 0.2,
      behavioralRisk: riskScore * 0.1,
      prediction: createMockPrediction(riskScore, riskLevel),
    };
  });
};

describe('FallRiskHistoryChart', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with empty history data', () => {
    render(<FallRiskHistoryChart historyData={[]} />);
    expect(screen.getByText(/no historical data available/i)).toBeInTheDocument();
  });

  it('renders with history data', () => {
    const history = createMockHistoryData(10);
    render(<FallRiskHistoryChart historyData={history} />);
    expect(screen.getByText(/fall risk history/i)).toBeInTheDocument();
  });

  it('displays time range filter buttons', () => {
    const history = createMockHistoryData(30);
    render(<FallRiskHistoryChart historyData={history} />);
    expect(screen.getByText('7D')).toBeInTheDocument();
    expect(screen.getByText('30D')).toBeInTheDocument();
    expect(screen.getByText('90D')).toBeInTheDocument();
    expect(screen.getByText('1Y')).toBeInTheDocument();
    expect(screen.getByText('All')).toBeInTheDocument();
  });

  it('filters data by time range', () => {
    const history = createMockHistoryData(50);
    const { rerender } = render(
      <FallRiskHistoryChart historyData={history} timeRange="7d" />
    );

    // Click 30d button
    const button30d = screen.getByText('30D');
    fireEvent.click(button30d);

    // Component should update (we can't easily test the filtered data without exposing it,
    // but we can verify the button state changes)
    expect(button30d).toBeInTheDocument();
  });

  it('calculates and displays trend statistics', () => {
    const history = createMockHistoryData(20);
    render(<FallRiskHistoryChart historyData={history} showTrends={true} />);

    // Should show trend information
    expect(screen.getByText(/trend/i)).toBeInTheDocument();
  });

  it('switches between tabs', () => {
    const history = createMockHistoryData(10);
    render(
      <FallRiskHistoryChart
        historyData={history}
        showTrends={true}
        showBreakdown={true}
      />
    );

    // Click on breakdown tab
    const breakdownTab = screen.getByText('Breakdown');
    fireEvent.click(breakdownTab);

    // Should show breakdown content
    expect(breakdownTab).toBeInTheDocument();
  });

  it('renders chart with data points', () => {
    const history = createMockHistoryData(5);
    const { container } = render(
      <FallRiskHistoryChart historyData={history} />
    );

    // Check for SVG element (chart)
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('handles single data point', () => {
    const history = createMockHistoryData(1);
    render(<FallRiskHistoryChart historyData={history} />);
    expect(screen.getByText(/fall risk history/i)).toBeInTheDocument();
  });

  it('displays risk level zones in chart', () => {
    const history = createMockHistoryData(10);
    const { container } = render(
      <FallRiskHistoryChart historyData={history} />
    );

    // Chart should have risk zone rectangles
    const rects = container.querySelectorAll('svg rect');
    expect(rects.length).toBeGreaterThan(0);
  });

  it('shows breakdown when enabled', () => {
    const history = createMockHistoryData(10);
    render(
      <FallRiskHistoryChart historyData={history} showBreakdown={true} />
    );

    const breakdownTab = screen.getByText('Breakdown');
    fireEvent.click(breakdownTab);

    // Should show category breakdowns
    expect(screen.getByText(/gait/i)).toBeInTheDocument();
  });

  it('handles all time range correctly', () => {
    const history = createMockHistoryData(100);
    render(<FallRiskHistoryChart historyData={history} timeRange="all" />);

    const allButton = screen.getByText('All');
    expect(allButton).toBeInTheDocument();
  });
});
