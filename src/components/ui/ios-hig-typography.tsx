/**
 * iOS 26 HIG-Compliant Typography System (2025)
 *
 * This module provides a complete typography system that follows iOS 26 Human Interface Guidelines
 * with enhanced Dynamic Type support, improved accessibility features, and responsive scaling.
 *
 * Key iOS 26 Updates:
 * - Enhanced Dynamic Type scaling (up to 310%)
 * - Improved accessibility text sizes
 * - Better contrast ratios
 * - Tabular number support for health metrics
 */

import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';

/**
 * iOS 26 Typography Variants with Enhanced Dynamic Type
 * Based on Apple's latest text style specifications for 2025
 */
const textVariants = cva(
  // Base styles with iOS 26 enhancements
  'font-inter leading-normal ios26-dynamic-type',
  {
    variants: {
      variant: {
        // Display Text (Large titles) - iOS 26 enhanced
        'large-title':
          'text-[34px] font-bold leading-[1.2] tracking-tight ios26-text-scale-xl',

        // Titles - iOS 26 enhanced scaling
        'title-1':
          'text-[28px] font-bold leading-[1.25] tracking-tight ios26-text-scale-lg',
        'title-2':
          'text-[22px] font-bold leading-[1.3] tracking-tight ios26-text-scale-md',
        'title-3':
          'text-[20px] font-semibold leading-[1.35] tracking-normal ios26-text-scale-md',

        // Headlines - iOS 26 optimized
        headline:
          'text-[17px] font-semibold leading-[1.4] tracking-tight ios26-text-scale-base',

        // Body Text - iOS 26 enhanced readability
        body: 'text-[17px] font-normal leading-[1.47] tracking-normal ios26-text-scale-base',
        'body-emphasized':
          'text-[17px] font-medium leading-[1.47] tracking-normal ios26-text-scale-base',

        // Supporting Text - iOS 26 improved hierarchy
        callout:
          'text-[16px] font-normal leading-[1.44] tracking-normal ios26-text-scale-sm',
        subheadline:
          'text-[15px] font-normal leading-[1.47] tracking-normal ios26-text-scale-sm',
        footnote:
          'text-[13px] font-normal leading-[1.54] tracking-normal ios26-text-scale-xs',
        caption:
          'text-[12px] font-normal leading-[1.5] tracking-normal ios26-text-scale-xs',
        'caption-2':
          'text-[11px] font-normal leading-[1.45] tracking-normal ios26-text-scale-xs',

        // Numeric Display (Enhanced for health metrics) - iOS 26 tabular numbers
        'numeric-large':
          'text-[24px] font-semibold leading-[1.2] tracking-tight font-mono tabular-nums ios26-numeric-display',
        'numeric-medium':
          'text-[20px] font-medium leading-[1.3] tracking-tight font-mono tabular-nums ios26-numeric-display',
        'numeric-small':
          'text-[16px] font-normal leading-[1.4] tracking-normal font-mono tabular-nums ios26-numeric-display',

        // iOS 26 Accessibility Sizes (New for enhanced accessibility)
        'accessibility-xl':
          'text-[28px] font-bold leading-[1.2] tracking-tight ios26-a11y-enhanced',
        'accessibility-lg':
          'text-[24px] font-semibold leading-[1.25] tracking-tight ios26-a11y-enhanced',
        'accessibility-md':
          'text-[20px] font-medium leading-[1.3] tracking-normal ios26-a11y-enhanced',
      },

      // Semantic colors following VitalSense brand
      color: {
        primary: 'text-vitalsense-text-primary',
        secondary: 'text-vitalsense-text-muted',
        'brand-primary': 'text-vitalsense-primary',
        'brand-teal': 'text-vitalsense-teal',
        success: 'text-vitalsense-success',
        warning: 'text-vitalsense-warning',
        error: 'text-vitalsense-error',
        white: 'text-white',
        inherit: 'text-inherit',
      },

      // Responsive scaling for mobile optimization
      responsive: {
        'mobile-optimized': 'text-base sm:text-lg md:text-xl',
        'desktop-first': 'text-sm md:text-base lg:text-lg',
      },

      // Accessibility features
      accessibility: {
        'high-contrast':
          'contrast-more:text-black contrast-more:dark:text-white',
        'screen-reader-optimized': 'sr-only',
      },
    },
    defaultVariants: {
      variant: 'body',
      color: 'primary',
    },
  }
);

/**
 * Text Component Props
 */
export interface TextProps
  extends Omit<ComponentProps<'span'>, 'color'>,
    VariantProps<typeof textVariants> {
  children: React.ReactNode;
}

