# VitalSense Button System Guide

## Overview

The VitalSense button system provides consistent sizing and styling across the entire application. No need to override button heights manually - use the appropriate size variant instead.

## Button Sizes

### Standard Sizes

- `xs`: Very small (h-6, px-2, text-xs) - For compact interfaces
- `sm`: Small (h-8, px-3, text-sm) - Default for most components
- `default`: Medium (h-10, px-4, text-sm) - Standard button size
- `lg`: Large (h-12, px-6, text-base) - For important actions
- `xl`: Extra large (h-14, px-8, text-lg) - For hero sections

### Icon Buttons

- `icon-sm`: Small icon (h-6, w-6, p-0) - For toolbars
- `icon`: Standard icon (h-8, w-8, p-0) - Default icon button
- `icon-lg`: Large icon (h-10, w-10, p-0) - For prominent actions

### Special Sizes

- `emergency`: Emergency actions (h-16, flex-col, gap-2) - For emergency buttons

## Button Variants

### Visual Styles

- `default`: Primary VitalSense blue
- `secondary`/`outline`: Theme-aware outline
- `ghost`: Transparent with theme-aware hover
- `success`: Green for positive actions
- `warning`: Orange for caution actions
- `destructive`: Red for dangerous actions
- `link`: Text link style

## Usage Examples

```tsx
// Standard buttons
<Button size="sm" variant="outline">View Details</Button>
<Button size="default" variant="default">Submit</Button>
<Button size="lg" variant="success">Save Changes</Button>

// Icon buttons
<Button size="icon-sm" variant="ghost"><Icon /></Button>
<Button size="icon" variant="outline"><Icon /></Button>

// Emergency buttons
<Button size="emergency" variant="destructive">
  <Phone className="h-6 w-6" />
  <span>Emergency Call</span>
</Button>
```

## Migration from Custom Heights

❌ **Don't do this:**

```tsx
<Button className="h-8" size="sm">Button</Button>
<Button className="h-12 px-6">Large Button</Button>
```

✅ **Do this instead:**

```tsx
<Button size="sm">Button</Button>
<Button size="lg">Large Button</Button>
```

## Theme Compatibility

All button variants automatically adapt to light/dark mode using CSS variables:

- `--color-vitalsense-primary`
- `--color-sidebar-bg`
- `--color-nav-hover`
- `--color-nav-text`

No need for `dark:` classes - the theme system handles everything automatically.
