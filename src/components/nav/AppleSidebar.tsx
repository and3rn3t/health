'use client';

import { Slot } from '@radix-ui/react-slot';
import { PanelLeft } from 'lucide-react';
import {
  ComponentProps,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

type NavState = 'expanded' | 'collapsed';

type AppleSidebarCtx = {
  state: NavState;
  open: boolean;
  setOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (v: boolean) => void;
  isMobile: boolean;
  toggle: () => void;
  width: number; // px
  iconWidth: number; // px
};

const Ctx = createContext<AppleSidebarCtx | null>(null);
// eslint-disable-next-line react-refresh/only-export-components
export const useAppleSidebar = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error('useAppleSidebar must be used within AppleSidebarProvider');
  return ctx;
};

export function AppleSidebarProvider({
  defaultOpen = true,
  width = 272, // iPad style width ~ 17rem (base fallback)
  iconWidth = 56,
  children,
  className,
  ...props
}: ComponentProps<'div'> & {
  defaultOpen?: boolean;
  width?: number;
  iconWidth?: number;
}) {
  const isMobile = useIsMobile();
  const [o, setO] = useState(defaultOpen);
  const [openMobile, setOpenMobile] = useState(false);

  const setOpen = useCallback(
    (v: boolean | ((v: boolean) => boolean)) => {
      setO(typeof v === 'function' ? (v as (b: boolean) => boolean)(o) : v);
    },
    [o]
  );

  const toggle = useCallback(() => {
    // Toggle only the relevant state for the current form factor
    if (isMobile) {
      setOpenMobile((x) => !x);
    } else {
      setO((x) => !x);
    }
  }, [isMobile]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  const state: NavState = o ? 'expanded' : 'collapsed';

  const value = useMemo<AppleSidebarCtx>(
    () => ({
      state,
      open: o,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggle,
      width,
      iconWidth,
    }),
    [
      state,
      o,
      setOpen,
      openMobile,
      setOpenMobile,
      isMobile,
      toggle,
      width,
      iconWidth,
    ]
  );

  return (
    <Ctx.Provider value={value}>
      <TooltipProvider>
        <div
          data-vs="apple-sidebar"
          className={cn('group/apple-sidebar flex min-h-svh w-full', className)}
          data-vs-sidebar-width={width}
          data-vs-sidebar-icon-width={iconWidth}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </Ctx.Provider>
  );
}

export function AppleSidebarPanel({
  side = 'left',
  variant = 'inset',
  collapsible = 'offcanvas',
  withSpacer: _withSpacer = false,
  className,
  children,
  ...props
}: ComponentProps<'aside'> & {
  side?: 'left' | 'right';
  variant?: 'inset' | 'floating' | 'sidebar';
  collapsible?: 'offcanvas' | 'icon' | 'none';
  /** When true, renders a non-fixed spacer sibling to reserve layout space instead of relying on peer-margin. Default false. */
  withSpacer?: boolean;
}) {
  const { isMobile, state, openMobile, setOpenMobile } = useAppleSidebar();

  if (collapsible === 'none') {
    return (
      <aside
        data-vs="apple-sidebar-panel"
        data-side={side}
        className={cn(
          // Responsive comfort widths on large displays
          'md:w-[360px] xl:w-[420px] 2xl:w-[520px] bg-card text-foreground border-border h-full w-[320px] shrink-0 border-r',
          className
        )}
        {...props}
      >
        <div
          data-vs="apple-sidebar-inner"
          className="flex h-full min-h-0 w-full flex-col overflow-y-auto"
        >
          {children}
        </div>
      </aside>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          side={side}
          className="bg-card text-foreground w-[90vw] max-w-[420px] p-0 shadow-xl" // cap width on large phones/tablets
          id="vs-apple-sidebar-mobile"
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation</SheetTitle>
          </SheetHeader>
          <div
            data-vs="apple-sidebar-inner"
            className="flex h-full min-h-0 w-full flex-col overflow-y-auto"
          >
            {children}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: static flex item that transitions width. No overlay; main content is never hidden.
  const expandedWidth = 'w-[320px] md:w-[360px] xl:w-[420px] 2xl:w-[520px]';
  const collapsedWidth =
    collapsible === 'icon' ? 'w-0 md:w-[56px]' : 'w-0 md:w-0';
  const widthClass = state === 'expanded' ? expandedWidth : collapsedWidth;

  return (
    <aside
      data-vs="apple-sidebar-panel"
      data-side={side}
      data-variant={variant}
      data-collapsible={collapsible}
      className={cn(
        'bg-card text-foreground border-border h-full shrink-0 overflow-hidden border-r transition-[width] duration-200 ease-linear',
        widthClass,
        className
      )}
      {...props}
    >
      <div
        data-vs="apple-sidebar-inner"
        className="flex h-full min-h-0 w-full flex-col overflow-y-auto"
      >
        {children}
      </div>
    </aside>
  );
}

export function AppleSidebarTrigger({
  className,
  onClick,
  ...props
}: ComponentProps<typeof Button>) {
  const { toggle, open } = useAppleSidebar();
  return (
    <Button
      type="button"
      aria-label="Toggle Navigation"
      aria-expanded={open}
      variant="ghost"
      size="icon"
      className={cn('size-7', className)}
      onClick={(e) => {
        onClick?.(e);
        toggle();
      }}
      {...props}
    >
      <PanelLeft />
    </Button>
  );
}

export function AppleSidebarMain({
  className,
  bumper: _bumper = 'none',
  ...props
}: ComponentProps<'main'> & {
  bumper?: 'peer-margin' | 'none' | 'responsive';
}) {
  const { state } = useAppleSidebar();
  return (
    <main
      data-vs="apple-sidebar-main"
      className={cn(
        // Make this the scrolling container so sticky headers work correctly
        'bg-background text-foreground flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-y-auto',
        className
      )}
      data-state={state}
      {...props}
    />
  );
}

export function AppleSidebarHeader({
  className,
  asChild = false,
  ...props
}: ComponentProps<'div'> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : 'div';
  return (
    <Comp
      data-vs="apple-sidebar-header"
      className={cn(
        // z-20 to sit above sidebar items, below main NavigationHeader (z-40)
        'h-12 px-3 border-border sticky top-0 z-20 flex items-center gap-2 border-b',
        className
      )}
      {...props}
    />
  );
}

export function AppleSidebarSection({
  className,
  ...props
}: ComponentProps<'section'>) {
  return (
    <section
      data-vs="apple-sidebar-section"
      className={cn('px-2 py-2', className)}
      {...props}
    />
  );
}

export function AppleSidebarList({
  className,
  ...props
}: ComponentProps<'ul'>) {
  return (
    <ul
      data-vs="apple-sidebar-list"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  );
}

export function AppleSidebarItem({
  className,
  active,
  ...props
}: ComponentProps<'button'> & { active?: boolean }) {
  return (
    <li>
      <button
        data-vs="apple-sidebar-item"
        type="button"
        data-active={active ? 'true' : undefined}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'h-10 gap-3 px-3 outline-hidden relative flex w-full items-center rounded-md text-left text-sm transition-colors',
          active
            ? 'bg-vitalsense-primary/10 font-semibold text-vitalsense-primary dark:bg-vitalsense-primary/20'
            : 'text-muted-foreground hover:bg-muted dark:hover:bg-muted/70 font-medium',
          'focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-vitalsense-primary/30',
          className
        )}
        {...props}
      />
    </li>
  );
}

export function AppleSidebarBadge({
  className,
  ...props
}: ComponentProps<'div'>) {
  return (
    <div
      data-vs="apple-sidebar-badge"
      className={cn(
        'h-5 min-w-5 text-xs bg-muted text-muted-foreground pointer-events-none ml-auto inline-flex items-center justify-center rounded-md px-1 tabular-nums',
        className
      )}
      {...props}
    />
  );
}
