/**
 * VitalSense Brand Color Utilities
 *
 * Provides consistent access to VitalSense brand colors across the application.
 * These colors align with the VitalSense branding guidelines and provide
 * semantic meaning for health-related UI elements.
 */

export const VitalSenseColors = {
  // Primary brand colors
  primary: {
    main: '#2563eb',
    light: '#3b82f6',
    dark: '#1d4ed8',
    contrast: '#ffffff',
    css: 'vitalsense-primary',
  },

  // Accent teal for secondary actions and highlights
  teal: {
    main: '#0891b2',
    light: '#06b6d4',
    dark: '#0e7490',
    contrast: '#ffffff',
    css: 'vitalsense-teal',
  },

  // Success green for positive health indicators
  success: {
    main: '#059669',
    light: '#10b981',
    dark: '#047857',
    contrast: '#ffffff',
    css: 'vitalsense-success',
  },

  // Warning amber for caution and attention
  warning: {
    main: '#d97706',
    light: '#f59e0b',
    dark: '#b45309',
    contrast: '#000000',
    css: 'vitalsense-warning',
  },

  // Error red for alerts and critical states
  error: {
    main: '#dc2626',
    light: '#ef4444',
    dark: '#b91c1c',
    contrast: '#ffffff',
    css: 'vitalsense-error',
  },

  // Supporting colors
  text: {
    primary: '#111827',
    muted: '#6b7280',
    css: {
      primary: 'vitalsense-text-primary',
      muted: 'vitalsense-text-muted',
    },
  },

  background: {
    light: '#ffffff',
    dark: '#1f2937',
    card: {
      light: '#f9fafb',
      dark: '#374151',
    },
    css: {
      light: 'vitalsense-bg-light',
      dark: 'vitalsense-bg-dark',
      cardLight: 'vitalsense-card-light',
      cardDark: 'vitalsense-card-dark',
    },
  },
} as const;

/**
 * Health-specific color mappings using VitalSense brand colors
 */
export const HealthColorMap = {
  // Heart rate zones
  heartRate: {
    resting: VitalSenseColors.success.css,
    moderate: VitalSenseColors.teal.css,
    vigorous: VitalSenseColors.warning.css,
    maximum: VitalSenseColors.error.css,
  },

  // Fall risk levels
  fallRisk: {
    low: VitalSenseColors.success.css,
    moderate: VitalSenseColors.warning.css,
    high: VitalSenseColors.error.css,
    critical: VitalSenseColors.error.css,
  },

  // Activity levels
  activity: {
    sedentary: VitalSenseColors.text.css.muted,
    light: VitalSenseColors.teal.css,
    moderate: VitalSenseColors.primary.css,
    vigorous: VitalSenseColors.success.css,
  },

  // Emergency status
  emergency: {
    normal: VitalSenseColors.success.css,
    alert: VitalSenseColors.warning.css,
    critical: VitalSenseColors.error.css,
  },

  // Data quality
  dataQuality: {
    excellent: VitalSenseColors.success.css,
    good: VitalSenseColors.teal.css,
    fair: VitalSenseColors.warning.css,
    poor: VitalSenseColors.error.css,
  },
} as const;

/**
 * Utility function to get Tailwind CSS classes for VitalSense colors
 */
export const getVitalSenseClasses = {
  // Background classes
  bg: {
    primary: 'bg-vitalsense-primary',
    primaryLight: 'bg-vitalsense-primary-light',
    primaryDark: 'bg-vitalsense-primary-dark',
    teal: 'bg-vitalsense-teal',
    tealLight: 'bg-vitalsense-teal-light',
    tealDark: 'bg-vitalsense-teal-dark',
    success: 'bg-vitalsense-success',
    successLight: 'bg-vitalsense-success-light',
    successDark: 'bg-vitalsense-success-dark',
    warning: 'bg-vitalsense-warning',
    warningLight: 'bg-vitalsense-warning-light',
    warningDark: 'bg-vitalsense-warning-dark',
    error: 'bg-vitalsense-error',
    errorLight: 'bg-vitalsense-error-light',
    errorDark: 'bg-vitalsense-error-dark',
  },

  // Text classes
  text: {
    primary: 'text-vitalsense-primary',
    primaryLight: 'text-vitalsense-primary-light',
    primaryDark: 'text-vitalsense-primary-dark',
    primaryContrast: 'text-vitalsense-primary-contrast',
    teal: 'text-vitalsense-teal',
    tealLight: 'text-vitalsense-teal-light',
    tealDark: 'text-vitalsense-teal-dark',
    tealContrast: 'text-vitalsense-teal-contrast',
    success: 'text-vitalsense-success',
    successLight: 'text-vitalsense-success-light',
    successDark: 'text-vitalsense-success-dark',
    successContrast: 'text-vitalsense-success-contrast',
    warning: 'text-vitalsense-warning',
    warningLight: 'text-vitalsense-warning-light',
    warningDark: 'text-vitalsense-warning-dark',
    warningContrast: 'text-vitalsense-warning-contrast',
    error: 'text-vitalsense-error',
    errorLight: 'text-vitalsense-error-light',
    errorDark: 'text-vitalsense-error-dark',
    errorContrast: 'text-vitalsense-error-contrast',
    primaryText: 'text-vitalsense-text-primary',
    mutedText: 'text-vitalsense-text-muted',
  },

  // Border classes
  border: {
    primary: 'border-vitalsense-primary',
    teal: 'border-vitalsense-teal',
    success: 'border-vitalsense-success',
    warning: 'border-vitalsense-warning',
    error: 'border-vitalsense-error',
  },

  // Hover states
  hover: {
    bgPrimary: 'hover:bg-vitalsense-primary-light',
    bgTeal: 'hover:bg-vitalsense-teal-light',
    bgSuccess: 'hover:bg-vitalsense-success-light',
    bgWarning: 'hover:bg-vitalsense-warning-light',
    bgError: 'hover:bg-vitalsense-error-light',
  },
} as const;
