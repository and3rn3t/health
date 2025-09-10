/**
 * iOS 26 HIG-Compliant Icon System (2025)
 *
 * This file provides a unified icon mapping that aligns with iOS 26 Human Interface Guidelines
 * while maintaining compatibility with the web application. Updated for 2025 SF Symbols.
 */

import {
  Activity,
  AlertTriangle,
  Bell,
  BellRing,
  Brain,
  Calendar,
  CheckCircle,
  ChevronRight,
  Clock,
  CloudUpload,
  Gauge,
  Heart,
  Home,
  Lightbulb,
  Menu,
  Monitor,
  Moon,
  Phone,
  Settings,
  Share,
  Shield,
  ShieldCheck,
  Smartphone,
  Sun,
  Target,
  Trophy,
  Upload,
  User,
  Users,
  Zap,
} from 'lucide-react';

/**
 * iOS 26 SF Symbols Mapping (2025)
 * Maps semantic meanings to iOS 26-appropriate icons with updated SF Symbol references
 */
export const IOSHIGIcons = {
  // Health & Medical (iOS 26 enhanced symbols)
  health: {
    heart: Heart, // SF Symbol: heart.pulse (iOS 26 enhanced)
    heartRate: Activity, // SF Symbol: waveform.path.ecg.rectangle (iOS 26 new)
    brain: Brain, // SF Symbol: brain.head.profile (iOS 26 enhanced)
    activity: Gauge, // SF Symbol: gauge.with.dots.needle.bottom.50percent (iOS 26 enhanced)
    pulse: Activity, // SF Symbol: waveform.path.ecg (iOS 26 stable)
    steps: Target, // SF Symbol: figure.walk.motion (iOS 26 new)
    sleep: Moon, // SF Symbol: bed.double.fill (iOS 26 enhanced)
    wellness: Trophy, // SF Symbol: leaf.fill (iOS 26 enhanced)
  },

  // Navigation & Interface (iOS 26 enhanced)
  navigation: {
    home: Home, // SF Symbol: house.fill (iOS 26 stable)
    menu: Menu, // SF Symbol: line.3.horizontal (iOS 26 stable)
    chevronRight: ChevronRight, // SF Symbol: chevron.right (iOS 26 stable)
    settings: Settings, // SF Symbol: gearshape.fill (iOS 26 enhanced)
    user: User, // SF Symbol: person.crop.circle.fill (iOS 26 enhanced)
    users: Users, // SF Symbol: person.2.fill (iOS 26 enhanced)
    back: ChevronRight, // SF Symbol: chevron.backward (iOS 26 stable)
  },

  // Status & Alerts (iOS 26 enhanced symbols)
  status: {
    success: CheckCircle, // SF Symbol: checkmark.circle.fill (iOS 26 enhanced)
    warning: AlertTriangle, // SF Symbol: exclamationmark.triangle.fill (iOS 26 enhanced)
    error: AlertTriangle, // SF Symbol: xmark.circle.fill (iOS 26 enhanced)
    info: Lightbulb, // SF Symbol: info.circle.fill (iOS 26 enhanced)
    alert: Bell, // SF Symbol: bell.fill (iOS 26 enhanced)
    alertActive: BellRing, // SF Symbol: bell.badge.fill (iOS 26 enhanced)
    shield: Shield, // SF Symbol: shield.fill (iOS 26 enhanced)
    shieldCheck: ShieldCheck, // SF Symbol: shield.checkered (iOS 26 stable)
  },

  // System & Actions
  system: {
    upload: Upload, // SF Symbol: arrow.up.to.line
    cloudUpload: CloudUpload, // SF Symbol: arrow.up.to.line.alt
    share: Share, // SF Symbol: square.and.arrow.up
    phone: Phone, // SF Symbol: phone
    smartphone: Smartphone, // SF Symbol: iphone
    monitor: Monitor, // SF Symbol: display
    calendar: Calendar, // SF Symbol: calendar
    clock: Clock, // SF Symbol: clock
    lightbulb: Lightbulb, // SF Symbol: lightbulb
    trophy: Trophy, // SF Symbol: trophy
    target: Target, // SF Symbol: target
    zap: Zap, // SF Symbol: bolt
  },

  // Theme
  theme: {
    sun: Sun, // SF Symbol: sun.max
    moon: Moon, // SF Symbol: moon
  },
} as const;

/**
 * Icon Size Constants (iOS HIG Compliant)
 */
