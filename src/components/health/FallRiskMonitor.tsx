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
import { ProcessedHealthData } from '@/lib/healthDataProcessor';
import { Brain, Heart, Phone, Shield } from 'lucide-react';
import { useEffect } from 'react';
import MLPredictionsDashboard from './MLPredictionsDashboard';

interface FallRiskMonitorProps {
  healthData: ProcessedHealthData;
  fallRiskScore: number;
  setFallRiskScore: (score: number) => void;
}

interface RiskFactorProps {
  label: string;
  value: number;
  threshold: number;
  unit?: string;
  description: string;
}

function RiskFactor({
  label,
  value,
  threshold,
  unit,
  description,
}: RiskFactorProps) {
  const isRisk = value < threshold;
  const percentage = Math.max(0, Math.min(100, (value / threshold) * 100));

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm">
            {value}
            {unit}
          </span>
          {isRisk && <AlertTriangle className="text-accent h-4 w-4" />}
        </div>
      </div>
      <Progress
        value={percentage}
        className={`h-2 ${isRisk ? 'bg-red-100' : ''}`}
      />
      <p className="text-muted-foreground text-xs">{description}</p>
    </div>
  );
}

function FallRiskGauge({ score }: { score: number }) {
  const getRiskLevel = (score: number) => {
    if (score < 30)
      return {
        level: 'Low',
        color: getVitalSenseClasses.text.success,
        bgColor: getVitalSenseClasses.bg.success + ' bg-opacity-10',
      };
    if (score < 70)
      return {
        level: 'Moderate',
        color: getVitalSenseClasses.text.AlertTriangle,
        bgColor: getVitalSenseClasses.bg.AlertTriangle + ' bg-opacity-10',
      };
    return {
      level: 'High',
      color: getVitalSenseClasses.text.error,
      bgColor: getVitalSenseClasses.bg.error + ' bg-opacity-10',
    };
  };

  const risk = getRiskLevel(score);
  const strokeDasharray = 2 * Math.PI * 40;
  const strokeDashoffset = strokeDasharray - (score / 100) * strokeDasharray;

  return (
    <div className="flex flex-col items-center space-y-3">
      <div className="relative h-32 w-32">
        <svg
          className="h-full w-full -rotate-90 transform"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="rgb(226 232 240)"
            strokeWidth="8"
          />
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke={
              score < 30
                ? 'rgb(34 197 94)'
                : score < 70
                  ? 'rgb(234 179 8)'
                  : 'rgb(239 68 68)'
            }
            strokeWidth="8"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            className={risk.color}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
          <span className="text-muted-foreground text-xs">Risk Score</span>
        </div>
      </div>
      <Badge
        variant={
          score > 70 ? 'destructive' : score > 30 ? 'secondary' : 'default'
        }
        className="text-sm"
      >
        {risk.level} Risk
      </Badge>
    </div>
  );
}

