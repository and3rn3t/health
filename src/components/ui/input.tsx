import { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function Input({ className, type, ...props }: ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        [
          'selection:bg-primary selection:text-primary-foreground',
          'dark:bg-input/30',
          'border-input shadow-xs',
          'h-10 py-2.5',
          'file:text-slate-900 placeholder:text-slate-500',
          'md:text-sm flex w-full min-w-0 rounded-md border bg-transparent px-4 text-base',
          'outline-none transition-[color,box-shadow]',
          'file:inline-flex file:h-8 file:border-0 file:bg-transparent file:text-sm file:font-medium',
          'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50'
        ].join(' '),
        'focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]',
        'aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  );
}

export { Input };
