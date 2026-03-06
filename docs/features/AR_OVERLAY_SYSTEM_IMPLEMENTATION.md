# 🥽 AR Overlay System - Implementation Guide

## Overview

The AR Overlay System extends your LiDAR Advanced integration with immersive augmented reality capabilities. This system provides real-time health visualization, movement guidance, and environmental hazard detection using WebXR (web) and ARKit (iOS).

## 🎯 Core AR Features

### 1. **Real-time Health Visualization**

- Overlay gait stability indicators in real space
- Display posture correction guidance
- Show fall risk zones around the user
- Visualize movement confidence metrics

### 2. **Environmental Safety**

- Highlight potential trip hazards
- Mark unstable surfaces
- Show optimal walking paths
- Display safety recommendations

### 3. **Interactive Health Coaching**

- Real-time posture feedback
- Gait improvement suggestions
- Balance exercise guidance
- Movement pattern optimization

## 🌐 WebXR Implementation (Web Platform)

### A. WebXR AR Manager

```typescript
/**
 * WebXR AR Overlay System for VitalSense Health Monitoring
 * Integrates with existing LiDAR data streams for immersive health visualization
 */

import { LiDARScanData, HealthMetrics } from '@/components/health/lidar/CleanLiDARComponents';

export interface AROverlaySystem {
  initializeWebXR(): Promise<XRSession | null>;
  overlayHealthMetrics(position: XRSpace, data: HealthMetrics): void;
  displayGaitGuidance(realTime: boolean): void;
  showEnvironmentalHazards(detected: EnvironmentalHazard[]): void;
  cleanup(): void;
}

export interface EnvironmentalHazard {
  id: string;
  type: 'trip_hazard' | 'unstable_surface' | 'obstacle' | 'poor_lighting';
  position: { x: number; y: number; z: number };
  severity: 'low' | 'medium' | 'high';
  description: string;
  recommendations: string[];
}

export interface HealthVisualization {
  gaitStability: {
    value: number;
    color: string;
    position: XRSpace;
  };
  postureIndicator: {
    alignment: number;
    corrections: string[];
    visualCues: ARVisualCue[];
  };
  fallRiskZones: {
    zones: ARZone[];
    severity: 'low' | 'medium' | 'high';
  };
}

export interface ARVisualCue {
  type: 'arrow' | 'highlight' | 'text' | 'icon';
  position: { x: number; y: number; z: number };
  content: string | HTMLElement;
  animation?: 'pulse' | 'fade' | 'bounce';
  duration?: number;
}

export interface ARZone {
  id: string;
  type: 'safe' | 'caution' | 'danger';
  boundaries: { x: number; y: number; z: number }[];
  color: string;
  opacity: number;
  warning?: string;
}

export class WebXRHealthOverlay implements AROverlaySystem {
  private xrSession: XRSession | null = null;
  private xrReferenceSpace: XRReferenceSpace | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private frameCallbacks: Set<() => void> = new Set();
  private healthVisualizations: Map<string, HealthVisualization> = new Map();
  private environmentalHazards: EnvironmentalHazard[] = [];

  async initializeWebXR(): Promise<XRSession | null> {
    if (!navigator.xr) {
      console.warn('WebXR not supported in this browser');
      return null;
    }

    try {
      const isARSupported = await navigator.xr.isSessionSupported('immersive-ar');
      if (!isARSupported) {
        console.warn('Immersive AR not supported');
        return null;
      }

      this.xrSession = await navigator.xr.requestSession('immersive-ar', {
        requiredFeatures: ['local', 'hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation']
      });

      this.xrReferenceSpace = await this.xrSession.requestReferenceSpace('local');
      
      // Initialize WebGL context
      const canvas = document.createElement('canvas');
      this.gl = canvas.getContext('webgl2');
      
      if (!this.gl) {
        throw new Error('WebGL2 not supported');
      }

      // Start AR session
      this.xrSession.requestAnimationFrame(this.onXRFrame.bind(this));
      
      console.log('✅ WebXR AR Session initialized successfully');
      return this.xrSession;

    } catch (error) {
      console.error('Failed to initialize WebXR:', error);
      return null;
    }
  }

  overlayHealthMetrics(position: XRSpace, data: HealthMetrics): void {
    if (!this.xrSession || !this.xrReferenceSpace) return;

    const visualization: HealthVisualization = {
      gaitStability: {
        value: data.gaitStability,
        color: this.getHealthColor(data.gaitStability),
        position
      },
      postureIndicator: {
        alignment: data.postureScore,
        corrections: this.generatePostureCorrections(data.postureScore),
        visualCues: this.createPostureVisualCues(data.postureScore)
      },
      fallRiskZones: {
        zones: this.generateFallRiskZones(data.fallRisk),
        severity: this.getFallRiskSeverity(data.fallRisk)
      }
    };

    this.healthVisualizations.set(`health-${Date.now()}`, visualization);
  }

  displayGaitGuidance(realTime: boolean): void {
    if (!this.xrSession) return;

    const guidanceElements = [
      {
        type: 'arrow' as const,
        position: { x: 0, y: 0, z: -2 },
        content: 'Maintain steady pace',
        animation: 'pulse' as const,
        duration: 3000
      },
      {
        type: 'highlight' as const,
        position: { x: 0, y: -1, z: -1 },
        content: 'Keep feet shoulder-width apart',
        animation: 'fade' as const,
        duration: 5000
      }
    ];

    guidanceElements.forEach(element => {
      this.renderARElement(element);
    });
  }

  showEnvironmentalHazards(detected: EnvironmentalHazard[]): void {
    this.environmentalHazards = detected;

    detected.forEach(hazard => {
      const hazardVisualization = {
        type: 'icon' as const,
        position: hazard.position,
        content: this.getHazardIcon(hazard.type),
        animation: 'bounce' as const,
        duration: 0 // Persistent until hazard is resolved
      };

      this.renderARElement(hazardVisualization);
    });
  }

  private onXRFrame(time: number, frame: XRFrame): void {
    if (!this.xrSession || !this.xrReferenceSpace) return;

    const pose = frame.getViewerPose(this.xrReferenceSpace);
    if (!pose) return;

    // Update health visualizations
    this.updateHealthVisualizations(frame);
    
    // Update environmental hazard detection
    this.updateHazardDetection(frame);
    
    // Execute frame callbacks
    this.frameCallbacks.forEach(callback => callback());

    // Continue animation loop
    this.xrSession?.requestAnimationFrame(this.onXRFrame.bind(this));
  }

  private updateHealthVisualizations(frame: XRFrame): void {
    // Real-time health metric visualization updates
    this.healthVisualizations.forEach((visualization, id) => {
      // Update gait stability indicator
      this.updateGaitIndicator(visualization.gaitStability);
      
      // Update posture correction cues
      this.updatePostureCues(visualization.postureIndicator);
      
      // Update fall risk zones
      this.updateFallRiskZones(visualization.fallRiskZones);
    });
  }

  private updateHazardDetection(frame: XRFrame): void {
    // Process LiDAR data for environmental hazards
    // This would integrate with your existing LiDAR data stream
    const detectedHazards = this.analyzeLiDARForHazards();
    
    if (detectedHazards.length > 0) {
      this.showEnvironmentalHazards(detectedHazards);
    }
  }

  private getHealthColor(value: number): string {
    if (value >= 85) return '#10b981'; // Green
    if (value >= 70) return '#3b82f6'; // Blue  
    if (value >= 55) return '#f59e0b'; // Yellow
    if (value >= 40) return '#f97316'; // Orange
    return '#ef4444'; // Red
  }

  private generatePostureCorrections(score: number): string[] {
    if (score >= 85) return ['Excellent posture!'];
    if (score >= 70) return ['Straighten shoulders slightly'];
    if (score >= 55) return ['Lift chin', 'Straighten back'];
    return ['Stand taller', 'Align shoulders', 'Engage core'];
  }

  private createPostureVisualCues(score: number): ARVisualCue[] {
    const cues: ARVisualCue[] = [];
    
    if (score < 70) {
      cues.push({
        type: 'arrow',
        position: { x: 0, y: 1.5, z: -0.5 },
        content: '↑ Lift head',
        animation: 'pulse',
        duration: 3000
      });
    }
    
    if (score < 60) {
      cues.push({
        type: 'highlight',
        position: { x: 0, y: 1, z: -0.5 },
        content: 'Straighten spine',
        animation: 'fade',
        duration: 4000
      });
    }

    return cues;
  }

  private generateFallRiskZones(fallRisk: number): ARZone[] {
    const zones: ARZone[] = [];
    
    if (fallRisk > 60) {
      zones.push({
        id: 'high-risk-zone',
        type: 'danger',
        boundaries: [
          { x: -1, y: 0, z: -2 },
          { x: 1, y: 0, z: -2 },
          { x: 1, y: 0, z: -0.5 },
          { x: -1, y: 0, z: -0.5 }
        ],
        color: '#ef4444',
        opacity: 0.3,
        warning: 'High fall risk - move carefully'
      });
    }

    return zones;
  }

  private getFallRiskSeverity(fallRisk: number): 'low' | 'medium' | 'high' {
    if (fallRisk < 30) return 'low';
    if (fallRisk < 60) return 'medium';
    return 'high';
  }

  private renderARElement(element: ARVisualCue): void {
    // WebGL rendering implementation for AR elements
    if (!this.gl) return;

    // Create visual representation based on element type
    switch (element.type) {
      case 'arrow':
        this.renderArrow(element);
        break;
      case 'highlight':
        this.renderHighlight(element);
        break;
      case 'text':
        this.renderText(element);
        break;
      case 'icon':
        this.renderIcon(element);
        break;
    }
  }

  private renderArrow(element: ARVisualCue): void {
    // WebGL arrow rendering implementation
    // Creates 3D arrow geometry at specified position
  }

  private renderHighlight(element: ARVisualCue): void {
    // WebGL highlight zone rendering
    // Creates translucent overlay zones
  }

  private renderText(element: ARVisualCue): void {
    // Text rendering in AR space
    // Creates billboard text elements
  }

  private renderIcon(element: ARVisualCue): void {
    // Icon rendering for hazards and indicators
    // Creates 3D icon representations
  }

  private updateGaitIndicator(gaitStability: HealthVisualization['gaitStability']): void {
    // Update real-time gait stability visualization
  }

  private updatePostureCues(postureIndicator: HealthVisualization['postureIndicator']): void {
    // Update posture correction visual cues
  }

  private updateFallRiskZones(fallRiskZones: HealthVisualization['fallRiskZones']): void {
    // Update fall risk zone boundaries and colors
  }

  private analyzeLiDARForHazards(): EnvironmentalHazard[] {
    // Analyze LiDAR point cloud data for environmental hazards
    // This would integrate with your existing LiDAR processing pipeline
    return [
      {
        id: 'hazard-1',
        type: 'trip_hazard',
        position: { x: 0.5, y: 0, z: -1.5 },
        severity: 'medium',
        description: 'Uneven surface detected',
        recommendations: ['Step carefully', 'Use handrail if available']
      }
    ];
  }

  private getHazardIcon(type: EnvironmentalHazard['type']): string {
    const icons = {
      'trip_hazard': '⚠️',
      'unstable_surface': '🛑',
      'obstacle': '🚧',
      'poor_lighting': '💡'
    };
    return icons[type] || '⚠️';
  }

  cleanup(): void {
    if (this.xrSession) {
      this.xrSession.end();
      this.xrSession = null;
    }
    
    this.xrReferenceSpace = null;
    this.gl = null;
    this.frameCallbacks.clear();
    this.healthVisualizations.clear();
    this.environmentalHazards = [];
  }
}
```

