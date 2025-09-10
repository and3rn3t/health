/**
 * iOS 26 Advanced Accessibility Utilities (Priority 2)
 *
 * Enhanced accessibility patterns following iOS 26 HIG guidelines
 * for comprehensive ARIA support, keyboard navigation, and assistive technology integration
 */

export type AccessibilityLevel =
  | 'minimal'
  | 'standard'
  | 'enhanced'
  | 'maximum';
export type AccessibilityRole =
  | 'alert'
  | 'status'
  | 'progressbar'
  | 'tabpanel'
  | 'dialog'
  | 'navigation';
export type KeyboardNavigation =
  | 'none'
  | 'basic'
  | 'enhanced'
  | 'roving-tabindex';

/**
 * iOS 26 ARIA Patterns for Health Applications
 */
export const iOS26ARIAPatterns = {
  // Health Data Presentation
  healthMetric: {
    role: 'status',
    'aria-live': 'polite',
    'aria-atomic': 'true',
    'aria-describedby': 'health-description',
  },

  criticalAlert: {
    role: 'alert',
    'aria-live': 'assertive',
    'aria-atomic': 'true',
    'aria-labelledby': 'alert-title',
  },

  // Interactive Controls
  toggleButton: {
    role: 'button',
    'aria-pressed': 'false', // dynamic
    'aria-describedby': 'toggle-description',
  },

  slider: {
    role: 'slider',
    'aria-valuemin': '0',
    'aria-valuemax': '100',
    'aria-valuenow': '50', // dynamic
    'aria-valuetext': '', // dynamic with units
  },

  // Navigation
  tabPanel: {
    role: 'tabpanel',
    'aria-labelledby': 'tab-label',
    tabIndex: 0,
  },

  // Data Tables
  dataTable: {
    role: 'table',
    'aria-label': 'Health data table',
    'aria-describedby': 'table-description',
  },
} as const;

/**
 * iOS 26 Keyboard Navigation Patterns
 */
export const iOS26KeyboardPatterns = {
  // Focus Management
  focusRing: {
    outline: '2px solid var(--ios-system-blue)',
    outlineOffset: '2px',
    borderRadius: '4px',
  },

  // Skip Links
  skipLink: {
    position: 'absolute',
    left: '-9999px',
    zIndex: 999,
    padding: '8px',
    backgroundColor: 'var(--ios-system-background)',
    color: 'var(--ios-label-primary)',
    textDecoration: 'none',
    borderRadius: '4px',
  },

  skipLinkFocus: {
    left: '6px',
    top: '6px',
  },
} as const;

/**
 * Enhanced Accessibility Hook for iOS 26 Components
 */
export const useAccessibilityEnhanced = (
  level: AccessibilityLevel = 'enhanced',
  options: {
    role?: AccessibilityRole;
    keyboardNav?: KeyboardNavigation;
    announceChanges?: boolean;
    criticalContent?: boolean;
  } = {}
) => {
  const {
    role = 'status',
    keyboardNav = 'enhanced',
    announceChanges = true,
    criticalContent = false,
  } = options;

  // Base accessibility attributes
  const baseAttributes = {
    role,
    tabIndex: keyboardNav !== 'none' ? 0 : -1,
  };

  // Enhanced attributes based on level
  const enhancedAttributes =
    level === 'enhanced' || level === 'maximum'
      ? {
          'aria-live': criticalContent
            ? ('assertive' as const)
            : ('polite' as const),
          'aria-atomic': true,
        }
      : {};

  // Maximum accessibility attributes
  const maximumAttributes =
    level === 'maximum'
      ? {
          'aria-describedby': 'detailed-description',
          'aria-expanded': undefined, // Set dynamically
          'aria-controls': undefined, // Set dynamically
        }
      : {};

  return {
    ...baseAttributes,
    ...enhancedAttributes,
    ...maximumAttributes,
  };
};

/**
 * iOS 26 Focus Management Utilities
 */
export const iOS26FocusManager = {
  // Trap focus within a container
  trapFocus: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else if (document.activeElement === lastElement) {
        firstElement.focus();
        e.preventDefault();
      }
    };

    container.addEventListener('keydown', handleTabKey);
    return () => container.removeEventListener('keydown', handleTabKey);
  },

  // Restore focus to previous element
  restoreFocus: (previousElement: HTMLElement | null) => {
    if (previousElement) {
      previousElement.focus();
    }
  },

  // Announce content to screen readers
  announceToScreenReader: (
    message: string,
    priority: 'polite' | 'assertive' = 'polite'
  ) => {
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    setTimeout(() => {
      document.body.removeChild(announcement);
    }, 1000);
  },
};

