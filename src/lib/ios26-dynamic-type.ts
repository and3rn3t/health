/**
 * iOS 26 Enhanced Dynamic Type System (Critical Priority 1)
 *
 * This utility provides iOS 26 Dynamic Type support with enhanced accessibility
 * features and proper scaling for health metrics.
 */

/**
 * iOS 26 Dynamic Type CSS Classes
 * These classes provide proper scaling for iOS 26 accessibility requirements
 */
export const iOS26DynamicTypeClasses = {
  // Base dynamic type support
  base: 'ios26-dynamic-type',

  // Enhanced scaling classes
  scales: {
    xs: 'ios26-text-scale-xs',
    sm: 'ios26-text-scale-sm',
    base: 'ios26-text-scale-base',
    md: 'ios26-text-scale-md',
    lg: 'ios26-text-scale-lg',
    xl: 'ios26-text-scale-xl',
  },

  // Accessibility enhanced classes
  accessibility: {
    enhanced: 'ios26-a11y-enhanced',
    numeric: 'ios26-numeric-display',
  },
} as const;

/**
 * iOS 26 Typography Scale Utilities
 * Provides proper font scaling for iOS 26 Dynamic Type
 */
export const iOS26TypographyUtils = {
  /**
   * Get dynamic type class for a given variant
   */
  getDynamicTypeClass: (
    variant: keyof typeof iOS26DynamicTypeClasses.scales
  ) => {
    return iOS26DynamicTypeClasses.scales[variant];
  },

  /**
   * Combine base dynamic type with scale
   */
  getScaledClass: (scale: keyof typeof iOS26DynamicTypeClasses.scales) => {
    return `${iOS26DynamicTypeClasses.base} ${iOS26DynamicTypeClasses.scales[scale]}`;
  },

  /**
   * Get accessibility enhanced class
   */
  getAccessibilityClass: (type: 'enhanced' | 'numeric') => {
    return iOS26DynamicTypeClasses.accessibility[type];
  },
} as const;

/**
 * Health Metrics Typography Classes
 * Optimized for displaying health data with proper tabular numbers
 */
export const healthMetricsTypographyClasses = {
  large: `text-[24px] font-semibold leading-[1.2] tracking-tight font-mono tabular-nums ${iOS26DynamicTypeClasses.accessibility.numeric}`,
  medium: `text-[20px] font-medium leading-[1.3] tracking-tight font-mono tabular-nums ${iOS26DynamicTypeClasses.accessibility.numeric}`,
  small: `text-[16px] font-normal leading-[1.4] tracking-normal font-mono tabular-nums ${iOS26DynamicTypeClasses.accessibility.numeric}`,
} as const;

/**
 * iOS 26 Enhanced Typography Variants
 * Pre-built classes that include proper Dynamic Type support
 */
export const iOS26TypographyVariants = {
  // Display and Titles
  'large-title': `text-[34px] font-bold leading-[1.2] tracking-tight ${iOS26TypographyUtils.getScaledClass('xl')}`,
  'title-1': `text-[28px] font-bold leading-[1.25] tracking-tight ${iOS26TypographyUtils.getScaledClass('lg')}`,
  'title-2': `text-[22px] font-bold leading-[1.3] tracking-tight ${iOS26TypographyUtils.getScaledClass('md')}`,
  'title-3': `text-[20px] font-semibold leading-[1.35] tracking-normal ${iOS26TypographyUtils.getScaledClass('md')}`,

  // Body and Text
  headline: `text-[17px] font-semibold leading-[1.4] tracking-tight ${iOS26TypographyUtils.getScaledClass('base')}`,
  body: `text-[17px] font-normal leading-[1.47] tracking-normal ${iOS26TypographyUtils.getScaledClass('base')}`,
  'body-emphasized': `text-[17px] font-medium leading-[1.47] tracking-normal ${iOS26TypographyUtils.getScaledClass('base')}`,
  callout: `text-[16px] font-normal leading-[1.44] tracking-normal ${iOS26TypographyUtils.getScaledClass('sm')}`,
  subheadline: `text-[15px] font-normal leading-[1.47] tracking-normal ${iOS26TypographyUtils.getScaledClass('sm')}`,
  footnote: `text-[13px] font-normal leading-[1.54] tracking-normal ${iOS26TypographyUtils.getScaledClass('xs')}`,
  caption: `text-[12px] font-normal leading-[1.5] tracking-normal ${iOS26TypographyUtils.getScaledClass('xs')}`,

  // Health Metrics
  'health-metric-large': healthMetricsTypographyClasses.large,
  'health-metric-medium': healthMetricsTypographyClasses.medium,
  'health-metric-small': healthMetricsTypographyClasses.small,

  // iOS 26 Accessibility Enhanced
  'accessibility-xl': `text-[28px] font-bold leading-[1.2] tracking-tight ${iOS26DynamicTypeClasses.accessibility.enhanced}`,
  'accessibility-lg': `text-[24px] font-semibold leading-[1.25] tracking-tight ${iOS26DynamicTypeClasses.accessibility.enhanced}`,
  'accessibility-md': `text-[20px] font-medium leading-[1.3] tracking-normal ${iOS26DynamicTypeClasses.accessibility.enhanced}`,
} as const;

/**
 * Get iOS 26 typography class for a variant
 */
export const getiOS26TypographyClass = (
  variant: keyof typeof iOS26TypographyVariants
): string => {
  return iOS26TypographyVariants[variant];
};

/**
 * iOS 26 Typography Component Helpers
 * Utilities for applying iOS 26 typography to components
 */
export const iOS26TypographyHelpers = {
  /**
   * Apply iOS 26 typography to an element
   */
  applyTypography: (
    variant: keyof typeof iOS26TypographyVariants,
    additionalClasses?: string
  ) => {
    const baseClass = getiOS26TypographyClass(variant);
    return additionalClasses ? `${baseClass} ${additionalClasses}` : baseClass;
  },

  /**
   * Check if variant supports accessibility enhancements
   */
  supportsAccessibility: (
    variant: keyof typeof iOS26TypographyVariants
  ): boolean => {
    return (
      variant.includes('accessibility') || variant.includes('health-metric')
    );
  },

  /**
   * Get the appropriate heading level for a typography variant
   */
  getHeadingLevel: (
    variant: keyof typeof iOS26TypographyVariants
  ): 1 | 2 | 3 | 4 | 5 | 6 => {
    if (variant === 'large-title' || variant === 'title-1') return 1;
    if (variant === 'title-2') return 2;
    if (variant === 'title-3' || variant === 'headline') return 3;
    return 4;
  },
} as const;
