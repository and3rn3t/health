/**
 * Tests for RiskComparisonBenchmark component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import RiskComparisonBenchmark from '../RiskComparisonBenchmark';
import type { AdvancedFallRiskPrediction } from '@/lib/advanced-fall-risk-engine';

const createMockPrediction = (
  riskScore: number
): AdvancedFallRiskPrediction => ({
  riskScore,
  riskLevel: riskScore < 20 ? 'low' : riskScore < 40 ? 'moderate' : 'high',
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
      fallsLast30Days: 0,
      fallsLast90Days: 0,
      fallsLastYear: 0,
      fallPattern: 'none' as const,
      commonLocations: [],
      commonTimes: [],
      injuryRate: 0,
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
  lastUpdated: new Date(),
  nextAssessment: new Date(),
});

describe('RiskComparisonBenchmark', () => {
  it('renders population comparison', () => {
    const prediction = createMockPrediction(35);
    render(<RiskComparisonBenchmark prediction={prediction} userAge={72} />);

    expect(screen.getByText(/population comparison/i)).toBeInTheDocument();
  });

  it('displays user risk score', () => {
    const prediction = createMockPrediction(35);
    render(<RiskComparisonBenchmark prediction={prediction} userAge={72} />);

    // Use getAllByText since the score may appear multiple times
    const scoreElements = screen.getAllByText('35.0');
    expect(scoreElements.length).toBeGreaterThan(0);
  });

  it('displays age group average', () => {
    const prediction = createMockPrediction(35);
    render(<RiskComparisonBenchmark prediction={prediction} userAge={72} />);

    expect(screen.getByText(/age group average/i)).toBeInTheDocument();
  });

  it('calculates and displays percentile', () => {
    const prediction = createMockPrediction(35);
    render(<RiskComparisonBenchmark prediction={prediction} userAge={72} />);

    // Use getAllByText since "percentile" may appear multiple times
    const percentileElements = screen.getAllByText(/percentile/i);
    expect(percentileElements.length).toBeGreaterThan(0);
  });

  it('shows comparison to average', () => {
    const prediction = createMockPrediction(35);
    render(<RiskComparisonBenchmark prediction={prediction} userAge={72} />);

    expect(screen.getByText(/vs. average/i)).toBeInTheDocument();
  });

  it('displays percentile breakdown', () => {
    const prediction = createMockPrediction(35);
    render(<RiskComparisonBenchmark prediction={prediction} userAge={72} />);

    // Use getAllByText since percentiles may appear multiple times
    const percentile25 = screen.getAllByText(/25th percentile/i);
    expect(percentile25.length).toBeGreaterThan(0);
    const percentile50 = screen.getAllByText(/50th percentile/i);
    expect(percentile50.length).toBeGreaterThan(0);
    const percentile75 = screen.getAllByText(/75th percentile/i);
    expect(percentile75.length).toBeGreaterThan(0);
    const percentile90 = screen.getAllByText(/90th percentile/i);
    expect(percentile90.length).toBeGreaterThan(0);
  });

  it('renders comparison bar chart', () => {
    const prediction = createMockPrediction(35);
    const { container } = render(
      <RiskComparisonBenchmark prediction={prediction} userAge={72} />
    );

    // Should have comparison visualization
    expect(container.querySelector('.h-12')).toBeInTheDocument();
  });

  it('handles different age groups', () => {
    const prediction = createMockPrediction(30);
    render(<RiskComparisonBenchmark prediction={prediction} userAge={68} />);

    expect(screen.getByText(/65-70/i)).toBeInTheDocument();
  });

  it('displays interpretation text', () => {
    const prediction = createMockPrediction(35);
    render(<RiskComparisonBenchmark prediction={prediction} userAge={72} />);

    expect(screen.getByText(/what this means/i)).toBeInTheDocument();
  });
});
