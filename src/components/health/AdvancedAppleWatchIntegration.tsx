import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useKV } from '@github/spark/hooks';
import {
  Activity,
  AlertTriangle,
  Battery,
  Bluetooth,
  Brain,
  Heart,
  Radio,
  Timer,
  Watch,
  WifiOff,
} from 'lucide-react';
import { useCallback, useEffect } from 'react';
import { toast } from 'sonner';

interface AppleWatchStatus {
  connected: boolean;
  batteryLevel: number;
  signalStrength: number;
  lastSync: Date;
  model: string;
  osVersion: string;
}

interface BiometricReading {
  heartRate: number;
  heartRateVariability: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  bodyTemperature: number;
  timestamp: Date;
}

interface MovementData {
  steps: number;
  walkingSpeed: number;
  cadence: number;
  strideLength: number;
  groundContactTime: number;
  verticalOscillation: number;
  balanceMetrics: number;
  steadiness: number;
  timestamp: Date;
}

interface HealthScoreBreakdown {
  overall: number;
  cardiovascular: number;
  respiratory: number;
  movement: number;
  recovery: number;
  stress: number;
  fatigue: number;
  timestamp: Date;
  factors: Array<{
    name: string;
    value: number;
    impact: 'positive' | 'negative' | 'neutral';
    weight: number;
  }>;
}

// Stable defaults at module scope to avoid recreating on each render
const DEFAULT_WATCH_STATUS: AppleWatchStatus = {
  connected: false,
  batteryLevel: 85,
  signalStrength: 4,
  lastSync: new Date(),
  model: 'Apple Watch Series 9',
  osVersion: 'watchOS 10.1',
};

const DEFAULT_BIOMETRICS: BiometricReading = {
  heartRate: 72,
  heartRateVariability: 45,
  oxygenSaturation: 98,
  respiratoryRate: 16,
  bloodPressure: { systolic: 120, diastolic: 80 },
  bodyTemperature: 98.6,
  timestamp: new Date(),
};

const DEFAULT_MOVEMENT: MovementData = {
  steps: 8432,
  walkingSpeed: 3.2,
  cadence: 165,
  strideLength: 2.8,
  groundContactTime: 0.25,
  verticalOscillation: 8.2,
  balanceMetrics: 78,
  steadiness: 82,
  timestamp: new Date(),
};

const DEFAULT_HEALTH_SCORE: HealthScoreBreakdown = {
  overall: 78,
  cardiovascular: 82,
  respiratory: 76,
  movement: 75,
  recovery: 80,
  stress: 72,
  fatigue: 74,
  timestamp: new Date(),
  factors: [],
};

