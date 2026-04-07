---
description: 'Audit a React component for WCAG AA accessibility compliance: ARIA attributes, keyboard navigation, color contrast, focus management, and screen reader support.'
---

Perform a WCAG AA accessibility audit on the provided component:

1. **Semantic HTML**: Correct heading hierarchy, landmark regions, lists for related items
2. **ARIA Attributes**: Labels on interactive elements, roles where needed, `aria-live` for dynamic updates
3. **Keyboard Navigation**: All interactive elements focusable, logical tab order, no keyboard traps, Escape to dismiss overlays
4. **Focus Management**: Focus moves to new content (modals, alerts), focus returns on dismiss, visible focus indicators
5. **Color Contrast**: Text ≥4.5:1 ratio (normal), ≥3.0:1 (large text / UI components). Check VitalSense palette in `src/lib/vitalsense-colors.ts`
6. **Dark Mode**: Verify contrast ratios hold in `[data-appearance="dark"]` mode
7. **Screen Reader**: Meaningful alt text, hidden decorative elements (`aria-hidden`), status announcements via live regions
8. **Motion**: Respect `prefers-reduced-motion`, no auto-playing animations without pause control
9. **Touch Targets**: Minimum 44x44px for mobile (iOS app considerations)

For each issue found, provide:
- **Severity**: CRITICAL (blocks users) / HIGH (degrades experience) / MEDIUM (improvement)
- **WCAG Criterion**: The specific guideline (e.g., 1.4.3 Contrast)
- **Location**: File and approximate line
- **Fix**: Code example

Reference existing accessible patterns in `src/components/ui/*` and VitalSense design tokens in `src/styles/theme.css`.
