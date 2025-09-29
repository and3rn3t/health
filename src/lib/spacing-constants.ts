/**
 * VitalSense Spacing Constants
 * Standardized spacing tokens and presets
 */

// Spacing scale constants (based on 4px grid)
export const SPACING = {
  tight: {
    gap: 'gap-2',      // 8px
    padding: 'p-3',    // 12px
    margin: 'm-2',     // 8px
    space: 'space-y-3' // 12px
  },
  normal: {
    gap: 'gap-4',      // 16px
    padding: 'p-4',    // 16px
    margin: 'm-4',     // 16px
    space: 'space-y-4' // 16px
  },
  comfortable: {
    gap: 'gap-6',      // 24px
    padding: 'p-6',    // 24px
    margin: 'm-6',     // 24px
    space: 'space-y-6' // 24px
  },
  loose: {
    gap: 'gap-8',      // 32px
    padding: 'p-8',    // 32px
    margin: 'm-8',     // 32px
    space: 'space-y-8' // 32px
  }
} as const;

// Component spacing presets
export const COMPONENT_SPACING = {
  card: {
    internal: 'gap-4 p-6',              // Internal card spacing
    external: 'my-4 md:my-6',           // Card-to-card spacing
    grid: 'gap-4 md:gap-6',             // Card grid gaps
    content: 'px-6 py-4'                // Card content padding
  },
  section: {
    spacing: 'space-y-6 md:space-y-8',  // Section separation
    padding: 'px-4 py-6 md:px-6 md:py-8', // Section padding
    header: 'mb-6 md:mb-8',             // Section header margin
    content: 'space-y-4'                // Section content spacing
  },
  navigation: {
    items: 'gap-1',                     // Nav item gaps
    sections: 'py-2',                   // Section padding
    content: 'gap-3 px-3',             // Item content gaps
    touchTarget: 'min-h-[44px]'        // iOS touch target compliance
  },
  dashboard: {
    container: 'space-y-8',             // Main dashboard sections
    metrics: 'gap-4 md:gap-6',          // Metrics grid
    actions: 'gap-4',                   // Action buttons
    content: 'px-4 py-6 md:px-6 md:py-8' // Main content padding
  },
  header: {
    padding: 'px-3 md:px-6 py-2 md:py-3', // Header internal padding
    gap: 'gap-3 md:gap-4',              // Header element gaps
    margin: 'mb-2 md:mb-3',             // Header bottom margin
    secondary: 'py-2 md:py-3',          // Secondary bar padding
    touchTarget: 'min-h-[44px]'        // Touch target compliance
  }
} as const;

// Responsive spacing utilities
export const RESPONSIVE_SPACING = {
  // Mobile-first responsive padding
  section: 'px-4 py-6 md:px-6 md:py-8',
  container: 'px-4 md:px-6 lg:px-8',
  
  // Mobile-optimized margins  
  cardStack: 'my-3 md:my-4',
  sectionGap: 'mb-6 md:mb-8',
  
  // Grid gaps that scale appropriately
  grid: 'gap-4 md:gap-6',
  metrics: 'gap-3 md:gap-4',
  
  // Touch-friendly spacing
  buttons: 'gap-3 min-h-[44px]',
  navItems: 'gap-2 min-h-[44px]'
} as const;

// Export individual spacing classes for direct use
export const SPACING_CLASSES = {
  // Frequently used combinations
  dashboardSection: `${COMPONENT_SPACING.section.padding} ${COMPONENT_SPACING.section.spacing}`,
  cardGrid: `grid ${COMPONENT_SPACING.card.grid}`,
  metricCards: `grid grid-cols-1 sm:grid-cols-2 ${SPACING.normal.gap}`,
  actionButtons: `flex ${SPACING.tight.gap} items-center`,
  
  // Safe area insets for mobile
  safeTop: 'pt-safe-top',
  safeBottom: 'pb-safe-bottom',
  safeX: 'px-safe-x',
  
  // Common spacing patterns
  headerSpacing: `${COMPONENT_SPACING.header.padding} ${COMPONENT_SPACING.header.gap} border-b`,
  headerSecondary: `${COMPONENT_SPACING.header.padding} ${COMPONENT_SPACING.header.secondary}`,
  contentSpacing: RESPONSIVE_SPACING.section,
  footerSpacing: `${SPACING.comfortable.padding} border-t`
} as const;

export type SpacingSize = 'tight' | 'normal' | 'comfortable' | 'loose';

// Utility functions for dynamic spacing
export function getSpacing(size: SpacingSize, type: 'gap' | 'padding' | 'margin' | 'space') {
  return SPACING[size][type];
}

export function getComponentSpacing(component: keyof typeof COMPONENT_SPACING, property?: string) {
  const componentSpacing = COMPONENT_SPACING[component];
  if (property && property in componentSpacing) {
    return componentSpacing[property as keyof typeof componentSpacing];
  }
  return componentSpacing;
}