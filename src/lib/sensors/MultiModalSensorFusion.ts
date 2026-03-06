/**
 * Multi-Modal Sensor Fusion for LiDAR Health Analysis
 * Integration with Apple Watch, smartphone sensors, and camera-based pose estimation
 */

import { useCallback, useEffect, useRef, useState } from 'react';

// Sensor Data Types
interface SensorMetrics {
  stability: number;
  coordination: number;
  symmetry: number;
  fluidity: number;
  riskScore: number;
}
interface AccelerometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface GyroscopeData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface MagnetometerData {
  x: number;
  y: number;
  z: number;
  timestamp: number;
}

interface AppleWatchData {
  heartRate: number;
  activeEnergyBurned: number;
  steps: number;
  walkingStability: number; // 0-100
  walkingAsymmetry: number; // percentage
  walkingSpeed: number; // m/s
  doubleSupportTime: number; // percentage of gait cycle
  stepLength: number; // meters
  timestamp: number;
  workoutType?: string;
}

interface CameraPoseData {
  keypoints: {
    nose: { x: number; y: number; confidence: number };
    leftEye: { x: number; y: number; confidence: number };
    rightEye: { x: number; y: number; confidence: number };
    leftEar: { x: number; y: number; confidence: number };
    rightEar: { x: number; y: number; confidence: number };
    leftShoulder: { x: number; y: number; confidence: number };
    rightShoulder: { x: number; y: number; confidence: number };
    leftElbow: { x: number; y: number; confidence: number };
    rightElbow: { x: number; y: number; confidence: number };
    leftWrist: { x: number; y: number; confidence: number };
    rightWrist: { x: number; y: number; confidence: number };
    leftHip: { x: number; y: number; confidence: number };
    rightHip: { x: number; y: number; confidence: number };
    leftKnee: { x: number; y: number; confidence: number };
    rightKnee: { x: number; y: number; confidence: number };
    leftAnkle: { x: number; y: number; confidence: number };
    rightAnkle: { x: number; y: number; confidence: number };
  };
  timestamp: number;
  confidence: number;
}

interface EnvironmentalData {
  temperature: number; // Celsius
  humidity: number; // percentage
  pressure: number; // hPa
  lightLevel: number; // lux
  noiseLevel: number; // dB
  timestamp: number;
}

interface FusedSensorData {
  smartphone: {
    accelerometer: AccelerometerData[];
    gyroscope: GyroscopeData[];
    magnetometer: MagnetometerData[];
  };
  appleWatch?: AppleWatchData[];
  cameraPose?: CameraPoseData[];
  environmental?: EnvironmentalData[];
  lidar?: {
    pointCloud: Array<{ x: number; y: number; z: number }>;
    confidence: number;
    timestamp: number;
  }[];
}

interface SensorFusionConfig {
  enabledSensors: {
    smartphone: boolean;
    appleWatch: boolean;
    camera: boolean;
    environmental: boolean;
    lidar: boolean;
  };
  samplingRates: {
    smartphone: number; // Hz
    appleWatch: number; // Hz
    camera: number; // fps
    environmental: number; // Hz
  };
  fusionAlgorithm: 'kalman' | 'complementary' | 'madgwick' | 'mahony';
  confidenceThreshold: number;
  timeWindow: number; // seconds
}

interface FusionResult {
  combinedMetrics: {
    stability: number; // 0-100
    coordination: number; // 0-100
    symmetry: number; // 0-100
    fluidity: number; // 0-100
    riskScore: number; // 0-100
  };
  confidence: number;
  contributingSensors: string[];
  processingTime: number;
  timestamp: number;
}

export class MultiModalSensorFusion {
  private readonly config: SensorFusionConfig;
  private readonly sensorData: FusedSensorData;
  private isCollecting: boolean = false;
  private collectionInterval?: NodeJS.Timeout;
  private webSocketConnection?: WebSocket;