/**
 * iOS 26 Enhanced Contrast Support
 */
export const iOS26ContrastSupport = {
  // Detect high contrast mode
  isHighContrastMode: () => {
    return window.matchMedia('(prefers-contrast: more)').matches;
  },

  // Enhanced contrast classes
  getContrastClasses: (baseClasses: string) => {
    const isHighContrast = iOS26ContrastSupport.isHighContrastMode();
    return isHighContrast ? `${baseClasses} ios-26-high-contrast` : baseClasses;
  },

  // Monitor contrast preference changes
  onContrastChange: (callback: (isHighContrast: boolean) => void) => {
    const mediaQuery = window.matchMedia('(prefers-contrast: more)');
    const handler = (e: MediaQueryListEvent) => callback(e.matches);

    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  },
};

/**
 * iOS 26 Motion and Animation Accessibility
 */
export const iOS26MotionAccessibility = {
  // Respect reduced motion preference
  respectsReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  },

  // Get animation classes based on motion preference
  getAnimationClasses: (
    animationClasses: string,
    reducedClasses: string = ''
  ) => {
    return iOS26MotionAccessibility.respectsReducedMotion()
      ? reducedClasses
      : animationClasses;
  },

  // Safe animation utility
  safeAnimate: (
    element: HTMLElement,
    keyframes: Keyframe[],
    options?: KeyframeAnimationOptions
  ) => {
    if (iOS26MotionAccessibility.respectsReducedMotion()) {
      // Skip animation or use reduced version
      return null;
    }

    return element.animate(keyframes, {
      duration: 300,
      easing: 'ease-out',
      ...options,
    });
  },
};

/**
 * iOS 26 Voice Control Support Preparation
 */
export const iOS26VoiceControlSupport = {
  // Add voice control labels
  addVoiceControlLabels: (element: HTMLElement, label: string) => {
    element.setAttribute('data-voice-label', label);
    element.setAttribute('aria-label', label);
  },

  // Enhanced button labeling for voice control
  enhanceButtonForVoice: (
    button: HTMLElement,
    action: string,
    context?: string
  ) => {
    const voiceLabel = context ? `${action} ${context}` : action;
    iOS26VoiceControlSupport.addVoiceControlLabels(button, voiceLabel);
  },
};

/**
 * Comprehensive accessibility validator for iOS 26 components
 */
export const validateiOS26Accessibility = (
  element: HTMLElement
): {
  score: number;
  issues: string[];
  recommendations: string[];
} => {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for basic ARIA attributes
  if (
    !element.hasAttribute('aria-label') &&
    !element.hasAttribute('aria-labelledby')
  ) {
    issues.push('Missing aria-label or aria-labelledby');
  }

  // Check for keyboard accessibility
  if (
    element.matches('button, [role="button"]') &&
    !element.hasAttribute('tabindex')
  ) {
    issues.push('Interactive element missing tabindex');
  }

  // Check for focus indicators
  const focusStyle = getComputedStyle(element, ':focus');
  if (!focusStyle.outline || focusStyle.outline === 'none') {
    issues.push('Missing focus indicator');
    recommendations.push('Add visible focus outline');
  }

  // Check for contrast (basic check)
  // Note: Full contrast checking would require color parsing library

  // Calculate score
  const maxScore = 100;
  const deductions = issues.length * 20;
  const score = Math.max(0, maxScore - deductions);

  // Add recommendations based on issues
  if (issues.length === 0) {
    recommendations.push('Excellent accessibility implementation!');
  }

  return { score, issues, recommendations };
};

/**
 * iOS 26 Accessibility Testing Utilities
 */
export const iOS26AccessibilityTesting = {
  // Test keyboard navigation
  testKeyboardNavigation: (container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    return {
      focusableCount: focusableElements.length,
      hasFocusTrap: container.hasAttribute('data-focus-trap'),
      hasSkipLinks: container.querySelector('[data-skip-link]') !== null,
    };
  },

  // Test screen reader compatibility
  testScreenReaderCompatibility: (element: HTMLElement) => {
    return {
      hasAriaLabel: element.hasAttribute('aria-label'),
      hasRole: element.hasAttribute('role'),
      hasLiveRegion: element.hasAttribute('aria-live'),
      hasDescription: element.hasAttribute('aria-describedby'),
    };
  },
};