/**
 * iOS HIG-Compliant Text Component
 */
export function Text({
  variant,
  color,
  responsive,
  accessibility,
  className,
  children,
  ...props
}: TextProps) {
  return (
    <span
      className={cn(
        textVariants({ variant, color, responsive, accessibility }),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

/**
 * Semantic Text Components
 * Pre-configured components for common use cases
 */

export function Title1({
  children,
  className,
  ...props
}: Omit<TextProps, 'variant'>) {
  return (
    <h1
      className={cn(textVariants({ variant: 'title-1' }), className)}
      {...props}
    >
      {children}
    </h1>
  );
}

export function Title2({
  children,
  className,
  ...props
}: Omit<TextProps, 'variant'>) {
  return (
    <h2
      className={cn(textVariants({ variant: 'title-2' }), className)}
      {...props}
    >
      {children}
    </h2>
  );
}

export function Title3({
  children,
  className,
  ...props
}: Omit<TextProps, 'variant'>) {
  return (
    <h3
      className={cn(textVariants({ variant: 'title-3' }), className)}
      {...props}
    >
      {children}
    </h3>
  );
}

export function Headline({
  children,
  className,
  ...props
}: Omit<TextProps, 'variant'>) {
  return (
    <h4
      className={cn(textVariants({ variant: 'headline' }), className)}
      {...props}
    >
      {children}
    </h4>
  );
}

export function BodyText({
  children,
  className,
  ...props
}: Omit<TextProps, 'variant'>) {
  return (
    <p className={cn(textVariants({ variant: 'body' }), className)} {...props}>
      {children}
    </p>
  );
}

export function BodyEmphasized({
  children,
  className,
  ...props
}: Omit<TextProps, 'variant'>) {
  return (
    <p
      className={cn(textVariants({ variant: 'body-emphasized' }), className)}
      {...props}
    >
      {children}
    </p>
  );
}

export function Caption({
  children,
  className,
  ...props
}: Omit<TextProps, 'variant'>) {
  return (
    <span
      className={cn(
        textVariants({ variant: 'caption', color: 'secondary' }),
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function NumericDisplay({
  children,
  size = 'medium',
  className,
  ...props
}: Omit<TextProps, 'variant'> & {
  size?: 'small' | 'medium' | 'large';
}) {
  let variant: 'numeric-small' | 'numeric-medium' | 'numeric-large';

  if (size === 'small') {
    variant = 'numeric-small';
  } else if (size === 'large') {
    variant = 'numeric-large';
  } else {
    variant = 'numeric-medium';
  }

  return (
    <Text
      variant={variant}
      className={className}
      aria-live="polite"
      aria-atomic="true"
      {...props}
    >
      {children}
    </Text>
  );
}

/**
 * Health-Specific Text Components
 */
export function HealthScore({
  value,
  className,
  ...props
}: { value: number } & Omit<TextProps, 'children' | 'variant'>) {
  const getScoreColor = (score: number) => {
    if (score >= 85) return 'success';
    if (score >= 70) return 'brand-teal';
    if (score >= 55) return 'warning';
    return 'error';
  };

  return (
    <NumericDisplay
      size="large"
      color={getScoreColor(value)}
      className={className}
      aria-label={`Health score: ${value} out of 100`}
      {...props}
    >
      {value}
    </NumericDisplay>
  );
}

export function MetricValue({
  value,
  unit,
  label,
  className,
  ...props
}: {
  value: string | number;
  unit?: string;
  label?: string;
} & Omit<TextProps, 'children' | 'variant'>) {
  return (
    <div className="flex flex-col items-start space-y-1">
      <NumericDisplay
        size="medium"
        className={className}
        aria-label={label ? `${label}: ${value}${unit || ''}` : undefined}
        {...props}
      >
        {value}
      </NumericDisplay>
      {unit && <Caption className="text-xs">{unit}</Caption>}
    </div>
  );
}

/**
 * Accessibility Helpers
 */
export function ScreenReaderOnly({ children }: { children: React.ReactNode }) {
  return (
    <Text accessibility="screen-reader-optimized" aria-live="polite">
      {children}
    </Text>
  );
}

/**
 * Typography Scale Constants
 * For use in custom components
 */
export const TypographyScale = {
  largeTitle: '34px',
  title1: '28px',
  title2: '22px',
  title3: '20px',
  headline: '17px',
  body: '17px',
  callout: '16px',
  subheadline: '15px',
  footnote: '13px',
  caption: '12px',
  caption2: '11px',
} as const;

/**
 * Line Height Scale
 */
export const LineHeightScale = {
  tight: '1.2',
  normal: '1.4',
  relaxed: '1.5',
} as const;