  constructor(config?: Partial<SensorFusionConfig>) {
    this.config = {
      enabledSensors: {
        smartphone: true,
        appleWatch: false,
        camera: false,
        environmental: false,
        lidar: true,
      },
      samplingRates: {
        smartphone: 50, // 50 Hz
        appleWatch: 10, // 10 Hz
        camera: 30, // 30 fps
        environmental: 1, // 1 Hz
      },
      fusionAlgorithm: 'complementary',
      confidenceThreshold: 0.7,
      timeWindow: 5, // 5 seconds
      ...config,
    };

    this.sensorData = {
      smartphone: {
        accelerometer: [],
        gyroscope: [],
        magnetometer: [],
      },
    };
  }

  async initializeSensors(): Promise<boolean> {
    let success = true;

    try {
      // Initialize smartphone sensors
      if (this.config.enabledSensors.smartphone) {
        success &&= await this.initializeSmartphoneSensors();
      }

      // Initialize Apple Watch connection
      if (this.config.enabledSensors.appleWatch) {
        success &&= await this.initializeAppleWatchConnection();
      }

      // Initialize camera pose estimation
      if (this.config.enabledSensors.camera) {
        success &&= await this.initializeCameraPoseEstimation();
      }

      // Initialize environmental sensors
      if (this.config.enabledSensors.environmental) {
        success &&= await this.initializeEnvironmentalSensors();
      }

      console.log(
        `🔄 Sensor initialization: ${success ? 'Success' : 'Partial failure'}`
      );
      return success;
    } catch (error) {
      console.error('❌ Sensor initialization failed:', error);
      return false;
    }
  }

  private async initializeSmartphoneSensors(): Promise<boolean> {
    try {
      // Request device motion permissions
      if (
        typeof DeviceMotionEvent !== 'undefined' &&
        'requestPermission' in DeviceMotionEvent
      ) {
        // Define the type for DeviceMotionEvent with the iOS-specific requestPermission method
        interface DeviceMotionEventWithPermission extends EventTarget {
          requestPermission: () => Promise<'granted' | 'denied' | 'default'>;
        }

        const permission = await (
          DeviceMotionEvent as unknown as DeviceMotionEventWithPermission
        ).requestPermission();
        if (permission !== 'granted') {
          console.warn('⚠️ Device motion permission denied');
          return false;
        }
      }

      // Start listening to device motion
      window.addEventListener(
        'devicemotion',
        this.handleDeviceMotion.bind(this)
      );
      console.log('✅ Smartphone sensors initialized');
      return true;
    } catch (error) {
      console.error('❌ Smartphone sensor initialization failed:', error);
      return false;
    }
  }

  private async initializeAppleWatchConnection(): Promise<boolean> {
    try {
      // Establish WebSocket connection to companion iOS app
      const wsUrl = 'wss://localhost:8080/apple-watch-bridge';
      this.webSocketConnection = new WebSocket(wsUrl);

      return new Promise((resolve) => {
        if (!this.webSocketConnection) {
          resolve(false);
          return;
        }

        this.webSocketConnection.onopen = () => {
          console.log('✅ Apple Watch connection established');
          resolve(true);
        };

        this.webSocketConnection.onerror = (error) => {
          console.error('❌ Apple Watch connection failed:', error);
          resolve(false);
        };

        this.webSocketConnection.onmessage = (event) => {
          try {
            const watchData: AppleWatchData = JSON.parse(event.data);
            this.handleAppleWatchData(watchData);
          } catch (error) {
            console.error('Apple Watch data parsing error:', error);
          }
        };

        // Timeout after 5 seconds
        setTimeout(() => {
          if (this.webSocketConnection?.readyState !== WebSocket.OPEN) {
            resolve(false);
          }
        }, 5000);
      });
    } catch (error) {
      console.error('❌ Apple Watch initialization failed:', error);
      return false;
    }
  }

  private async initializeCameraPoseEstimation(): Promise<boolean> {
    try {
      // Check if camera is available
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
      });

      // Stop the stream immediately (we just needed to check permissions)
      stream.getTracks().forEach((track) => track.stop());

