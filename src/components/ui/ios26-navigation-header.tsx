/**
 * iOS 26 Navigation Header and Tab Navigation (clean rebuild)
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
  navigationStyle?: 'standard' | 'large' | 'compact';
  searchEnabled?: boolean;
  searchPlaceholder?: string;
  onSearchChange?: (query: string) => void;
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
  accessibilityLevel?: 'standard' | 'enhanced' | 'maximum';
  announceNavigation?: boolean;
  variant?: 'default' | 'prominent' | 'minimal';
  showDivider?: boolean;
}

export function IOS26NavigationHeader({
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
  const searchRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);

  const accessibilityProps = useAccessibilityEnhanced(accessibilityLevel, {
    role: 'navigation',
    keyboardNav: 'enhanced',
    announceChanges: announceNavigation,
  });

  const contrastClasses = iOS26ContrastSupport.getContrastClasses(
    'ios-26-navigation-header'
  );

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

  const getNavigationClasses = () => {
    const base = `${contrastClasses} ios-26-nav-${navigationStyle}`;
    switch (variant) {
      case 'prominent':
        return `${base} ios-26-nav-prominent bg-vitalsense-primary text-white`;
      case 'minimal':
        return `${base} ios-26-nav-minimal bg-transparent`;
      default:
        return `${base} ios-26-nav-default bg-ios-system-background`;
    }
  };

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

  const getSubtitleClasses = () => getiOS26TypographyClass('subheadline');

  useEffect(() => {
    if (!searchEnabled || !searchRef.current) return;
    const cleanup = iOS26FocusManager.trapFocus(headerRef.current!);
    return cleanup;
  }, [searchEnabled]);

  return (
    <header
      ref={headerRef}
      className={`${getNavigationClasses()} ios-26-surface-elevated`}
      {...accessibilityProps}
      aria-label={`${title} navigation`}
    >
      <div className="py-3 flex items-center justify-between px-4">
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

        <div className="flex items-center space-x-2">
          {primaryAction && (
            <button
              onClick={primaryAction.onClick}
              className="ios-26-button-primary bg-ios-system-blue hover:bg-ios-system-blue-dark focus:ring-ios-system-blue rounded-lg p-2 text-white focus:outline-none focus:ring-2"
              aria-label={primaryAction.label}
            >
              <HIGIcon
                icon={IOSHIGIcons.navigation[primaryAction.icon]}
                className="ios-26-icon-adaptive"
              />
            </button>
          )}

          {secondaryActions.map((action) => (
            <button
              key={`${action.icon}-${action.label}`}
              onClick={action.onClick}
              className="ios-26-button-secondary text-ios-label-primary hover:bg-ios-secondary-system-background focus:ring-ios-system-blue rounded-lg p-2 focus:outline-none focus:ring-2"
              aria-label={action.label}
            >
              <HIGIcon
                icon={IOSHIGIcons.system[action.icon]}
                className="ios-26-icon-adaptive"
              />
            </button>
          ))}
        </div>
      </div>

      {searchEnabled && (
        <div className="pb-3 px-4">
          <div className="relative">
            <input
              ref={searchRef}
              type="search"
              value={searchQuery}
              onChange={handleSearchChange}
              placeholder={searchPlaceholder}
              className={`
                px-10 w-full py-2
                ${getiOS26TypographyClass('body')}
                bg-ios-tertiary-system-background
                text-ios-label-primary
                placeholder-ios-label-tertiary
                border-ios-separator focus:ring-ios-system-blue
                ios-26-search-field
                rounded-lg border focus:border-transparent focus:outline-none focus:ring-2
              `}
              aria-label={`Search ${title.toLowerCase()}`}
            />

            <HIGIcon
              icon={IOSHIGIcons.navigation.home}
              className="text-ios-label-secondary ios-26-icon-adaptive left-3 absolute top-1/2 -translate-y-1/2 transform"
            />

            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  onSearchChange?.('');
                  searchRef.current?.focus();
                }}
                className="hover:bg-ios-quaternary-system-background focus:ring-ios-system-blue right-3 absolute top-1/2 -translate-y-1/2 transform rounded-full p-1 focus:outline-none focus:ring-1"
                aria-label="Clear search"
              >
                <HIGIcon
                  icon={IOSHIGIcons.status.warning}
                  className="text-ios-label-secondary ios-26-icon-adaptive h-4 w-4"
                />
              </button>
            )}
          </div>
        </div>
      )}

      {showDivider && <div className="border-ios-separator border-b" />}
    </header>
  );
}

export interface IOSTabNavigationProps {
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

export function IOSTabNavigation({
  tabs,
  activeTab,
  onTabChange,
  accessibilityLevel = 'enhanced',
  variant = 'underline',
}: Readonly<IOSTabNavigationProps>) {
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

  const getVariantActiveClass = () => {
    switch (variant) {
      case 'pills':
        return 'bg-ios-system-blue rounded-lg text-white';
      case 'segmented':
        return 'bg-ios-system-background text-ios-label-primary rounded-md shadow-sm';
      default:
        return 'text-ios-system-blue border-ios-system-blue border-b-2';
    }
  };

  const getVariantInactiveClass = () => {
    return 'text-ios-label-secondary hover:text-ios-label-primary';
  };

  return (
    <nav
      className={`${getVariantClasses()} ios-26-tab-navigation`}
      {...accessibilityProps}
      aria-label="Content navigation"
    >
      <div
        className="flex flex-nowrap items-center gap-2 overflow-x-auto overflow-y-hidden"
        role="tablist"
        aria-orientation="horizontal"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          const isDisabled = tab.disabled;

          const baseClasses = `py-3 inline-flex !w-fit basis-auto min-w-fit max-w-none shrink-0 items-center justify-center space-x-2 whitespace-nowrap px-4 overflow-visible h-auto ${getiOS26TypographyClass('callout')} transition-all duration-200 ease-out focus:outline-none focus:ring-2 focus:ring-inset ${isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`;
          const stateClasses = isActive
            ? getVariantActiveClass()
            : getVariantInactiveClass();

          if (isActive) {
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && onTabChange(tab.id)}
                disabled={isDisabled}
                className={`${baseClasses} ${stateClasses}`}
                role="tab"
                aria-selected="true"
                aria-controls={`tabpanel-${tab.id}`}
                id={`tab-${tab.id}`}
                tabIndex={0}
              >
                {tab.icon && (
                  <HIGIcon
                    icon={IOSHIGIcons.navigation[tab.icon]}
                    className="ios-26-icon-adaptive h-5 w-5"
                  />
                )}
                <span className="inline-block">{tab.label}</span>
                {tab.badge && tab.badge > 0 && (
                  <span
                    className="bg-ios-system-red py-0.5 text-xs ml-1 rounded-full px-2 font-medium text-white"
                    aria-label={`${tab.badge} notifications`}
                  >
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onTabChange(tab.id)}
              disabled={isDisabled}
              className={`${baseClasses} ${stateClasses}`}
              role="tab"
              aria-selected="false"
              aria-controls={`tabpanel-${tab.id}`}
              id={`tab-${tab.id}`}
              tabIndex={-1}
            >
              {tab.icon && (
                <HIGIcon
                  icon={IOSHIGIcons.navigation[tab.icon]}
                  className="ios-26-icon-adaptive h-5 w-5"
                />
              )}
              <span className="inline-block">{tab.label}</span>
              {tab.badge && tab.badge > 0 && (
                <span
                  className="bg-ios-system-red py-0.5 text-xs ml-1 rounded-full px-2 font-medium text-white"
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
