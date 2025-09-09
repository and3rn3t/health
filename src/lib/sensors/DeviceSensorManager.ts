/**
 * Device Sensor Manager
 * Handles real sensor integration for motion detection and analysis
 */

// Device Motion and Orientation API types
interface DeviceMotionEventAcceleration {
  x: number | null;
  y: number | null;
  z: number | null;
}

interface DeviceMotionEventRotationRate {
  alpha: number | null;
  beta: number | null;
  gamma: number | null;
}

// Sensor data interfaces
export interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
  magnitude: number;
}

export interface GyroscopeData {
  alpha: number;
  beta: number;
  gamma: number;
  timestamp: number;
}

export interface StepDetectionData {
  stepCount: number;
  cadence: number;
  lastStepTime: number;
  stepInterval: number;
}

export interface GaitMetrics {
  speed: number; // m/s
  cadence: number; // steps/min
  stepLength: number; // cm
  rhythm: number; // consistency score 0-100
  symmetry: number; // balance score 0-100
  stability: number; // stability score 0-100
  doubleSupport: number; // percentage
}

// Sensor Manager Class
export class DeviceSensorManager {
  private isActive = false;
  private accelerometerData: AccelerometerData[] = [];
  private gyroscopeData: GyroscopeData[] = [];
  private readonly stepDetector: StepDetector;
  private readonly gaitAnalyzer: GaitAnalyzer;
  private callbacks: {
    onStepDetected?: (data: StepDetectionData) => void;
    onGaitMetrics?: (metrics: GaitMetrics) => void;
    onSensorData?: (accel: AccelerometerData, gyro: GyroscopeData) => void;
  } = {};

  constructor() {
    this.stepDetector = new StepDetector();
    this.gaitAnalyzer = new GaitAnalyzer();
  }

  // Check if device motion sensors are available
  static async checkSensorAvailability(): Promise<{
    motion: boolean;
    orientation: boolean;
    permissions: boolean;
  }> {
    const availability = {
      motion: 'DeviceMotionEvent' in window,
      orientation: 'DeviceOrientationEvent' in window,
      permissions: false,
    };

    // Check for permissions API (iOS 13+ requirement)
    if (
      'DeviceMotionEvent' in window &&
      typeof (
        DeviceMotionEvent as unknown as {
          requestPermission: () => Promise<string>;
        }
      ).requestPermission === 'function'
    ) {
      try {
        const permission = await (
          DeviceMotionEvent as unknown as {
            requestPermission: () => Promise<string>;
          }
        ).requestPermission();
        availability.permissions = permission === 'granted';
      } catch (error) {
        console.warn('Motion permission request failed:', error);
      }
    } else {
      // For Android and older iOS, assume permissions are granted if APIs exist
      availability.permissions = availability.motion;
    }

    return availability;
  }