### B. React Component Integration

```typescript
/**
 * AR Overlay Integration Component
 * Connects WebXR system with existing LiDAR data streams
 */

import React, { useEffect, useRef, useState } from 'react';
import { WebXRHealthOverlay } from './WebXRHealthOverlay';
import type { LiDARScanData } from '@/components/health/lidar/CleanLiDARComponents';

interface AROverlayIntegrationProps {
  scanData: LiDARScanData[];
  enableRealTimeGuidance?: boolean;
  enableHazardDetection?: boolean;
  className?: string;
}

export const AROverlayIntegration: React.FC<AROverlayIntegrationProps> = ({
  scanData,
  enableRealTimeGuidance = true,
  enableHazardDetection = true,
  className = ''
}) => {
  const arSystemRef = useRef<WebXRHealthOverlay | null>(null);
  const [isARSupported, setIsARSupported] = useState(false);
  const [isARActive, setIsARActive] = useState(false);
  const [arError, setArError] = useState<string | null>(null);

  // Check AR support on component mount
  useEffect(() => {
    const checkARSupport = async () => {
      if (navigator.xr) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-ar');
          setIsARSupported(supported);
        } catch (error) {
          console.warn('AR support check failed:', error);
          setIsARSupported(false);
        }
      } else {
        setIsARSupported(false);
      }
    };

    checkARSupport();
  }, []);

  // Initialize AR system
  const initializeAR = async () => {
    try {
      setArError(null);
      const arSystem = new WebXRHealthOverlay();
      const session = await arSystem.initializeWebXR();
      
      if (session) {
        arSystemRef.current = arSystem;
        setIsARActive(true);
        console.log('✅ AR Overlay System initialized');
      } else {
        setArError('Failed to initialize AR session');
      }
    } catch (error) {
      setArError(`AR initialization failed: ${error.message}`);
      console.error('AR initialization error:', error);
    }
  };

  // Cleanup AR system
  const cleanupAR = () => {
    if (arSystemRef.current) {
      arSystemRef.current.cleanup();
      arSystemRef.current = null;
      setIsARActive(false);
    }
  };

  // Update AR with latest scan data
  useEffect(() => {
    if (isARActive && arSystemRef.current && scanData.length > 0) {
      const latestScan = scanData[scanData.length - 1];
      const healthMetrics = {
        gaitStability: latestScan.metadata.accuracy * 100,
        postureScore: Math.random() * 100, // Replace with actual posture calculation
        fallRisk: Math.random() * 100, // Replace with actual fall risk calculation
        movementConfidence: latestScan.metadata.accuracy * 95,
        dataAccuracy: latestScan.metadata.accuracy * 100
      };

      // Update AR overlay with health metrics
      // Note: position would come from AR tracking in real implementation
      const mockPosition = {} as XRSpace;
      arSystemRef.current.overlayHealthMetrics(mockPosition, healthMetrics);

      if (enableRealTimeGuidance) {
        arSystemRef.current.displayGaitGuidance(true);
      }

      if (enableHazardDetection) {
        // Hazard detection would be integrated with LiDAR processing
        arSystemRef.current.showEnvironmentalHazards([]);
      }
    }
  }, [scanData, isARActive, enableRealTimeGuidance, enableHazardDetection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupAR();
    };
  }, []);

  if (!isARSupported) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-yellow-600 mr-3">📱</div>
          <div>
            <h4 className="font-medium text-yellow-800">AR Not Supported</h4>
            <p className="text-sm text-yellow-700 mt-1">
              This device doesn't support WebXR AR. Try using a compatible mobile device with Chrome or Edge.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* AR Control Panel */}
      <div className="bg-white rounded-lg shadow-sm border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">AR Health Overlay</h3>
            <p className="text-sm text-gray-600">
              Immersive health visualization and movement guidance
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className={`w-3 h-3 rounded-full ${isARActive ? 'bg-green-500' : 'bg-gray-300'}`} />
            <button
              type="button"
              onClick={isARActive ? cleanupAR : initializeAR}
              disabled={!isARSupported}
              className={`px-4 py-2 rounded-lg font-medium ${
                isARActive
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isARActive ? 'Stop AR' : 'Start AR'}
            </button>
          </div>
        </div>

        {arError && (
          <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700">
            <strong>Error:</strong> {arError}
          </div>
        )}
      </div>

      {/* AR Features Status */}
      {isARActive && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-3">Active AR Features</h4>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-green-700">Health Metrics Overlay</span>
            </div>
            {enableRealTimeGuidance && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className="text-sm text-green-700">Movement Guidance</span>
              </div>
            )}
            {enableHazardDetection && (
              <div className="flex items-center">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
                <span className="text-sm text-green-700">Hazard Detection</span>
              </div>
            )}
            <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2" />
              <span className="text-sm text-green-700">Real-time Processing</span>
            </div>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-800 mb-2">How to Use AR Overlay</h4>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Click "Start AR" to begin AR session</li>
          <li>2. Allow camera permissions when prompted</li>
          <li>3. Point device at open space for health visualization</li>
          <li>4. Move naturally to see real-time health feedback</li>
          <li>5. Follow AR guidance for posture and gait improvement</li>
        </ol>
      </div>
    </div>
  );
};
```

## 📱 iOS ARKit Integration

### Swift ARKit Manager

```swift
/**
 * VitalSense AR Health Overlay Manager
 * ARKit integration for immersive health visualization
 */

