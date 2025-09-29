/**
 * VitalSense Spacing Components
 * Standardized spacing components for consistent UI/UX
 */

import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';
import { SPACING, COMPONENT_SPACING, SpacingSize } from '@/lib/spacing-constants';

// Spacing wrapper components for consistent layout
export function SpacedSection({ 
  spacing = 'normal', 
  className, 
  children, 
  ...props 
}: ComponentProps<'section'> & { spacing?: SpacingSize }) {
  let spaceClass = 'space-y-6'; // normal default
  
  if (spacing === 'tight') spaceClass = 'space-y-4';
  else if (spacing === 'loose') spaceClass = 'space-y-8';
  
  return (
    <section 
      className={cn(
        COMPONENT_SPACING.section.padding,
        spaceClass,
        className
      )}
      {...props}
    >
      {children}
    </section>
  );
}

export function SpacedContainer({ 
  maxWidth = '7xl',
  spacing = 'normal',
  className, 
  children, 
  ...props 
}: ComponentProps<'div'> & { 
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '7xl';
  spacing?: SpacingSize;
}) {
  const maxWidthClass = `max-w-${maxWidth}`;
  const spacingClass = SPACING[spacing].space;
  
  return (
    <div 
      className={cn(
        'mx-auto',
        maxWidthClass,
        spacingClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SpacedGrid({ 
  cols = 'responsive',
  spacing = 'normal',
  className, 
  children, 
  ...props 
}: ComponentProps<'div'> & { 
  cols?: 'responsive' | 'cards' | 'metrics' | 'auto';
  spacing?: SpacingSize;
}) {
  const gapClass = SPACING[spacing].gap;
  
  const colsClass = {
    responsive: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4', 
    metrics: 'grid-cols-1 sm:grid-cols-2',
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }[cols];
  
  return (
    <div 
      className={cn(
        'grid',
        colsClass,
        gapClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SpacedCard({ 
  spacing = 'normal',
  className, 
  children, 
  ...props 
}: ComponentProps<'div'> & { spacing?: SpacingSize }) {
  const paddingClass = SPACING[spacing].padding;
  const gapClass = SPACING[spacing].gap;
  
  return (
    <div 
      className={cn(
        'rounded-xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md',
        'my-4 md:my-6', // Consistent external spacing
        'flex flex-col',
        paddingClass,
        gapClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function SpacedStack({ 
  spacing = 'normal',
  direction = 'vertical',
  className, 
  children, 
  ...props 
}: ComponentProps<'div'> & { 
  spacing?: SpacingSize;
  direction?: 'vertical' | 'horizontal';
}) {
  const spaceClass = direction === 'vertical' 
    ? SPACING[spacing].space 
    : SPACING[spacing].gap;
    
  const flexClass = direction === 'vertical' 
    ? 'flex flex-col' 
    : 'flex flex-row items-center';
  
  return (
    <div 
      className={cn(
        flexClass,
        spaceClass,
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