      console.log('✅ Camera pose estimation ready');
      return true;
    } catch (error) {
      console.error('❌ Camera initialization failed:', error);
      return false;
    }
  }

  private async initializeEnvironmentalSensors(): Promise<boolean> {
    try {
      // Check for ambient light sensor
      if ('AmbientLightSensor' in window) {
        const lightSensor = new (window as any).AmbientLightSensor();
        lightSensor.addEventListener('reading', () => {
          this.handleEnvironmentalData({
            temperature: 0, // Not available in web browsers
            humidity: 0, // Not available in web browsers
            pressure: 0, // Not available in web browsers
            lightLevel: lightSensor.illuminance,
            noiseLevel: 0, // Would need Web Audio API
            timestamp: Date.now(),
          });
        });
        lightSensor.start();
      }

      console.log('✅ Environmental sensors initialized');
      return true;
    } catch (error) {
      console.warn('⚠️ Environmental sensors not available:', error);
      return true; // Non-critical failure
    }
  }

  private handleDeviceMotion(event: DeviceMotionEvent): void {
    const timestamp = Date.now();

    if (event.acceleration) {
      this.sensorData.smartphone.accelerometer.push({
        x: event.acceleration.x || 0,
        y: event.acceleration.y || 0,
        z: event.acceleration.z || 0,
        timestamp,
      });
    }

    if (event.rotationRate) {
      this.sensorData.smartphone.gyroscope.push({
        x: event.rotationRate.alpha || 0,
        y: event.rotationRate.beta || 0,
        z: event.rotationRate.gamma || 0,
        timestamp,
      });
    }

    // Keep only recent data (last 5 seconds)
    const cutoffTime = timestamp - this.config.timeWindow * 1000;
    this.sensorData.smartphone.accelerometer =
      this.sensorData.smartphone.accelerometer.filter(
        (data) => data.timestamp > cutoffTime
      );
    this.sensorData.smartphone.gyroscope =
      this.sensorData.smartphone.gyroscope.filter(
        (data) => data.timestamp > cutoffTime
      );
  }

  private handleAppleWatchData(data: AppleWatchData): void {
    this.sensorData.appleWatch ??= [];

    this.sensorData.appleWatch.push(data);

    // Keep only recent data
    const cutoffTime = Date.now() - this.config.timeWindow * 1000;
    this.sensorData.appleWatch = this.sensorData.appleWatch.filter(
      (data) => data.timestamp > cutoffTime
    );
  }

  private handleEnvironmentalData(data: EnvironmentalData): void {
    this.sensorData.environmental ??= [];
    this.sensorData.environmental.push(data);

    // Keep only recent data
    const cutoffTime = Date.now() - this.config.timeWindow * 1000;
    this.sensorData.environmental = this.sensorData.environmental.filter(
      (data) => data.timestamp > cutoffTime
    );
  }

  fuseSensorData(): FusionResult {
    const startTime = performance.now();
    const contributingSensors: string[] = [];
    let totalConfidence = 0;
    let sensorCount = 0;

    // Initialize combined metrics
    const combinedMetrics = {
      stability: 0,
      coordination: 0,
      symmetry: 0,
      fluidity: 0,
      riskScore: 0,
    };

    // Fuse smartphone sensor data
    if (
      this.config.enabledSensors.smartphone &&
      this.hasRecentSmartphoneData()
    ) {
      const smartphoneMetrics = this.analyzeSmartphoneData();
      this.weightedMerge(combinedMetrics, smartphoneMetrics, 0.4);
      contributingSensors.push('smartphone');
      totalConfidence += 0.8;
      sensorCount++;
    }

    // Fuse Apple Watch data
    if (
      this.config.enabledSensors.appleWatch &&
      this.hasRecentAppleWatchData()
    ) {
      const watchMetrics = this.analyzeAppleWatchData();
      this.weightedMerge(combinedMetrics, watchMetrics, 0.3);
      contributingSensors.push('appleWatch');
      totalConfidence += 0.9;
      sensorCount++;
    }

    // Fuse camera pose data
    if (this.config.enabledSensors.camera && this.hasRecentCameraData()) {
      const poseMetrics = this.analyzeCameraPoseData();
      this.weightedMerge(combinedMetrics, poseMetrics, 0.2);
      contributingSensors.push('camera');
      totalConfidence += 0.7;
      sensorCount++;
    }

    // Fuse LiDAR data
    if (this.config.enabledSensors.lidar && this.hasRecentLiDARData()) {
      const lidarMetrics = this.analyzeLiDARData();
      this.weightedMerge(combinedMetrics, lidarMetrics, 0.5);
      contributingSensors.push('lidar');
      totalConfidence += 0.95;
      sensorCount++;
    }

    const processingTime = performance.now() - startTime;
    const confidence = sensorCount > 0 ? totalConfidence / sensorCount : 0;

    return {
      combinedMetrics,
      confidence,
      contributingSensors,
      processingTime,
      timestamp: Date.now(),
    };
  }

  private hasRecentSmartphoneData(): boolean {
    const cutoff = Date.now() - 1000; // 1 second
    return (
      this.sensorData.smartphone.accelerometer.some(
        (d) => d.timestamp > cutoff
      ) &&
      this.sensorData.smartphone.gyroscope.some((d) => d.timestamp > cutoff)
    );
  }

  private hasRecentAppleWatchData(): boolean {
    if (
      !this.sensorData.appleWatch ||
      this.sensorData.appleWatch.length === 0
    ) {
      return false;
    }
    const cutoff = Date.now() - 5000; // 5 seconds
    return this.sensorData.appleWatch.some((d) => d.timestamp > cutoff);
  }

  private hasRecentCameraData(): boolean {
    if (
      !this.sensorData.cameraPose ||
      this.sensorData.cameraPose.length === 0
    ) {
      return false;
    }
    const cutoff = Date.now() - 1000; // 1 second
    return this.sensorData.cameraPose.some((d) => d.timestamp > cutoff);
  }

  private hasRecentLiDARData(): boolean {
    if (!this.sensorData.lidar || this.sensorData.lidar.length === 0) {
      return false;
    }
    const cutoff = Date.now() - 2000; // 2 seconds
    return this.sensorData.lidar.some((d) => d.timestamp > cutoff);
  }

  private analyzeSmartphoneData(): SensorMetrics {
    const accelData = this.sensorData.smartphone.accelerometer;
    const gyroData = this.sensorData.smartphone.gyroscope;

    // Calculate stability from accelerometer variance
    const accelVariance = this.calculateVariance(
      accelData.map((d) => Math.sqrt(d.x * d.x + d.y * d.y + d.z * d.z))
    );
    const stability = Math.max(0, 100 - accelVariance * 10);

    // Calculate coordination from gyroscope smoothness
    const gyroSmoothness = this.calculateSmoothness(gyroData);
    const coordination = Math.min(100, gyroSmoothness * 100);

    return {
      stability,
      coordination,
      symmetry: 75, // Placeholder - would need more complex analysis
      fluidity: coordination,
      riskScore: Math.max(0, 100 - stability),
    };
  }

  private analyzeAppleWatchData(): SensorMetrics {
    if (
      !this.sensorData.appleWatch ||
      this.sensorData.appleWatch.length === 0
    ) {
      return {
        stability: 0,
        coordination: 0,
        symmetry: 0,
        fluidity: 0,
        riskScore: 100,
      };
    }

    const latest =
      this.sensorData.appleWatch[this.sensorData.appleWatch.length - 1];

    return {
      stability: latest.walkingStability,
      coordination: Math.max(0, 100 - latest.walkingAsymmetry),
      symmetry: Math.max(0, 100 - latest.walkingAsymmetry),
      fluidity: Math.min(100, latest.walkingSpeed * 50), // Normalize speed to 0-100
      riskScore: Math.max(0, 100 - latest.walkingStability),
    };
  }

  private analyzeCameraPoseData(): SensorMetrics {
    // Placeholder implementation
    return {
      stability: 80,
      coordination: 75,
      symmetry: 85,
      fluidity: 78,
      riskScore: 20,
    };
  }

  private analyzeLiDARData(): SensorMetrics {
    // Placeholder implementation - would analyze point cloud data
    return {
      stability: 90,
      coordination: 88,
      symmetry: 92,
      fluidity: 85,
      riskScore: 10,
    };
  }

  private weightedMerge(
    target: SensorMetrics,
    source: SensorMetrics,
    weight: number
  ): void {
    target.stability =
      target.stability * (1 - weight) + source.stability * weight;
    target.coordination =
      target.coordination * (1 - weight) + source.coordination * weight;
    target.symmetry = target.symmetry * (1 - weight) + source.symmetry * weight;
    target.fluidity = target.fluidity * (1 - weight) + source.fluidity * weight;
    target.riskScore =
      target.riskScore * (1 - weight) + source.riskScore * weight;
  }

  private calculateVariance(data: number[]): number {
    if (data.length === 0) return 0;

    const mean = data.reduce((sum, val) => sum + val, 0) / data.length;
    const variance =
      data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.length;
    return variance;
  }

  private calculateSmoothness(
    data: { x: number; y: number; z: number }[]
  ): number {
    if (data.length < 2) return 0;

    let totalChange = 0;
    for (let i = 1; i < data.length; i++) {
      const prev = data[i - 1];
      const curr = data[i];
      const change = Math.sqrt(
        Math.pow(curr.x - prev.x, 2) +
          Math.pow(curr.y - prev.y, 2) +
          Math.pow(curr.z - prev.z, 2)
      );
      totalChange += change;
    }

    // Lower total change indicates smoother movement
    return Math.max(0, 1 - totalChange / data.length);
  }

  startDataCollection(): void {
    if (this.isCollecting) return;

    this.isCollecting = true;
    console.log('🎯 Starting multi-modal data collection');

    // Start periodic fusion
    this.collectionInterval = setInterval(() => {
      const result = this.fuseSensorData();
      // Emit fusion result to listeners
      window.dispatchEvent(
        new CustomEvent('sensorFusionUpdate', {
          detail: result,
        })
      );
    }, 1000 / 10); // 10 Hz fusion rate
  }

  stopDataCollection(): void {
    if (!this.isCollecting) return;

    this.isCollecting = false;
    console.log('⏹️ Stopping multi-modal data collection');

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = undefined;
    }
  }

  dispose(): void {
    this.stopDataCollection();

    // Clean up event listeners
    window.removeEventListener(
      'devicemotion',
      this.handleDeviceMotion.bind(this)
    );

    // Close WebSocket connection
    if (this.webSocketConnection) {
      this.webSocketConnection.close();
      this.webSocketConnection = undefined;
    }

    console.log('🧹 Multi-modal sensor fusion disposed');
  }
}

