/**
 * Enhanced ML Integration for LiDAR Health Analysis
 * TensorFlow.js models for edge computing and real-time predictions
 */

// Mock TensorFlow.js types for development without full dependency
// To use real TensorFlow.js, install: npm install @tensorflow/tfjs
interface TensorFlowMock {
  LayersModel: any;
  Tensor: any;
  env: () => { set: (key: string, value: boolean) => void };
  loadLayersModel: (path: string) => Promise<any>;
  zeros: (shape: number[]) => any;
  tensor: (
    data: any,
    shape?: number[],
    dtype?: string
  ) => { reshape: (shape: number[]) => any; dispose: () => void };
  tensor1d: (data: any) => any;
  oneHot: (indices: any, depth: number) => any;
  train: {
    adam: (learningRate: number) => any;
  };
  getBackend: () => string;
  memory: () => { numTensors: number; numBytes: number };
}

const tf: TensorFlowMock = {
  LayersModel: class MockLayersModel {},
  Tensor: class MockTensor {},
  env: () => ({ set: () => {} }),
  loadLayersModel: async () => ({ predict: () => ({ dataSync: () => [0.5] }) }),
  zeros: () => ({ predict: () => {} }),
  tensor: (data: any, shape?: number[], dtype?: string) => ({
    reshape: () => ({ predict: () => ({ dataSync: () => [0.5] }) }),
    dispose: () => {},
  }),
  tensor1d: () => ({}),
  oneHot: (indices: any, depth: number) => ({}),
  train: {
    adam: (learningRate: number) => ({}),
  },
  getBackend: () => 'cpu',
  memory: () => ({ numTensors: 0, numBytes: 0 }),
};
import { useCallback, useEffect, useRef, useState } from 'react';

// ML Model Types
interface MLModelConfig {
  modelPath: string;
  inputShape: number[];
  outputClasses: string[];
  threshold: number;
  version: string;
}

interface PredictionResult {
  prediction: string;
  confidence: number;
  probabilities: Record<string, number>;
  processingTime: number;
  modelVersion: string;
}

interface TrainingData {
  inputs: number[][];
  labels: string[];
  metadata: {
    timestamp: Date;
    deviceId: string;
    userConsent: boolean;
  };
}

interface FederatedLearningConfig {
  enabled: boolean;
  contributionLevel: 'minimal' | 'standard' | 'full';
  privacyPreserving: boolean;
  localTrainingRounds: number;
  uploadFrequency: 'never' | 'weekly' | 'monthly';
}

// Available ML Models
const ML_MODELS: Record<string, MLModelConfig> = {
  gaitAnalysis: {
    modelPath: '/models/gait-analysis-v2.json',
    inputShape: [1, 50, 6], // 50 time steps, 6 features (x,y,z accel + gyro)
    outputClasses: ['normal', 'unsteady', 'at-risk', 'concerning'],
    threshold: 0.75,
    version: '2.1.0',
  },
  fallPrediction: {
    modelPath: '/models/fall-prediction-v3.json',
    inputShape: [1, 100, 9], // 100 time steps, 9 features (3D accel + gyro + mag)
    outputClasses: ['low-risk', 'medium-risk', 'high-risk', 'immediate-risk'],
    threshold: 0.8,
    version: '3.0.1',
  },
  postureClassification: {
    modelPath: '/models/posture-classifier-v1.json',
    inputShape: [1, 25, 12], // 25 time steps, 12 joint positions
    outputClasses: ['excellent', 'good', 'fair', 'poor', 'concerning'],
    threshold: 0.7,
    version: '1.2.0',
  },
  movementPattern: {
    modelPath: '/models/movement-pattern-v2.json',
    inputShape: [1, 75, 8], // 75 time steps, 8 movement features
    outputClasses: ['fluid', 'compensatory', 'restricted', 'abnormal'],
    threshold: 0.72,
    version: '2.3.0',
  },
};

export class LiDARMLEngine {
  private models: Map<string, any> = new Map();
  private loadingStates: Map<string, boolean> = new Map();
  private trainingData: TrainingData[] = [];
  private federatedConfig: FederatedLearningConfig;

  constructor(federatedConfig?: Partial<FederatedLearningConfig>) {
    this.federatedConfig = {
      enabled: false,
      contributionLevel: 'minimal',
      privacyPreserving: true,
      localTrainingRounds: 5,
      uploadFrequency: 'monthly',
      ...federatedConfig,
    };

    // Configure TensorFlow.js for optimal performance
    tf.env().set('WEBGL_PACK', true);
    tf.env().set('WEBGL_FORCE_F16_TEXTURES', true);
  }

