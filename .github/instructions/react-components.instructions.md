---
description: "Use when creating or modifying React components, UI elements, or pages. Covers component patterns, Radix UI composition, Tailwind v4 styling, accessibility, and VitalSense design system."
applyTo: "src/components/**/*.{ts,tsx}"
---

# React Component Guidelines — VitalSense

## Component Structure
- Function components with explicit `Props` type — never `any`.
- Named exports only; one primary component per file.
- Co-locate styles (Tailwind classes), types, and helpers within the component file unless shared.

## Styling
- Tailwind v4 utility classes — no CSS-in-JS.
- Semantic tokens from `src/lib/vitalsense-colors.ts` via `getVitalSenseClasses()`.
- Dark mode: `[data-appearance="dark"]` attribute on `document.documentElement`.
- Colors: primary `#2563eb`, accent teal `#056487`, dark accent foreground `#333333`.

## UI Primitives
- Compose from existing `src/components/ui/*` (Radix-based).
- Icons: `lucide-react` via `src/lib/icons.ts`, or `@phosphor-icons/react`.
- Do NOT create new UI primitives that duplicate existing ones in `ui/`.

## State & Data
- UI state: `useKV` for lightweight client persistence.
- Server state: `@tanstack/react-query` — co-locate query keys.
- Real-time: `useWebSocket` hook with zod message guards.

## Performance
- `React.lazy()` + `<Suspense>` for components >50KB.
- `useMemo`/`useCallback` for expensive computations.
- Route chunks <100KB target.

## Accessibility
- All interactive elements need keyboard navigation + ARIA labels.
- WCAG AA contrast: normal text ≥4.5:1, large text/UI ≥3.0:1.
- Use `useLiveRegion` for dynamic content announcements.

## Branding
- Always use **VitalSense** in user-facing text — never "Health App".
