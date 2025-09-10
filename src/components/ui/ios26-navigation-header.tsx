/**
 * iOS 26 Navigation Header Component (Priority 2)
 *
 * Modern navigation patterns following iOS 26 HIG with enhanced accessibility,
 * Dynamic Type support, and adaptive layouts
 */

import { HIGIcon, IOSHIGIcons } from '@/components/ui/ios-hig-icons';
import {
  iOS26ContrastSupport,
  iOS26FocusManager,
  useAccessibilityEnhanced,
} from '@/lib/ios26-accessibility-enhanced';
import { getiOS26TypographyClass } from '@/lib/ios26-dynamic-type';
import React, { useEffect, useRef, useState } from 'react';

export interface NavigationHeaderProps {
  title: string;
  subtitle?: string;
  backAction?: () => void;
  backLabel?: string;

  // iOS 26 Navigation Features
  navigationStyle?: 'standard' | 'large' | 'compact';
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;

  // Actions
  primaryAction?: {
    icon: keyof typeof IOSHIGIcons.navigation;
    label: string;
    onClick: () => void;
  };
  secondaryActions?: Array<{
    icon: keyof typeof IOSHIGIcons.system;
    label: string;
    onClick: () => void;
  }>;

  // Accessibility
  accessibilityLevel?: 'standard' | 'enhanced' | 'maximum';
  announceNavigation?: boolean;

  // Visual
  variant?: 'default' | 'prominent' | 'minimal';
  showDivider?: boolean;
}

export function iOS26NavigationHeader({
  title,
  subtitle,
  backAction,
  backLabel = 'Back',
  navigationStyle = 'standard',
  searchEnabled = false,
  searchPlaceholder = 'Search',
  onSearchChange,
  primaryAction,
  secondaryActions = [],
  accessibilityLevel = 'enhanced',
  announceNavigation = true,
  variant = 'default',
  showDivider = true,
}: Readonly<NavigationHeaderProps>) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  // Accessibility enhancements
  const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
    role: 'navigation',
    keyboardNav: 'enhanced',
    announceChanges: announceNavigation,
  });

  // Enhanced contrast support
  const contrastClasses = iOS26ContrastSupport.getContrastClasses(
    'ios-26-navigation-header'
  );

  // Handle search changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearchChange?.(query);

    if (announceNavigation && query) {
      iOS26FocusManager.announceToScreenReader(
        `Searching for ${query}`,
        'polite'
      );
    }
  };

  // Navigation style classes
  const getNavigationClasses = () => {
    const baseClasses = `${contrastClasses} ios-26-nav-${navigationStyle}`;

    switch (variant) {
      case 'prominent':
        return `${baseClasses} ios-26-nav-prominent bg-vitalsense-primary text-white`;
      case 'minimal':
        return `${baseClasses} ios-26-nav-minimal bg-transparent`;
      default:
        return `${baseClasses} ios-26-nav-default bg-ios-system-background`;
    }
  };

  // Typography classes based on navigation style
  const getTitleClasses = () => {
    switch (navigationStyle) {
      case 'large':
        return getiOS26TypographyClass('title-1');
      case 'compact':
        return getiOS26TypographyClass('headline');
      default:
        return getiOS26TypographyClass('title-2');
    }
  };

  const getSubtitleClasses = () => {
    return getiOS26TypographyClass('subheadline');
  };

  // Focus management
  useEffect(() => {
    if (searchEnabled && searchRef.current) {
      const cleanup = iOS26FocusManager.trapFocus(headerRef.current!);
      return cleanup;
    }
  }, [searchEnabled]);

  return (
    <header
      ref={headerRef}
      className={`${getNavigationClasses()} ios-26-surface-elevated`}
      {...accessibilityProps}
      aria-label={`${title} navigation`}
    >
      {/* Main Navigation Bar */}
      <div className="flex items-center justify-between px-4 py-3">
        {/* Leading Section - Back Button */}
        {backAction && (
          <button
            onClick={backAction}
            className="ios-26-button-ghost ios-26-nav-back hover:bg-ios-secondary-system-background focus:ring-ios-system-blue flex items-center space-x-2 rounded-lg p-2 focus:outline-none focus:ring-2"
            aria-label={backLabel}
          >
            <HIGIcon
              icon={IOSHIGIcons.navigation.back}
              className="ios-26-icon-adaptive text-ios-system-blue"
            />
            <span
              className={`${getiOS26TypographyClass('body')} text-ios-system-blue`}
            >
              {backLabel}
            </span>
          </button>
        )}

        {/* Center Section - Title */}
        <div className="mx-4 flex-1 text-center">
          <h1
            className={`${getTitleClasses()} text-ios-label-primary font-semibold`}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`${getSubtitleClasses()} text-ios-label-secondary mt-1`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {/* Trailing Section - Actions */}
        <div className="flex items-center space-x-2">
          {/* Primary Action */}
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="ios-26-button-primary bg-ios-system-blue hover:bg-ios-system-blue-dark focus:ring-ios-system-blue rounded-lg p-2 text-white focus:outline-none focus:ring-2"
              aria-label={primaryAction.label}
            >
              <HIGIcon
                icon={primaryAction.icon}
                className="ios-26-icon-adaptive"
              />
            </button>
          )}

          {/* Secondary Actions */}
          {secondaryActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className="ios-26-button-secondary text-ios-label-primary hover:bg-ios-secondary-system-background focus:ring-ios-system-blue rounded-lg p-2 focus:outline-none focus:ring-2"
              aria-label={action.label}
            >
              <HIGIcon icon={action.icon} className="ios-26-icon-adaptive" />
            </button>
          ))}
        </div>
      </div>

      {/* Search Bar (if enabled) */}
      {searchEnabled && (
        <div className="px-4 pb-3">
          <div className="relative">
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              placeholder={searchPlaceholder}
              className={`
                w-full px-10 py-2
                ${getiOS26TypographyClass('body')}
                bg-ios-tertiary-system-background
                text-ios-label-primary
                placeholder-ios-label-tertiary
                border-ios-separator focus:ring-ios-system-blue
                ios-26-search-field
                rounded-lg
                border
                focus:border-transparent
                focus:outline-none
                focus:ring-2
              `}
              aria-label={`Search ${title.toLowerCase()}`}
            />

            {/* Search Icon */}
            <HIGIcon
              icon={IOSHIGIcons.navigation.search}
              className="text-ios-label-secondary ios-26-icon-adaptive absolute left-3 top-1/2 -translate-y-1/2 transform"
            />

            {/* Clear Button */}
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  onSearchChange?.('');
                  searchRef.current?.focus();
                }}
                className="hover:bg-ios-quaternary-system-background focus:ring-ios-system-blue absolute right-3 top-1/2 -translate-y-1/2 transform rounded-full p-1 focus:outline-none focus:ring-1"
                aria-label="Clear search"
              >
                <HIGIcon
                  icon={IOSHIGIcons.system.close}
                  className="text-ios-label-secondary ios-26-icon-adaptive h-4 w-4"
                />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Divider */}
      {showDivider && <div className="border-ios-separator border-b" />}
    </header>
  );
}