import ARKit
import RealityKit
import SwiftUI
import Combine

@available(iOS 13.0, *)
class VitalSenseARManager: NSObject, ObservableObject {
    @Published var isARActive = false
    @Published var arError: String?
    @Published var healthVisualizationAnchors: [ARAnchor] = []
    
    private var arView: ARView?
    private var arSession: ARSession?
    private var healthDataSubscription: AnyCancellable?
    
    // Health data integration
    private let healthDataStream = PassthroughSubject<LiDARHealthData, Never>()
    
    override init() {
        super.init()
        setupHealthDataSubscription()
    }
    
    func initializeAR() throws {
        guard ARWorldTrackingConfiguration.isSupported else {
            throw ARError(.unsupportedConfiguration)
        }
        
        // Create AR view
        arView = ARView(frame: .zero)
        arSession = arView?.session
        arView?.session.delegate = self
        
        // Configure AR session
        let configuration = ARWorldTrackingConfiguration()
        configuration.planeDetection = [.horizontal, .vertical]
        configuration.environmentTexturing = .automatic
        
        if ARWorldTrackingConfiguration.supportsSceneReconstruction(.mesh) {
            configuration.sceneReconstruction = .mesh
        }
        
        arView?.session.run(configuration)
        isARActive = true
        
        print("✅ VitalSense AR Session initialized successfully")
    }
    
