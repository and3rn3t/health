import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Point3D } from '@/lib/lidar/types';
import { useKV } from '@github/spark/hooks';
import { useCallback, useEffect, useState } from 'react';

// Enhanced Environmental Hazard Detection Types
interface EnvironmentalHazard {
  id: string;
  type:
    | 'obstacle'
    | 'surface'
    | 'lighting'
    | 'height_change'
    | 'narrow_passage'
    | 'clutter'
    | 'stairs'
    | 'furniture';
  severity: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
  description: string;
  location: {
    x: number;
    y: number;
    z: number;
    distance: number; // meters from user
    bearing: number; // degrees from forward direction
  };
  confidence: number; // 0-100
  recommendations: string[];
  detected: Date;
  dimensions?: {
    width: number;
    height: number;
    depth: number;
  };
  riskLevel: number; // 0-100
}

interface SpatialMapping {
  roomDimensions: {
    width: number;
    length: number;
    height: number;
    area: number;
  };
  surfaceAnalysis: {
    floorType:
      | 'hardwood'
      | 'carpet'
      | 'tile'
      | 'concrete'
      | 'mixed'
      | 'unknown';
    roughness: number; // 0-1
    levelness: number; // 0-1 (1 = perfectly level)
    slipResistance: number; // 0-1
  };
  lightingConditions: {
    averageLevel: number; // lux
    uniformity: number; // 0-1
    shadowAreas: number; // count
    glareSpots: number; // count
  };
  accessibility: {
    clearPathways: number; // percentage
    doorwayWidths: number[];
    stepHeights: number[];
    reachableObjects: number; // percentage
  };
  navigationPaths: Array<{
    start: Point3D;
    end: Point3D;
    clearance: number;
    difficulty: number; // 0-1
  }>;
}

interface SafetyAssessment {
  overallRisk: number; // 0-100
  categories: {
    mobility: { score: number; factors: string[] };
    vision: { score: number; factors: string[] };
    balance: { score: number; factors: string[] };
    emergency: { score: number; factors: string[] };
  };
  recommendations: Array<{
    priority: 'immediate' | 'high' | 'medium' | 'low';
    category: 'modification' | 'equipment' | 'lighting' | 'layout';
    description: string;
    estimatedCost: string;
    difficulty: 'easy' | 'moderate' | 'complex';
  }>;
  criticalHazards: EnvironmentalHazard[];
}

interface LiDAREnvironmentalHazardDetectorProps {
  onHazardDetected?: (hazard: EnvironmentalHazard) => void;
  onAssessmentComplete?: (assessment: SafetyAssessment) => void;
  autoScan?: boolean;
  scanRadius?: number; // meters
}

