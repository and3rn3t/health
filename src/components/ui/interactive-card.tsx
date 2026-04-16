import type { ComponentProps } from 'react';

import { cn } from '@/lib/utils';

function InteractiveCard({
  className,
  children,
  ...props
}: Readonly<ComponentProps<'button'>>) {
  return (
    <button
      data-slot="interactive-card"
      type="button"
      className={cn(
        'my-3 flex w-full cursor-pointer select-none flex-col gap-5 rounded-xl border border-border bg-card py-5 text-left text-card-foreground transition-all duration-200',
        'vs-elevation-raised hover:vs-elevation-grouped',
        'active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:ring-offset-2',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export { InteractiveCard };
