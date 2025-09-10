/**
 * iOS 26 Button System (Priority 2)
 *
 * Modern button components following iOS 26 HIG with enhanced accessibility,
 * Dynamic Type support, and interaction states
 */

import { HIGIcon, IOSHIGIcons } from '@/components/ui/ios-hig-icons';
import {
  iOS26ContrastSupport,
  iOS26MotionAccessibility,
  useAccessibilityEnhanced,
} from '@/lib/ios26-accessibility-enhanced';
import { getiOS26TypographyClass } from '@/lib/ios26-dynamic-type';
import { cva, type VariantProps } from 'class-variance-authority';
import React from 'react';

/**
 * iOS 26 Button Variants using CVA
 */
const ios26ButtonVariants = cva(
  // Base classes
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ios-26-button',
  {
    variants: {
      variant: {
        // iOS 26 Primary Styles
        primary:
          'bg-ios-system-blue text-white hover:bg-ios-system-blue-dark focus:ring-ios-system-blue shadow-sm ios-26-button-primary',
        secondary:
          'bg-ios-secondary-system-background text-ios-label-primary hover:bg-ios-tertiary-system-background focus:ring-ios-system-gray border border-ios-separator ios-26-button-secondary',
        destructive:
          'bg-ios-system-red text-white hover:bg-ios-system-red-dark focus:ring-ios-system-red shadow-sm ios-26-button-destructive',

        // iOS 26 Ghost/Minimal Styles
        ghost:
          'text-ios-system-blue hover:bg-ios-system-blue hover:bg-opacity-10 focus:ring-ios-system-blue ios-26-button-ghost',
        link: 'text-ios-system-blue underline-offset-4 hover:underline focus:ring-ios-system-blue ios-26-button-link',

        // iOS 26 Prominent Styles
        prominent:
          'bg-gradient-to-r from-vitalsense-primary to-vitalsense-teal text-white hover:from-vitalsense-primary-dark hover:to-vitalsense-teal-dark focus:ring-vitalsense-primary shadow-lg ios-26-button-prominent',

        // iOS 26 System Integration
        tinted:
          'bg-ios-system-blue bg-opacity-15 text-ios-system-blue hover:bg-opacity-25 focus:ring-ios-system-blue ios-26-button-tinted',
      },
      size: {
        small: 'px-3 py-1.5 text-sm min-h-[32px]',
        medium: 'px-4 py-2 text-base min-h-[44px]', // iOS 26 minimum touch target
        large: 'px-6 py-3 text-lg min-h-[56px]',
        xl: 'px-8 py-4 text-xl min-h-[64px]',
      },
      width: {
        auto: 'w-auto',
        full: 'w-full',
        fit: 'w-fit',
      },
      cornerRadius: {
        small: 'rounded-md',
        medium: 'rounded-lg',
        large: 'rounded-xl',
        pill: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'medium',
      width: 'auto',
      cornerRadius: 'medium',
    },
  }
);

export interface iOS26ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof ios26ButtonVariants> {
  // iOS 26 Enhanced Features
  icon?: keyof typeof IOSHIGIcons.system;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  loadingText?: string;

  // Typography
  dynamicType?: boolean;

  // Accessibility
  accessibilityLevel?: 'standard' | 'enhanced' | 'maximum';
  announcePresses?: boolean;

  // Visual States
  badge?: number;
  showFocusRing?: boolean;
}

export const iOS26Button = React.forwardRef<
  HTMLButtonElement,
  iOS26ButtonProps
>(
  (
    {
      className,
      variant,
      size,
      width,
      cornerRadius,
      children,
      icon,
      iconPosition = 'left',
      loading = false,
      loadingText = 'Loading...',
      dynamicType = true,
      accessibilityLevel = 'enhanced',
      announcePresses = false,
      badge,
      showFocusRing = true,
      disabled,
      onClick,
      ...props
    },
    ref
  ) => {
    // Accessibility enhancements
    const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
      announceChanges: announcePresses,
    });

    // Enhanced contrast support
    const contrastClasses = iOS26ContrastSupport.getContrastClasses('');

    // Dynamic type classes
    const typographyClass = dynamicType
      ? getiOS26TypographyClass(
          size === 'small' ? 'callout' : size === 'large' ? 'title-3' : 'body'
        )
      : '';

    // Motion-safe animation classes
    const animationClasses = iOS26MotionAccessibility.getAnimationClasses(
      'transform active:scale-95',
      'active:opacity-75'
    );

    // Handle click with accessibility announcements
    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      if (announcePresses && accessibilityLevel !== 'standard') {
        const buttonText = typeof children === 'string' ? children : 'Button';
        // Note: Actual screen reader announcement would be implemented here
        console.log(`Button pressed: ${buttonText}`);
      }
      onClick?.(e);
    };

    const buttonContent = (
      <>
        {/* Loading State */}
        {loading && (
          <div className="ios-26-spinner h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        )}

        {/* Left Icon */}
        {icon && iconPosition === 'left' && !loading && (
          <HIGIcon
            icon={IOSHIGIcons.system[icon]}
            className="ios-26-icon-adaptive flex-shrink-0"
          />
        )}

        {/* Button Content */}
        <span className={`${typographyClass} ios-26-text-adaptive`}>
          {loading ? loadingText : children}
        </span>

        {/* Right Icon */}
        {icon && iconPosition === 'right' && !loading && (
          <HIGIcon
            icon={IOSHIGIcons.system[icon]}
            className="ios-26-icon-adaptive flex-shrink-0"
          />
        )}

        {/* Badge */}
        {badge && badge > 0 && (
          <span
            className="bg-ios-system-red ios-26-badge ml-2 rounded-full px-2 py-0.5 text-xs font-medium text-white"
            aria-label={`${badge} notifications`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </>
    );

    return (
      <button
        ref={ref}
        className={`
          ${ios26ButtonVariants({ variant, size, width, cornerRadius })}
          ${contrastClasses}
          ${animationClasses}
          ${showFocusRing ? 'focus:ring-2' : 'focus:ring-0'}
          ${className || ''}
        `}
        disabled={disabled || loading}
        onClick={handleClick}
        {...accessibilityProps}
        {...props}
      >
        {buttonContent}
      </button>
    );
  }
);

iOS26Button.displayName = 'iOS26Button';

/**
 * iOS 26 Button Group Component
 */
export interface iOS26ButtonGroupProps {
  children: React.ReactNode;
  orientation?: 'horizontal' | 'vertical';
  spacing?: 'tight' | 'normal' | 'loose';
  variant?: 'segmented' | 'toolbar' | 'stack';
  accessibilityLevel?: 'standard' | 'enhanced';
}

export function iOS26ButtonGroup({
  children,
  orientation = 'horizontal',
  spacing = 'normal',
  variant = 'toolbar',
  accessibilityLevel = 'enhanced',
}: iOS26ButtonGroupProps) {
  const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
    role: 'navigation',
    keyboardNav: 'roving-tabindex',
  });

  const getGroupClasses = () => {
    const baseClasses = 'ios-26-button-group flex';

    const orientationClasses =
      orientation === 'horizontal' ? 'flex-row' : 'flex-col';

    const spacingClasses = {
      tight: orientation === 'horizontal' ? 'space-x-1' : 'space-y-1',
      normal: orientation === 'horizontal' ? 'space-x-2' : 'space-y-2',
      loose: orientation === 'horizontal' ? 'space-x-4' : 'space-y-4',
    };

    const variantClasses = {
      segmented: 'bg-ios-secondary-system-background rounded-lg p-1',
      toolbar: 'items-center',
      stack: 'items-stretch',
    };

    return `${baseClasses} ${orientationClasses} ${spacingClasses[spacing]} ${variantClasses[variant]}`;
  };

  return (
    <div className={getGroupClasses()} role="group" {...accessibilityProps}>
      {children}
    </div>
  );
}

/**
 * iOS 26 Floating Action Button
 */
export interface iOS26FABProps {
  icon: keyof typeof IOSHIGIcons.system;
  label: string;
  onClick: () => void;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  size?: 'normal' | 'small' | 'large';
  variant?: 'primary' | 'secondary';
  accessibilityLevel?: 'enhanced' | 'maximum';
}

export function iOS26FAB({
  icon,
  label,
  onClick,
  position = 'bottom-right',
  size = 'normal',
  variant = 'primary',
  accessibilityLevel = 'enhanced',
}: iOS26FABProps) {
  const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
    announceChanges: true,
  });

  const getPositionClasses = () => {
    const positions = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6',
      'top-right': 'top-6 right-6',
      'top-left': 'top-6 left-6',
    };
    return positions[position];
  };

  const getSizeClasses = () => {
    const sizes = {
      small: 'w-12 h-12',
      normal: 'w-14 h-14',
      large: 'w-16 h-16',
    };
    return sizes[size];
  };

  const getVariantClasses = () => {
    return variant === 'primary'
      ? 'bg-ios-system-blue text-white shadow-lg hover:bg-ios-system-blue-dark'
      : 'bg-ios-secondary-system-background text-ios-label-primary shadow-md hover:bg-ios-tertiary-system-background border border-ios-separator';
  };

  return (
    <button
      className={`
        fixed ${getPositionClasses()} ${getSizeClasses()}
        ${getVariantClasses()}
        focus:ring-ios-system-blue ios-26-fab ios-26-surface-elevated flex
        items-center justify-center rounded-full
        transition-all duration-200 ease-out focus:outline-none
        focus:ring-2 focus:ring-offset-2
        ${iOS26MotionAccessibility.getAnimationClasses(
          'transform hover:scale-105 active:scale-95',
          'hover:opacity-90 active:opacity-75'
        )}
      `}
      onClick={onClick}
      aria-label={label}
      {...accessibilityProps}
    >
      <HIGIcon
        icon={IOSHIGIcons.system[icon]}
        className="ios-26-icon-adaptive"
      />
    </button>
  );
}
