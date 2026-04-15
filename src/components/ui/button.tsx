import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

// Consolidated button system: shadcn base + iOS 26 variants.
// All interactive targets meet >=44px minimum touch area (iOS HIG).
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background aria-invalid:ring-destructive/30 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive select-none",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 active:scale-[0.98] focus-visible:ring-ring/50',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 active:scale-[0.98] focus-visible:ring-destructive/50 dark:bg-destructive/70',
        outline:
          'border bg-background shadow-xs hover:bg-muted/70 hover:text-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 active:scale-[0.98]',
        ghost: 'hover:bg-muted/70 hover:text-foreground dark:hover:bg-muted/40',
        link: 'text-primary underline-offset-4 hover:underline px-0 min-h-[44px] h-auto',
        // iOS 26 glass-style prominent button
        prominent:
          'bg-gradient-to-r from-[var(--vitalsense-primary)] to-[var(--vitalsense-teal)] text-white shadow-lg hover:opacity-90 active:scale-[0.98]',
        // iOS 26 tinted button (subtle brand background)
        tinted:
          'bg-primary/15 text-primary hover:bg-primary/25 active:scale-[0.98]',
      },
      size: {
        default: 'min-h-[44px] px-5 py-2.5 has-[>svg]:pl-4',
        sm: 'min-h-[44px] rounded-md gap-1.5 px-4 py-2 has-[>svg]:pl-3',
        lg: 'min-h-[52px] rounded-lg px-7 py-3 has-[>svg]:pl-5 text-base',
        xl: 'min-h-[64px] rounded-xl px-8 py-4 text-lg',
        icon: 'h-11 w-11', // 44px
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