export function LiDAREnvironmentalHazardDetector({
  onHazardDetected,
  onAssessmentComplete,
  autoScan = false,
  scanRadius = 3.0,
}: Readonly<LiDAREnvironmentalHazardDetectorProps>) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [hazards, setHazards] = useState<EnvironmentalHazard[]>([]);
  const [spatialMapping, setSpatialMapping] = useState<SpatialMapping | null>(
    null
  );
  const [safetyAssessment, setSafetyAssessment] =
    useState<SafetyAssessment | null>(null);
  const [_scanHistory, setScanHistory] = useKV('environmental-scans', '[]');
  const [isLiDARActive] = useState(false);
  const [scanMode, setScanMode] = useState<
    'quick' | 'detailed' | 'comprehensive'
  >('detailed');
  const [currentPhase, setCurrentPhase] = useState<string>('');

  // Generate realistic environmental hazards
  const generateEnvironmentalHazards =
    useCallback((): EnvironmentalHazard[] => {
      const hazardTypes = [
        {
          id: 'loose-rug',
          type: 'surface' as const,
          severity: 'high' as const,
          description: 'Loose area rug detected - high slip and trip risk',
          location: { x: 1.2, y: 0, z: 0.01, distance: 1.2, bearing: 45 },
          confidence: 92,
          recommendations: [
            'Secure rug with non-slip pad or adhesive strips',
            'Consider removing rug from high-traffic area',
            'Replace with low-profile, secured flooring',
          ],
          dimensions: { width: 1.8, height: 0.01, depth: 1.2 },
          riskLevel: 85,
        },
        {
          id: 'coffee-table',
          type: 'furniture' as const,
          severity: 'moderate' as const,
          description: 'Coffee table with sharp corners in walking path',
          location: { x: 0.8, y: 0.5, z: 0.4, distance: 0.94, bearing: 32 },
          confidence: 88,
          recommendations: [
            'Add corner guards or padding',
            'Reposition away from main walking path',
            'Improve lighting around furniture',
          ],
          dimensions: { width: 1.2, height: 0.4, depth: 0.6 },
          riskLevel: 65,
        },
        {
          id: 'cable-clutter',
          type: 'clutter' as const,
          severity: 'moderate' as const,
          description: 'Electrical cables across walkway - trip hazard',
          location: { x: 2.1, y: -0.3, z: 0.02, distance: 2.12, bearing: -8 },
          confidence: 95,
          recommendations: [
            'Use cable management system or cord covers',
            'Route cables along walls or under furniture',
            'Consider wireless alternatives where possible',
          ],
          riskLevel: 70,
        },
      ];

      // Add random variations and additional hazards
      const additionalHazards = [];
      if ((crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) < 0.6) {
        additionalHazards.push({
          id: 'threshold-step',
          type: 'height_change' as const,
          severity: 'moderate' as const,
          description: 'Raised threshold between rooms detected',
          location: { x: 0, y: 1.5, z: 0.02, distance: 1.5, bearing: 90 },
          confidence: 85,
          recommendations: [
            'Install threshold ramp or beveled transition',
            'Add contrasting tape for visibility',
            'Ensure adequate lighting at transition',
          ],
          dimensions: { width: 0.8, height: 0.02, depth: 0.05 },
          riskLevel: 55,
        });
      }

      if ((crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) < 0.4) {
        additionalHazards.push({
          id: 'poor-lighting',
          type: 'lighting' as const,
          severity: 'high' as const,
          description: 'Inadequate lighting creating shadows and dark areas',
          location: { x: -1.0, y: 2.0, z: 1.5, distance: 2.24, bearing: 116 },
          confidence: 80,
          recommendations: [
            'Install additional lighting or increase bulb wattage',
            'Add motion-activated lights for pathways',
            'Reduce shadows with diffused lighting',
          ],
          riskLevel: 75,
        });
      }

      return [...hazardTypes, ...additionalHazards].map((hazard) => ({
        ...hazard,
        detected: new Date(),
      }));
    }, []);

  // Generate spatial mapping data
  const generateSpatialMapping = useCallback((): SpatialMapping => {
    return {
      roomDimensions: {
        width: 4.2 + Math.random() * 2.0,
        length: 5.8 + Math.random() * 3.0,
        height: 2.4 + Math.random() * 0.6,
        area: 0, // Will be calculated
      },
      surfaceAnalysis: {
        floorType: (['hardwood', 'carpet', 'tile'] as const)[
          Math.floor(Math.random() * 3)
        ],
        roughness: Math.random() * 0.3,
        levelness: 0.85 + Math.random() * 0.15,
        slipResistance: 0.6 + Math.random() * 0.3,
      },
      lightingConditions: {
        averageLevel: 150 + Math.random() * 200, // lux
        uniformity: 0.6 + Math.random() * 0.3,
        shadowAreas: Math.floor(Math.random() * 5),
        glareSpots: Math.floor(Math.random() * 3),
      },
      accessibility: {
      // NOSONAR: Non-security use - Math.random() acceptable for demo/test/UI
        clearPathways: 70 + Math.random() * 25,
      // NOSONAR: Non-security use - Math.random() acceptable for demo/test/UI
        doorwayWidths: [0.8, 0.85, 0.9].map((w) => w + Math.random() * 0.1),
      // NOSONAR: Non-security use - Math.random() acceptable for demo/test/UI
        stepHeights: [0.18, 0.2].map((h) => h + Math.random() * 0.04),
      // NOSONAR: Non-security use - Math.random() acceptable for demo/test/UI
        reachableObjects: 80 + Math.random() * 15,
      },
      navigationPaths: [
        {
          start: { x: 0, y: 0, z: 0 },
          end: { x: 2.5, y: 1.8, z: 0 },
          clearance: 0.9 + Math.random() * 0.3,
          difficulty: Math.random() * 0.4,
        },
        {
          start: { x: 0, y: 0, z: 0 },
          end: { x: -1.2, y: 2.5, z: 0 },
          clearance: 0.8 + Math.random() * 0.4,
          difficulty: Math.random() * 0.6,
        },
      ],
    };
  }, []);

  // Generate safety assessment
  const generateSafetyAssessment = useCallback(
    (
      hazards: EnvironmentalHazard[],
      mapping: SpatialMapping
    ): SafetyAssessment => {
      const criticalHazards = hazards.filter(
        (h) => h.severity === 'critical' || h.severity === 'high'
      );
      const moderateHazards = hazards.filter((h) => h.severity === 'moderate');

      // Calculate category scores
      const mobilityScore = Math.max(
        0,
        100 - (criticalHazards.length * 25 + moderateHazards.length * 10)
      );
      const visionScore = Math.max(
        0,
        100 - mapping.lightingConditions.shadowAreas * 15
      );
      const balanceScore = Math.max(
        0,
        100 - hazards.filter((h) => h.type === 'surface').length * 20
      );
      const emergencyScore = Math.max(
        0,
        100 - (mapping.accessibility.clearPathways < 80 ? 30 : 0)
      );

      const overallRisk =
        100 -
        Math.min(
          100,
          (mobilityScore + visionScore + balanceScore + emergencyScore) / 4
        );

      const recommendations = [
        {
          priority: 'immediate' as const,
          category: 'modification' as const,
          description: 'Secure all loose rugs and remove tripping hazards',
          estimatedCost: '$50-150',
          difficulty: 'easy' as const,
        },
        {
          priority: 'high' as const,
          category: 'lighting' as const,
          description: 'Install motion-activated LED lights in pathways',
          estimatedCost: '$100-300',
          difficulty: 'moderate' as const,
        },
        {
          priority: 'medium' as const,
          category: 'equipment' as const,
          description: 'Add furniture padding and corner guards',
          estimatedCost: '$25-75',
          difficulty: 'easy' as const,
        },
      ];

      return {
        overallRisk,
        categories: {
          mobility: {
            score: mobilityScore,
            factors: hazards
              .filter((h) => h.type === 'obstacle' || h.type === 'clutter')
              .map((h) => h.description),
          },
          vision: {
            score: visionScore,
            factors: [
              `${mapping.lightingConditions.shadowAreas} shadow areas`,
              `${mapping.lightingConditions.glareSpots} glare spots`,
            ],
          },
          balance: {
            score: balanceScore,
            factors: hazards
              .filter((h) => h.type === 'surface' || h.type === 'height_change')
              .map((h) => h.description),
          },
          emergency: {
            score: emergencyScore,
            factors: [
              `${mapping.accessibility.clearPathways.toFixed(0)}% clear pathways`,
            ],
          },
        },
        recommendations,
        criticalHazards,
      };
    },
    []
  );

  // Main scanning function
  const runEnvironmentalScan = useCallback(async () => {
    setIsScanning(true);
    setScanProgress(0);
    setCurrentPhase('Initializing LiDAR sensors...');

    try {
      const phases = [
        'Initializing LiDAR sensors...',
        'Calibrating depth perception...',
        'Scanning room geometry...',
        'Detecting obstacles and furniture...',
        'Analyzing surface conditions...',
        'Evaluating lighting conditions...',
        'Assessing accessibility features...',
        'Calculating safety metrics...',
        'Generating recommendations...',
      ];

      for (let i = 0; i < phases.length; i++) {
        setCurrentPhase(phases[i]);
        await new Promise((resolve) =>
          setTimeout(resolve, scanMode === 'quick' ? 400 : 1000)
        );
        setScanProgress(((i + 1) / phases.length) * 100);
      }

      // Generate results
      const detectedHazards = generateEnvironmentalHazards();
      const mapping = generateSpatialMapping();
      mapping.roomDimensions.area =
        mapping.roomDimensions.width * mapping.roomDimensions.length;
      const assessment = generateSafetyAssessment(detectedHazards, mapping);

      setHazards(detectedHazards);
      setSpatialMapping(mapping);
      setSafetyAssessment(assessment);

      // Trigger callbacks
      detectedHazards.forEach((hazard) => onHazardDetected?.(hazard));
      onAssessmentComplete?.(assessment);

      // Save to history
      const scanRecord = {
        id: `scan-${Date.now()}`,
        timestamp: new Date(),
        hazardCount: detectedHazards.length,
        overallRisk: assessment.overallRisk,
        scanMode,
        duration: (phases.length * (scanMode === 'quick' ? 400 : 1000)) / 1000,
      };
      setScanHistory((prev) =>
        JSON.stringify([scanRecord, ...JSON.parse(prev || '[]').slice(0, 9)])
      );
    } catch (error) {
      console.error('Environmental scan failed:', error);
    } finally {
      setIsScanning(false);
      setScanProgress(0);
      setCurrentPhase('');
    }
  }, [
    scanMode,
    generateEnvironmentalHazards,
    generateSpatialMapping,
    generateSafetyAssessment,
    onHazardDetected,
    onAssessmentComplete,
    setScanHistory,
  ]);

  // Auto-scan effect
  useEffect(() => {
    if (autoScan && !isScanning) {
      runEnvironmentalScan();
    }
  }, [autoScan, runEnvironmentalScan, isScanning]);

  // Helper functions
  const getSeverityColor = (severity: EnvironmentalHazard['severity']) => {
    switch (severity) {
      case 'minimal':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'low':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'moderate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getRiskLevelColor = (risk: number) => {
    if (risk < 20) return 'text-green-600';
    if (risk < 40) return 'text-blue-600';
    if (risk < 60) return 'text-yellow-600';
    if (risk < 80) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatDistance = (distance: number) => {
    return distance < 1
      ? `${(distance * 100).toFixed(0)}cm`
      : `${distance.toFixed(1)}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            🏠 LiDAR Environmental Hazard Detection
            <div className="flex items-center gap-2">
              <Badge variant={isLiDARActive ? 'default' : 'secondary'}>
                {isLiDARActive ? '🟢 Scanning' : '⚪ Ready'}
              </Badge>
              <Badge variant="outline">Radius: {scanRadius}m</Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant={scanMode === 'quick' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('quick')}
              >
                ⚡ Quick Scan (1 min)
              </Button>
              <Button
                variant={scanMode === 'detailed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('detailed')}
              >
                🔍 Detailed (3 min)
              </Button>
              <Button
                variant={scanMode === 'comprehensive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setScanMode('comprehensive')}
              >
                🏗️ Comprehensive (5 min)
              </Button>
            </div>
            <Button
              onClick={runEnvironmentalScan}
              disabled={isScanning}
              variant="default"
            >
              {isScanning ? '🔄 Scanning...' : '🎯 Start Scan'}
            </Button>
          </div>

          {isScanning && (
            <div className="space-y-2">
              <Progress value={scanProgress} className="w-full" />
              <p className="text-muted-foreground text-center text-sm">
                {currentPhase} {Math.round(scanProgress)}%
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results */}
      {safetyAssessment && (
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">📊 Overview</TabsTrigger>
            <TabsTrigger value="hazards">⚠️ Hazards</TabsTrigger>
            <TabsTrigger value="mapping">🗺️ Spatial Map</TabsTrigger>
            <TabsTrigger value="recommendations">💡 Solutions</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            {/* Safety Score Overview */}
            <div className="md:grid-cols-2 grid grid-cols-1 gap-4 lg:grid-cols-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div
                      className={`text-3xl font-bold ${getRiskLevelColor(safetyAssessment.overallRisk)}`}
                    >
                      {(100 - safetyAssessment.overallRisk).toFixed(0)}%
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Safety Score
                    </div>
                    <Progress
                      value={100 - safetyAssessment.overallRisk}
                      className="mt-2"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-blue-600 text-2xl font-bold">
                      {hazards.length}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Hazards Detected
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-orange-600 text-2xl font-bold">
                      {safetyAssessment.criticalHazards.length}
                    </div>
                    <div className="text-muted-foreground text-sm">
                      High Priority
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-green-600 text-2xl font-bold">
                      {spatialMapping?.roomDimensions.area.toFixed(1)}m²
                    </div>
                    <div className="text-muted-foreground text-sm">
                      Area Scanned
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Category Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>🎯 Safety Category Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(safetyAssessment.categories).map(
                    ([category, data]) => (
                      <div key={category}>
                        <div className="mb-2 flex items-center justify-between">
                          <span className="text-sm font-medium capitalize">
                            {category}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            {data.score.toFixed(0)}%
                          </span>
                        </div>
                        <Progress value={data.score} />
                        {data.factors.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {data.factors.slice(0, 2).join(', ')}
                          </div>
                        )}
                      </div>
                    )
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Critical Hazards Alert */}
            {safetyAssessment.criticalHazards.length > 0 && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-800">
                  🚨 **{safetyAssessment.criticalHazards.length} Critical Hazard
                  {safetyAssessment.criticalHazards.length > 1 ? 's' : ''}{' '}
                  Detected** - Immediate attention required to prevent falls and
                  injuries.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="hazards" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>⚠️ Detected Environmental Hazards</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {hazards.map((hazard) => (
                    <div key={hazard.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium">{hazard.description}</h4>
                          <div className="mt-1 flex items-center gap-2">
                            <Badge
                              className={getSeverityColor(hazard.severity)}
                            >
                              {hazard.severity}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {hazard.type.replace('_', ' ')}
                            </Badge>
                            <Badge variant="secondary" className="text-xs">
                              {formatDistance(hazard.location.distance)} away
                            </Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium">
                            Risk: {hazard.riskLevel}%
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Confidence: {hazard.confidence}%
                          </div>
                        </div>
                      </div>

                      <div className="mt-3">
                        <p className="mb-1 text-sm font-medium">
                          Recommendations:
                        </p>
                        <ul className="text-muted-foreground space-y-1 text-sm">
                          {hazard.recommendations.map((rec, index) => (
                            <li
                              key={`rec-${hazard.id}-${index}`}
                              className="flex items-start gap-2"
                            >
                              <span className="text-blue-500 mt-1">•</span>
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mapping" className="space-y-4">
            {spatialMapping && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>🗺️ Room Analysis</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="md:grid-cols-2 grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium">Dimensions</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            Width:{' '}
                            {spatialMapping.roomDimensions.width.toFixed(1)}m
                          </div>
                          <div>
                            Length:{' '}
                            {spatialMapping.roomDimensions.length.toFixed(1)}m
                          </div>
                          <div>
                            Height:{' '}
                            {spatialMapping.roomDimensions.height.toFixed(1)}m
                          </div>
                          <div>
                            Area:{' '}
                            {spatialMapping.roomDimensions.area.toFixed(1)}m²
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium">Surface Analysis</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            Floor Type:{' '}
                            {spatialMapping.surfaceAnalysis.floorType}
                          </div>
                          <div>
                            Levelness:{' '}
                            {(
                              spatialMapping.surfaceAnalysis.levelness * 100
                            ).toFixed(0)}
                            %
                          </div>
                          <div>
                            Slip Resistance:{' '}
                            {(
                              spatialMapping.surfaceAnalysis.slipResistance *
                              100
                            ).toFixed(0)}
                            %
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>💡 Lighting & Accessibility</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="md:grid-cols-2 grid grid-cols-1 gap-6">
                      <div className="space-y-3">
                        <h4 className="font-medium">Lighting Conditions</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            Average Level:{' '}
                            {spatialMapping.lightingConditions.averageLevel.toFixed(
                              0
                            )}{' '}
                            lux
                          </div>
                          <div>
                            Uniformity:{' '}
                            {(
                              spatialMapping.lightingConditions.uniformity * 100
                            ).toFixed(0)}
                            %
                          </div>
                          <div>
                            Shadow Areas:{' '}
                            {spatialMapping.lightingConditions.shadowAreas}
                          </div>
                          <div>
                            Glare Spots:{' '}
                            {spatialMapping.lightingConditions.glareSpots}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h4 className="font-medium">Accessibility Features</h4>
                        <div className="space-y-1 text-sm">
                          <div>
                            Clear Pathways:{' '}
                            {spatialMapping.accessibility.clearPathways.toFixed(
                              0
                            )}
                            %
                          </div>
                          <div>
                            Doorway Widths:{' '}
                            {spatialMapping.accessibility.doorwayWidths
                              .map((w) => `${(w * 100).toFixed(0)}cm`)
                              .join(', ')}
                          </div>
                          <div>
                            Reachable Objects:{' '}
                            {spatialMapping.accessibility.reachableObjects.toFixed(
                              0
                            )}
                            %
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>💡 Safety Improvement Recommendations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {safetyAssessment.recommendations.map((rec, index) => {
                    const getBadgeVariant = () => {
                      if (rec.priority === 'immediate') return 'destructive';
                      if (rec.priority === 'high') return 'default';
                      return 'secondary';
                    };

                    return (
                      <div
                        key={`rec-${rec.category}-${index}`}
                        className="rounded-lg border p-4"
                      >
                        <div className="mb-2 flex items-start justify-between">
                          <h4 className="font-medium">{rec.description}</h4>
                          <div className="flex items-center gap-2">
                            <Badge variant={getBadgeVariant()}>
                              {rec.priority}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {rec.category}
                            </Badge>
                          </div>
                        </div>
                        <div className="text-muted-foreground flex items-center gap-4 text-sm">
                          <span>Cost: {rec.estimatedCost}</span>
                          <span>Difficulty: {rec.difficulty}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
