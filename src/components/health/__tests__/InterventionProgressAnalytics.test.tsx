/**
 * Tests for InterventionProgressAnalytics component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import InterventionProgressAnalytics from '../InterventionProgressAnalytics';
import type {
  PersonalizedInterventionPlan,
  InterventionProgress,
} from '@/lib/enhanced-intervention-engine';
import type { FallPreventionIntervention } from '@/lib/advanced-fall-risk-engine';

const createMockIntervention = (
  id: string,
  title: string
): FallPreventionIntervention => ({
  id,
  type: 'exercise',
  priority: 'high',
  title,
  description: 'Test intervention description',
  instructions: ['Step 1', 'Step 2'],
  expectedOutcome: 'Improved balance',
  timeframe: '4 weeks',
  evidence: 'strong',
  riskReduction: 15,
  effort: 'moderate',
  cost: 'free',
});

const createMockProgress = (
  interventionId: string
): InterventionProgress => ({
  interventionId,
  startDate: new Date('2024-01-01'),
  lastActive: new Date('2024-01-15'),
  completionRate: 60,
  adherenceRate: 75,
  effectiveness: 50,
  userRating: 4,
  notes: [],
  challenges: [],
  modifications: [],
});

const createMockPlan = (): PersonalizedInterventionPlan => ({
  id: 'plan-1',
  userId: 'user-1',
  createdDate: new Date('2024-01-01'),
  lastUpdated: new Date('2024-01-15'),
  baselineRisk: 50,
  currentRisk: 40,
  targetRisk: 30,
  activeInterventions: [
    createMockIntervention('int-1', 'Balance Training'),
    createMockIntervention('int-2', 'Strength Exercises'),
  ],
  completedInterventions: [
    createMockIntervention('int-3', 'Completed Program'),
  ],
  progress: [
    createMockProgress('int-1'),
    createMockProgress('int-2'),
  ],
  enrolledPrograms: [],
  preferences: {
    timeOfDay: 'morning',
    intensity: 'moderate',
    duration: 'medium',
    location: 'home',
    equipment: [],
    limitations: [],
  },
});

describe('InterventionProgressAnalytics', () => {
  it('renders overall progress summary', () => {
    const plan = createMockPlan();
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    expect(screen.getByText(/overall progress/i)).toBeInTheDocument();
  });

  it('displays baseline, current, and target risk', () => {
    const plan = createMockPlan();
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    expect(screen.getByText('50.0')).toBeInTheDocument(); // Baseline
    expect(screen.getByText('40.0')).toBeInTheDocument(); // Current
    expect(screen.getByText('30.0')).toBeInTheDocument(); // Target
  });

  it('calculates and displays risk reduction progress', () => {
    const plan = createMockPlan();
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    expect(screen.getByText(/risk reduction progress/i)).toBeInTheDocument();
  });

  it('displays average statistics', () => {
    const plan = createMockPlan();
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    expect(screen.getByText(/avg completion/i)).toBeInTheDocument();
    expect(screen.getByText(/avg adherence/i)).toBeInTheDocument();
    expect(screen.getByText(/avg effectiveness/i)).toBeInTheDocument();
  });

  it('shows active interventions', () => {
    const plan = createMockPlan();
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    expect(screen.getByText('Balance Training')).toBeInTheDocument();
    expect(screen.getByText('Strength Exercises')).toBeInTheDocument();
  });

  it('displays intervention progress metrics', () => {
    const plan = createMockPlan();
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    expect(screen.getByText(/60%/i)).toBeInTheDocument(); // Completion rate
    expect(screen.getByText(/75%/i)).toBeInTheDocument(); // Adherence rate
    expect(screen.getByText(/50%/i)).toBeInTheDocument(); // Effectiveness
  });

  it('switches between active and completed tabs', () => {
    const plan = createMockPlan();
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    const completedTab = screen.getByText(/completed/i);
    fireEvent.click(completedTab);

    expect(screen.getByText('Completed Program')).toBeInTheDocument();
  });

  it('shows empty state for no completed interventions', () => {
    const plan = createMockPlan();
    plan.completedInterventions = [];
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    const completedTab = screen.getByText(/completed/i);
    fireEvent.click(completedTab);

    expect(
      screen.getByText(/no completed interventions yet/i)
    ).toBeInTheDocument();
  });

  it('displays days active for interventions', () => {
    const plan = createMockPlan();
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    expect(screen.getByText(/days active/i)).toBeInTheDocument();
  });

  it('handles empty progress array', () => {
    const plan = createMockPlan();
    plan.progress = [];
    render(<InterventionProgressAnalytics interventionPlan={plan} />);

    // Should still render overall progress
    expect(screen.getByText(/overall progress/i)).toBeInTheDocument();
  });

  it('shows challenges when present', () => {
    const plan = createMockPlan();
    plan.progress[0].challenges = ['Time constraints', 'Equipment needed'];
    render(
      <InterventionProgressAnalytics interventionPlan={plan} showDetails={true} />
    );

    expect(screen.getByText(/challenges/i)).toBeInTheDocument();
  });

  it('shows modifications when present', () => {
    const plan = createMockPlan();
    plan.progress[0].modifications = ['Reduced intensity', 'Extended timeframe'];
    render(
      <InterventionProgressAnalytics interventionPlan={plan} showDetails={true} />
    );

    expect(screen.getByText(/modifications/i)).toBeInTheDocument();
  });
});
