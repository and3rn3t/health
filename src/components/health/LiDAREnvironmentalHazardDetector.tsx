import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
  Activity,
  AlertTriangle,
  ArrowUp,
  Eye,
  Home,
  Layers,
  Lightbulb,
  MapPin,
  Shield,
  Target,
  Zap,
} from 'lucide-react';
import React, { useCallback, useState } from 'react';

interface EnvironmentalHazard {
  id: string;
  type:
    | 'obstacle'
    | 'surface'
    | 'lighting'
    | 'height_change'
    | 'narrow_passage'
    | 'clutter';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: {
    x: number;
    y: number;
    z: number;
    distance: number; // meters from user
  };
  confidence: number;
  recommendations: string[];
  detected: Date;
}

interface SpatialMapping {
  roomDimensions: {
    width: number;
    length: number;
    height: number;
  };
  surfaceTypes: {
    floor: string;
    walls: string[];
    ceiling: string;
  };
  lighting: {
    level: number; // lux
    evenness: number; // 0-100%
    shadowAreas: number;
  };
  accessibility: {
    clearPathways: number; // percentage
    doorwayWidths: number[];
    stepHeights: number[];
  };
}

interface FallRiskAssessment {
  overallRisk: number;
  environmentalFactors: {
    lighting: number;
    obstacles: number;
    surfaces: number;
    pathways: number;
  };
  recommendations: string[];
  criticalAreas: EnvironmentalHazard[];
}

