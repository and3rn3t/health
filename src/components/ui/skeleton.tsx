import { cn } from '@/lib/utils';
import { ComponentProps } from 'react';

function Skeleton({ className, ...props }: ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      className={cn('bg-accent animate-Activity rounded-md', className)}
      {...props}
    />
  );
}

export { Skeleton };
