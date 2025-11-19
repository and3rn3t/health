/**
 * Tests for SensorDataVisualization component
 */

import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SensorDataVisualization from '../SensorDataVisualization';
import type { EnhancedSensorData } from '@/lib/enhanced-fall-detection-engine';

const createMockSensorData = (): EnhancedSensorData => ({
  timestamp: Date.now(),
  accelerometer: {
    x: 0.1,
    y: 0.2,
    z: 9.8,
    magnitude: 9.82,
  },
  gyroscope: {
    x: 0.1,
    y: 0.2,
    z: 0.3,
    magnitude: 0.37,
  },
  heartRate: 75,
  heartRateVariability: 45,
  confidence: 0.9,
  postureOrientation: 'standing',
  activityType: 'walking',
});

describe('SensorDataVisualization', () => {
  it('renders sensor data visualization', () => {
    const sensorData = createMockSensorData();
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText(/accelerometer/i)).toBeInTheDocument();
    expect(screen.getByText(/gyroscope/i)).toBeInTheDocument();
    expect(screen.getByText(/physiological/i)).toBeInTheDocument();
  });

  it('displays accelerometer data', () => {
    const sensorData = createMockSensorData();
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText(/0.10/i)).toBeInTheDocument(); // X-axis
    expect(screen.getByText(/0.20/i)).toBeInTheDocument(); // Y-axis
    expect(screen.getByText(/9.80/i)).toBeInTheDocument(); // Z-axis
  });

  it('displays gyroscope data', () => {
    const sensorData = createMockSensorData();
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText(/0.37/i)).toBeInTheDocument(); // Magnitude
  });

  it('displays heart rate', () => {
    const sensorData = createMockSensorData();
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText('75')).toBeInTheDocument();
  });

  it('shows impact alert when high impact detected', () => {
    const sensorData = createMockSensorData();
    sensorData.accelerometer.magnitude = 4.0; // High impact
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText(/high impact detected/i)).toBeInTheDocument();
  });

  it('shows rotation alert when rapid rotation detected', () => {
    const sensorData = createMockSensorData();
    sensorData.gyroscope.magnitude = 3.0; // Rapid rotation
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText(/rapid rotation detected/i)).toBeInTheDocument();
  });

  it('displays posture orientation when available', () => {
    const sensorData = createMockSensorData();
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText(/standing/i)).toBeInTheDocument();
  });

  it('displays activity type when available', () => {
    const sensorData = createMockSensorData();
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText(/walking/i)).toBeInTheDocument();
  });

  it('displays overall status metrics', () => {
    const sensorData = createMockSensorData();
    render(<SensorDataVisualization sensorData={sensorData} />);

    expect(screen.getByText(/motion intensity/i)).toBeInTheDocument();
    expect(screen.getByText(/stability score/i)).toBeInTheDocument();
    expect(screen.getByText(/sensor confidence/i)).toBeInTheDocument();
  });

  it('renders mini charts when history is enabled', () => {
    const sensorData = createMockSensorData();
    const { container } = render(
      <SensorDataVisualization sensorData={sensorData} showHistory={true} />
    );

    // Should have SVG elements for charts
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThan(0);
  });
});