export const LiDAREnvironmentalHazardDetector: React.FC = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [hazards, setHazards] = useState<EnvironmentalHazard[]>([]);
  const [spatialMapping, setSpatialMapping] = useState<SpatialMapping | null>(
    null
  );
  const [riskAssessment, setRiskAssessment] =
    useState<FallRiskAssessment | null>(null);
  const [selectedHazard, setSelectedHazard] = useState<string | null>(null);

  const generateHazards = useCallback((): EnvironmentalHazard[] => {
    const hazardTypes = [
      {
        type: 'obstacle' as const,
        descriptions: [
          'Low coffee table',
          'Pet bed',
          'Electrical cord',
          'Small rug edge',
        ],
        severities: ['medium', 'low', 'high', 'medium'] as const,
      },
      {
        type: 'surface' as const,
        descriptions: [
          'Slippery bathroom tile',
          'Uneven threshold',
          'Loose floorboard',
          'Wet kitchen floor',
        ],
        severities: ['high', 'medium', 'medium', 'critical'] as const,
      },
      {
        type: 'lighting' as const,
        descriptions: [
          'Poor hallway lighting',
          'Glare from window',
          'Burned out bulb',
          'Shadow from furniture',
        ],
        severities: ['high', 'medium', 'high', 'low'] as const,
      },
      {
        type: 'height_change' as const,
        descriptions: [
          'Single step',
          'Raised doorway',
          'Sunken living room',
          'Curb height difference',
        ],
        severities: ['critical', 'medium', 'high', 'medium'] as const,
      },
      {
        type: 'narrow_passage' as const,
        descriptions: [
          'Narrow hallway',
          'Furniture blocking path',
          'Doorway obstruction',
          'Cluttered walkway',
        ],
        severities: ['medium', 'high', 'medium', 'high'] as const,
      },
      {
        type: 'clutter' as const,
        descriptions: [
          'Shoes by door',
          'Magazines on floor',
          'Laundry basket',
          'Multiple cords',
        ],
        severities: ['medium', 'low', 'medium', 'high'] as const,
      },
    ];

    const selectedHazards: EnvironmentalHazard[] = [];
    const numHazards = Math.floor(Math.random() * 6) + 3; // 3-8 hazards

    for (let i = 0; i < numHazards; i++) {
      const hazardType =
        hazardTypes[Math.floor(Math.random() * hazardTypes.length)];
      const index = Math.floor(Math.random() * hazardType.descriptions.length);

      selectedHazards.push({
        id: `hazard_${i}`,
        type: hazardType.type,
        severity: hazardType.severities[index],
        description: hazardType.descriptions[index],
        location: {
          x: Math.random() * 10 - 5, // -5 to 5 meters
          y: Math.random() * 10 - 5,
          z: Math.random() * 0.5, // 0 to 0.5 meters height
          distance: Math.random() * 8 + 1, // 1-9 meters
        },
        confidence: Math.random() * 20 + 80, // 80-100%
        recommendations: generateRecommendations(hazardType.type),
        detected: new Date(),
      });
    }

    return selectedHazards;
  }, []);

  const generateRecommendations = (type: string): string[] => {
    const recommendations: Record<string, string[]> = {
      obstacle: [
        'Remove or relocate the obstacle',
        'Add reflective tape for visibility',
        'Install motion-activated lighting',
        'Create clear pathway markers',
      ],
      surface: [
        'Add non-slip mats or strips',
        'Repair uneven surfaces',
        'Improve drainage in wet areas',
        'Install textured surface treatments',
      ],
      lighting: [
        'Install brighter LED bulbs',
        'Add motion sensor lights',
        'Reduce glare with blinds or filters',
        'Install pathway lighting',
      ],
      height_change: [
        'Install handrails',
        'Add contrasting edge marking',
        'Install ramp for gradual transition',
        'Add warning signage or tactile indicators',
      ],
      narrow_passage: [
        'Widen pathway by removing furniture',
        'Install grab bars for support',
        'Mark pathway boundaries clearly',
        'Consider alternative routing',
      ],
      clutter: [
        'Organize storage solutions',
        'Implement regular decluttering routine',
        'Use cord management systems',
        'Designate specific areas for items',
      ],
    };

    return recommendations[type] || ['Address the identified hazard'];
  };

  const generateSpatialMapping = (): SpatialMapping => {
    return {
      roomDimensions: {
        width: Math.random() * 4 + 3, // 3-7 meters
        length: Math.random() * 5 + 4, // 4-9 meters
        height: Math.random() * 0.5 + 2.5, // 2.5-3.0 meters
      },
      surfaceTypes: {
        floor: ['Hardwood', 'Carpet', 'Tile', 'Laminate'][
          Math.floor(Math.random() * 4)
        ],
        walls: ['Drywall', 'Painted', 'Wallpapered'],
        ceiling: 'Standard',
      },
      lighting: {
        level: Math.random() * 300 + 100, // 100-400 lux
        evenness: Math.random() * 40 + 60, // 60-100%
        shadowAreas: Math.floor(Math.random() * 5), // 0-4 shadow areas
      },
      accessibility: {
        clearPathways: Math.random() * 30 + 70, // 70-100%
        doorwayWidths: [
          Math.random() * 20 + 80, // 80-100cm
          Math.random() * 15 + 85, // 85-100cm
        ],
        stepHeights: [
          Math.random() * 5 + 15, // 15-20cm
          Math.random() * 3 + 17, // 17-20cm
        ],
      },
    };
  };

  const generateRiskAssessment = (
    hazardList: EnvironmentalHazard[]
  ): FallRiskAssessment => {
    const criticalHazards = hazardList.filter((h) => h.severity === 'critical');
    const highHazards = hazardList.filter((h) => h.severity === 'high');

    const baseRisk =
      criticalHazards.length * 25 +
      highHazards.length * 15 +
      hazardList.length * 5;
    const overallRisk = Math.min(baseRisk, 100);

    return {
      overallRisk,
      environmentalFactors: {
        lighting: Math.random() * 30 + 20,
        obstacles: Math.random() * 25 + 15,
        surfaces: Math.random() * 20 + 10,
        pathways: Math.random() * 35 + 25,
      },
      recommendations: [
        'Prioritize critical hazards first',
        'Improve overall lighting conditions',
        'Clear pathways of obstacles',
        'Install safety equipment where needed',
        'Regular environmental assessments',
      ],
      criticalAreas: criticalHazards.slice(0, 3),
    };
  };

  const startEnvironmentalScan = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setHazards([]);
    setSpatialMapping(null);
    setRiskAssessment(null);

    // Simulate scanning process
    for (let i = 0; i <= 100; i += 2) {
      await new Promise((resolve) => setTimeout(resolve, 50));
      setScanProgress(i);
    }

    // Generate results
    const detectedHazards = generateHazards();
    const mapping = generateSpatialMapping();
    const assessment = generateRiskAssessment(detectedHazards);

    setHazards(detectedHazards);
    setSpatialMapping(mapping);
    setRiskAssessment(assessment);
    setIsScanning(false);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getHazardIcon = (type: string) => {
    switch (type) {
      case 'obstacle':
        return Target;
      case 'surface':
        return Layers;
      case 'lighting':
        return Lightbulb;
      case 'height_change':
        return ArrowUp;
      case 'narrow_passage':
        return Home;
      case 'clutter':
        return AlertTriangle;
      default:
        return Shield;
    }
  };

  const getRiskColor = (risk: number) => {
    if (risk < 25) return 'text-green-600';
    if (risk < 50) return 'text-yellow-600';
    if (risk < 75) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="mb-6 text-center">
        <Shield className="mx-auto mb-2 h-10 w-10 text-blue-600" />
        <h2 className="text-2xl font-bold">Environmental Hazard Detection</h2>
        <p className="text-sm text-gray-600">
          LiDAR-powered spatial analysis for fall risk prevention
        </p>
      </div>

      {/* Scan Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            3D Environmental Scan
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <Button
              onClick={startEnvironmentalScan}
              disabled={isScanning}
              className="w-full"
            >
              {isScanning ? (
                <>
                  <Activity className="mr-2 h-4 w-4 animate-spin" />
                  Scanning Environment...
                </>
              ) : (
                <>
                  <Zap className="mr-2 h-4 w-4" />
                  Start Environmental Scan
                </>
              )}
            </Button>

            {isScanning && (
              <div className="mt-4">
                <Progress value={scanProgress} className="w-full" />
                <p className="mt-2 text-sm text-gray-600">
                  Analyzing spatial data and identifying potential hazards...
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Spatial Mapping Results */}
      {spatialMapping && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Spatial Environment Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h4 className="mb-2 font-semibold">Room Dimensions</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Width: {spatialMapping.roomDimensions.width.toFixed(1)}m
                  </div>
                  <div>
                    Length: {spatialMapping.roomDimensions.length.toFixed(1)}m
                  </div>
                  <div>
                    Height: {spatialMapping.roomDimensions.height.toFixed(1)}m
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Lighting Analysis</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Level: {spatialMapping.lighting.level.toFixed(0)} lux
                  </div>
                  <div>
                    Evenness: {spatialMapping.lighting.evenness.toFixed(1)}%
                  </div>
                  <div>Shadow Areas: {spatialMapping.lighting.shadowAreas}</div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Surface Types</h4>
                <div className="space-y-1 text-sm">
                  <div>Floor: {spatialMapping.surfaceTypes.floor}</div>
                  <div>
                    Walls: {spatialMapping.surfaceTypes.walls.join(', ')}
                  </div>
                </div>
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Accessibility</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    Clear Pathways:{' '}
                    {spatialMapping.accessibility.clearPathways.toFixed(1)}%
                  </div>
                  <div>
                    Doorway Widths:{' '}
                    {spatialMapping.accessibility.doorwayWidths
                      .map((w) => w.toFixed(0) + 'cm')
                      .join(', ')}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Assessment */}
      {riskAssessment && (
        <Card className="border-l-4 border-l-red-500">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Environmental Fall Risk Assessment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div className="text-center">
                <div className="text-sm text-gray-600">
                  Overall Environmental Risk
                </div>
                <div
                  className={`text-4xl font-bold ${getRiskColor(riskAssessment.overallRisk)}`}
                >
                  {riskAssessment.overallRisk.toFixed(1)}%
                </div>
                <Progress value={riskAssessment.overallRisk} className="mt-2" />
              </div>

              <div>
                <h4 className="mb-2 font-semibold">Risk Factors</h4>
                <div className="space-y-2">
                  {Object.entries(riskAssessment.environmentalFactors).map(
                    ([factor, value]) => (
                      <div
                        key={factor}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">{factor}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={value} className="w-16" />
                          <span className="w-10 text-xs">
                            {value.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detected Hazards */}
      {hazards.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Detected Hazards ({hazards.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {hazards.map((hazard) => {
                const IconComponent = getHazardIcon(hazard.type);
                return (
                  <div
                    key={hazard.id}
                    className={`cursor-pointer rounded-lg border p-4 transition-all ${
                      selectedHazard === hazard.id
                        ? 'border-blue-500 bg-blue-50'
                        : ''
                    }`}
                    onClick={() =>
                      setSelectedHazard(
                        selectedHazard === hazard.id ? null : hazard.id
                      )
                    }
                  >
                    <div className="mb-2 flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-5 w-5 text-gray-600" />
                        <div>
                          <Badge className={getSeverityColor(hazard.severity)}>
                            {hazard.severity.toUpperCase()}
                          </Badge>
                          <h4 className="mt-1 font-semibold">
                            {hazard.description}
                          </h4>
                          <p className="text-sm capitalize text-gray-600">
                            {hazard.type.replace('_', ' ')} •{' '}
                            {hazard.location.distance.toFixed(1)}m away
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm text-gray-600">Confidence</div>
                        <div className="text-lg font-bold text-green-600">
                          {hazard.confidence.toFixed(1)}%
                        </div>
                      </div>
                    </div>

                    {selectedHazard === hazard.id && (
                      <div className="mt-4 border-t pt-4">
                        <h5 className="mb-2 font-semibold">Recommendations:</h5>
                        <ul className="space-y-1 text-sm">
                          {hazard.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-center gap-2">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                              {rec}
                            </li>
                          ))}
                        </ul>

                        <div className="mt-3 text-xs text-gray-500">
                          Location: ({hazard.location.x.toFixed(1)},{' '}
                          {hazard.location.y.toFixed(1)},{' '}
                          {hazard.location.z.toFixed(1)})m
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Safety Recommendations */}
      {riskAssessment && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Safety Improvement Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskAssessment.recommendations.map((recommendation, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                    {index + 1}
                  </div>
                  <p className="text-sm">{recommendation}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isScanning && (
        <Alert>
          <Activity className="h-4 w-4 animate-spin" />
          <AlertDescription>
            LiDAR sensors are analyzing the environment for potential fall
            hazards...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default LiDAREnvironmentalHazardDetector;
