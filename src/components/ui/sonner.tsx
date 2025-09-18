import { CSSProperties } from 'react';
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
