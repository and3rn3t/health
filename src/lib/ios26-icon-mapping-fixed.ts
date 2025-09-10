/**
 * iOS 26 Cross-Platform Icon Mapping Utility (Critical Priority 1)
 *
 * This utility ensures consistent icons across web and native iOS by providing
 * a mapping from generic icon names to iOS 26 SF Symbol equivalents.
 */

/**
 * iOS 26 SF Symbols Mapping for Cross-Platform Consistency
 * Maps web icon names to their iOS 26 SF Symbol equivalents
 */
export const SFSymbolsMapping = {
  // Health & Fitness (iOS 26 new symbols)
  heart: 'heart.pulse',
  activity: 'waveform.path.ecg.rectangle',
  steps: 'figure.walk.motion',
  sleep: 'bed.double.fill',
  brain: 'brain.head.profile',
  wellness: 'leaf.fill',
  pulse: 'waveform.path.ecg',
  gauge: 'gauge.with.dots.needle.bottom.50percent',

  // Status & Alerts (iOS 26 enhanced)
  warning: 'exclamationmark.triangle.fill',
  success: 'checkmark.circle.fill',
  error: 'xmark.circle.fill',
  info: 'info.circle.fill',
  alert: 'bell.badge.fill',
  shield: 'shield.fill',
  'shield-check': 'shield.checkered',

  // Navigation (iOS 26 updated)
  home: 'house.fill',
  profile: 'person.crop.circle.fill',
  settings: 'gearshape.fill',
  search: 'magnifyingglass.circle.fill',
  back: 'chevron.backward',
  menu: 'line.3.horizontal',

  // System & Controls (iOS 26 modern)
  close: 'xmark',
  check: 'checkmark',
  plus: 'plus.circle.fill',
  minus: 'minus.circle.fill',
  edit: 'pencil.circle.fill',
  delete: 'trash.fill',
  share: 'square.and.arrow.up.fill',
  download: 'arrow.down.circle.fill',

  // Medical & Health Specific (iOS 26 health icons)
  pill: 'pills.fill',
  thermometer: 'thermometer.medium',
  stethoscope: 'stethoscope',
  medical: 'cross.circle.fill',
  emergency: 'cross.vial.fill',
  bandage: 'bandage.fill',

  // Measurement & Analytics (iOS 26 data icons)
  chart: 'chart.line.uptrend.xyaxis.circle.fill',
  graph: 'waveform.path.ecg.rectangle.fill',
  analytics: 'chart.bar.fill',
  trend: 'chart.line.uptrend.xyaxis',
  meter: 'speedometer',
  scale: 'scalemass.fill',
} as const;

/**
 * iOS 26 Icon Categories for Semantic Organization
 */
export const ios26IconCategories = {
  health: [
    'heart',
    'activity',
    'steps',
    'sleep',
    'brain',
    'wellness',
    'pulse',
    'gauge',
  ] as const,
  status: [
    'warning',
    'success',
    'error',
    'info',
    'alert',
    'shield',
    'shield-check',
  ] as const,
  navigation: [
    'home',
    'profile',
    'settings',
    'search',
    'back',
    'menu',
  ] as const,
  system: [
    'close',
    'check',
    'plus',
    'minus',
    'edit',
    'delete',
    'share',
    'download',
  ] as const,
  medical: [
    'pill',
    'thermometer',
    'stethoscope',
    'medical',
    'emergency',
    'bandage',
  ] as const,
  analytics: [
    'chart',
    'graph',
    'analytics',
    'trend',
    'meter',
    'scale',
  ] as const,
} as const;

/**
 * Get icon category for a given icon name
 */
export const getIconCategory = (
  iconName: keyof typeof SFSymbolsMapping
): keyof typeof ios26IconCategories | 'unknown' => {
  for (const [category, icons] of Object.entries(ios26IconCategories)) {
    if ((icons as readonly string[]).includes(iconName)) {
      return category as keyof typeof ios26IconCategories;
    }
  }
  return 'unknown';
};

/**
 * Get SF Symbol equivalent for a given icon name
 * Used for iOS native implementation
 */
export const getSFSymbolEquivalent = (
  iconName: keyof typeof SFSymbolsMapping
): string => {
  return SFSymbolsMapping[iconName] || 'questionmark.circle';
};

/**
 * iOS 26 Icon Size Mapping
 */
export const iOS26IconSizes = {
  small: 16,
  medium: 24,
  large: 32,
  xl: 48,
  '2xl': 64,
} as const;

/**
 * iOS 26 Icon Weight Mapping (for SF Symbols)
 */
export const iOS26IconWeights = {
  ultralight: 'ultralight',
  thin: 'thin',
  light: 'light',
  regular: 'regular',
  medium: 'medium',
  semibold: 'semibold',
  bold: 'bold',
  heavy: 'heavy',
  black: 'black',
} as const;

/**
 * Helper function to get icon with iOS 26 styling
 */
export const getiOS26IconProps = (
  iconName: keyof typeof SFSymbolsMapping,
  size: keyof typeof iOS26IconSizes = 'medium',
  weight: keyof typeof iOS26IconWeights = 'regular'
) => ({
  sfSymbol: getSFSymbolEquivalent(iconName),
  size: iOS26IconSizes[size],
  weight: iOS26IconWeights[weight],
  category: getIconCategory(iconName),
});

// Legacy aliases for backward compatibility
export const iOS26IconMapping = SFSymbolsMapping;
export const iOS26IconCategories = ios26IconCategories;
