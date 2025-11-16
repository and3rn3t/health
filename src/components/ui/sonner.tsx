import { CSSProperties, useEffect, useState } from 'react';
import { Toaster as Sonner, ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  // Derive theme from our global data-appearance attribute or OS preference
  let theme: ToasterProps['theme'] | undefined;
  try {
    const appearance =
      typeof document !== 'undefined'
        ? document.documentElement.getAttribute('data-appearance')
        : null;
    if (appearance === 'dark') theme = 'dark';
    else if (appearance === 'light') theme = 'light';
    else if (
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      theme = 'dark';
    } else {
      theme = 'light';
    }
  } catch {
    theme = 'light';
  }
  if (!theme) theme = 'light';

  return (
    <Sonner
      theme={theme}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
        } as CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };

// Lazily mount the Toaster after first client paint to avoid any mount-time
// effect cycles that could interact with other layout effects.
export function AppToaster(props: ToasterProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  // Allow runtime disabling of toasts to isolate update loops
  if (!mounted) return null;
  if (typeof window !== 'undefined' && (window as unknown as Record<string, unknown>).__DISABLE_TOASTS) {
    return null;
  }
  return <Toaster {...props} />;
}