export default function AdvancedAppleWatchIntegration() {
  const [watchStatus, setWatchStatus] = useKV<AppleWatchStatus>(
    'Watch-status',
    DEFAULT_WATCH_STATUS
  );
  const [biometrics, setBiometrics] = useKV<BiometricReading>(
    'current-biometrics',
    DEFAULT_BIOMETRICS
  );
  const [movementData, setMovementData] = useKV<MovementData>(
    'movement-data',
    DEFAULT_MOVEMENT
  );
  const [healthScore, setHealthScore] = useKV<HealthScoreBreakdown>(
    'health-score-breakdown',
    DEFAULT_HEALTH_SCORE
  );

  const [isMonitoring, setIsMonitoring] = useKV<boolean>(
    'advanced-monitoring',
    false
  );
  const [_dataHistory, setDataHistory] = useKV<HealthScoreBreakdown[]>(
    'score-history-detailed',
    []
  );

  // Safe fallbacks for KV values (types may be optional)
  const safeWatchStatus: AppleWatchStatus = watchStatus ?? DEFAULT_WATCH_STATUS;
  const safeBiometrics: BiometricReading = biometrics ?? DEFAULT_BIOMETRICS;
  const safeMovement: MovementData = movementData ?? DEFAULT_MOVEMENT;
  const safeHealthScore: HealthScoreBreakdown =
    healthScore ?? DEFAULT_HEALTH_SCORE;

  // Calculate comprehensive health score
  const calculateAdvancedHealthScore = useCallback((): HealthScoreBreakdown => {
    const factors = [];

    // Cardiovascular factors
    const heartRateScore = Math.max(
      0,
      Math.min(100, 100 - Math.abs(safeBiometrics.heartRate - 70) * 2)
    );
    factors.push({
      name: 'Resting Heart Rate',
      value: heartRateScore,
      impact:
        safeBiometrics.heartRate > 80
          ? 'negative'
          : ('positive' as 'positive' | 'negative'),
      weight: 0.15,
    });

    const hrvScore = Math.min(100, safeBiometrics.heartRateVariability * 2);
    factors.push({
      name: 'Heart Rate Variability',
      value: hrvScore,
      impact:
        safeBiometrics.heartRateVariability > 40
          ? 'positive'
          : ('negative' as 'positive' | 'negative'),
      weight: 0.15,
    });

    // Respiratory factors
    const oxygenScore = Math.max(
      0,
      (safeBiometrics.oxygenSaturation - 90) * 10
    );
    factors.push({
      name: 'Oxygen Saturation',
      value: oxygenScore,
      impact:
        safeBiometrics.oxygenSaturation >= 95
          ? 'positive'
          : ('negative' as 'positive' | 'negative'),
      weight: 0.1,
    });

    // Movement factors
    const balanceScore = safeMovement.balanceMetrics;
    factors.push({
      name: 'Balance & Stability',
      value: balanceScore,
      impact:
        balanceScore > 75
          ? 'positive'
          : ('negative' as 'positive' | 'negative'),
      weight: 0.2,
    });

    const steadinessScore = safeMovement.steadiness;
    factors.push({
      name: 'Walking Steadiness',
      value: steadinessScore,
      impact:
        steadinessScore > 80
          ? 'positive'
          : ('negative' as 'positive' | 'negative'),
      weight: 0.15,
    });

    // Calculate category scores
    const cardiovascular = Math.round((heartRateScore + hrvScore) / 2);
    const respiratory = Math.round(oxygenScore);
    const movement = Math.round((balanceScore + steadinessScore) / 2);
    const recovery = Math.round(
      75 + (safeBiometrics.heartRateVariability - 40) * 0.5
    );
    const stress = Math.round(
      Math.max(0, 100 - (safeBiometrics.heartRate - 60) * 2)
    );
    const fatigue = Math.round(
      85 - Math.abs(safeBiometrics.bodyTemperature - 98.6) * 10
    );

    // Calculate weighted overall score
    const overall = Math.round(
      factors.reduce((sum, factor) => {
        return sum + factor.value * factor.weight;
      }, 0) / factors.reduce((sum, factor) => sum + factor.weight, 0)
    );

    return {
      overall,
      cardiovascular,
      respiratory,
      movement,
      recovery,
      stress,
      fatigue,
      timestamp: new Date(),
      factors,
    };
  }, [safeBiometrics, safeMovement]);

  // Toggle Apple Watch connection
  const toggleWatchConnection = async () => {
    if (!safeWatchStatus.connected) {
      toast.loading('Connecting to Apple Watch...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setWatchStatus((current) => {
        const prev = current ?? DEFAULT_WATCH_STATUS;
        return {
          ...prev,
          connected: true,
          lastSync: new Date(),
        };
      });

      toast.success('Apple Watch connected successfully');

      // Start real-time monitoring
      setIsMonitoring(true);
    } else {
      setWatchStatus((current) => {
        const prev = current ?? DEFAULT_WATCH_STATUS;
        return {
          ...prev,
          connected: false,
        };
      });
      setIsMonitoring(false);
      toast.info('Apple Watch disconnected');
    }
  };

  // Simulate real-time data updates
  useEffect(() => {
    if (!safeWatchStatus.connected || !isMonitoring) {
      return;
    }

    const interval = setInterval(() => {
      // Update biometrics with realistic variations
      setBiometrics((current) => {
        const prev = current ?? DEFAULT_BIOMETRICS;
        return {
          heartRate: Math.max(
            55,
            Math.min(100, prev.heartRate + (Math.random() - 0.5) * 4)
          ),
          heartRateVariability: Math.max(
            20,
            Math.min(80, prev.heartRateVariability + (Math.random() - 0.5) * 3)
          ),
          oxygenSaturation: Math.max(
            92,
            Math.min(100, prev.oxygenSaturation + (Math.random() - 0.5) * 0.5)
          ),
          respiratoryRate: Math.max(
            12,
            Math.min(20, prev.respiratoryRate + (Math.random() - 0.5) * 1)
          ),
          bloodPressure: {
            systolic: Math.max(
              90,
              Math.min(
                140,
                prev.bloodPressure.systolic + (Math.random() - 0.5) * 3
              )
            ),
            diastolic: Math.max(
              60,
              Math.min(
                90,
                prev.bloodPressure.diastolic + (Math.random() - 0.5) * 2
              )
            ),
          },
          bodyTemperature: Math.max(
            97,
            Math.min(100, prev.bodyTemperature + (Math.random() - 0.5) * 0.2)
          ),
          timestamp: new Date(),
        };
      });

      // Update movement data
      setMovementData((current) => {
        const prev = current ?? DEFAULT_MOVEMENT;
        return {
          ...prev,
          balanceMetrics: Math.max(
            0,
            Math.min(100, prev.balanceMetrics + (Math.random() - 0.5) * 3)
          ),
          steadiness: Math.max(
            0,
            Math.min(100, prev.steadiness + (Math.random() - 0.5) * 2)
          ),
          timestamp: new Date(),
        };
      });

      // Update Watch status
      setWatchStatus((current) => {
        const prev = current ?? DEFAULT_WATCH_STATUS;
        return {
          ...prev,
          batteryLevel: Math.max(0, prev.batteryLevel - 0.1),
          lastSync: new Date(),
        };
      });
    }, 3000);

    return () => clearInterval(interval);
  }, [
    safeWatchStatus.connected,
    isMonitoring,
    setBiometrics,
    setMovementData,
    setWatchStatus,
  ]);

  // Calculate health score when data changes
  useEffect(() => {
    if (safeWatchStatus.connected) {
      const newScore = calculateAdvancedHealthScore();
      setHealthScore(newScore);

      // Add to history
      setDataHistory((current) => [...(current ?? []), newScore].slice(-100));
    }
  }, [
    safeBiometrics,
    safeMovement,
    safeWatchStatus.connected,
    calculateAdvancedHealthScore,
    setHealthScore,
    setDataHistory,
  ]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Apple Watch Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Watch className="h-6 w-6 text-gray-800" />
            Apple Watch Integration
          </CardTitle>
          <CardDescription>
            Advanced health monitoring with real-time Apple Watch data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                {safeWatchStatus.connected ? (
                  <Bluetooth className="h-5 w-5 text-blue-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <div className="font-medium">{safeWatchStatus.model}</div>
                  <div className="text-muted-foreground text-sm">
                    {safeWatchStatus.osVersion}
                  </div>
                </div>
              </div>

              {safeWatchStatus.connected && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Battery className="h-4 w-4" />
                    <span>{Math.round(safeWatchStatus.batteryLevel)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Radio className="h-4 w-4" />
                    <span>{safeWatchStatus.signalStrength}/5</span>
                  </div>
                  <div className="text-muted-foreground">
                    Last sync: {safeWatchStatus.lastSync.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={toggleWatchConnection}
              variant={safeWatchStatus.connected ? 'outline' : 'default'}
              className="flex items-center gap-2"
            >
              {safeWatchStatus.connected ? 'Disconnect' : 'Connect'}
              <Watch className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {safeWatchStatus.connected && (
        <>
          {/* Health Score Overview */}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
            <Card className="col-span-2 md:col-span-2 lg:col-span-1">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Heart className="h-5 w-5 text-red-500" />
                  Overall
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className={`text-3xl font-bold ${getScoreColor(safeHealthScore.overall)}`}
                >
                  {safeHealthScore.overall}
                </div>
                <Progress value={safeHealthScore.overall} className="mt-2" />
              </CardContent>
            </Card>

            {[
              {
                label: 'Cardiovascular',
                value: safeHealthScore.cardiovascular,
                icon: Heart,
              },
              {
                label: 'Respiratory',
                value: safeHealthScore.respiratory,
                icon: Activity,
              },
              {
                label: 'Movement',
                value: safeHealthScore.movement,
                icon: Activity,
              },
              {
                label: 'Recovery',
                value: safeHealthScore.recovery,
                icon: Timer,
              },
              { label: 'Stress', value: safeHealthScore.stress, icon: Brain },
              {
                label: 'Fatigue',
                value: safeHealthScore.fatigue,
                icon: Battery,
              },
            ].map((item) => {
              const IconComponent = item.icon;
              return (
                <Card key={item.label}>
                  <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-1 text-sm">
                      <IconComponent className="h-4 w-4" />
                      {item.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-xl font-bold ${getScoreColor(item.value)}`}
                    >
                      {item.value}
                    </div>
                    <Progress value={item.value} className="mt-1" />
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Detailed Data Tabs */}
          <Tabs defaultValue="biometrics" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="biometrics">Live Biometrics</TabsTrigger>
              <TabsTrigger value="movement">Movement Analysis</TabsTrigger>
              <TabsTrigger value="factors">Score Factors</TabsTrigger>
            </TabsList>

            <TabsContent value="biometrics" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Heart Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {Math.round(safeBiometrics.heartRate)}
                      </span>
                      <span className="text-muted-foreground text-sm">bpm</span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      Updated {safeBiometrics.timestamp.toLocaleTimeString()}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">HRV</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {Math.round(safeBiometrics.heartRateVariability)}
                      </span>
                      <span className="text-muted-foreground text-sm">ms</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Blood Oxygen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {safeBiometrics.oxygenSaturation.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-sm">%</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Blood Pressure</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold">
                        {Math.round(safeBiometrics.bloodPressure.systolic)}/
                        {Math.round(safeBiometrics.bloodPressure.diastolic)}
                      </span>
                      <span className="text-muted-foreground text-sm">
                        mmHg
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Respiratory Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {Math.round(safeBiometrics.respiratoryRate)}
                      </span>
                      <span className="text-muted-foreground text-sm">bpm</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Body Temperature</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {safeBiometrics.bodyTemperature.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-sm">°F</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="movement" className="space-y-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Balance Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(safeMovement.balanceMetrics)}`}
                    >
                      {Math.round(safeMovement.balanceMetrics)}
                    </div>
                    <Progress
                      value={safeMovement.balanceMetrics}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">
                      Walking Steadiness
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div
                      className={`text-2xl font-bold ${getScoreColor(safeMovement.steadiness)}`}
                    >
                      {Math.round(safeMovement.steadiness)}
                    </div>
                    <Progress
                      value={safeMovement.steadiness}
                      className="mt-2"
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Walking Speed</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="text-2xl font-bold">
                        {safeMovement.walkingSpeed.toFixed(1)}
                      </span>
                      <span className="text-muted-foreground text-sm">mph</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Steps Today</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {safeMovement.steps.toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="factors" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Health Score Factors</CardTitle>
                  <CardDescription>
                    Individual factors contributing to your overall health score
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {safeHealthScore.factors.map((factor) => {
                      let impactBg: string;
                      if (factor.impact === 'positive') {
                        impactBg = 'bg-green-500';
                      } else if (factor.impact === 'negative') {
                        impactBg = 'bg-red-500';
                      } else {
                        impactBg = 'bg-gray-500';
                      }
                      return (
                        <div
                          key={`${factor.name}:${factor.weight}`}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-3 w-3 rounded-full ${impactBg}`}
                            />
                            <span className="font-medium">{factor.name}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-muted-foreground text-sm">
                              Weight: {Math.round(factor.weight * 100)}%
                            </span>
                            {(() => {
                              const variant =
                                factor.impact === 'positive'
                                  ? 'default'
                                  : ('destructive' as const);
                              return (
                                <Badge variant={variant}>
                                  {Math.round(factor.value)}
                                </Badge>
                              );
                            })()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Alerts and Recommendations */}
          {(safeHealthScore.overall < 70 || safeBiometrics.heartRate > 90) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {safeHealthScore.overall < 70 &&
                  'Your health score indicates areas needing attention. '}
                {safeBiometrics.heartRate > 90 &&
                  'Elevated heart rate detected. Consider resting or consulting healthcare provider.'}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
