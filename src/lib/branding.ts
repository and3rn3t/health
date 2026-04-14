/**
 * Centralized VitalSense branding constants.
 *
 * Import from here instead of hardcoding brand strings.
 * Covers app identity, social/SEO metadata, and key design tokens
 * that must stay in sync across HTML, PWA manifest, Worker routes, and components.
 */

// ─── App Identity ───────────────────────────────────────────────────────────

export const APP_NAME = 'VitalSense' as const;
export const APP_TAGLINE = 'Apple Health Insights & Fall Risk Monitor' as const;
export const APP_DESCRIPTION =
  'Your comprehensive health companion with advanced analytics, fall risk monitoring, and emergency safety features. Track Apple Health data with AI-powered insights.' as const;
export const APP_SHORT_DESCRIPTION =
  'Your comprehensive health companion with advanced analytics and safety monitoring' as const;
export const APP_AUTHOR = 'VitalSense Health Technologies' as const;
export const APP_URL = 'https://health.andernet.dev' as const;

// ─── Core Design Tokens ─────────────────────────────────────────────────────
// Single source of truth for values duplicated across CSS, manifest.json,
// index.html meta tags, and inline Worker HTML.

export const BRAND_COLORS = {
  /** Primary brand blue — used for theme-color, PWA chrome, etc. */
  primary: '#2563eb',
  /** Primary hover / dark variant */
  primaryDark: '#1d4ed8',
  /** Accent teal */
  teal: '#0891b2',
  /** Teal hover / dark variant */
  tealDark: '#0e7490',
  /** Background (light) */
  background: '#ffffff',
  /** Foreground (light) */
  foreground: '#0f172a',
  /** Card / elevated surface */
  card: '#f8fafc',
  /** Border / divider */
  border: '#e2e8f0',
  /** Muted / secondary text */
  muted: '#64748b',
  /** Success green */
  success: '#059669',
  /** Success light variant (e.g. "Low" risk label) */
  successLight: '#10b981',
  /** Error / destructive red */
  error: '#dc2626',
} as const;

// ─── Typography ─────────────────────────────────────────────────────────────

export const FONT_STACK =
  "-apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', Roboto, sans-serif" as const;

// ─── Derived Constants ──────────────────────────────────────────────────────

/** Full page title (used in index.html <title> and OG tags) */
export const PAGE_TITLE = `${APP_NAME} - ${APP_TAGLINE}` as const;

/** Document title suffix for per-page titles in the SPA */
export const TITLE_SEPARATOR = '•' as const;

/** Build a document.title like "Dashboard • VitalSense" */
export function formatPageTitle(section: string): string {
  return `${section} ${TITLE_SEPARATOR} ${APP_NAME}`;
}
