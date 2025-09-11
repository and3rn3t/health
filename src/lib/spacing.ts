/**
 * VitalSense Spacing System
 * Consistent spacing utilities for perfect UI/UX layout
 */

export type SpacingSize = 'sm' | 'md' | 'lg';

export const spacing = {
  // Base spacing scale (rem)
  none: '0',
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '0.75rem', // 12px
  base: '1rem', // 16px
  lg: '1.25rem', // 20px
  xl: '1.5rem', // 24px
  '2xl': '2rem', // 32px
  '3xl': '2.5rem', // 40px
  '4xl': '3rem', // 48px
  '5xl': '4rem', // 64px
  '6xl': '5rem', // 80px
};

export const layout = {
  // Component-specific spacing
  card: {
    padding: {
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    },
    gap: {
      sm: 'gap-4',
      md: 'gap-6',
      lg: 'gap-8',
    },
    margin: {
      sm: 'm-4',
      md: 'm-6',
      lg: 'm-8',
    },
  },

  section: {
    padding: {
      sm: 'py-6 px-4',
      md: 'py-8 px-6',
      lg: 'py-12 px-8',
    },
    gap: 'space-y-8',
    marginBottom: 'mb-8',
  },

  header: {
    padding: 'px-4 py-4 lg:px-8',
    height: 'h-16',
    gap: 'gap-4',
  },

  footer: {
    padding: 'px-4 py-6 lg:px-8',
    gap: 'gap-6',
  },

  button: {
    padding: {
      sm: 'px-4 py-2',
      md: 'px-5 py-2.5',
      lg: 'px-7 py-3',
    },
    gap: 'gap-2',
  },

  input: {
    padding: 'px-4 py-2.5',
    height: 'h-10',
  },

  badge: {
    padding: 'px-3 py-1',
    gap: 'gap-1.5',
  },
};

export const responsive = {
  // Responsive spacing utilities
  container: {
    sm: 'max-w-sm mx-auto',
    md: 'max-w-md mx-auto',
    lg: 'max-w-lg mx-auto',
    xl: 'max-w-xl mx-auto',
    '2xl': 'max-w-2xl mx-auto',
    '4xl': 'max-w-4xl mx-auto',
    '7xl': 'max-w-7xl mx-auto',
  },

  padding: {
    responsive: 'px-4 md:px-6 lg:px-8',
    section: 'py-6 md:py-8 lg:py-12',
  },

  grid: {
    responsive: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    cards: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
  },

  gap: {
    responsive: 'gap-4 md:gap-6 lg:gap-8',
    cards: 'gap-6',
    sections: 'gap-8',
  },
};

export const animations = {
  // Smooth transitions for spacing changes
  transition: 'transition-all duration-300 ease-in-out',
  hover: 'hover:shadow-lg transition-shadow duration-200',
  focus: 'focus:ring-2 focus:ring-offset-2 focus:ring-vitalsense-primary',
};

// Utility functions for consistent spacing
export const getCardSpacing = (size: SpacingSize = 'md') =>
  layout.card.padding[size];
export const getCardGap = (size: SpacingSize = 'md') => layout.card.gap[size];
export const getSectionSpacing = () => layout.section.gap;
export const getButtonSpacing = (size: SpacingSize = 'md') =>
  layout.button.padding[size];

// VitalSense design system spacing presets
export const designSystem = {
  // Component spacing presets
  healthCard: `${layout.card.padding.md} ${layout.card.gap.md} rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow`,

  dashboardSection: `${layout.section.gap} ${layout.section.marginBottom}`,

  navigationHeader: `${layout.header.padding} ${layout.header.height} ${layout.header.gap} border-b border-gray-100`,

  pageFooter: `${layout.footer.padding} ${layout.footer.gap} border-t border-gray-100`,

  primaryButton: `${layout.button.padding.md} ${layout.button.gap} rounded-lg font-medium transition-all hover:shadow-sm`,

  formInput: `${layout.input.padding} ${layout.input.height} rounded-md border border-gray-300 focus:border-vitalsense-primary focus:ring-2 focus:ring-vitalsense-primary/20`,

  statusBadge: `${layout.badge.padding} ${layout.badge.gap} rounded-md text-xs font-medium`,

  // Layout presets
  mainContent: `${responsive.container['7xl']} ${responsive.padding.responsive} ${responsive.padding.section}`,

  cardGrid: `grid ${responsive.grid.cards} ${responsive.gap.cards}`,

  sectionGrid: `grid ${responsive.grid.responsive} ${responsive.gap.responsive}`,
};
