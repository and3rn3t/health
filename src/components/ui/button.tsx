import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

/**
 * VitalSense Button Component
 *
 * Standardized button system with consistent sizing and styling.
 *
 * Sizes:
 * - xs: h-6 px-3 text-xs (very small with comfortable padding)
 * - sm: h-8 px-4 text-sm (small with comfortable padding)
 * - default: h-10 px-6 text-sm (medium - default with comfortable padding)
 * - lg: h-12 px-8 text-base (large with generous padding)
 * - xl: h-14 px-10 text-lg (extra large with generous padding)
 * - icon: h-8 w-8 p-0 (square icon button)
 * - icon-sm: h-6 w-6 p-0 (small square icon)
 * - icon-lg: h-10 w-10 p-0 (large square icon)
 * - emergency: h-16 flex-col gap-2 (emergency action buttons)
 *
 * Variants:
 * - default: Primary VitalSense blue
 * - secondary: Outline with theme-aware colors
 * - outline: Same as secondary
 * - ghost: Transparent with theme-aware hover
 * - success: Green for positive actions
 * - warning: Orange for caution actions
 * - destructive: Red for dangerous actions
 * - link: Text link style
 *
 * Usage:
 * <Button size="sm" variant="outline">Small Button</Button>
 * <Button size="icon" variant="ghost"><Icon /></Button>
 * <Button size="emergency" variant="destructive">Emergency Action</Button>
 */

const buttonVariants = cva(
  'vitalsense-btn focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
  {
    variants: {
      variant: {
        default: 'vitalsense-btn-primary',
        destructive: 'vitalsense-btn-error',
        outline: 'vitalsense-btn-secondary border',
        secondary: 'vitalsense-btn-secondary',
        ghost: 'vitalsense-btn-ghost',
        link: 'text-primary underline-offset-4 hover:underline bg-transparent p-0 h-auto',
        success: 'vitalsense-btn-success',
        warning: 'vitalsense-btn-warning',
      },
      size: {
        default: 'vitalsense-btn-md',
        sm: 'vitalsense-btn-sm',
        lg: 'vitalsense-btn-lg',
        xs: 'vitalsense-btn-xs',
        xl: 'vitalsense-btn-xl',
        icon: 'vitalsense-btn-icon-md',
        'icon-sm': 'vitalsense-btn-icon-sm',
        'icon-lg': 'vitalsense-btn-icon-lg',
        emergency: 'vitalsense-btn-emergency',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