    func overlayHealthInsights(_ data: LiDARHealthData) {
        guard let arView = arView else { return }
        
        // Create health visualization anchor
        let healthAnchor = createHealthVisualizationAnchor(data)
        arView.scene.addAnchor(healthAnchor)
        
        // Add to tracking
        healthVisualizationAnchors.append(healthAnchor)
        
        // Update real-time overlays
        updateGaitStabilityOverlay(data.gaitStability)
        updatePostureGuidance(data.postureScore)
        updateFallRiskVisualization(data.fallRisk)
    }
    
    private func createHealthVisualizationAnchor(_ data: LiDARHealthData) -> AnchorEntity {
        let anchor = AnchorEntity(world: [0, 0, -1])
        
        // Create health metrics display
        let healthDisplay = createHealthMetricsDisplay(data)
        anchor.addChild(healthDisplay)
        
        // Add gait guidance arrows
        let gaitGuidance = createGaitGuidanceVisuals(data.gaitStability)
        anchor.addChild(gaitGuidance)
        
        // Add posture correction indicators
        let postureIndicators = createPostureIndicators(data.postureScore)
        anchor.addChild(postureIndicators)
        
        return anchor
    }
    
    private func createHealthMetricsDisplay(_ data: LiDARHealthData) -> ModelEntity {
        // Create 3D text display for health metrics
        let textMesh = MeshResource.generateText(
            """
            Gait Stability: \(String(format: "%.1f", data.gaitStability))%
            Posture Score: \(String(format: "%.1f", data.postureScore))%
            Fall Risk: \(getFallRiskLevel(data.fallRisk))
            """,
            extrusionDepth: 0.02,
            font: .systemFont(ofSize: 0.1),
            containerFrame: .zero,
            alignment: .center,
            lineBreakMode: .byWordWrapping
        )
        
        let material = SimpleMaterial(color: .systemBlue, isMetallic: false)
        let textEntity = ModelEntity(mesh: textMesh, materials: [material])
        textEntity.position = [0, 0.5, 0]
        
        return textEntity
    }
    