export default function FallRiskMonitor({
  healthData,
  fallRiskScore,
  setFallRiskScore,
}: FallRiskMonitorProps) {
  useEffect(() => {
    if (healthData && healthData.metrics) {
      // Calculate fall risk based on multiple factors
      const walkingSteadiness =
        healthData.metrics.walkingSteadiness?.average || 100;
      const activityLevel = healthData.metrics.steps?.average || 10000;
      const heartRateVariability = 100; // Mock value

      // Risk calculation algorithm
      let risk = 0;

      // Walking steadiness (40% of risk)
      if (walkingSteadiness < 50) risk += 40;
      else if (walkingSteadiness < 70) risk += 20;

      // Activity level (30% of risk)
      if (activityLevel < 3000) risk += 30;
      else if (activityLevel < 5000) risk += 15;

      // Heart rate variability (20% of risk)
      if (heartRateVariability < 70) risk += 20;
      else if (heartRateVariability < 85) risk += 10;

      // Age factor (10% of risk) - mock
      risk += 10;

      setFallRiskScore(Math.min(100, risk));
    }
  }, [healthData, setFallRiskScore]);

  if (!healthData || !healthData.metrics) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Shield className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
          <p className="text-muted-foreground">
            Import health data to assess fall risk
          </p>
        </CardContent>
      </Card>
    );
  }

  const { metrics } = healthData;
  const isHighRisk = fallRiskScore > 70;

  return (
    <div className="space-y-6">
      {/* VitalSense Branded Header */}
      <VitalSenseBrandHeader
        title="Fall Risk Monitor"
        subtitle="Advanced fall risk assessment and prevention insights"
        icon={<Shield className="h-6 w-6" />}
        variant={
          isHighRisk
            ? 'error'
            : fallRiskScore > 50
              ? 'AlertTriangle'
              : 'success'
        }
      >
        <VitalSenseStatusCard
          type="fallRisk"
          status={
            fallRiskScore > 70
              ? 'high'
              : fallRiskScore > 50
                ? 'moderate'
                : 'low'
          }
          title="Risk Level"
          value={`${fallRiskScore}%`}
          subtitle="Based on current metrics"
          className="w-64"
        />
      </VitalSenseBrandHeader>

      {isHighRisk && (
        <Alert
          className={`border-l-4 ${getVitalSenseClasses.border.error} ${getVitalSenseClasses.bg.error} bg-opacity-10`}
        >
          <AlertTriangle
            className={`${getVitalSenseClasses.text.error} h-4 w-4`}
          />
          <AlertDescription className={getVitalSenseClasses.text.error}>
            <strong>High fall risk detected.</strong> Consider consulting with
            your healthcare provider and review the recommendations below.
          </AlertDescription>
        </Alert>
      )}

      {/* Assessment Method Tabs */}
      <Tabs defaultValue="traditional" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="traditional" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Traditional Assessment
          </TabsTrigger>
          <TabsTrigger value="ml" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            AI-Powered Analysis
          </TabsTrigger>
        </TabsList>

        {/* Traditional Assessment */}
        <TabsContent value="traditional" className="space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Risk Score Display */}
            <Card className="lg:col-span-1">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Shield className="h-5 w-5" />
                  Fall Risk Assessment
                </CardTitle>
                <CardDescription>
                  Based on your recent health metrics
                </CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center">
                <FallRiskGauge score={fallRiskScore} />
              </CardContent>
            </Card>

            {/* Risk Factors */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Risk Factors Analysis</CardTitle>
                <CardDescription>
                  Key metrics that influence your fall risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RiskFactor
                  label="Walking Steadiness"
                  value={Math.round(metrics.walkingSteadiness?.average || 0)}
                  threshold={70}
                  unit="%"
                  description="Measures balance and gait stability during walking"
                />
                <RiskFactor
                  label="Daily Activity"
                  value={metrics.steps?.average || 0}
                  threshold={5000}
                  unit=" steps"
                  description="Higher activity levels are associated with better balance"
                />
                <RiskFactor
                  label="Heart Rate Variability"
                  value={85}
                  threshold={70}
                  unit="%"
                  description="Indicator of cardiovascular fitness and autonomic function"
                />
                <RiskFactor
                  label="Sleep Quality"
                  value={Math.round(
                    ((metrics.sleepHours?.average || 0) / 8) * 100
                  )}
                  threshold={70}
                  unit="%"
                  description="Adequate sleep is crucial for balance and coordination"
                />
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Recommendations to Reduce Fall Risk
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-medium">
                    <Activity className="h-4 w-4" />
                    Physical Activity
                  </h4>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Practice balance exercises (tai chi, yoga)</li>
                    <li>• Strength training 2-3 times per week</li>
                    <li>• Regular walking or low-impact aerobic exercise</li>
                    <li>• Flexibility and stretching routines</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 font-medium">
                    <Heart className="h-4 w-4" />
                    Health Management
                  </h4>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Regular vision and hearing checkups</li>
                    <li>• Medication review with healthcare provider</li>
                    <li>• Blood pressure monitoring</li>
                    <li>• Maintain healthy weight</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Home Safety</h4>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Remove tripping hazards</li>
                    <li>• Install grab bars in bathroom</li>
                    <li>• Ensure adequate lighting</li>
                    <li>• Use non-slip mats</li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium">Sleep & Recovery</h4>
                  <ul className="text-muted-foreground space-y-2 text-sm">
                    <li>• Maintain consistent sleep schedule</li>
                    <li>• Aim for 7-9 hours of sleep nightly</li>
                    <li>• Address sleep disorders</li>
                    <li>• Limit alcohol and caffeine</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Emergency Action */}
          <Card className="border-accent">
            <CardHeader>
              <CardTitle className="text-accent flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Emergency Action Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  If you experience a fall or feel at immediate risk:
                </p>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Phone className="mr-2 h-4 w-4" />
                    Call Emergency Contacts
                  </Button>
                  <Button
                    variant="outline"
                    className="border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    Report Fall Incident
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ML Predictions Tab */}
        <TabsContent value="ml" className="space-y-6">
          <MLPredictionsDashboard healthData={healthData} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