export const IconSizes = {
  small: 16, // 16pt - inline with text
  medium: 24, // 24pt - buttons and controls
  large: 32, // 32pt - headers and primary actions
  hero: 48, // 48pt - prominent displays
} as const;

/**
 * Touch Target Sizes (iOS HIG Compliant)
 */
export const TouchTargets = {
  minimum: 44, // 44pt minimum for all interactive elements
  comfortable: 48, // 48pt for better user experience
  large: 56, // 56pt for primary actions
} as const;

/**
 * Icon Props with HIG Compliance
 */
export interface HIGIconProps {
  size?: keyof typeof IconSizes;
  className?: string;
  'aria-label'?: string;
}

/**
 * HIG-Compliant Icon Component
 */
export function HIGIcon({
  size = 'medium',
  className = '',
  'aria-label': ariaLabel,
  icon: Icon,
}: HIGIconProps & {
  icon: React.ComponentType<{ size?: number; className?: string }>;
}) {
  const sizeValue = IconSizes[size];

  return (
    <Icon
      size={sizeValue}
      className={`shrink-0 ${className}`}
      aria-label={ariaLabel}
    />
  );
}

/**
 * Semantic Icon Components
 * Pre-configured icons for common use cases
 */
export const SemanticIcons = {
  HealthScore: (props: Omit<HIGIconProps, 'icon'>) => (
    <HIGIcon
      icon={IOSHIGIcons.health.heart}
      aria-label="Health Score"
      {...props}
    />
  ),

  FallRisk: (props: Omit<HIGIconProps, 'icon'>) => (
    <HIGIcon
      icon={IOSHIGIcons.status.shield}
      aria-label="Fall Risk Status"
      {...props}
    />
  ),

  Activity: (props: Omit<HIGIconProps, 'icon'>) => (
    <HIGIcon
      icon={IOSHIGIcons.health.activity}
      aria-label="Activity Level"
      {...props}
    />
  ),

  Emergency: (props: Omit<HIGIconProps, 'icon'>) => (
    <HIGIcon
      icon={IOSHIGIcons.status.warning}
      aria-label="Emergency Alert"
      {...props}
    />
  ),

  Navigation: (props: Omit<HIGIconProps, 'icon'>) => (
    <HIGIcon
      icon={IOSHIGIcons.navigation.chevronRight}
      aria-label="Navigate"
      {...props}
    />
  ),

  Settings: (props: Omit<HIGIconProps, 'icon'>) => (
    <HIGIcon
      icon={IOSHIGIcons.navigation.settings}
      aria-label="Settings"
      {...props}
    />
  ),

  Notifications: (props: Omit<HIGIconProps, 'icon'>) => (
    <HIGIcon
      icon={IOSHIGIcons.status.alert}
      aria-label="Notifications"
      {...props}
    />
  ),

  Profile: (props: Omit<HIGIconProps, 'icon'>) => (
    <HIGIcon
      icon={IOSHIGIcons.navigation.user}
      aria-label="User Profile"
      {...props}
    />
  ),
} as const;

/**
 * Health Status Icon Mapping
 * Maps health statuses to appropriate icons with colors
 */
export const HealthStatusIcons = {
  excellent: {
    icon: IOSHIGIcons.status.success,
    className: 'text-vitalsense-success',
    ariaLabel: 'Excellent health status',
  },
  good: {
    icon: IOSHIGIcons.health.heart,
    className: 'text-vitalsense-success',
    ariaLabel: 'Good health status',
  },
  fair: {
    icon: IOSHIGIcons.status.warning,
    className: 'text-vitalsense-warning',
    ariaLabel: 'Fair health status',
  },
  poor: {
    icon: IOSHIGIcons.status.warning,
    className: 'text-vitalsense-error',
    ariaLabel: 'Poor health status',
  },
  critical: {
    icon: IOSHIGIcons.status.warning,
    className: 'text-vitalsense-error animate-pulse',
    ariaLabel: 'Critical health status',
  },
} as const;

/**
 * Emergency Icon with Animation
 */
export function EmergencyIcon(props: HIGIconProps) {
  return (
    <HIGIcon
      icon={IOSHIGIcons.status.warning}
      className="animate-pulse text-red-500"
      aria-label="Emergency Alert"
      {...props}
    />
  );
}

/**
 * Export all icon mappings for easy import
 */
export default IOSHIGIcons;