    private func createGaitGuidanceVisuals(_ gaitStability: Float) -> ModelEntity {
        let containerEntity = ModelEntity()
        
        // Create guidance arrows based on gait stability
        if gaitStability < 70 {
            let arrowMesh = MeshResource.generateBox(width: 0.1, height: 0.02, depth: 0.3)
            let arrowMaterial = SimpleMaterial(
                color: getHealthColor(gaitStability),
                isMetallic: false
            )
            
            let leftArrow = ModelEntity(mesh: arrowMesh, materials: [arrowMaterial])
            leftArrow.position = [-0.2, 0, 0]
            leftArrow.orientation = simd_quatf(angle: .pi/4, axis: [0, 1, 0])
            
            let rightArrow = ModelEntity(mesh: arrowMesh, materials: [arrowMaterial])
            rightArrow.position = [0.2, 0, 0]
            rightArrow.orientation = simd_quatf(angle: -.pi/4, axis: [0, 1, 0])
            
            containerEntity.addChild(leftArrow)
            containerEntity.addChild(rightArrow)
        }
        
        return containerEntity
    }
    
    private func createPostureIndicators(_ postureScore: Float) -> ModelEntity {
        let containerEntity = ModelEntity()
        
        if postureScore < 80 {
            // Create spine alignment guide
            let spineMesh = MeshResource.generateCylinder(height: 0.6, radius: 0.01)
            let spineMaterial = SimpleMaterial(
                color: .systemYellow,
                isMetallic: false
            )
            
            let spineGuide = ModelEntity(mesh: spineMesh, materials: [spineMaterial])
            spineGuide.position = [0, 0.3, -0.5]
            
            // Add pulsing animation
            let pulseAnimation = AnimationResource.makeColorAnimation(
                from: .systemYellow,
                to: .systemOrange,
                duration: 1.5,
                autoreverses: true,
                repeatMode: .indefinite
            )
            
            spineGuide.playAnimation(pulseAnimation)
            containerEntity.addChild(spineGuide)
        }
        
        return containerEntity
    }
    
