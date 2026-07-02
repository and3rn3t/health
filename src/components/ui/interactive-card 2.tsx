import { cn } from '@/lib/utils';
import React, { forwardRef } from 'react';
import type { ComponentProps } from 'react';

/**
 * InteractiveCard
 * Accessible, keyboard-activatable wrapper for card-like buttons.
 * Ensures 44px min hit target, focus ring, press feedback, and ARIA roles.
 */
export interface InteractiveCardProps
  extends Omit<ComponentProps<'div'>, 'role' | 'tabIndex' | 'onKeyDown'> {
  /**
   * If true, marks the card as currently selected (aria-pressed / data-active)
   */
  pressed?: boolean;
  /** Optional id of an element describing this card */
  describedBy?: string;
  /** If provided, acts like a toggle button (aria-pressed). */
  toggleable?: boolean;
}

export const InteractiveCard = forwardRef<HTMLDivElement, InteractiveCardProps>(
  (
    { className, pressed = false, describedBy, toggleable, onClick, ...rest },
    ref
  ) => {
    return (
      <div
        ref={ref}
        role="button"
        tabIndex={0}
        aria-pressed={toggleable ? pressed : undefined}
        aria-describedby={describedBy}
        data-active={pressed ? 'true' : undefined}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }}
        onClick={onClick}
        className={cn(
          'vs-tap-target focus-visible:ring-ring/50 focus-visible:ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
          'cursor-pointer select-none rounded-xl transition-all duration-200',
          'bg-card border-border border vs-elevation-raised hover:vs-elevation-grouped active:scale-[0.98]',
          'data-[active=true]:ring-primary/50 data-[active=true]:ring-2',
          className
        )}
        {...rest}
      />
    );
  }
);
InteractiveCard.displayName = 'InteractiveCard';
