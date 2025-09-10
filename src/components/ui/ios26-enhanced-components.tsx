/**
 * iOS 26 Enhanced VitalSense Components (Priority 2)
 *
 * Enhanced versions of existing VitalSense components with Priority 2 improvements:
 * - Advanced accessibility patterns
 * - Enhanced button interactions
 * - Modern navigation patterns
 */

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  HIGIcon,
  IOSHIGIcons,
  SemanticIcons,
} from '@/components/ui/ios-hig-icons';
import {
  iOS26ContrastSupport,
  iOS26FocusManager,
  iOS26MotionAccessibility,
  useAccessibilityEnhanced,
} from '@/lib/ios26-accessibility-enhanced';
import { getiOS26TypographyClass } from '@/lib/ios26-dynamic-type';
import { getVitalSenseClasses } from '@/lib/vitalsense-colors';
import { Search } from 'lucide-react';
import { useState } from 'react';

/**
 * Enhanced VitalSense Status Card with Priority 2 improvements
 */
export interface EnhancedStatusCardProps {
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

  // Priority 2 Enhancements
  interactive?: boolean;
  onCardClick?: () => void;
  onActionClick?: () => void;
  actionLabel?: string;
  showTrend?: boolean;
  trendDirection?: 'up' | 'down' | 'stable';
  trendValue?: string;

  // Advanced Accessibility
  accessibilityLevel?: 'standard' | 'enhanced' | 'maximum';
  announceChanges?: boolean;
  keyboardNavigable?: boolean;

  // Enhanced Visual States
  loading?: boolean;
  expanded?: boolean;
  badge?: number;
}