    private func updateGaitStabilityOverlay(_ stability: Float) {
        // Real-time gait stability updates
        // Update existing anchors with new stability data
    }
    
    private func updatePostureGuidance(_ postureScore: Float) {
        // Real-time posture guidance updates
        // Adjust guidance visuals based on current posture
    }
    
    private func updateFallRiskVisualization(_ fallRisk: Float) {
        guard let arView = arView else { return }
        
        // Create or update fall risk zones
        if fallRisk > 60 {
            let hazardZone = createFallRiskZone(severity: getFallRiskSeverity(fallRisk))
            arView.scene.addAnchor(hazardZone)
        }
    }
    
    private func createFallRiskZone(severity: FallRiskSeverity) -> AnchorEntity {
        let anchor = AnchorEntity(world: [0, 0, -2])
        
        // Create warning zone visualization
        let zoneMesh = MeshResource.generatePlane(width: 2, depth: 2)
        let zoneMaterial = SimpleMaterial(
            color: severity.color.withAlphaComponent(0.3),
            isMetallic: false
        )
        
        let zoneEntity = ModelEntity(mesh: zoneMesh, materials: [zoneMaterial])
        zoneEntity.position = [0, 0, 0]
        
        anchor.addChild(zoneEntity)
        return anchor
    }
    
    private func setupHealthDataSubscription() {
        healthDataSubscription = healthDataStream
            .throttle(for: .milliseconds(500), scheduler: RunLoop.main, latest: true)
            .sink { [weak self] healthData in
                self?.overlayHealthInsights(healthData)
            }
    }
    
    func processNewHealthData(_ data: LiDARHealthData) {
        healthDataStream.send(data)
    }
    
    private func getHealthColor(_ value: Float) -> UIColor {
        switch value {
        case 85...: return .systemGreen
        case 70..<85: return .systemBlue
        case 55..<70: return .systemYellow
        case 40..<55: return .systemOrange
        default: return .systemRed
        }
    }
    
    private func getFallRiskLevel(_ risk: Float) -> String {
        switch risk {
        case 0..<30: return "Low"
        case 30..<60: return "Medium"
        default: return "High"
        }
    }
    
