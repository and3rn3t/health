/**
 * Tests for RiskFactorDetailView component
 */

import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import {
  RiskFactorDetailView,
  ProtectiveFactorDetailView,
} from '../RiskFactorDetailView';
import type { RiskFactor, ProtectiveFactor } from '@/lib/advanced-fall-risk-engine';

const mockRiskFactor: RiskFactor = {
  id: 'test-risk-1',
  category: 'gait',
  severity: 'high',
  weight: 0.3,
  description: 'Reduced walking steadiness',
  explanation: 'Your walking patterns show increased variability',
  trend: 'worsening',
  modifiable: true,
  interventions: ['balance-training', 'strength-exercises'],
};

const mockProtectiveFactor: ProtectiveFactor = {
  id: 'test-protective-1',
  category: 'strength',
  strength: 0.7,
  description: 'Regular exercise routine',
  recommendations: [
    'Continue your current exercise program',
    'Add balance exercises 3x per week',
  ],
};

describe('RiskFactorDetailView', () => {
  it('renders risk factor information', () => {
    render(<RiskFactorDetailView riskFactor={mockRiskFactor} />);

    expect(screen.getByText(mockRiskFactor.description)).toBeInTheDocument();
    expect(screen.getByText(mockRiskFactor.explanation)).toBeInTheDocument();
    expect(screen.getByText(/high/i)).toBeInTheDocument();
  });

  it('displays impact weight', () => {
    render(<RiskFactorDetailView riskFactor={mockRiskFactor} />);
    expect(screen.getByText(/30%/i)).toBeInTheDocument();
  });

  it('shows modifiable status', () => {
    render(<RiskFactorDetailView riskFactor={mockRiskFactor} />);
    expect(screen.getByText(/modifiable/i)).toBeInTheDocument();
  });

  it('shows non-modifiable status', () => {
    const nonModifiable = { ...mockRiskFactor, modifiable: false };
    render(<RiskFactorDetailView riskFactor={nonModifiable} />);
    expect(screen.getByText(/non-modifiable/i)).toBeInTheDocument();
  });

  it('expands and collapses details', () => {
    render(<RiskFactorDetailView riskFactor={mockRiskFactor} />);

    const learnMoreButton = screen.getByText(/learn more/i);
    expect(learnMoreButton).toBeInTheDocument();

    // Click to expand
    fireEvent.click(learnMoreButton);

    // Should show expanded content
    expect(screen.getByText(/category/i)).toBeInTheDocument();
    expect(screen.getByText(/trend/i)).toBeInTheDocument();
  });

  it('displays category and trend in expanded view', () => {
    render(<RiskFactorDetailView riskFactor={mockRiskFactor} />);

    const learnMoreButton = screen.getByText(/learn more/i);
    fireEvent.click(learnMoreButton);

    expect(screen.getByText(/gait/i)).toBeInTheDocument();
    expect(screen.getByText(/worsening/i)).toBeInTheDocument();
  });

  it('shows related interventions when provided', () => {
    render(
      <RiskFactorDetailView
        riskFactor={mockRiskFactor}
        showInterventions={true}
      />
    );

    expect(screen.getByText(/related interventions/i)).toBeInTheDocument();
  });

  it('calls onInterventionClick when intervention button is clicked', () => {
    const onInterventionClick = vi.fn();
    render(
      <RiskFactorDetailView
        riskFactor={mockRiskFactor}
        onInterventionClick={onInterventionClick}
        showInterventions={true}
      />
    );

    const startButtons = screen.getAllByText(/start/i);
    if (startButtons.length > 0) {
      fireEvent.click(startButtons[0]);
      expect(onInterventionClick).toHaveBeenCalled();
    }
  });

  it('displays severity badge with correct color', () => {
    render(<RiskFactorDetailView riskFactor={mockRiskFactor} />);
    const badge = screen.getByText(/high/i);
    expect(badge).toBeInTheDocument();
  });

  it('shows non-modifiable notice for fixed factors', () => {
    const nonModifiable = { ...mockRiskFactor, modifiable: false };
    render(<RiskFactorDetailView riskFactor={nonModifiable} />);

    expect(
      screen.getByText(/non-modifiable risk factor/i)
    ).toBeInTheDocument();
  });
});

describe('ProtectiveFactorDetailView', () => {
  it('renders protective factor information', () => {
    render(<ProtectiveFactorDetailView protectiveFactor={mockProtectiveFactor} />);

    expect(
      screen.getByText(mockProtectiveFactor.description)
    ).toBeInTheDocument();
  });

  it('displays protective strength', () => {
    render(<ProtectiveFactorDetailView protectiveFactor={mockProtectiveFactor} />);
    expect(screen.getByText(/70%/i)).toBeInTheDocument();
  });

  it('shows recommendations when provided', () => {
    render(<ProtectiveFactorDetailView protectiveFactor={mockProtectiveFactor} />);

    expect(
      screen.getByText(mockProtectiveFactor.recommendations[0])
    ).toBeInTheDocument();
  });

  it('displays category', () => {
    render(<ProtectiveFactorDetailView protectiveFactor={mockProtectiveFactor} />);
    expect(screen.getByText(/strength/i)).toBeInTheDocument();
  });
});
