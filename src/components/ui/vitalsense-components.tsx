import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HIGIcon,
  IOSHIGIcons,
  SemanticIcons,
} from '@/components/ui/ios-hig-icons';
import { getiOS26TypographyClass } from '@/lib/ios26-dynamic-type';
import { getVitalSenseClasses, HealthColorMap } from '@/lib/vitalsense-colors';

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
  // iOS 26 enhancements
  supportsDynamicType?: boolean;
  accessibilityLevel?: 'standard' | 'enhanced';
}

const getStatusIcon = (
  type: VitalSenseStatusCardProps['type'],
  status: VitalSenseStatusCardProps['status']
) => {
  // Use iOS HIG-compliant icons with proper accessibility
  if (type === 'emergency' && status === 'critical') {
    return (
      <HIGIcon
        icon={IOSHIGIcons.status.warning}
        size="medium"
        className={`${getVitalSenseClasses.text.error} animate-pulse`}
        aria-label={`Critical ${type} status`}
      />
    );
  }

  if (type === 'health' && (status === 'excellent' || status === 'good')) {
    return (
      <SemanticIcons.HealthScore
        size="medium"
        className={getVitalSenseClasses.text.success}
      />
    );
  }

  if (type === 'activity') {
    return (
      <SemanticIcons.Activity
        size="medium"
        className={getVitalSenseClasses.text.teal}
      />
    );
  }

  if (type === 'fallRisk' && status === 'low') {
    return (
      <SemanticIcons.FallRisk
        size="medium"
        className={getVitalSenseClasses.text.success}
      />
    );
  }

  if (type === 'system') {
    return (
      <HIGIcon
        icon={IOSHIGIcons.status.shield}
        size="medium"
        className={getVitalSenseClasses.text.primary}
        aria-label="System status"
      />
    );
  }

  // Default fallback with proper semantics
  return (
    <HIGIcon
      icon={IOSHIGIcons.status.success}
      size="medium"
      className={getVitalSenseClasses.text.primary}
      aria-label={`${type} status: ${status}`}
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
        ] || getVitalSenseClasses.text.warning
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
  className,
  supportsDynamicType = true,
  accessibilityLevel = 'enhanced',
}: Readonly<VitalSenseStatusCardProps>) {
  const icon = getStatusIcon(type, status);
  const colorClasses = getStatusColor(type, status);

  // iOS 26 Dynamic Type classes
  const titleClass = supportsDynamicType
    ? getiOS26TypographyClass('headline')
    : 'text-lg font-semibold';
  const valueClass = supportsDynamicType
    ? getiOS26TypographyClass('large-title')
    : 'text-2xl font-bold';
  const subtitleClass = supportsDynamicType
    ? getiOS26TypographyClass('footnote')
    : 'text-sm';

  // iOS 26 Enhanced Accessibility
  const ariaLabel = `${title}: ${value || status}`;
  const fullAriaLabel = subtitle ? `${ariaLabel}. ${subtitle}` : ariaLabel;

  const ariaLive: 'assertive' | 'polite' =
    type === 'emergency' || type === 'health' ? 'assertive' : 'polite';
  const accessibilityProps =
    accessibilityLevel === 'enhanced'
      ? {
          role: 'status' as const,
          'aria-live': ariaLive,
          'aria-label': fullAriaLabel,
        }
      : {};

  return (
    <Card
      className={`${getVitalSenseClasses.bg.primary} ${className || ''} ios-26-card`}
      {...accessibilityProps}
    >
      <CardHeader className="ios-26-surface-secondary pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className={`${titleClass} text-ios-label-primary`}>
            {title}
          </CardTitle>
          <div className="ios-26-icon-adaptive" aria-hidden="true">
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent className="ios-26-surface-primary pt-0">
        {value && (
          <div
            className={`${valueClass} ${colorClasses} ios-26-color-adaptive mb-1`}
          >
            {value}
          </div>
        )}
        {subtitle && (
          <p
            className={`${subtitleClass} text-ios-label-secondary ios-26-text-secondary`}
          >
            {subtitle}
          </p>
        )}
        <Badge
          variant="secondary"
          className={`mt-2 ${colorClasses} ios-26-badge ${accessibilityLevel === 'enhanced' ? 'ios-26-enhanced-contrast' : ''}`}
        >
          {status}
        </Badge>
      </CardContent>
    </Card>
  );
}

/**
 * VitalSense Brand Header Component
 * Provides consistent branding across different sections of the app
 * Enhanced with iOS 26 HIG compliance and Dynamic Type
 */
interface VitalSenseBrandHeaderProps {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
  variant?: 'primary' | 'teal' | 'success' | 'warning' | 'error';
  supportsDynamicType?: boolean;
  accessibilityLevel?: 'standard' | 'enhanced';
}

export function VitalSenseBrandHeader({
  title,
  subtitle,
  icon,
  children,
  variant = 'primary',
  supportsDynamicType = true,
  accessibilityLevel = 'enhanced',
}: Readonly<VitalSenseBrandHeaderProps>) {
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
      case 'warning':
        return {
          bg: getVitalSenseClasses.bg.warning,
          text: getVitalSenseClasses.text.warningContrast,
          accent: getVitalSenseClasses.text.warning,
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
  const headerId = `header-${title.replace(/\s+/g, '-').toLowerCase()}`;

  // iOS 26 Dynamic Type classes
  const titleClass = supportsDynamicType
    ? getiOS26TypographyClass('title-1')
    : 'text-2xl font-bold';
  const subtitleClass = supportsDynamicType
    ? getiOS26TypographyClass('subheadline')
    : 'text-sm';

  // iOS 26 Enhanced Accessibility
  const headerProps =
    accessibilityLevel === 'enhanced'
      ? {
          role: 'banner' as const,
        }
      : {};

  const toolbarAttributes =
    accessibilityLevel === 'enhanced'
      ? {
          role: 'toolbar' as const,
          'aria-label': 'Header actions',
        }
      : {};

  return (
    <header
      className={`${classes.bg} ios-26-surface-elevated ios-26-enhanced-contrast mb-6 rounded-lg p-6 focus-within:ring-2 focus-within:ring-current focus-within:ring-opacity-50`}
      aria-labelledby={headerId}
      {...headerProps}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          {icon && (
            <div
              className={`${classes.text} ios-26-icon-adaptive opacity-90`}
              aria-hidden="true"
            >
              {icon}
            </div>
          )}
          <div>
            <h1
              id={headerId}
              className={`${titleClass} ${classes.text} ios-26-text-primary leading-tight`}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className={`${subtitleClass} ${classes.text} ios-26-text-secondary mt-1 leading-relaxed opacity-80`}
                aria-describedby={headerId}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>
        {children && (
          <div className="flex items-center space-x-2" {...toolbarAttributes}>
            {children}
          </div>
        )}
      </div>
    </header>
  );
}