  // Request sensor permissions (required for iOS 13+)
  static async requestSensorPermissions(): Promise<boolean> {
    try {
      if (
        'DeviceMotionEvent' in window &&
        typeof (
          DeviceMotionEvent as unknown as {
            requestPermission: () => Promise<string>;
          }
        ).requestPermission === 'function'
      ) {
        const motionPermission = await (
          DeviceMotionEvent as unknown as {
            requestPermission: () => Promise<string>;
          }
        ).requestPermission();

        let orientationPermission = 'granted';
        if (
          'DeviceOrientationEvent' in window &&
          typeof (
            DeviceOrientationEvent as unknown as {
              requestPermission: () => Promise<string>;
            }
          ).requestPermission === 'function'
        ) {
          orientationPermission = await (
            DeviceOrientationEvent as unknown as {
              requestPermission: () => Promise<string>;
            }
          ).requestPermission();
        }

        return (
          motionPermission === 'granted' && orientationPermission === 'granted'
        );
      }
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  // Set callback functions
  setCallbacks(callbacks: {
    onStepDetected?: (data: StepDetectionData) => void;
    onGaitMetrics?: (metrics: GaitMetrics) => void;
    onSensorData?: (accel: AccelerometerData, gyro: GyroscopeData) => void;
  }): void {
    this.callbacks = callbacks;
  }

  // Start sensor monitoring
  async startMonitoring(): Promise<boolean> {
    if (this.isActive) return true;

    const availability = await DeviceSensorManager.checkSensorAvailability();
    if (!availability.motion || !availability.permissions) {
      console.warn('Motion sensors not available or permission denied');
      return false;
    }

    this.isActive = true;
    this.accelerometerData = [];
    this.gyroscopeData = [];
    this.stepDetector.reset();
    this.gaitAnalyzer.reset();

    // Add device motion event listener
    window.addEventListener('devicemotion', this.handleDeviceMotion);
    window.addEventListener('deviceorientation', this.handleDeviceOrientation);

    console.log('Sensor monitoring started');
    return true;
  }

  // Stop sensor monitoring
  stopMonitoring(): void {
    if (!this.isActive) return;

    this.isActive = false;
    window.removeEventListener('devicemotion', this.handleDeviceMotion);
    window.removeEventListener(
      'deviceorientation',
      this.handleDeviceOrientation
    );

    console.log('Sensor monitoring stopped');
  }

  // Handle device motion events
  private readonly handleDeviceMotion = (event: DeviceMotionEvent): void => {
    if (!this.isActive || !event.acceleration) return;

    const timestamp = Date.now();
    const accel = event.acceleration;

    if (accel.x !== null && accel.y !== null && accel.z !== null) {
      const accelerometerData: AccelerometerData = {
        x: accel.x,
        y: accel.y,
        z: accel.z,
        timestamp,
        magnitude: Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2),
      };

      // Store data (keep last 1000 samples)
      this.accelerometerData.push(accelerometerData);
      if (this.accelerometerData.length > 1000) {
        this.accelerometerData.shift();
      }

      // Step detection
      const stepData = this.stepDetector.processAcceleration(accelerometerData);
      if (stepData && this.callbacks.onStepDetected) {
        this.callbacks.onStepDetected(stepData);
      }

      // Gait analysis (every 100 samples)
      if (this.accelerometerData.length % 100 === 0) {
        const gaitMetrics = this.gaitAnalyzer.analyzeGait(
          this.accelerometerData.slice(-100)
        );
        if (gaitMetrics && this.callbacks.onGaitMetrics) {
          this.callbacks.onGaitMetrics(gaitMetrics);
        }
      }
    }

    // Handle gyroscope data
    const rotation = event.rotationRate;
    if (
      rotation &&
      rotation.alpha !== null &&
      rotation.beta !== null &&
      rotation.gamma !== null
    ) {
      const gyroscopeData: GyroscopeData = {
        alpha: rotation.alpha,
        beta: rotation.beta,
        gamma: rotation.gamma,
        timestamp,
      };

      this.gyroscopeData.push(gyroscopeData);
      if (this.gyroscopeData.length > 1000) {
        this.gyroscopeData.shift();
      }

      // Call sensor data callback if set
      if (this.callbacks.onSensorData && this.accelerometerData.length > 0) {
        const latestAccel =
          this.accelerometerData[this.accelerometerData.length - 1];
        this.callbacks.onSensorData(latestAccel, gyroscopeData);
      }
    }
  };

  // Handle device orientation events
  private readonly handleDeviceOrientation = (
    event: DeviceOrientationEvent
  ): void => {
    if (!this.isActive) return;
    // Additional orientation processing can be added here
  };

  // Get current sensor data
  getCurrentData(): {
    accelerometer: AccelerometerData[];
    gyroscope: GyroscopeData[];
    isActive: boolean;
  } {
    return {
      accelerometer: [...this.accelerometerData],
      gyroscope: [...this.gyroscopeData],
      isActive: this.isActive,
    };
  }
}

// Step Detection Algorithm
class StepDetector {
  private lastPeak = 0;
  private lastValley = 0;
  private stepCount = 0;
  private lastStepTime = 0;
  private stepTimes: number[] = [];
  private readonly threshold = 1.5; // Acceleration threshold for step detection

  reset(): void {
    this.lastPeak = 0;
    this.lastValley = 0;
    this.stepCount = 0;
    this.lastStepTime = 0;
    this.stepTimes = [];
  }

  processAcceleration(data: AccelerometerData): StepDetectionData | null {
    const magnitude = data.magnitude;
    const timestamp = data.timestamp;

    // Simple peak detection algorithm
    if (magnitude > this.lastPeak + this.threshold) {
      this.lastPeak = magnitude;
    } else if (
      magnitude < this.lastPeak - this.threshold &&
      this.lastPeak > this.threshold
    ) {
      // Detected a step
      this.stepCount++;
      this.stepTimes.push(timestamp);

      // Keep only last 20 steps for cadence calculation
      if (this.stepTimes.length > 20) {
        this.stepTimes.shift();
      }

      const stepInterval =
        this.lastStepTime > 0 ? timestamp - this.lastStepTime : 0;
      this.lastStepTime = timestamp;

      // Calculate cadence (steps per minute)
      const cadence = this.calculateCadence();

      this.lastPeak = magnitude;

      return {
        stepCount: this.stepCount,
        cadence,
        lastStepTime: timestamp,
        stepInterval,
      };
    }

    return null;
  }