  async loadModel(modelType: keyof typeof ML_MODELS): Promise<boolean> {
    if (this.loadingStates.get(modelType)) {
      return false; // Already loading
    }

    if (this.models.has(modelType)) {
      return true; // Already loaded
    }

    try {
      this.loadingStates.set(modelType, true);
      const config = ML_MODELS[modelType];

      console.log(`Loading ML model: ${modelType} v${config.version}`);

      const model = await tf.loadLayersModel(config.modelPath);

      // Warm up the model with dummy data
      const dummyInput = tf.zeros(config.inputShape);
      await model.predict(dummyInput);
      dummyInput.dispose();

      this.models.set(modelType, model);
      console.log(`✅ ML model loaded: ${modelType}`);

      return true;
    } catch (error) {
      console.error(`❌ Failed to load ML model ${modelType}:`, error);
      return false;
    } finally {
      this.loadingStates.set(modelType, false);
    }
  }

  async predict(
    modelType: keyof typeof ML_MODELS,
    inputData: number[][],
    metadata?: Record<string, unknown>
  ): Promise<PredictionResult | null> {
    const model = this.models.get(modelType);
    if (!model) {
      console.warn(`Model ${modelType} not loaded`);
      return null;
    }

    const startTime = performance.now();

    try {
      const config = ML_MODELS[modelType];

      // Prepare input tensor
      const inputTensor = tf.tensor(inputData).reshape(config.inputShape);

      // Make prediction
      const prediction = model.predict(inputTensor) as any;
      const probabilities = await prediction.data();

      // Find the class with highest probability
      const maxIndex = probabilities.indexOf(Math.max(...probabilities));
      const predictedClass = config.outputClasses[maxIndex];
      const confidence = probabilities[maxIndex];

      // Create probability map
      const probabilityMap: Record<string, number> = {};
      config.outputClasses.forEach((className, index) => {
        probabilityMap[className] = probabilities[index];
      });

      // Clean up tensors
      inputTensor.dispose();
      prediction.dispose();

      const processingTime = performance.now() - startTime;

      // Collect training data if enabled
      if (this.federatedConfig.enabled && metadata?.userConsent) {
        this.collectTrainingData(inputData, predictedClass, metadata);
      }

      return {
        prediction: predictedClass,
        confidence,
        probabilities: probabilityMap,
        processingTime,
        modelVersion: config.version,
      };
    } catch (error) {
      console.error(`Prediction error for ${modelType}:`, error);
      return null;
    }
  }

  private collectTrainingData(
    inputs: number[][],
    label: string,
    metadata: Record<string, unknown>
  ): void {
    if (this.trainingData.length > 1000) {
      // Limit training data collection
      this.trainingData.shift();
    }

    this.trainingData.push({
      inputs,
      labels: [label],
      metadata: {
        timestamp: new Date(),
        deviceId: (metadata.deviceId as string) || 'unknown',
        userConsent: (metadata.userConsent as boolean) || false,
      },
    });
  }

  async performLocalTraining(
    modelType: keyof typeof ML_MODELS,
    customData?: TrainingData[]
  ): Promise<boolean> {
    if (!this.federatedConfig.enabled) {
      return false;
    }

    const model = this.models.get(modelType);
    if (!model) {
      console.warn(`Cannot train: Model ${modelType} not loaded`);
      return false;
    }

    try {
      const dataToUse = customData || this.trainingData;
      if (dataToUse.length < 50) {
        console.warn('Insufficient training data for local training');
        return false;
      }

      console.log(`🧠 Starting local training for ${modelType}...`);

      // Prepare training data
      const xs = tf.tensor(dataToUse.map((d) => d.inputs).flat());
      const ys = tf.oneHot(
        tf.tensor1d(
          dataToUse
            .map((d) => d.labels[0])
            .map((label) => ML_MODELS[modelType].outputClasses.indexOf(label))
        ),
        ML_MODELS[modelType].outputClasses.length
      );

      // Configure training
      model.compile({
        optimizer: tf.train.adam(0.001),
        loss: 'categoricalCrossentropy',
        metrics: ['accuracy'],
      });

      // Perform local training rounds
      for (
        let round = 0;
        round < this.federatedConfig.localTrainingRounds;
        round++
      ) {
        await model.fit(xs, ys, {
          epochs: 1,
          batchSize: 16,
          verbose: 0,
        });
      }

      // Clean up
      xs.dispose();
      ys.dispose();

      console.log(`✅ Local training completed for ${modelType}`);
      return true;
    } catch (error) {
      console.error(`Local training error for ${modelType}:`, error);
      return false;
    }
  }

