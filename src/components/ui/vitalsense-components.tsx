import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getVitalSenseClasses, HealthColorMap } from '@/lib/vitalsense-colors';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Heart,
  Shield,
} from 'lucide-react';

interface VitalSenseStatusCardProps {
  type: 'health' | 'emergency' | 'activity' | 'fallRisk' | 'system';
  status:
    | 'excellent'
    | 'good'
    | 'fair'
    | 'poor'
    | 'normal'
    | 'alert'
    | 'critical'
    | 'low'
    | 'moderate'
    | 'high';
  title: string;
  value?: string | number;
  subtitle?: string;
  className?: string;
}

const getStatusIcon = (
  type: VitalSenseStatusCardProps['type'],
  status: VitalSenseStatusCardProps['status']
) => {
  const iconProps = { className: 'h-5 w-5' };

  if (type === 'emergency' && status === 'critical') {
    return (
      <AlertTriangle
        {...iconProps}
        className={`${iconProps.className} ${getVitalSenseClasses.text.error}`}
      />
    );
  }

  if (type === 'health' && (status === 'excellent' || status === 'good')) {
    return (
      <Heart
        {...iconProps}
        className={`${iconProps.className} ${getVitalSenseClasses.text.success}`}
      />
    );
  }

  if (type === 'activity') {
    return (
      <Activity
        {...iconProps}
        className={`${iconProps.className} ${getVitalSenseClasses.text.teal}`}
      />
    );
  }

  if (type === 'fallRisk' && status === 'low') {
    return (
      <CheckCircle
        {...iconProps}
        className={`${iconProps.className} ${getVitalSenseClasses.text.success}`}
      />
    );
  }

  if (type === 'system') {
    return (
      <Shield
        {...iconProps}
        className={`${iconProps.className} ${getVitalSenseClasses.text.primary}`}
      />
    );
  }

  return (
    <CheckCircle
      {...iconProps}
      className={`${iconProps.className} ${getVitalSenseClasses.text.primary}`}
    />
  );
};

const getStatusColor = (
  type: VitalSenseStatusCardProps['type'],
  status: VitalSenseStatusCardProps['status']
) => {
  switch (type) {
    case 'health':
    case 'system':
      return (
        HealthColorMap.dataQuality[
          status as keyof typeof HealthColorMap.dataQuality
        ] || getVitalSenseClasses.text.primary
      );

    case 'emergency':
      return (
        HealthColorMap.emergency[
          status as keyof typeof HealthColorMap.emergency
        ] || getVitalSenseClasses.text.error
      );

    case 'activity':
      return (
        HealthColorMap.activity[
          status as keyof typeof HealthColorMap.activity
        ] || getVitalSenseClasses.text.teal
      );

    case 'fallRisk':
      return (
        HealthColorMap.fallRisk[
          status as keyof typeof HealthColorMap.fallRisk
        ] || getVitalSenseClasses.text.AlertTriangle
      );

    default:
      return getVitalSenseClasses.text.primary;
  }
};

export function VitalSenseStatusCard({
  type,
  status,
  title,
  value,
  subtitle,
  className = '',
}: VitalSenseStatusCardProps) {
  const statusColorClass = getStatusColor(type, status);
  const icon = getStatusIcon(type, status);

  return (
    <Card
      className={`border-l-4 transition-all duration-200 hover:shadow-md ${className}`}
      style={{ borderLeftColor: 'var(--color-vitalsense-primary)' }}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-vitalsense-text-primary text-sm font-medium">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline space-x-2">
          {value && (
            <div
              className={`text-2xl font-bold ${getVitalSenseClasses.text.primary}`}
            >
              {value}
            </div>
          )}
          <Badge
            variant="secondary"
            className={`text-xs capitalize ${statusColorClass} bg-opacity-10`}
          >
            {status}
          </Badge>
        </div>
        {subtitle && (
          <p className="text-vitalsense-text-muted mt-1 text-xs">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * VitalSense Brand Header Component
 * Provides consistent branding across different sections of the app
 */
interface VitalSenseBrandHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'primary' | 'teal' | 'success' | 'AlertTriangle' | 'error';
}

export function VitalSenseBrandHeader({
  title,
  subtitle,
  icon,
  children,
  variant = 'primary',
}: VitalSenseBrandHeaderProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case 'teal':
        return {
          bg: getVitalSenseClasses.bg.teal,
          text: getVitalSenseClasses.text.tealContrast,
          accent: getVitalSenseClasses.text.teal,
        };
      case 'success':
        return {
          bg: getVitalSenseClasses.bg.success,
          text: getVitalSenseClasses.text.successContrast,
          accent: getVitalSenseClasses.text.success,
        };
      case 'AlertTriangle':
        return {
          bg: getVitalSenseClasses.bg.AlertTriangle,
          text: getVitalSenseClasses.text.warningContrast,
          accent: getVitalSenseClasses.text.AlertTriangle,
        };
      case 'error':
        return {
          bg: getVitalSenseClasses.bg.error,
          text: getVitalSenseClasses.text.errorContrast,
          accent: getVitalSenseClasses.text.error,
        };
      default:
        return {
          bg: getVitalSenseClasses.bg.primary,
          text: getVitalSenseClasses.text.primaryContrast,
          accent: getVitalSenseClasses.text.primary,
        };
    }
  };

  const classes = getVariantClasses();

  return (
    <div className={`${classes.bg} mb-6 rounded-lg p-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {icon && <div className={`${classes.text} opacity-90`}>{icon}</div>}
          <div>
            <h1 className={`text-2xl font-bold ${classes.text}`}>{title}</h1>
            {subtitle && (
              <p className={`${classes.text} mt-1 opacity-80`}>{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center space-x-2">{children}</div>
        )}
      </div>
    </div>
  );
}
