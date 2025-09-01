import { useState, useEffect, useRef } from 'react';
import { useKV } from '@github/spark/hooks';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Play,
  Pause,
  AlertTriangle,
  CheckCircle,
  Activity,
  Watch,
  Phone,
  Heart,
  Zap,
  TrendUp,
  Wifi,
} from '@phosphor-icons/react';
import { toast } from 'sonner';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

interface SensorData {
  timestamp: number;
  accelerometer: { x: number; y: number; z: number };
  gyroscope: { x: number; y: number; z: number };
  heartRate?: number;
  confidence: number;
}

interface FallEvent {
  id: string;
  timestamp: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
  sensorData: SensorData[];
  location?: { latitude: number; longitude: number };
  confirmed: boolean;
  falseAlarm: boolean;
  responseTime?: number;
}

interface CalibrationData {
  baseline: {
    accelerometer: { x: number; y: number; z: number };
    gyroscope: { x: number; y: number; z: number };
    heartRate: number;
  };
  thresholds: {
    impact: number;
    rotation: number;
    heartRateSpike: number;
    confidence: number;
  };
}

export default function RealTimeFallDetection() {
  const [isMonitoring, setIsMonitoring] = useKV('fall-detection-active', false);
  const [calibrationData, setCalibrationData] = useKV<CalibrationData | null>(
    'fall-detection-calibration',
    null
  );
  const [fallEvents, setFallEvents] = useKV<FallEvent[]>('fall-events', []);
  const [currentSensorData, setCurrentSensorData] = useState<SensorData | null>(
    null
  );
  const [recentSensorHistory, setRecentSensorHistory] = useState<SensorData[]>(
    []
  );
  const [connectionStatus, setConnectionStatus] = useState<
    'connected' | 'connecting' | 'disconnected'
  >('disconnected');
  const [fallRisk, setFallRisk] = useState<'low' | 'medium' | 'high'>('low');
  const [alertPending, setAlertPending] = useState<FallEvent | null>(null);
  const [countdownTimer, setCountdownTimer] = useState<number | null>(null);

  const sensorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Simulate Apple Watch sensor data
  const generateMockSensorData = (): SensorData => {
    const baseAccel = calibrationData?.baseline.accelerometer || {
      x: 0,
      y: 0,
      z: -9.8,
    };
    const baseGyro = calibrationData?.baseline.gyroscope || {
      x: 0,
      y: 0,
      z: 0,
    };
    const baseHR = calibrationData?.baseline.heartRate || 75;

    // Add normal movement variation
    const accelVariation = 0.5 + Math.random() * 1.0;
    const gyroVariation = 0.1 + Math.random() * 0.2;
    const hrVariation = Math.random() * 10 - 5;

    return {
      timestamp: Date.now(),
      accelerometer: {
        x: baseAccel.x + (Math.random() - 0.5) * accelVariation,
        y: baseAccel.y + (Math.random() - 0.5) * accelVariation,
        z: baseAccel.z + (Math.random() - 0.5) * accelVariation,
      },
      gyroscope: {
        x: baseGyro.x + (Math.random() - 0.5) * gyroVariation,
        y: baseGyro.y + (Math.random() - 0.5) * gyroVariation,
        z: baseGyro.z + (Math.random() - 0.5) * gyroVariation,
      },
      heartRate: Math.max(60, baseHR + hrVariation),
      confidence: 0.95 + Math.random() * 0.05,
    };
  };

  // Simulate fall event
  const simulateFallEvent = (): SensorData => {
    return {
      timestamp: Date.now(),
      accelerometer: {
        x: (Math.random() - 0.5) * 20, // High impact
        y: (Math.random() - 0.5) * 20,
        z: -15 + (Math.random() - 0.5) * 10,
      },
      gyroscope: {
        x: (Math.random() - 0.5) * 8, // High rotation
        y: (Math.random() - 0.5) * 8,
        z: (Math.random() - 0.5) * 8,
      },
      heartRate: 120 + Math.random() * 30, // Elevated heart rate
      confidence: 0.85 + Math.random() * 0.15,
    };
  };

  // Fall detection algorithm
  const detectFall = (
    sensorData: SensorData,
    history: SensorData[]
  ): boolean => {
    if (!calibrationData) return false;

    const { thresholds } = calibrationData;

    // Calculate impact magnitude
    const impactMagnitude = Math.sqrt(
      Math.pow(sensorData.accelerometer.x, 2) +
        Math.pow(sensorData.accelerometer.y, 2) +
        Math.pow(sensorData.accelerometer.z + 9.8, 2) // Remove gravity
    );

    // Calculate rotation magnitude
    const rotationMagnitude = Math.sqrt(
      Math.pow(sensorData.gyroscope.x, 2) +
        Math.pow(sensorData.gyroscope.y, 2) +
        Math.pow(sensorData.gyroscope.z, 2)
    );

    // Check for sudden heart rate spike
    const avgHeartRate =
      history.slice(-5).reduce((sum, data) => sum + (data.heartRate || 0), 0) /
      5;
    const heartRateSpike = (sensorData.heartRate || 0) - avgHeartRate;

    // Fall detection logic
    const impactDetected = impactMagnitude > thresholds.impact;
    const rotationDetected = rotationMagnitude > thresholds.rotation;
    const heartRateDetected = heartRateSpike > thresholds.heartRateSpike;
    const confidenceOk = sensorData.confidence > thresholds.confidence;

    return impactDetected && rotationDetected && confidenceOk;
  };

  // Handle fall detection
  const handleFallDetected = (
    sensorData: SensorData,
    severity: 'low' | 'medium' | 'high' | 'critical'
  ) => {
    const fallEvent: FallEvent = {
      id: `fall-${Date.now()}`,
      timestamp: Date.now(),
      severity,
      sensorData: recentSensorHistory.slice(-10).concat([sensorData]),
      confirmed: false,
      falseAlarm: false,
    };

    setAlertPending(fallEvent);
    setCountdownTimer(30); // 30 second countdown

    // Start countdown
    countdownIntervalRef.current = setInterval(() => {
      setCountdownTimer((prev) => {
        if (prev === null || prev <= 1) {
          // Auto-confirm fall and send alerts
          confirmFallEvent(fallEvent);
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    toast.error('Fall detected! Tap to cancel if this is a false alarm.', {
      duration: 30000,
      action: {
        label: 'Cancel',
        onClick: () => cancelFallAlert(),
      },
    });
  };

  // Confirm fall event
  const confirmFallEvent = (fallEvent: FallEvent) => {
    setFallEvents((current) => [...current, { ...fallEvent, confirmed: true }]);
    setAlertPending(null);
    setCountdownTimer(null);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    toast.success('Emergency contacts have been notified.', {
      description: 'Fall event confirmed and alerts sent.',
    });
  };

  // Cancel fall alert
  const cancelFallAlert = () => {
    if (alertPending) {
      setFallEvents((current) => [
        ...current,
        { ...alertPending, falseAlarm: true },
      ]);
    }
    setAlertPending(null);
    setCountdownTimer(null);
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    toast.success('Fall alert cancelled');
  };

  // Start monitoring
  const startMonitoring = () => {
    if (!calibrationData) {
      toast.error('Please calibrate the system first');
      return;
    }

    setIsMonitoring(true);
    setConnectionStatus('connecting');

    // Simulate connection
    setTimeout(() => {
      setConnectionStatus('connected');
      toast.success('Connected to Apple Watch');
    }, 2000);

    sensorIntervalRef.current = setInterval(() => {
      // Randomly simulate a fall (very low probability for demo)
      const shouldSimulateFall = Math.random() < 0.001; // 0.1% chance
      const sensorData = shouldSimulateFall
        ? simulateFallEvent()
        : generateMockSensorData();

      setCurrentSensorData(sensorData);
      setRecentSensorHistory((current) => {
        const newHistory = [...current, sensorData].slice(-50); // Keep last 50 readings

        // Check for fall
        if (newHistory.length > 10) {
          const fallDetected = detectFall(sensorData, newHistory);
          if (fallDetected) {
            const severity = shouldSimulateFall ? 'high' : 'medium';
            handleFallDetected(sensorData, severity);
          }
        }

        return newHistory;
      });

      // Update fall risk based on recent activity
      const avgAccelMagnitude =
        recentSensorHistory.slice(-10).reduce((sum, data) => {
          return (
            sum +
            Math.sqrt(
              Math.pow(data.accelerometer.x, 2) +
                Math.pow(data.accelerometer.y, 2) +
                Math.pow(data.accelerometer.z, 2)
            )
          );
        }, 0) / Math.min(10, recentSensorHistory.length);

      if (avgAccelMagnitude > 15) setFallRisk('high');
      else if (avgAccelMagnitude > 10) setFallRisk('medium');
      else setFallRisk('low');
    }, 100); // 10Hz sampling rate
  };

  // Stop monitoring
  const stopMonitoring = () => {
    setIsMonitoring(false);
    setConnectionStatus('disconnected');
    if (sensorIntervalRef.current) {
      clearInterval(sensorIntervalRef.current);
    }
    setCurrentSensorData(null);
    setRecentSensorHistory([]);
    toast.info('Fall detection stopped');
  };

  // Calibrate system
  const calibrateSystem = () => {
    if (!currentSensorData) {
      toast.error('Please start monitoring first to collect baseline data');
      return;
    }

    const calibration: CalibrationData = {
      baseline: {
        accelerometer: currentSensorData.accelerometer,
        gyroscope: currentSensorData.gyroscope,
        heartRate: currentSensorData.heartRate || 75,
      },
      thresholds: {
        impact: 12.0, // m/s²
        rotation: 4.0, // rad/s
        heartRateSpike: 20, // bpm
        confidence: 0.85,
      },
    };

    setCalibrationData(calibration);
    toast.success('System calibrated successfully');
  };

  // Chart data for sensor visualization
  const chartData = recentSensorHistory.slice(-20).map((data, index) => ({
    time: index,
    accel: Math.sqrt(
      Math.pow(data.accelerometer.x, 2) +
        Math.pow(data.accelerometer.y, 2) +
        Math.pow(data.accelerometer.z, 2)
    ),
    gyro: Math.sqrt(
      Math.pow(data.gyroscope.x, 2) +
        Math.pow(data.gyroscope.y, 2) +
        Math.pow(data.gyroscope.z, 2)
    ),
    heartRate: data.heartRate || 0,
  }));

  useEffect(() => {
    return () => {
      if (sensorIntervalRef.current) clearInterval(sensorIntervalRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Fall Alert Modal */}
      {alertPending && countdownTimer !== null && (
        <Alert className="border-destructive bg-destructive/10">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong>FALL DETECTED!</strong> Emergency contacts will be
              notified in {countdownTimer} seconds.
            </div>
            <Button variant="destructive" size="sm" onClick={cancelFallAlert}>
              Cancel Alert
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Status Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Watch className="h-5 w-5" />
              Connection Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div
                className={`h-3 w-3 rounded-full ${
                  connectionStatus === 'connected'
                    ? 'bg-green-500'
                    : connectionStatus === 'connecting'
                      ? 'animate-pulse bg-yellow-500'
                      : 'bg-gray-400'
                }`}
              />
              <span className="font-medium capitalize">{connectionStatus}</span>
              {connectionStatus === 'connected' && (
                <Wifi className="h-4 w-4 text-green-500" />
              )}
            </div>
            {connectionStatus === 'connected' && (
              <p className="text-muted-foreground mt-2 text-sm">
                Apple Watch Series 8 • Sensor quality: Excellent
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5" />
              Fall Risk Level
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <Badge
                variant={
                  fallRisk === 'high'
                    ? 'destructive'
                    : fallRisk === 'medium'
                      ? 'default'
                      : 'secondary'
                }
              >
                {fallRisk.toUpperCase()}
              </Badge>
              {fallRisk === 'high' && (
                <AlertTriangle className="text-destructive h-4 w-4" />
              )}
              {fallRisk === 'medium' && (
                <Activity className="h-4 w-4 text-yellow-500" />
              )}
              {fallRisk === 'low' && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              Based on recent movement patterns
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Activity className="h-5 w-5" />
              Monitoring Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Switch
                  checked={isMonitoring}
                  onCheckedChange={
                    isMonitoring ? stopMonitoring : startMonitoring
                  }
                />
                <Label>Active Monitoring</Label>
              </div>
              {isMonitoring ? (
                <Badge
                  variant="default"
                  className="border-green-300 bg-green-100 text-green-800"
                >
                  <Play className="mr-1 h-3 w-3" />
                  Active
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <Pause className="mr-1 h-3 w-3" />
                  Inactive
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="realtime" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="realtime">Real-time Data</TabsTrigger>
          <TabsTrigger value="calibration">Calibration</TabsTrigger>
          <TabsTrigger value="alerts">Fall Alerts</TabsTrigger>
          <TabsTrigger value="history">Event History</TabsTrigger>
        </TabsList>

        <TabsContent value="realtime" className="space-y-6">
          {/* Live Sensor Data */}
          {currentSensorData && (
            <div className="grid gap-6 md:grid-cols-3">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="h-4 w-4" />
                    Accelerometer
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>X:</span>
                      <span className="font-mono">
                        {currentSensorData.accelerometer.x.toFixed(2)} m/s²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Y:</span>
                      <span className="font-mono">
                        {currentSensorData.accelerometer.y.toFixed(2)} m/s²
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Z:</span>
                      <span className="font-mono">
                        {currentSensorData.accelerometer.z.toFixed(2)} m/s²
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <TrendUp className="h-4 w-4" />
                    Gyroscope
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span>X:</span>
                      <span className="font-mono">
                        {currentSensorData.gyroscope.x.toFixed(2)} rad/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Y:</span>
                      <span className="font-mono">
                        {currentSensorData.gyroscope.y.toFixed(2)} rad/s
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Z:</span>
                      <span className="font-mono">
                        {currentSensorData.gyroscope.z.toFixed(2)} rad/s
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="h-4 w-4" />
                    Heart Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-primary text-3xl font-bold">
                      {Math.round(currentSensorData.heartRate || 0)}
                    </div>
                    <div className="text-muted-foreground text-sm">BPM</div>
                    <Progress
                      value={((currentSensorData.heartRate || 0) / 200) * 100}
                      className="mt-3"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Real-time Chart */}
          {chartData.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Sensor Data Visualization</CardTitle>
                <CardDescription>
                  Live sensor readings from Apple Watch
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="accel"
                        stroke="#3b82f6"
                        name="Acceleration"
                        strokeWidth={2}
                      />
                      <Line
                        type="monotone"
                        dataKey="gyro"
                        stroke="#ef4444"
                        name="Rotation"
                        strokeWidth={2}
                      />
                      {calibrationData && (
                        <>
                          <ReferenceLine
                            y={calibrationData.thresholds.impact}
                            stroke="#f59e0b"
                            strokeDasharray="5 5"
                          />
                          <ReferenceLine
                            y={calibrationData.thresholds.rotation}
                            stroke="#ef4444"
                            strokeDasharray="5 5"
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calibration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>System Calibration</CardTitle>
              <CardDescription>
                Calibrate the fall detection system based on your baseline
                movement patterns
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!calibrationData ? (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    System needs calibration. Please stand still for 10 seconds
                    while wearing your Apple Watch, then click calibrate.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    System is calibrated and ready for fall detection.
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-4">
                <Button
                  onClick={calibrateSystem}
                  disabled={!currentSensorData}
                  className="flex items-center gap-2"
                >
                  <Shield className="h-4 w-4" />
                  Calibrate System
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setCalibrationData(null);
                    toast.info('Calibration data cleared');
                  }}
                  disabled={!calibrationData}
                >
                  Reset Calibration
                </Button>
              </div>

              {calibrationData && (
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <h4 className="mb-3 font-medium">Baseline Values</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        Accelerometer: (
                        {calibrationData.baseline.accelerometer.x.toFixed(2)},{' '}
                        {calibrationData.baseline.accelerometer.y.toFixed(2)},{' '}
                        {calibrationData.baseline.accelerometer.z.toFixed(2)})
                      </div>
                      <div>
                        Gyroscope: (
                        {calibrationData.baseline.gyroscope.x.toFixed(2)},{' '}
                        {calibrationData.baseline.gyroscope.y.toFixed(2)},{' '}
                        {calibrationData.baseline.gyroscope.z.toFixed(2)})
                      </div>
                      <div>
                        Heart Rate:{' '}
                        {calibrationData.baseline.heartRate.toFixed(0)} BPM
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="mb-3 font-medium">Detection Thresholds</h4>
                    <div className="space-y-2 text-sm">
                      <div>
                        Impact: {calibrationData.thresholds.impact} m/s²
                      </div>
                      <div>
                        Rotation: {calibrationData.thresholds.rotation} rad/s
                      </div>
                      <div>
                        Heart Rate Spike:{' '}
                        {calibrationData.thresholds.heartRateSpike} BPM
                      </div>
                      <div>
                        Confidence:{' '}
                        {(calibrationData.thresholds.confidence * 100).toFixed(
                          0
                        )}
                        %
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fall Alert System</CardTitle>
              <CardDescription>
                Configure how fall alerts are handled
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Auto-confirm delay</Label>
                    <span className="text-muted-foreground text-sm">
                      30 seconds
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Emergency SMS</Label>
                    <Switch defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>Call emergency services</Label>
                    <Switch />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label>GPS location sharing</Label>
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="font-medium">Alert Sequence</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-yellow-500" />
                      Fall detected (immediate)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-orange-500" />
                      User notification (5 seconds)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500" />
                      Emergency contacts (30 seconds)
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-purple-500" />
                      Emergency services (60 seconds)
                    </div>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                className="flex items-center gap-2"
                onClick={() => {
                  const mockFall = simulateFallEvent();
                  handleFallDetected(mockFall, 'medium');
                }}
              >
                <AlertTriangle className="h-4 w-4" />
                Test Fall Alert
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fall Event History</CardTitle>
              <CardDescription>
                Review past fall events and false alarms
              </CardDescription>
            </CardHeader>
            <CardContent>
              {fallEvents.length === 0 ? (
                <div className="text-muted-foreground py-8 text-center">
                  No fall events recorded yet
                </div>
              ) : (
                <div className="space-y-4">
                  {fallEvents.map((event) => (
                    <div key={event.id} className="rounded-lg border p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Badge
                            variant={
                              event.falseAlarm
                                ? 'secondary'
                                : event.severity === 'critical'
                                  ? 'destructive'
                                  : event.severity === 'high'
                                    ? 'destructive'
                                    : 'default'
                            }
                          >
                            {event.falseAlarm
                              ? 'False Alarm'
                              : event.severity.toUpperCase()}
                          </Badge>
                          <span className="text-muted-foreground text-sm">
                            {new Date(event.timestamp).toLocaleString()}
                          </span>
                        </div>
                        {event.confirmed && !event.falseAlarm && (
                          <Badge
                            variant="outline"
                            className="border-green-600 text-green-600"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Confirmed
                          </Badge>
                        )}
                      </div>
                      <p className="text-muted-foreground text-sm">
                        {event.confirmed &&
                          !event.falseAlarm &&
                          'Emergency contacts were notified'}
                        {event.falseAlarm &&
                          'False alarm - user cancelled alert'}
                        {!event.confirmed &&
                          !event.falseAlarm &&
                          'Pending confirmation'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
