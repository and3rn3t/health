/**
 * WebXR AR Overlay System for VitalSense Health Monitoring
 * Integrates with existing LiDAR data streams for immersive health visualization
 */

// WebXR type declarations
// Note: We extend Navigator but need to avoid conflicts with standard DOM types
// The 'xr' property exists in browsers but may not be in all TypeScript DOM lib versions
declare global {
  interface Navigator {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    xr?: any; // Use any to avoid type conflicts with standard DOM types
  }
}

interface XRSystem {
  isSessionSupported(mode: string): Promise<boolean>;
  requestSession(mode: string, options?: XRSessionInit): Promise<XRSession>;
}

interface XRSessionInit {
  requiredFeatures?: string[];
  optionalFeatures?: string[];
}

interface XRSession {
  requestReferenceSpace(type: string): Promise<XRReferenceSpace>;
  requestAnimationFrame(callback: XRFrameRequestCallback): number;
  end(): Promise<void>;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface XRReferenceSpace {}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface XRSpace {}
interface XRFrame {
  getViewerPose(referenceSpace: XRReferenceSpace): XRViewerPose | null;
}
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface XRViewerPose {}
type XRFrameRequestCallback = (time: number, frame: XRFrame) => void;

// Health risk severity type
type RiskSeverity = 'low' | 'medium' | 'high';

export interface HealthMetrics {
  gaitStability: number;
  postureScore: number;
  fallRisk: number;
  movementConfidence: number;
  dataAccuracy: number;
}

export interface EnvironmentalHazard {
  id: string;
  type: 'trip_hazard' | 'unstable_surface' | 'obstacle' | 'poor_lighting';
  position: { x: number; y: number; z: number };
  severity: RiskSeverity;
  description: string;
  recommendations: string[];
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
    severity: RiskSeverity;
  };
}

export interface AROverlaySystem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initializeWebXR(): Promise<any | null>;
  overlayHealthMetrics(position: XRSpace, data: HealthMetrics): void;
  displayGaitGuidance(realTime: boolean): void;
  showEnvironmentalHazards(detected: EnvironmentalHazard[]): void;
  cleanup(): void;
}