  getModelMetrics(): Record<string, unknown> {
    const metrics: Record<string, unknown> = {};

    this.models.forEach((model, modelType) => {
      metrics[modelType] = {
        loaded: true,
        version: ML_MODELS[modelType as keyof typeof ML_MODELS].version,
        memoryUsage: model.countParams(),
        inputShape: ML_MODELS[modelType as keyof typeof ML_MODELS].inputShape,
        outputClasses:
          ML_MODELS[modelType as keyof typeof ML_MODELS].outputClasses.length,
      };
    });

    return {
      models: metrics,
      trainingDataSize: this.trainingData.length,
      federatedLearning: this.federatedConfig,
      tfBackend: tf.getBackend(),
      memoryInfo: tf.memory(),
    };
  }

  async dispose(): Promise<void> {
    // Dispose all models
    this.models.forEach((model) => {
      model.dispose();
    });
    this.models.clear();

    // Clear training data
    this.trainingData = [];

    console.log('🧹 ML Engine disposed');
  }
}

// React Hook for ML Integration
export function useLiDARMLEngine(
  federatedConfig?: Partial<FederatedLearningConfig>
) {
  const [engine] = useState(() => new LiDARMLEngine(federatedConfig));
  const [loadedModels, setLoadedModels] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(false);
  const engineRef = useRef(engine);

  const loadModel = useCallback(async (modelType: keyof typeof ML_MODELS) => {
    setIsLoading(true);
    try {
      const success = await engineRef.current.loadModel(modelType);
      if (success) {
        setLoadedModels((prev) => new Set([...prev, modelType]));
      }
      return success;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const predict = useCallback(
    async (
      modelType: keyof typeof ML_MODELS,
      inputData: number[][],
      metadata?: Record<string, unknown>
    ) => {
      return await engineRef.current.predict(modelType, inputData, metadata);
    },
    []
  );

  const performTraining = useCallback(
    async (modelType: keyof typeof ML_MODELS, customData?: TrainingData[]) => {
      return await engineRef.current.performLocalTraining(
        modelType,
        customData
      );
    },
    []
  );

  const getMetrics = useCallback(() => {
    return engineRef.current.getModelMetrics();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    const currentEngine = engineRef.current;
    return () => {
      currentEngine.dispose();
    };
  }, []);

  return {
    engine: engineRef.current,
    loadedModels,
    isLoading,
    loadModel,
    predict,
    performTraining,
    getMetrics,
  };
}

// Utility functions for data preprocessing
export const MLUtils = {
  normalizeData: (data: number[][], min?: number, max?: number): number[][] => {
    if (!min || !max) {
      const flat = data.flat();
      min = Math.min(...flat);
      max = Math.max(...flat);
    }

    return data.map((row) =>
      row.map((value) => (value - min!) / (max! - min!))
    );
  },

  createSlidingWindow: (
    data: number[],
    windowSize: number,
    stepSize: number = 1
  ): number[][] => {
    const windows: number[][] = [];
    for (let i = 0; i <= data.length - windowSize; i += stepSize) {
      windows.push(data.slice(i, i + windowSize));
    }
    return windows;
  },

  extractFeatures: (sensorData: {
    accelerometer: { x: number; y: number; z: number }[];
    gyroscope: { x: number; y: number; z: number }[];
    timestamp: number[];
  }): number[][] => {
    const features: number[][] = [];

    for (let i = 0; i < sensorData.accelerometer.length; i++) {
      const accel = sensorData.accelerometer[i];
      const gyro = sensorData.gyroscope[i];

      features.push([
        accel.x,
        accel.y,
        accel.z,
        gyro.x,
        gyro.y,
        gyro.z,
        Math.sqrt(accel.x ** 2 + accel.y ** 2 + accel.z ** 2), // magnitude
        Math.sqrt(gyro.x ** 2 + gyro.y ** 2 + gyro.z ** 2), // angular magnitude
      ]);
    }

    return features;
  },
};
