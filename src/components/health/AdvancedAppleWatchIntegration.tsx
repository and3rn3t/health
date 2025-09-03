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
import { useEffect } from 'react';
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

export default function AdvancedAppleWatchIntegration() {
  const [watchStatus, setWatchStatus] = useKV<AppleWatchStatus>(
    'Watch-status',
    {
      connected: false,
      batteryLevel: 85,
      signalStrength: 4,
      lastSync: new Date(),
      model: 'Apple Watch Series 9',
      osVersion: 'watchOS 10.1',
    }
  );

  const [biometrics, setBiometrics] = useKV<BiometricReading>(
    'current-biometrics',
    {
      heartRate: 72,
      heartRateVariability: 45,
      oxygenSaturation: 98,
      respiratoryRate: 16,
      bloodPressure: { systolic: 120, diastolic: 80 },
      bodyTemperature: 98.6,
      timestamp: new Date(),
    }
  );

  const [movementData, setMovementData] = useKV<MovementData>('movement-data', {
    steps: 8432,
    walkingSpeed: 3.2,
    cadence: 165,
    strideLength: 2.8,
    groundContactTime: 0.25,
    verticalOscillation: 8.2,
    balanceMetrics: 78,
    steadiness: 82,
    timestamp: new Date(),
  });

  const [healthScore, setHealthScore] = useKV<HealthScoreBreakdown>(
    'health-score-breakdown',
    {
      overall: 78,
      cardiovascular: 82,
      respiratory: 76,
      movement: 75,
      recovery: 80,
      stress: 72,
      fatigue: 74,
      timestamp: new Date(),
      factors: [],
    }
  );

  const [isMonitoring, setIsMonitoring] = useKV('advanced-monitoring', false);
  const [dataHistory, setDataHistory] = useKV<HealthScoreBreakdown[]>(
    'score-history-detailed',
    []
  );

  // Calculate comprehensive health score
  const calculateAdvancedHealthScore = (): HealthScoreBreakdown => {
    const factors = [];

    // Cardiovascular factors
    const heartRateScore = Math.max(
      0,
      Math.min(100, 100 - Math.abs(biometrics.heartRate - 70) * 2)
    );
    factors.push({
      name: 'Resting Heart Rate',
      value: heartRateScore,
      impact:
        biometrics.heartRate > 80
          ? 'negative'
          : ('positive' as 'positive' | 'negative'),
      weight: 0.15,
    });

    const hrvScore = Math.min(100, biometrics.heartRateVariability * 2);
    factors.push({
      name: 'Heart Rate Variability',
      value: hrvScore,
      impact:
        biometrics.heartRateVariability > 40
          ? 'positive'
          : ('negative' as 'positive' | 'negative'),
      weight: 0.15,
    });

    // Respiratory factors
    const oxygenScore = Math.max(0, (biometrics.oxygenSaturation - 90) * 10);
    factors.push({
      name: 'Oxygen Saturation',
      value: oxygenScore,
      impact:
        biometrics.oxygenSaturation >= 95
          ? 'positive'
          : ('negative' as 'positive' | 'negative'),
      weight: 0.1,
    });

    // Movement factors
    const balanceScore = movementData.balanceMetrics;
    factors.push({
      name: 'Balance & Stability',
      value: balanceScore,
      impact:
        balanceScore > 75
          ? 'positive'
          : ('negative' as 'positive' | 'negative'),
      weight: 0.2,
    });

    const steadinessScore = movementData.steadiness;
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
      75 + (biometrics.heartRateVariability - 40) * 0.5
    );
    const stress = Math.round(
      Math.max(0, 100 - (biometrics.heartRate - 60) * 2)
    );
    const fatigue = Math.round(
      85 - Math.abs(biometrics.bodyTemperature - 98.6) * 10
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
  };

  // Toggle Apple Watch connection
  const toggleWatchConnection = async () => {
    if (!watchStatus.connected) {
      toast.loading('Connecting to Apple Watch...');
      await new Promise((resolve) => setTimeout(resolve, 2000));

      setWatchStatus((current) => ({
        ...current,
        connected: true,
        lastSync: new Date(),
      }));

      toast.success('Apple Watch connected successfully');

      // Start real-time monitoring
      setIsMonitoring(true);
    } else {
      setWatchStatus((current) => ({
        ...current,
        connected: false,
      }));
      setIsMonitoring(false);
      toast.info('Apple Watch disconnected');
    }
  };

  // Simulate real-time data updates
  useEffect(() => {
    if (!watchStatus.connected || !isMonitoring) return;

    const interval = setInterval(() => {
      // Update biometrics with realistic variations
      setBiometrics((current) => ({
        heartRate: Math.max(
          55,
          Math.min(100, current.heartRate + (Math.random() - 0.5) * 4)
        ),
        heartRateVariability: Math.max(
          20,
          Math.min(80, current.heartRateVariability + (Math.random() - 0.5) * 3)
        ),
        oxygenSaturation: Math.max(
          92,
          Math.min(100, current.oxygenSaturation + (Math.random() - 0.5) * 0.5)
        ),
        respiratoryRate: Math.max(
          12,
          Math.min(20, current.respiratoryRate + (Math.random() - 0.5) * 1)
        ),
        bloodPressure: {
          systolic: Math.max(
            90,
            Math.min(
              140,
              current.bloodPressure.systolic + (Math.random() - 0.5) * 3
            )
          ),
          diastolic: Math.max(
            60,
            Math.min(
              90,
              current.bloodPressure.diastolic + (Math.random() - 0.5) * 2
            )
          ),
        },
        bodyTemperature: Math.max(
          97,
          Math.min(100, current.bodyTemperature + (Math.random() - 0.5) * 0.2)
        ),
        timestamp: new Date(),
      }));

      // Update movement data
      setMovementData((current) => ({
        ...current,
        balanceMetrics: Math.max(
          0,
          Math.min(100, current.balanceMetrics + (Math.random() - 0.5) * 3)
        ),
        steadiness: Math.max(
          0,
          Math.min(100, current.steadiness + (Math.random() - 0.5) * 2)
        ),
        timestamp: new Date(),
      }));

      // Update Watch status
      setWatchStatus((current) => ({
        ...current,
        batteryLevel: Math.max(0, current.batteryLevel - 0.1),
        lastSync: new Date(),
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, [watchStatus.connected, isMonitoring]);

  // Calculate health score when data changes
  useEffect(() => {
    if (watchStatus.connected) {
      const newScore = calculateAdvancedHealthScore();
      setHealthScore(newScore);

      // Add to history
      setDataHistory((current) => [...current, newScore].slice(-100));
    }
  }, [biometrics, movementData, watchStatus.connected]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
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
                {watchStatus.connected ? (
                  <Bluetooth className="h-5 w-5 text-blue-600" />
                ) : (
                  <WifiOff className="h-5 w-5 text-gray-500" />
                )}
                <div>
                  <div className="font-medium">{watchStatus.model}</div>
                  <div className="text-muted-foreground text-sm">
                    {watchStatus.osVersion}
                  </div>
                </div>
              </div>

              {watchStatus.connected && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Battery className="h-4 w-4" />
                    <span>{Math.round(watchStatus.batteryLevel)}%</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Radio className="h-4 w-4" />
                    <span>{watchStatus.signalStrength}/5</span>
                  </div>
                  <div className="text-muted-foreground">
                    Last sync: {watchStatus.lastSync.toLocaleTimeString()}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={toggleWatchConnection}
              variant={watchStatus.connected ? 'outline' : 'default'}
              className="flex items-center gap-2"
            >
              {watchStatus.connected ? 'Disconnect' : 'Connect'}
              <Watch className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {watchStatus.connected && (
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
                  className={`text-3xl font-bold ${getScoreColor(healthScore.overall)}`}
                >
                  {healthScore.overall}
                </div>
                <Progress value={healthScore.overall} className="mt-2" />
              </CardContent>
            </Card>

            {[
              {
                label: 'Cardiovascular',
                value: healthScore.cardiovascular,
                icon: Heart,
              },
              {
                label: 'Respiratory',
                value: healthScore.respiratory,
                icon: Activity,
              },
              {
                label: 'Movement',
                value: healthScore.movement,
                icon: Activity,
              },
              { label: 'Recovery', value: healthScore.recovery, icon: Timer },
              { label: 'Stress', value: healthScore.stress, icon: Brain },
              { label: 'Fatigue', value: healthScore.fatigue, icon: Battery },
            ].map((item, index) => {
              const IconComponent = item.icon;
              return (
                <Card key={index}>
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
                        {Math.round(biometrics.heartRate)}
                      </span>
                      <span className="text-muted-foreground text-sm">bpm</span>
                    </div>
                    <div className="text-muted-foreground mt-1 text-xs">
                      Updated {biometrics.timestamp.toLocaleTimeString()}
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
                        {Math.round(biometrics.heartRateVariability)}
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
                        {biometrics.oxygenSaturation.toFixed(1)}
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
                        {Math.round(biometrics.bloodPressure.systolic)}/
                        {Math.round(biometrics.bloodPressure.diastolic)}
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
                        {Math.round(biometrics.respiratoryRate)}
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
                        {biometrics.bodyTemperature.toFixed(1)}
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
                      className={`text-2xl font-bold ${getScoreColor(movementData.balanceMetrics)}`}
                    >
                      {Math.round(movementData.balanceMetrics)}
                    </div>
                    <Progress
                      value={movementData.balanceMetrics}
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
                      className={`text-2xl font-bold ${getScoreColor(movementData.steadiness)}`}
                    >
                      {Math.round(movementData.steadiness)}
                    </div>
                    <Progress
                      value={movementData.steadiness}
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
                        {movementData.walkingSpeed.toFixed(1)}
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
                      {movementData.steps.toLocaleString()}
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
                    {healthScore.factors.map((factor, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`h-3 w-3 rounded-full ${
                              factor.impact === 'positive'
                                ? 'bg-green-500'
                                : factor.impact === 'negative'
                                  ? 'bg-red-500'
                                  : 'bg-gray-500'
                            }`}
                          />
                          <span className="font-medium">{factor.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground text-sm">
                            Weight: {Math.round(factor.weight * 100)}%
                          </span>
                          <Badge
                            variant={
                              factor.impact === 'positive'
                                ? 'default'
                                : 'destructive'
                            }
                          >
                            {Math.round(factor.value)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Alerts and Recommendations */}
          {(healthScore.overall < 70 || biometrics.heartRate > 90) && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {healthScore.overall < 70 &&
                  'Your health score indicates areas needing attention. '}
                {biometrics.heartRate > 90 &&
                  'Elevated heart rate detected. Consider resting or consulting healthcare provider.'}
              </AlertDescription>
            </Alert>
          )}
        </>
      )}
    </div>
  );
}