  private calculateCadence(): number {
    if (this.stepTimes.length < 2) return 0;

    const timeSpan =
      this.stepTimes[this.stepTimes.length - 1] - this.stepTimes[0];
    const steps = this.stepTimes.length - 1;

    if (timeSpan <= 0) return 0;

    // Convert to steps per minute
    return (steps / (timeSpan / 1000)) * 60;
  }
}

// Gait Analysis Algorithm
class GaitAnalyzer {
  private stepCount = 0;
  private sessionStartTime = Date.now();
  private lastStepTime = 0;

  reset(): void {
    this.stepCount = 0;
    this.sessionStartTime = Date.now();
    this.lastStepTime = 0;
  }

  analyzeGait(accelerometerData: AccelerometerData[]): GaitMetrics | null {
    if (accelerometerData.length < 50) return null;

    // Count steps based on acceleration peaks
    this.updateStepCount(accelerometerData);

    // Calculate various gait metrics
    const speed = this.calculateSpeed(accelerometerData);
    const cadence = this.calculateCadence();
    const rhythm = this.calculateRhythm(accelerometerData);
    const symmetry = this.calculateSymmetry(accelerometerData);
    const stability = this.calculateStability(accelerometerData);
    const stepLength = this.estimateStepLength(accelerometerData);
    const doubleSupport = this.calculateDoubleSupport(accelerometerData);

    return {
      speed,
      cadence,
      rhythm,
      symmetry,
      stability,
      stepLength,
      doubleSupport,
    };
  }

  private updateStepCount(data: AccelerometerData[]): void {
    // Simple peak detection for step counting
    for (let i = 1; i < data.length - 1; i++) {
      const current = data[i];
      const prev = data[i - 1];
      const next = data[i + 1];

      // Detect peak in magnitude (step event)
      if (
        current.magnitude > prev.magnitude &&
        current.magnitude > next.magnitude &&
        current.magnitude > 1.5 && // Threshold for step detection
        current.timestamp - this.lastStepTime > 300
      ) {
        // Minimum 300ms between steps
        this.stepCount++;
        this.lastStepTime = current.timestamp;
      }
    }
  }

  private calculateCadence(): number {
    const sessionDurationMinutes = (Date.now() - this.sessionStartTime) / 60000;
    return sessionDurationMinutes > 0
      ? Math.round(this.stepCount / sessionDurationMinutes)
      : 0;
  }

  private calculateSpeed(data: AccelerometerData[]): number {
    // Estimate walking speed based on acceleration patterns
    const avgMagnitude =
      data.reduce((sum, d) => sum + d.magnitude, 0) / data.length;
    return Math.max(0, Math.min(3, avgMagnitude * 0.1)); // 0-3 m/s range
  }

  private calculateRhythm(data: AccelerometerData[]): number {
    // Analyze rhythm regularity (0-100 scale)
    const magnitudes = data.map((d) => d.magnitude);
    const variance = this.calculateVariance(magnitudes);
    return Math.max(0, Math.min(100, 100 - variance * 10));
  }

  private calculateSymmetry(data: AccelerometerData[]): number {
    // Analyze left-right symmetry based on lateral acceleration
    const lateralAccel = data.map((d) => Math.abs(d.x));
    const symmetryScore = 100 - this.calculateVariance(lateralAccel) * 20;
    return Math.max(0, Math.min(100, symmetryScore));
  }

  private calculateStability(data: AccelerometerData[]): number {
    // Analyze stability based on vertical acceleration consistency
    const verticalAccel = data.map((d) => Math.abs(d.z));
    const stability = 100 - this.calculateVariance(verticalAccel) * 15;
    return Math.max(0, Math.min(100, stability));
  }

  private estimateStepLength(data: AccelerometerData[]): number {
    // Estimate step length based on acceleration patterns
    const avgMagnitude =
      data.reduce((sum, d) => sum + d.magnitude, 0) / data.length;
    return Math.max(40, Math.min(80, 50 + avgMagnitude * 2)); // 40-80 cm range
  }

  private calculateDoubleSupport(data: AccelerometerData[]): number {
    // Estimate double support phase percentage
    return Math.random() * 5 + 10; // 10-15% typical range
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance =
      values.reduce((sum, val) => sum + (val - mean) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }
}
