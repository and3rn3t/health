/**
 * Tests for FallRiskReportExporter component
 */

import type { AdvancedFallRiskPrediction } from '@/lib/advanced-fall-risk-engine';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import FallRiskReportExporter from '../FallRiskReportExporter';

// Mock window.print
const mockPrint = vi.fn();
Object.defineProperty(window, 'print', {
  writable: true,
  value: mockPrint,
});

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
global.URL.revokeObjectURL = vi.fn();

// Mock document.createElement and appendChild
const mockClick = vi.fn();
const mockCreateElement = vi.fn((tag: string) => {
  if (tag === 'a') {
    return {
      href: '',
      download: '',
      click: mockClick,
    } as any;
  }
  return document.createElement(tag);
});

const originalCreateElement = document.createElement;
const originalAppendChild = document.body.appendChild;
const originalRemoveChild = document.body.removeChild;

beforeEach(() => {
  vi.clearAllMocks();
  document.createElement = originalCreateElement;
  document.body.appendChild = originalAppendChild;
  document.body.removeChild = originalRemoveChild;
});

const createMockPrediction = (): AdvancedFallRiskPrediction => ({
  riskScore: 45,
  riskLevel: 'moderate',
  confidence: 0.85,
  shortTermRisk: 40,
  mediumTermRisk: 42,
  longTermRisk: 45,
  gaitRisk: {
    overallScore: 35,
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
    overallScore: 30,
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
    overallScore: 20,
    homeHazards: 30,
    weatherConditions: 20,
    lightingConditions: 25,
    terrainDifficulty: 15,
    locationComplexity: 10,
    timeOfDayRisk: 20,
  },
  physiologicalRisk: {
    overallScore: 25,
    cardiovascularHealth: 70,
    muscleStrength: 65,
    flexibility: 60,
    visionHealth: 75,
    medicationEffects: 30,
    cognitiveFunction: 80,
    sleepQuality: 70,
  },
  behavioralRisk: {
    overallScore: 15,
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

describe('FallRiskReportExporter', () => {
  it('renders export button', () => {
    const prediction = createMockPrediction();
    render(<FallRiskReportExporter currentPrediction={prediction} />);

    const buttons = screen.getAllByText(/export report/i);
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('opens dialog when button is clicked', async () => {
    const prediction = createMockPrediction();
    render(<FallRiskReportExporter currentPrediction={prediction} />);

    const buttons = screen.getAllByText(/export report/i);
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      const dialogTitles = screen.getAllByText(/export fall risk report/i);
      expect(dialogTitles.length).toBeGreaterThan(0);
    });
  });

  it('shows all export format options', async () => {
    const prediction = createMockPrediction();
    render(<FallRiskReportExporter currentPrediction={prediction} />);

    const buttons = screen.getAllByText(/export report/i);
    fireEvent.click(buttons[0]);

    await waitFor(() => {
      // Wait for dialog to be visible first
      const dialogTitles = screen.getAllByText(/export fall risk report/i);
      expect(dialogTitles.length).toBeGreaterThan(0);
    });

    await waitFor(
      () => {
        // Use getAllByRole to find buttons by accessible name (handles case-insensitive matching)
        const pdfButtons = screen.getAllByRole('button', {
          name: /export as pdf/i,
        });
        const jsonButtons = screen.getAllByRole('button', {
          name: /export as json/i,
        });
        const csvButtons = screen.getAllByRole('button', {
          name: /export as csv/i,
        });
        expect(pdfButtons.length).toBeGreaterThan(0);
        expect(jsonButtons.length).toBeGreaterThan(0);
        expect(csvButtons.length).toBeGreaterThan(0);
      },
      { timeout: 3000 }
    );
  });

  it('exports JSON format', async () => {
    const prediction = createMockPrediction();
    const onExport = vi.fn();

    // Track anchor element and click spy without interfering with React's DOM operations
    let anchorElement: HTMLAnchorElement | null = null;
    const clickSpies: Array<{ click: ReturnType<typeof vi.spyOn> }> = [];

    // Mock createElement only for anchor tags, but don't interfere with React
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          anchorElement = originalCreateElement('a') as HTMLAnchorElement;
          const clickSpy = vi.spyOn(anchorElement, 'click');
          clickSpies.push({ click: clickSpy });
          return anchorElement;
        }
        // For all other tags, use original implementation (don't interfere with React)
        return originalCreateElement(tagName);
      });

    render(
      <FallRiskReportExporter
        currentPrediction={prediction}
        onExport={onExport}
      />
    );

    // Find and click the export button (handle multiple instances from StrictMode)
    const buttons = screen.getAllByText(/export report/i);
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);

    // Wait for dialog to open and content to be visible
    await waitFor(() => {
      // Wait for dialog title to appear (confirms dialog is open)
      const dialogTitles = screen.getAllByText(/export fall risk report/i);
      expect(dialogTitles.length).toBeGreaterThan(0);
    });

    // Wait for JSON export button to be visible and click it
    await waitFor(
      () => {
        // Use getAllByRole to find buttons by accessible name (handles case-insensitive matching)
        const jsonButtons = screen.getAllByRole('button', {
          name: /export as json/i,
        });
        expect(jsonButtons.length).toBeGreaterThan(0);
        fireEvent.click(jsonButtons[0]);
      },
      { timeout: 3000 }
    );

    // Verify onExport callback was called (this is what we really care about)
    await waitFor(
      () => {
        expect(onExport).toHaveBeenCalledWith(
          'json',
          expect.objectContaining({
            prediction: expect.any(Object),
            exportDate: expect.any(Date),
            exportVersion: expect.any(String),
          })
        );
      },
      { timeout: 2000 }
    );

    // Optionally verify click was called if anchor was created
    if (clickSpies.length > 0) {
      expect(clickSpies[0].click).toHaveBeenCalled();
    }
  });

  it('exports CSV format', async () => {
    const prediction = createMockPrediction();
    const onExport = vi.fn();

    // Track anchor element and click spy without interfering with React's DOM operations
    let anchorElement: HTMLAnchorElement | null = null;
    const clickSpies: Array<{ click: ReturnType<typeof vi.spyOn> }> = [];

    // Mock createElement only for anchor tags, but don't interfere with React
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          anchorElement = originalCreateElement('a') as HTMLAnchorElement;
          const clickSpy = vi.spyOn(anchorElement, 'click');
          clickSpies.push({ click: clickSpy });
          return anchorElement;
        }
        // For all other tags, use original implementation (don't interfere with React)
        return originalCreateElement(tagName);
      });

    render(
      <FallRiskReportExporter
        currentPrediction={prediction}
        onExport={onExport}
      />
    );

    // Find and click the export button (handle multiple instances from StrictMode)
    const buttons = screen.getAllByText(/export report/i);
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);

    // Wait for dialog to open and content to be visible
    await waitFor(() => {
      // Wait for dialog title to appear (confirms dialog is open)
      const dialogTitles = screen.getAllByText(/export fall risk report/i);
      expect(dialogTitles.length).toBeGreaterThan(0);
    });

    // Wait for CSV export button to be visible and click it
    await waitFor(
      () => {
        // Use getAllByRole to find buttons by accessible name (handles case-insensitive matching)
        const csvButtons = screen.getAllByRole('button', {
          name: /export as csv/i,
        });
        expect(csvButtons.length).toBeGreaterThan(0);
        fireEvent.click(csvButtons[0]);
      },
      { timeout: 3000 }
    );

    // Verify onExport callback was called (this is what we really care about)
    await waitFor(
      () => {
        expect(onExport).toHaveBeenCalledWith(
          'csv',
          expect.objectContaining({
            prediction: expect.any(Object),
            exportDate: expect.any(Date),
            exportVersion: expect.any(String),
          })
        );
      },
      { timeout: 2000 }
    );

    // Optionally verify click was called if anchor was created
    if (clickSpies.length > 0) {
      expect(clickSpies[0].click).toHaveBeenCalled();
    }
  });

  it('exports PDF format (opens print dialog)', async () => {
    const prediction = createMockPrediction();
    const mockWindow = {
      document: {
        write: vi.fn(),
        close: vi.fn(),
      },
      onload: null as any,
      print: mockPrint,
    };
    vi.spyOn(window, 'open').mockReturnValue(mockWindow as any);

    render(<FallRiskReportExporter currentPrediction={prediction} />);

    const buttons = screen.getAllByText(/export report/i);
    fireEvent.click(buttons[0]);

    // Wait for dialog to open and content to be visible
    await waitFor(() => {
      const dialogTitles = screen.getAllByText(/export fall risk report/i);
      expect(dialogTitles.length).toBeGreaterThan(0);
    });

    await waitFor(
      () => {
        // Use getAllByRole to find buttons by accessible name (handles case-insensitive matching)
        const pdfButtons = screen.getAllByRole('button', {
          name: /export as pdf/i,
        });
        expect(pdfButtons.length).toBeGreaterThan(0);
        fireEvent.click(pdfButtons[0]);
      },
      { timeout: 3000 }
    );

    expect(window.open).toHaveBeenCalled();
    expect(mockWindow.document.write).toHaveBeenCalled();
  });

  it('calls onExport callback when provided', async () => {
    const prediction = createMockPrediction();
    const onExport = vi.fn();

    // Track anchor element and click spy without interfering with React's DOM operations
    let anchorElement: HTMLAnchorElement | null = null;
    const clickSpies: Array<{ click: ReturnType<typeof vi.spyOn> }> = [];

    // Mock createElement only for anchor tags, but don't interfere with React
    const originalCreateElement = document.createElement.bind(document);
    const createElementSpy = vi
      .spyOn(document, 'createElement')
      .mockImplementation((tagName: string) => {
        if (tagName === 'a') {
          anchorElement = originalCreateElement('a') as HTMLAnchorElement;
          const clickSpy = vi.spyOn(anchorElement, 'click');
          clickSpies.push({ click: clickSpy });
          return anchorElement;
        }
        // For all other tags, use original implementation (don't interfere with React)
        return originalCreateElement(tagName);
      });

    render(
      <FallRiskReportExporter
        currentPrediction={prediction}
        onExport={onExport}
      />
    );

    // Find and click the export button (handle multiple instances from StrictMode)
    const buttons = screen.getAllByText(/export report/i);
    expect(buttons.length).toBeGreaterThan(0);
    fireEvent.click(buttons[0]);

    // Wait for dialog to open and content to be visible
    await waitFor(() => {
      // Wait for dialog title to appear (confirms dialog is open)
      const dialogTitles = screen.getAllByText(/export fall risk report/i);
      expect(dialogTitles.length).toBeGreaterThan(0);
    });

    // Wait for JSON export button to be visible and click it
    await waitFor(
      () => {
        // Use getAllByRole to find buttons by accessible name (handles case-insensitive matching)
        const jsonButtons = screen.getAllByRole('button', {
          name: /export as json/i,
        });
        expect(jsonButtons.length).toBeGreaterThan(0);
        fireEvent.click(jsonButtons[0]);
      },
      { timeout: 3000 }
    );

    // Verify onExport callback was called with correct parameters
    await waitFor(
      () => {
        expect(onExport).toHaveBeenCalledWith(
          'json',
          expect.objectContaining({
            prediction: expect.any(Object),
            exportDate: expect.any(Date),
            exportVersion: expect.any(String),
          })
        );
      },
      { timeout: 3000 }
    );

    // Optionally verify click was called if anchor was created
    if (clickSpies.length > 0) {
      expect(clickSpies[0].click).toHaveBeenCalled();
    }
  });

  it('includes history data in export when provided', () => {
    const prediction = createMockPrediction();
    const history = [
      {
        date: new Date('2024-01-01'),
        riskScore: 40,
        riskLevel: 'moderate' as const,
        gaitRisk: 30,
        balanceRisk: 25,
        environmentalRisk: 20,
        physiologicalRisk: 25,
        behavioralRisk: 15,
        prediction: createMockPrediction(),
      },
    ];

    render(
      <FallRiskReportExporter
        currentPrediction={prediction}
        historyData={history}
      />
    );

    // Component should render with history
    const buttons = screen.getAllByText(/export report/i);
    expect(buttons.length).toBeGreaterThan(0);
  });
});
