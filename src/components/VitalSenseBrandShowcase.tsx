import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  VitalSenseBrandHeader,
  VitalSenseStatusCard,
} from '@/components/ui/vitalsense-components';
import {
  getVitalSenseClasses,
  VitalSenseColors,
} from '@/lib/vitalsense-colors';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Heart,
  Palette,
  Shield,
  Sparkles,
} from 'lucide-react';

export default function VitalSenseBrandShowcase() {
  return (
    <div className="space-y-6">
      <VitalSenseBrandHeader
        title="VitalSense Brand Colors"
        subtitle="Complete color palette and component showcase"
        icon={<Palette className="h-8 w-8" />}
        variant="primary"
      >
        <Badge
          variant="outline"
          className="border-vitalsense-primary-contrast text-vitalsense-primary-contrast"
        >
          v2.0
        </Badge>
      </VitalSenseBrandHeader>

      {/* Brand Colors Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className={getVitalSenseClasses.text.primary}>
              Primary Blue
            </CardTitle>
            <CardDescription>
              Main brand color for primary actions
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`h-12 rounded-lg ${getVitalSenseClasses.bg.primary} flex items-center justify-center`}
            >
              <span className={getVitalSenseClasses.text.primaryContrast}>
                {VitalSenseColors.primary.main}
              </span>
            </div>
            <div className="flex space-x-2">
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.primaryLight}`}
                title="Light"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.primary}`}
                title="Main"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.primaryDark}`}
                title="Dark"
              />
            </div>
            <Button
              className={`${getVitalSenseClasses.bg.primary} ${getVitalSenseClasses.text.primaryContrast} ${getVitalSenseClasses.hover.bgPrimary}`}
            >
              Primary Button
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={getVitalSenseClasses.text.teal}>
              Accent Teal
            </CardTitle>
            <CardDescription>Secondary accent for highlights</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`h-12 rounded-lg ${getVitalSenseClasses.bg.teal} flex items-center justify-center`}
            >
              <span className={getVitalSenseClasses.text.tealContrast}>
                {VitalSenseColors.teal.main}
              </span>
            </div>
            <div className="flex space-x-2">
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.tealLight}`}
                title="Light"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.teal}`}
                title="Main"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.tealDark}`}
                title="Dark"
              />
            </div>
            <Button
              className={`${getVitalSenseClasses.bg.teal} ${getVitalSenseClasses.text.tealContrast} ${getVitalSenseClasses.hover.bgTeal}`}
            >
              Teal Button
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={getVitalSenseClasses.text.success}>
              Success Green
            </CardTitle>
            <CardDescription>Positive health indicators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`h-12 rounded-lg ${getVitalSenseClasses.bg.success} flex items-center justify-center`}
            >
              <span className={getVitalSenseClasses.text.successContrast}>
                {VitalSenseColors.success.main}
              </span>
            </div>
            <div className="flex space-x-2">
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.successLight}`}
                title="Light"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.success}`}
                title="Main"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.successDark}`}
                title="Dark"
              />
            </div>
            <Button
              className={`${getVitalSenseClasses.bg.success} ${getVitalSenseClasses.text.successContrast} ${getVitalSenseClasses.hover.bgSuccess}`}
            >
              Success Button
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={getVitalSenseClasses.text.AlertTriangle}>
              AlertTriangle Amber
            </CardTitle>
            <CardDescription>Caution and attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`h-12 rounded-lg ${getVitalSenseClasses.bg.AlertTriangle} flex items-center justify-center`}
            >
              <span className={getVitalSenseClasses.text.warningContrast}>
                {VitalSenseColors.AlertTriangle.main}
              </span>
            </div>
            <div className="flex space-x-2">
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.warningLight}`}
                title="Light"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.AlertTriangle}`}
                title="Main"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.warningDark}`}
                title="Dark"
              />
            </div>
            <Button
              className={`${getVitalSenseClasses.bg.AlertTriangle} ${getVitalSenseClasses.text.warningContrast} ${getVitalSenseClasses.hover.bgWarning}`}
            >
              AlertTriangle Button
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={getVitalSenseClasses.text.error}>
              Error Red
            </CardTitle>
            <CardDescription>Alerts and critical states</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div
              className={`h-12 rounded-lg ${getVitalSenseClasses.bg.error} flex items-center justify-center`}
            >
              <span className={getVitalSenseClasses.text.errorContrast}>
                {VitalSenseColors.error.main}
              </span>
            </div>
            <div className="flex space-x-2">
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.errorLight}`}
                title="Light"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.error}`}
                title="Main"
              />
              <div
                className={`h-8 w-8 rounded ${getVitalSenseClasses.bg.errorDark}`}
                title="Dark"
              />
            </div>
            <Button
              className={`${getVitalSenseClasses.bg.error} ${getVitalSenseClasses.text.errorContrast} ${getVitalSenseClasses.hover.bgError}`}
            >
              Error Button
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className={getVitalSenseClasses.text.primaryText}>
              Typography
            </CardTitle>
            <CardDescription>Brand text colors</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <p className={getVitalSenseClasses.text.primaryText}>
                Primary Text ({VitalSenseColors.text.primary})
              </p>
              <p className={getVitalSenseClasses.text.mutedText}>
                Muted Text ({VitalSenseColors.text.muted})
              </p>
            </div>
            <div className="flex space-x-2">
              <Badge
                variant="outline"
                className={`${getVitalSenseClasses.border.primary} ${getVitalSenseClasses.text.primary}`}
              >
                Primary Badge
              </Badge>
              <Badge
                variant="outline"
                className={`${getVitalSenseClasses.border.teal} ${getVitalSenseClasses.text.teal}`}
              >
                Teal Badge
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Card Examples */}
      <div className="space-y-4">
        <h2
          className={`text-xl font-semibold ${getVitalSenseClasses.text.primary}`}
        >
          VitalSense Status Components
        </h2>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <VitalSenseStatusCard
            type="health"
            status="excellent"
            title="Health Score"
            value="98"
            subtitle="All systems normal"
          />

          <VitalSenseStatusCard
            type="activity"
            status="moderate"
            title="Activity Level"
            value="7,234"
            subtitle="Steps today"
          />

          <VitalSenseStatusCard
            type="fallRisk"
            status="low"
            title="Fall Risk"
            value="Low"
            subtitle="Stable patterns"
          />

          <VitalSenseStatusCard
            type="emergency"
            status="normal"
            title="Emergency Status"
            value="Normal"
            subtitle="No alerts"
          />
        </div>
      </div>

      {/* Different Header Variants */}
      <div className="space-y-4">
        <h2
          className={`text-xl font-semibold ${getVitalSenseClasses.text.primary}`}
        >
          Brand Header Variants
        </h2>

        <VitalSenseBrandHeader
          title="Health Monitoring"
          subtitle="Real-time health analytics"
          icon={<Heart className="h-6 w-6" />}
          variant="success"
        >
          <CheckCircle className="h-5 w-5" />
        </VitalSenseBrandHeader>

        <VitalSenseBrandHeader
          title="Fall Risk Alert"
          subtitle="Elevated risk detected"
          icon={<AlertTriangle className="h-6 w-6" />}
          variant="AlertTriangle"
        >
          <Badge variant="destructive">Alert</Badge>
        </VitalSenseBrandHeader>

        <VitalSenseBrandHeader
          title="System Status"
          subtitle="All systems operational"
          icon={<Shield className="h-6 w-6" />}
          variant="teal"
        >
          <Activity className="h-5 w-5" />
        </VitalSenseBrandHeader>
      </div>

      {/* Usage Guidelines */}
      <Card>
        <CardHeader>
          <CardTitle className={getVitalSenseClasses.text.primary}>
            <Sparkles className="mr-2 inline h-5 w-5" />
            Usage Guidelines
          </CardTitle>
          <CardDescription>
            How to implement VitalSense brand colors effectively
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <h4
                className={`font-semibold ${getVitalSenseClasses.text.primary} mb-2`}
              >
                Do's
              </h4>
              <ul
                className={`space-y-1 text-sm ${getVitalSenseClasses.text.mutedText}`}
              >
                <li>• Use Primary Blue for main actions and navigation</li>
                <li>• Use Teal for secondary highlights and accents</li>
                <li>• Use Success Green for positive health indicators</li>
                <li>• Use AlertTriangle Amber for cautionary messages</li>
                <li>• Use Error Red for critical alerts only</li>
              </ul>
            </div>
            <div>
              <h4
                className={`font-semibold ${getVitalSenseClasses.text.primary} mb-2`}
              >
                Don'ts
              </h4>
              <ul
                className={`space-y-1 text-sm ${getVitalSenseClasses.text.mutedText}`}
              >
                <li>• Don't use Error Red for general emphasis</li>
                <li>• Don't mix too many brand colors in one component</li>
                <li>• Don't use brand colors as background for large areas</li>
                <li>• Don't reduce contrast below WCAG AA standards</li>
                <li>• Don't modify brand color values</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
