import { useKV } from '@/hooks/useLocalKV';
import { useCallback, useEffect, useMemo } from 'react';

export type ThemeMode = 'light' | 'dark' | 'system';

function getSystemPrefersDark() {
  return (
    typeof window !== 'undefined' &&
    window.matchMedia &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );
}

export function useThemeMode() {
  const [themeMode, setThemeMode] = useKV<ThemeMode>('theme-mode', 'system');

  const resolveTheme = (mode?: ThemeMode): 'light' | 'dark' => {
    if (!mode || mode === 'system') {
      return getSystemPrefersDark() ? 'dark' : 'light';
    }
    return mode;
  };

  const effectiveTheme: 'light' | 'dark' = useMemo(() => {
    return resolveTheme(themeMode);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = () => {
      const mode = resolveTheme(themeMode);
      root.setAttribute('data-appearance', mode);
    };

    applyTheme();

    // Listen for system changes only when in system mode
    let mql: MediaQueryList | null = null;
    const onChange = () => applyTheme();
    if (
      themeMode === 'system' &&
      typeof window !== 'undefined' &&
      window.matchMedia
    ) {
      mql = window.matchMedia('(prefers-color-scheme: dark)');
      mql.addEventListener?.('change', onChange);
    }
    return () => {
      mql?.removeEventListener?.('change', onChange);
    };
  }, [themeMode]);

  const toggleThemeMode = useCallback(() => {
    const order: ThemeMode[] = ['light', 'dark', 'system'];
    const idx = order.indexOf(themeMode ?? 'system');
    const next = order[(idx + 1) % order.length]!;
    setThemeMode(next);
  }, [themeMode, setThemeMode]);

  return { themeMode, setThemeMode, toggleThemeMode, effectiveTheme } as const;
}