/**
 * iOS 26 Tab Navigation Component
 */
export interface iOS26TabNavigationProps {
  tabs: Array<{
    id: string;
    label: string;
    icon?: keyof typeof IOSHIGIcons.navigation;
    badge?: number;
    disabled?: boolean;
  }>;
  activeTab: string;
  onTabChange: (tabId: string) => void;
  accessibilityLevel?: 'standard' | 'enhanced';
  variant?: 'pills' | 'underline' | 'segmented';
}

export function iOS26TabNavigation({
  tabs,
  activeTab,
  onTabChange,
  accessibilityLevel = 'enhanced',
  variant = 'underline',
}: Readonly<iOS26TabNavigationProps>) {
  const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
    role: 'navigation',
    keyboardNav: 'roving-tabindex',
  });

  const getVariantClasses = () => {
    switch (variant) {
      case 'pills':
        return 'ios-26-tabs-pills';
      case 'segmented':
        return 'ios-26-tabs-segmented bg-ios-secondary-system-background rounded-lg p-1';
      default:
        return 'ios-26-tabs-underline border-b border-ios-separator';
    }
  };

  return (
    <nav
      className={`${getVariantClasses()} ios-26-tab-navigation`}
      {...accessibilityProps}
      aria-label="Content navigation"
    >
      <div className="flex">
        {tabs.map((tab, index) => {
          const isActive = tab.id === activeTab;
          const isDisabled = tab.disabled;

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`
                flex flex-1 items-center justify-center space-x-2 px-4 py-3
                ${getiOS26TypographyClass('callout')}
                focus:ring-ios-system-blue transition-all duration-200
                ease-out focus:outline-none focus:ring-2 focus:ring-inset
                ${
                  isActive
                    ? 'text-ios-system-blue border-ios-system-blue border-b-2'
                    : 'text-ios-label-secondary hover:text-ios-label-primary'
                }
                ${
                  isDisabled
                    ? 'cursor-not-allowed opacity-50'
                    : 'cursor-pointer'
                }
                ${
                  variant === 'pills' && isActive
                    ? 'bg-ios-system-blue rounded-lg text-white'
                    : ''
                }
                ${
                  variant === 'segmented' && isActive
                    ? 'bg-ios-system-background text-ios-label-primary rounded-md shadow-sm'
                    : ''
                }
              `}
              role="tab"
              aria-selected={isActive}
              aria-controls={`tabpanel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
            >
              {tab.icon && (
                <HIGIcon
                  icon={tab.icon}
                  className="ios-26-icon-adaptive h-5 w-5"
                />
              )}
              <span>{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span
                  className="bg-ios-system-red ml-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
                  aria-label={`${tab.badge} notifications`}
                >
                  {tab.badge > 99 ? '99+' : tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