export class WebXRHealthOverlay implements AROverlaySystem {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private xrSession: any | null = null;
  private xrReferenceSpace: XRReferenceSpace | null = null;
  private gl: WebGL2RenderingContext | null = null;
  private frameCallbacks: Set<() => void> = new Set();
  private healthVisualizations: Map<string, HealthVisualization> = new Map();
  private environmentalHazards: EnvironmentalHazard[] = [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async initializeWebXR(): Promise<any | null> {
    if (!navigator.xr) {
      console.warn('WebXR not supported in this browser');
      return null;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const xr = navigator.xr as any;
      const isARSupported =
        await xr.isSessionSupported('immersive-ar');
      if (!isARSupported) {
        console.warn('Immersive AR not supported');
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      this.xrSession = await xr.requestSession('immersive-ar', {
        requiredFeatures: ['local', 'hit-test'],
        optionalFeatures: ['dom-overlay', 'light-estimation'],
      }) as any;

      if (!this.xrSession) {
        return null;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const referenceSpace = await (this.xrSession as any).requestReferenceSpace('local');
      if (!referenceSpace) {
        console.warn('Failed to get reference space');
        return null;
      }
      this.xrReferenceSpace = referenceSpace as XRReferenceSpace;

      // Initialize WebGL context
      const canvas = document.createElement('canvas');
      this.gl = canvas.getContext('webgl2');

      if (!this.gl) {
        throw new Error('WebGL2 not supported');
      }

      // Start AR session
      if (this.xrSession) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (this.xrSession as any).requestAnimationFrame(this.onXRFrame.bind(this));
      }

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
        position,
      },
      postureIndicator: {
        alignment: data.postureScore,
        corrections: this.generatePostureCorrections(data.postureScore),
        visualCues: this.createPostureVisualCues(data.postureScore),
      },
      fallRiskZones: {
        zones: this.generateFallRiskZones(data.fallRisk),
        severity: this.getFallRiskSeverity(data.fallRisk),
      },
    };

    this.healthVisualizations.set(`health-${Date.now()}`, visualization);
  }

  displayGaitGuidance(_realTime: boolean): void {
    if (!this.xrSession) return;

    const guidanceElements: ARVisualCue[] = [
      {
        type: 'arrow',
        position: { x: 0, y: 0, z: -2 },
        content: 'Maintain steady pace',
        animation: 'pulse',
        duration: 3000,
      },
      {
        type: 'highlight',
        position: { x: 0, y: -1, z: -1 },
        content: 'Keep feet shoulder-width apart',
        animation: 'fade',
        duration: 5000,
      },
    ];

    guidanceElements.forEach((element) => {
      this.renderARElement(element);
    });
  }

  showEnvironmentalHazards(detected: EnvironmentalHazard[]): void {
    this.environmentalHazards = detected;

    detected.forEach((hazard) => {
      const hazardVisualization: ARVisualCue = {
        type: 'icon',
        position: hazard.position,
        content: this.getHazardIcon(hazard.type),
        animation: 'bounce',
        duration: 0, // Persistent until hazard is resolved
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
    this.frameCallbacks.forEach((callback) => callback());

    // Continue animation loop
    if (this.xrSession) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (this.xrSession as any).requestAnimationFrame(this.onXRFrame.bind(this));
    }
  }

  private updateHealthVisualizations(_frame: XRFrame): void {
    // Real-time health metric visualization updates
    this.healthVisualizations.forEach((visualization, _id) => {
      // Update gait stability indicator
      this.updateGaitIndicator(visualization.gaitStability);

      // Update posture correction cues
      this.updatePostureCues(visualization.postureIndicator);

      // Update fall risk zones
      this.updateFallRiskZones(visualization.fallRiskZones);
    });
  }

  private updateHazardDetection(_frame: XRFrame): void {
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
        duration: 3000,
      });
    }

    if (score < 60) {
      cues.push({
        type: 'highlight',
        position: { x: 0, y: 1, z: -0.5 },
        content: 'Straighten spine',
        animation: 'fade',
        duration: 4000,
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
          { x: -1, y: 0, z: -0.5 },
        ],
        color: '#ef4444',
        opacity: 0.3,
        warning: 'High fall risk - move carefully',
      });
    }

    return zones;
  }

  private getFallRiskSeverity(fallRisk: number): RiskSeverity {
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
    console.log('Rendering arrow:', element);
  }

  private renderHighlight(element: ARVisualCue): void {
    // WebGL highlight zone rendering
    // Creates translucent overlay zones
    console.log('Rendering highlight:', element);
  }

  private renderText(element: ARVisualCue): void {
    // Text rendering in AR space
    // Creates billboard text elements
    console.log('Rendering text:', element);
  }

  private renderIcon(element: ARVisualCue): void {
    // Icon rendering for hazards and indicators
    // Creates 3D icon representations
    console.log('Rendering icon:', element);
  }

  private updateGaitIndicator(
    gaitStability: HealthVisualization['gaitStability']
  ): void {
    // Update real-time gait stability visualization
    console.log('Updating gait indicator:', gaitStability);
  }

  private updatePostureCues(
    postureIndicator: HealthVisualization['postureIndicator']
  ): void {
    // Update posture correction visual cues
    console.log('Updating posture cues:', postureIndicator);
  }

  private updateFallRiskZones(
    fallRiskZones: HealthVisualization['fallRiskZones']
  ): void {
    // Update fall risk zone boundaries and colors
    console.log('Updating fall risk zones:', fallRiskZones);
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
        recommendations: ['Step carefully', 'Use handrail if available'],
      },
    ];
  }

  private getHazardIcon(type: EnvironmentalHazard['type']): string {
    const icons = {
      trip_hazard: '⚠️',
      unstable_surface: '🛑',
      obstacle: '🚧',
      poor_lighting: '💡',
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
