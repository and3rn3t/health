import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { LiDARScanData } from '../CleanLiDARComponents';
import { AdvancedLiDARAnalytics } from '../AdvancedLiDARAnalytics';

const mockScanData: LiDARScanData[] = [
  {
    id: 'scan-1',
    timestamp: Date.now(),
    points: Array.from({ length: 10 }, (_, i) => ({
      id: `pt-${i}`,
      timestamp: Date.now(),
      x: i * 0.1,
      y: 0,
      z: 1.0,
      intensity: 0.8,
      confidence: 0.95,
    })),
    metadata: {
      duration: 5000,
      pointCount: 10,
      accuracy: 0.95,
    },
  },
];

describe('AdvancedLiDARAnalytics', () => {
  it('renders the heading', () => {
    render(<AdvancedLiDARAnalytics scanData={mockScanData} />);
    expect(
      screen.getByRole('heading', { name: /advanced lidar analytics/i })
    ).toBeInTheDocument();
  });

  it('renders description text', () => {
    render(<AdvancedLiDARAnalytics scanData={mockScanData} />);
    expect(
      screen.getByText(/AI-powered analysis/i)
    ).toBeInTheDocument();
  });
});