export function EnhancedVitalSenseStatusCard({
  type,
  status,
  title,
  value,
  subtitle,
  className,
  interactive = false,
  onCardClick,
  onActionClick,
  actionLabel = 'View Details',
  showTrend = false,
  trendDirection = 'stable',
  trendValue,
  accessibilityLevel = 'enhanced',
  announceChanges = true,
  keyboardNavigable = true,
  loading = false,
  expanded = false,
  badge,
}: Readonly<EnhancedStatusCardProps>) {
  const [isFocused, setIsFocused] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  // Enhanced accessibility props
  const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
    role: 'status',
    keyboardNav: keyboardNavigable ? 'enhanced' : 'none',
    announceChanges,
    criticalContent: type === 'emergency' || status === 'critical',
  });

  // Enhanced contrast support
  const contrastClasses = iOS26ContrastSupport.getContrastClasses(
    'ios-26-card-enhanced'
  );

  // Motion-safe animations
  const animationClasses = iOS26MotionAccessibility.getAnimationClasses(
    'transform transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]',
    'transition-opacity duration-200 hover:opacity-90'
  );

  // Get status icon and colors
  const getStatusIcon = (cardType: typeof type, cardStatus: typeof status) => {
    if (cardType === 'emergency' && cardStatus === 'critical') {
      return (
        <HIGIcon
          icon={IOSHIGIcons.status.warning}
          className="ios-26-icon-critical animate-pulse text-vitalsense-error"
        />
      );
    }
    if (
      cardType === 'health' &&
      (cardStatus === 'excellent' || cardStatus === 'good')
    ) {
      return (
        <SemanticIcons.HealthScore className="ios-26-icon-adaptive text-vitalsense-success" />
      );
    }
    return (
      <HIGIcon
        icon={IOSHIGIcons.status.success}
        className="ios-26-icon-adaptive text-vitalsense-primary"
      />
    );
  };

  const getStatusColor = (cardStatus: typeof status) => {
    const colorMap = {
      excellent: 'text-vitalsense-success',
      good: 'text-vitalsense-success',
      fair: 'text-vitalsense-warning',
      poor: 'text-vitalsense-error',
      normal: 'text-vitalsense-primary',
      alert: 'text-vitalsense-warning',
      critical: 'text-vitalsense-error animate-pulse',
      low: 'text-vitalsense-teal',
      moderate: 'text-vitalsense-warning',
      high: 'text-vitalsense-error',
    };
    return colorMap[cardStatus] || 'text-vitalsense-primary';
  };

  // Trend icon
  const getTrendIcon = () => {
    if (!showTrend) return null;

    const trendIcons = {
      up: IOSHIGIcons.status.success,
      down: IOSHIGIcons.status.warning,
      stable: IOSHIGIcons.status.info,
    };

    const trendColors = {
      up: 'text-vitalsense-success',
      down: 'text-vitalsense-error',
      stable: 'text-vitalsense-teal',
    };

    return (
      <div className="mt-2 flex items-center space-x-1">
        <HIGIcon
          icon={trendIcons[trendDirection]}
          className={`h-4 w-4 ${trendColors[trendDirection]} ios-26-icon-adaptive`}
        />
        {trendValue && (
          <span
            className={`${getiOS26TypographyClass('caption')} ${trendColors[trendDirection]}`}
          >
            {trendValue}
          </span>
        )}
      </div>
    );
  };

  // Enhanced interaction handlers
  const handleCardInteraction = () => {
    if (interactive && onCardClick) {
      onCardClick();

      if (announceChanges) {
        iOS26FocusManager.announceToScreenReader(
          `${title} card activated`,
          'polite'
        );
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (interactive && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      handleCardInteraction();
    }
  };

  return (
    <Card
      className={`
        ${getVitalSenseClasses.bg.primary}
        ${contrastClasses}
        ${animationClasses}
        ${interactive ? 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-vitalsense-primary' : ''}
        ${isFocused && interactive ? 'ring-2 ring-vitalsense-primary' : ''}
        ${isPressed && interactive ? 'scale-[0.98]' : ''}
        ${className || ''}
        ios-26-card-enhanced
        relative
      `}
      onClick={interactive ? handleCardInteraction : undefined}
      onKeyDown={interactive ? handleKeyDown : undefined}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      aria-expanded={interactive ? expanded : undefined}
      aria-describedby={`card-${title.replace(/\s+/g, '-').toLowerCase()}-description`}
      {...accessibilityProps}
    >
      {/* Badge */}
      {badge && badge > 0 && (
        <div className="absolute -right-2 -top-2 z-10">
          <span className="ios-26-badge inline-flex h-6 w-6 items-center justify-center rounded-full bg-vitalsense-error text-xs font-bold text-white">
            {badge > 99 ? '99+' : badge}
          </span>
        </div>
      )}

      {/* Loading overlay */}
      {loading && (
        <div className="bg-ios-system-background absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-opacity-75">
          <div className="ios-26-spinner h-6 w-6 animate-spin rounded-full border-2 border-vitalsense-primary border-t-transparent" />
        </div>
      )}

      <CardHeader className="ios-26-surface-secondary pb-2">
        <div className="flex items-center justify-between">
          <CardTitle
            className={`${getiOS26TypographyClass('headline')} text-ios-label-primary ios-26-text-primary`}
          >
            {title}
          </CardTitle>
          <div className="ios-26-icon-container">
            {getStatusIcon(type, status)}
          </div>
        </div>
      </CardHeader>

      <CardContent className="ios-26-surface-primary pt-0">
        {value && (
          <div
            className={`${getiOS26TypographyClass('large-title')} ${getStatusColor(status)} ios-26-color-adaptive mb-1 font-semibold`}
          >
            {value}
          </div>
        )}

        {subtitle && (
          <p
            className={`${getiOS26TypographyClass('footnote')} text-ios-label-secondary ios-26-text-secondary mb-2`}
            id={`card-${title.replace(/\s+/g, '-').toLowerCase()}-description`}
          >
            {subtitle}
          </p>
        )}

        <div className="flex items-center justify-between">
          <Badge
            variant="secondary"
            className={`${getStatusColor(status)} ios-26-badge ios-26-enhanced-contrast`}
          >
            {status}
          </Badge>

          {getTrendIcon()}
        </div>

        {/* Action button for interactive cards */}
        {interactive && onActionClick && (
          <div className="border-ios-separator mt-4 border-t pt-3">
            <Button
              onClick={(e: React.MouseEvent) => {
                e.stopPropagation();
                onActionClick();
              }}
              variant="ghost"
              size="sm"
              className="ios-26-button-secondary w-full text-vitalsense-primary hover:bg-vitalsense-primary hover:bg-opacity-10"
            >
              {actionLabel}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Enhanced VitalSense Navigation Header with Priority 2 improvements
 */
export interface EnhancedNavigationProps {
  title: string;
  subtitle?: string;
  backAction?: () => void;
  showSearch?: boolean;
  onSearchChange?: (query: string) => void;
  actions?: Array<{
    icon: keyof typeof IOSHIGIcons.system;
    label: string;
    onClick: () => void;
    badge?: number;
  }>;
  accessibilityLevel?: 'standard' | 'enhanced' | 'maximum';
}

export function EnhancedVitalSenseNavigation({
  title,
  subtitle,
  backAction,
  showSearch = false,
  onSearchChange,
  actions = [],
  accessibilityLevel = 'enhanced',
}: Readonly<EnhancedNavigationProps>) {
  const [searchQuery, setSearchQuery] = useState('');

  const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
    role: 'navigation',
    keyboardNav: 'enhanced',
    announceChanges: true,
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange?.(query);
  };

  return (
    <nav
      className="ios-26-navigation bg-ios-system-background border-ios-separator ios-26-surface-elevated border-b"
      {...accessibilityProps}
    >
      <div className="flex items-center justify-between p-4">
        {/* Back button */}
        {backAction && (
          <Button
            onClick={backAction}
            variant="ghost"
            size="sm"
            className="ios-26-button-back text-vitalsense-primary"
          >
            <HIGIcon icon={IOSHIGIcons.navigation.back} className="mr-1" />
            Back
          </Button>
        )}

        {/* Title section */}
        <div className="mx-4 flex-1 text-center">
          <h1
            className={`${getiOS26TypographyClass('title-2')} text-ios-label-primary ios-26-text-primary font-semibold`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`${getiOS26TypographyClass('caption')} text-ios-label-secondary ios-26-text-secondary`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center space-x-2">
          {actions.map((action, index) => (
            <Button
              key={`${action.label}-${index}`}
              onClick={action.onClick}
              variant="ghost"
              size="sm"
              className="ios-26-button-action text-ios-label-primary relative"
              aria-label={action.label}
            >
              <HIGIcon
                icon={IOSHIGIcons.system[action.icon]}
                className="ios-26-icon-adaptive"
              />
              {action.badge && action.badge > 0 && (
                <span className="ios-26-badge absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-vitalsense-error text-xs font-bold text-white">
                  {action.badge > 9 ? '9+' : action.badge}
                </span>
              )}
            </Button>
          ))}
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder="Search..."
              className={`
                w-full py-2 pl-10 pr-4
                ${getiOS26TypographyClass('body')}
                bg-ios-tertiary-system-background
                text-ios-label-primary
                placeholder-ios-label-tertiary
                border-ios-separator ios-26-search-field
                rounded-lg
                border
                focus:outline-none
                focus:ring-2
                focus:ring-vitalsense-primary
              `}
            />
            <Search className="text-ios-label-secondary ios-26-icon-adaptive absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform" />
          </div>
        </div>
      )}
    </nav>
  );
}

/**
 * Enhanced Button Component with iOS 26 improvements
 */
export interface EnhancedButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  icon?: keyof typeof IOSHIGIcons.system;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
  accessibilityLevel?: 'standard' | 'enhanced';
}

export function EnhancedVitalSenseButton({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  onClick,
  className,
  accessibilityLevel = 'enhanced',
}: Readonly<EnhancedButtonProps>) {
  const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
    announceChanges: true,
  });

  const getVariantClasses = () => {
    const variants = {
      primary:
        'bg-vitalsense-primary text-white hover:bg-vitalsense-primary-dark ios-26-button-primary',
      secondary:
        'bg-ios-secondary-system-background text-ios-label-primary hover:bg-ios-tertiary-system-background border border-ios-separator ios-26-button-secondary',
      ghost:
        'text-vitalsense-primary hover:bg-vitalsense-primary hover:bg-opacity-10 ios-26-button-ghost',
      destructive:
        'bg-vitalsense-error text-white hover:bg-vitalsense-error-dark ios-26-button-destructive',
    };
    return variants[variant];
  };

  const getSizeClasses = () => {
    const sizes = {
      sm: 'px-3 py-1.5 text-sm min-h-[32px]',
      md: 'px-4 py-2 text-base min-h-[44px]',
      lg: 'px-6 py-3 text-lg min-h-[56px]',
    };
    return sizes[size];
  };

  // Get typography class based on size
  const getTypographyClass = () => {
    if (size === 'sm') return 'callout';
    if (size === 'lg') return 'title-3';
    return 'body';
  };

  const typographyClass = getiOS26TypographyClass(getTypographyClass());

  return (
    <Button
      className={`
        ${getVariantClasses()}
        ${getSizeClasses()}
        ${typographyClass}
        ios-26-button-enhanced flex items-center justify-center gap-2 rounded-lg
        font-medium transition-all duration-200
        ease-out focus:outline-none focus:ring-2
        focus:ring-vitalsense-primary disabled:cursor-not-allowed
        disabled:opacity-50
        ${iOS26MotionAccessibility.getAnimationClasses(
          'transform active:scale-95',
          'active:opacity-75'
        )}
        ${className || ''}
      `}
      onClick={onClick}
      disabled={disabled || loading}
      {...accessibilityProps}
    >
      {loading && (
        <div className="ios-26-spinner h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}

      {icon && iconPosition === 'left' && !loading && (
        <HIGIcon
          icon={IOSHIGIcons.system[icon]}
          className="ios-26-icon-adaptive flex-shrink-0"
        />
      )}

      <span>{loading ? 'Loading...' : children}</span>

      {icon && iconPosition === 'right' && !loading && (
        <HIGIcon
          icon={IOSHIGIcons.system[icon]}
          className="ios-26-icon-adaptive flex-shrink-0"
        />
      )}
    </Button>
  );
}
