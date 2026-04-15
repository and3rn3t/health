'use client';

import { Link, useRouterState } from '@tanstack/react-router';
import { PanelLeft } from '@/lib/icons';
import type { ComponentProps } from 'react';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import './apple-sidebar.css';

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useIsMobile } from '@/hooks/use-mobile';
import { NAV_ITEMS } from '@/lib/navigation';
import { APP_NAME } from '@/lib/branding';
import { cn } from '@/lib/utils';

/* ===========================
   Sidebar Context & Provider
   =========================== */

type NavState = 'expanded' | 'collapsed';

type AppleSidebarCtx = {
  state: NavState;
  open: boolean;
  setOpen: (v: boolean | ((v: boolean) => boolean)) => void;
  openMobile: boolean;
  setOpenMobile: (v: boolean) => void;
  isMobile: boolean;
  toggle: () => void;
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
  children,
  className,
  ...props
}: ComponentProps<'div'> & { defaultOpen?: boolean }) {
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
    if (isMobile) {
      setOpenMobile((x) => !x);
    } else {
      setO((x) => !x);
    }
  }, [isMobile]);

  // Cmd+B keyboard shortcut
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
    }),
    [state, o, setOpen, openMobile, setOpenMobile, isMobile, toggle]
  );

  return (
    <Ctx.Provider value={value}>
      <TooltipProvider>
        <div
          data-vs="apple-sidebar"
          className={cn('group/apple-sidebar flex min-h-svh w-full', className)}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </Ctx.Provider>
  );
}

/* ===========================
   Sidebar Nav Items (shared)
   =========================== */

function SidebarNavItems({ onLinkClick }: { onLinkClick?: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // Split nav into main items and system (settings)
  const mainItems = NAV_ITEMS.filter((i) => i.path !== '/settings');
  const systemItems = NAV_ITEMS.filter((i) => i.path === '/settings');

  const renderItem = (item: (typeof NAV_ITEMS)[number]) => {
    const isActive =
      item.path === '/' ? pathname === '/' : pathname.startsWith(item.path);
    const Icon = item.icon;

    return (
      <li key={item.path}>
        <Link
          to={item.path}
          onClick={onLinkClick}
          aria-current={isActive ? 'page' : undefined}
          className={cn(
            'flex min-h-[44px] items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50',
            isActive
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
          )}
        >
          <Icon className="size-5 shrink-0" />
          <span className="truncate">{item.label}</span>
        </Link>
      </li>
    );
  };

  return (
    <div className="flex flex-1 flex-col justify-between overflow-y-auto px-3 py-4">
      <div>
        <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Navigation
        </p>
        <ul className="flex flex-col gap-1">{mainItems.map(renderItem)}</ul>
      </div>
      {systemItems.length > 0 && (
        <div className="mt-4 border-t border-border/50 pt-4">
          <ul className="flex flex-col gap-1">
            {systemItems.map(renderItem)}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ===========================
   Sidebar Panel
   =========================== */

export function AppleSidebarPanel({
  side = 'left',
  className,
  ...props
}: ComponentProps<'aside'> & { side?: 'left' | 'right' }) {
  const { isMobile, state, openMobile, setOpenMobile } = useAppleSidebar();

  if (isMobile) {
    return (
      <Sheet
        open={openMobile}
        onOpenChange={setOpenMobile}
        {...(props as Record<string, unknown>)}
      >
        <SheetContent
          side={side}
          className="w-[85vw] max-w-[380px] bg-card p-0 text-foreground shadow-xl"
          id="vs-apple-sidebar-mobile"
        >
          <SheetHeader className="border-b border-border px-4 py-3">
            <SheetTitle className="text-base font-semibold">
              {APP_NAME}
            </SheetTitle>
          </SheetHeader>
          <SidebarNavItems onLinkClick={() => setOpenMobile(false)} />
        </SheetContent>
      </Sheet>
    );
  }

  // Desktop: static sidebar with glass effect
  const expanded = state === 'expanded';

  return (
    <aside
      data-vs="apple-sidebar-panel"
      data-side={side}
      aria-label="Primary navigation"
      className={cn(
        'vs-glass-thick shrink-0 border-r border-border/30 text-foreground transition-[width] duration-200 ease-linear overflow-hidden',
        expanded ? 'w-[260px]' : 'w-0',
        className
      )}
      {...props}
    >
      <div className="flex h-full w-[260px] flex-col">
        {/* Sidebar header */}
        <div className="flex h-12 shrink-0 items-center border-b border-border/30 px-4">
          <span className="text-sm font-semibold text-foreground">
            {APP_NAME}
          </span>
        </div>
        <SidebarNavItems />
      </div>
    </aside>
  );
}

/* ===========================
   Sidebar Trigger Button
   =========================== */

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
      className={cn('size-8', className)}
      onClick={(e) => {
        onClick?.(e);
        toggle();
      }}
      {...props}
    >
      <PanelLeft className="size-4" />
    </Button>
  );
}
