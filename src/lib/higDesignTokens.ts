/**
 * Apple iOS Human Interface Guidelines (HIG) inspired design tokens
 * Centralized semantic scales exposed as CSS variables through `main.css`.
 * These tokens allow consistent spacing, sizing, typography, and radii
 * aligned with iOS conventions (comfortable touch targets, clear hierarchy).
 */

export const higSpacing = {
  '2xs': 2, // ultra-tight (avoid for interactive)
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  '3xl': 32,
  '4xl': 40,
};

export const higRadii = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const higTypography = {
  // Dynamic Type style approximations (base scale; can be scaled via prefers-large)
  title1: 'clamp(1.875rem, 1.7rem + 0.6vw, 2.25rem)', // ~30–36px
  title2: 'clamp(1.5rem, 1.4rem + 0.4vw, 1.875rem)', // ~24–30px
  title3: 'clamp(1.25rem, 1.2rem + 0.3vw, 1.5rem)', // ~20–24px
  headline: '1.0625rem', // 17px
  body: '1rem', // 16px (base)
  subhead: '0.9375rem', // 15px
  footnote: '0.8125rem', // 13px
  caption: '0.75rem', // 12px
};

export const higTargets = {
  minInteractiveSizePx: 44,
};

export const higElevation = {
  subtle: '0 0 0 1px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)',
  raised: '0 1px 3px rgba(0,0,0,0.12), 0 4px 12px -2px rgba(0,0,0,0.08)',
};

export const higMotion = {
  durationFast: '120ms',
  durationBase: '180ms',
  easingStandard: 'cubic-bezier(.4,.2,.2,1)',
  easingEmphasized: 'cubic-bezier(.32,.72,.35,1)',
};

// Convenience aggregated export
export const higTokens = {
  spacing: higSpacing,
  radii: higRadii,
  type: higTypography,
  targets: higTargets,
  elevation: higElevation,
  motion: higMotion,
};

export type HigTokens = typeof higTokens;
