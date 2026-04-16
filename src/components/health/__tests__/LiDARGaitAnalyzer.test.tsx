import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/hooks/useLiDARSession', () => ({
  useLiDARSession: () => ({
    lidarReady: false,
    currentSession: null,
    sessionHistory: [],
    calibrated: false,
    isRecording: false,
    calibrate: vi.fn(),
    startRecording: vi.fn(),
    stopRecording: vi.fn(),
    showNotification: null,
    preferences: null,
  }),
}));

const { LiDARGaitAnalyzer } = await import('../LiDARGaitAnalyzerClean');

describe('LiDARGaitAnalyzer', () => {
  it('shows LiDAR not available when sensor is absent', () => {
    render(<LiDARGaitAnalyzer />);
    expect(screen.getByText('LiDAR Not Available')).toBeInTheDocument();
  });

  it('explains device requirement', () => {
    render(<LiDARGaitAnalyzer />);
    expect(
      screen.getByText(/LiDAR sensor is required/i)
    ).toBeInTheDocument();
  });
});
