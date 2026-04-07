---
name: add-health-component
description: "Create a new health monitoring React component following VitalSense patterns. Use when building new health visualizations, device cards, alert UIs, or dashboard widgets. Includes Tailwind styling, accessibility, and React Query integration."
argument-hint: "Component name and type (e.g., 'BloodPressureCard visualization')"
---

# Add Health Component

## When to Use
- Build a new health data visualization
- Create a monitoring dashboard widget
- Add a device status or alert card
- Implement a new health feature UI

## Procedure

### 1. Create Component
Create `src/components/health/<ComponentName>.tsx`:

```tsx
import { type FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getVitalSenseClasses } from '@/lib/vitalsense-colors';

interface ComponentNameProps {
  // Explicit props — no `any`
}

export const ComponentName: FC<ComponentNameProps> = ({ ...props }) => {
  const classes = getVitalSenseClasses();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Title</CardTitle>
      </CardHeader>
      <CardContent>
        {/* Component content */}
      </CardContent>
    </Card>
  );
};
```

### 2. Style with Tailwind + VitalSense Tokens
- Use utility classes from Tailwind v4
- Apply semantic colors from `getVitalSenseClasses()`
- Support dark mode via `dark:` variants
- WCAG AA contrast: ≥4.5:1 normal text, ≥3.0:1 large/UI

### 3. Connect Data
- Server data: `@tanstack/react-query` with co-located query key
- Real-time: `useWebSocket` hook + `useLiveHealthData`
- Client persistence: `useKV`

### 4. Accessibility
- Keyboard navigation on all interactive elements
- ARIA labels and roles
- `useLiveRegion` for dynamic updates (alerts, scores)
- Test with screen reader

### 5. Performance
- Lazy load if >50KB: `React.lazy()` + `<Suspense>`
- Memoize expensive computations
- Keep under 100KB route chunk target

### 6. Test
Create `src/components/health/<ComponentName>.test.tsx`:
- Render with mock data
- Test user interactions
- Verify accessibility attributes
- Test loading/error states