    private func getFallRiskSeverity(_ risk: Float) -> FallRiskSeverity {
        switch risk {
        case 0..<30: return .low
        case 30..<60: return .medium
        default: return .high
        }
    }
    
    func stopAR() {
        arView?.session.pause()
        arView = nil
        arSession = nil
        isARActive = false
        healthVisualizationAnchors.removeAll()
    }
    
    deinit {
        healthDataSubscription?.cancel()
        stopAR()
    }
}

// MARK: - ARSessionDelegate
@available(iOS 13.0, *)
extension VitalSenseARManager: ARSessionDelegate {
    func session(_ session: ARSession, didFailWithError error: Error) {
        arError = error.localizedDescription
        isARActive = false
    }
    
    func sessionWasInterrupted(_ session: ARSession) {
        isARActive = false
    }
    
    func sessionInterruptionEnded(_ session: ARSession) {
        // Restart AR when interruption ends
        do {
            try initializeAR()
        } catch {
            arError = error.localizedDescription
        }
    }
}

// MARK: - Supporting Types
struct LiDARHealthData {
    let gaitStability: Float
    let postureScore: Float
    let fallRisk: Float
    let movementConfidence: Float
    let timestamp: Date
}

enum FallRiskSeverity {
    case low, medium, high
    
    var color: UIColor {
        switch self {
        case .low: return .systemGreen
        case .medium: return .systemYellow
        case .high: return .systemRed
        }
    }
}

// MARK: - SwiftUI Integration
@available(iOS 13.0, *)
struct VitalSenseARView: UIViewRepresentable {
    @ObservedObject var arManager: VitalSenseARManager
    
    func makeUIView(context: Context) -> ARView {
        let arView = ARView()
        arManager.arView = arView
        return arView
    }
    
    func updateUIView(_ uiView: ARView, context: Context) {
        // Update AR view if needed
    }
}
```

## 🔗 Integration with Existing System

### Adding AR to Your Complete LiDAR Integration

```typescript
// Update CompleteLiDARIntegration.tsx to include AR overlay
import { AROverlayIntegration } from './AROverlayIntegration';

// Add AR tab to your existing tabs
const tabs = [
  { id: 'realtime', label: 'Real-time Data', icon: Activity },
  { id: 'analytics', label: 'Advanced Analytics', icon: Brain },
  { id: 'ar-overlay', label: 'AR Overlay', icon: Eye }, // New AR tab
  { id: 'reports', label: 'Reports', icon: Database },
  { id: 'settings', label: 'Settings', icon: Settings }
];

// Add AR tab content
{activeTab === 'ar-overlay' && (
  <AROverlayIntegration
    scanData={scanHistory}
    enableRealTimeGuidance={settings.enableRealTimeGuidance}
    enableHazardDetection={settings.enableHazardDetection}
  />
)}
```

## 🎯 Implementation Roadmap

### Phase 1: Foundation (2-3 weeks)

1. **WebXR Setup**: Basic AR session initialization
2. **Simple Overlays**: Basic health metric display in AR
3. **iOS ARKit Base**: Core ARKit integration structure

### Phase 2: Core Features (4-6 weeks)

1. **Health Visualization**: Complete health metrics overlay
2. **Movement Guidance**: Real-time gait and posture feedback
3. **Environmental Detection**: Basic hazard identification

### Phase 3: Advanced Features (6-8 weeks)

1. **Machine Learning**: AI-powered movement analysis in AR
2. **Predictive Overlays**: Future movement prediction
3. **Clinical Integration**: Medical-grade AR assessments

## 🚀 Getting Started

1. **Test WebXR Support**: Check browser compatibility
2. **Implement Basic AR**: Start with simple health metric overlay
3. **Integrate with LiDAR**: Connect AR system to your existing data streams
4. **iOS Development**: Begin ARKit implementation for native experience

The AR overlay system provides an immersive, engaging way for users to visualize their health data and receive real-time guidance for movement improvement. It builds perfectly on your existing LiDAR Advanced integration!

Would you like me to help implement any specific part of this AR system, such as the WebXR foundation or the iOS ARKit integration?