// React Hook for Multi-Modal Sensor Fusion
export function useMultiModalSensorFusion(
  config?: Partial<SensorFusionConfig>
) {
  const [fusion] = useState(() => new MultiModalSensorFusion(config));
  const [fusionResult, setFusionResult] = useState<FusionResult | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isCollecting, setIsCollecting] = useState(false);
  const fusionRef = useRef(fusion);

  const initializeSensors = useCallback(async () => {
    const success = await fusionRef.current.initializeSensors();
    setIsInitialized(success);
    return success;
  }, []);

  const startCollection = useCallback(() => {
    fusionRef.current.startDataCollection();
    setIsCollecting(true);
  }, []);

  const stopCollection = useCallback(() => {
    fusionRef.current.stopDataCollection();
    setIsCollecting(false);
  }, []);

  // Listen for fusion updates
  useEffect(() => {
    const handleFusionUpdate = (event: CustomEvent<FusionResult>) => {
      setFusionResult(event.detail);
    };

    window.addEventListener(
      'sensorFusionUpdate',
      handleFusionUpdate as EventListener
    );

    return () => {
      window.removeEventListener(
        'sensorFusionUpdate',
        handleFusionUpdate as EventListener
      );
    };
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const currentFusion = fusionRef.current;
    return () => {
      currentFusion.dispose();
    };
  }, []);

  return {
    fusion: fusionRef.current,
    fusionResult,
    isInitialized,
    isCollecting,
    initializeSensors,
    startCollection,
    stopCollection,
  };
}
