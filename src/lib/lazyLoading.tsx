/**
 * Utilities for lazy loading components with consistent fallback patterns
 */

import { ComponentType, lazy, LazyExoticComponent } from 'react';
import { LucideIcon } from 'lucide-react';

/**
 * Creates a lazy-loaded component with a consistent fallback UI
 */
export function createLazyComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<{ default: T }>,
  fallbackConfig: {
    title: string;
    message: string;
    icon: LucideIcon;
  }
): LazyExoticComponent<T> {
  return lazy(
    () =>
      importFn().catch(() => ({
        default: (() => {
          const FallbackComponent: ComponentType = () => {
            const { title, message, icon: Icon } = fallbackConfig;
            return (
              <div className="p-8 text-center">
                <Icon className="mx-auto mb-4 h-12 w-12 text-vitalsense-teal" />
                <h2 className="mb-2 text-2xl font-bold text-foreground">
                  {title}
                </h2>
                <p className="text-muted-foreground">{message}</p>
              </div>
            );
          };
          return FallbackComponent as T;
        })(),
      }))
  );
}

/**
 * Creates a lazy component with a named export (for components that export named exports)
 */
export function createLazyNamedComponent<T extends ComponentType<Record<string, unknown>>>(
  importFn: () => Promise<Record<string, T>>,
  exportName: string,
  fallbackConfig: {
    title: string;
    message: string;
    icon: LucideIcon;
  }
): LazyExoticComponent<T> {
  return lazy(
    () =>
      importFn()
        .then((module) => ({
          default: module[exportName] as T,
        }))
        .catch(() => ({
          default: (() => {
            const FallbackComponent: ComponentType = () => {
              const { title, message, icon: Icon } = fallbackConfig;
              return (
                <div className="p-8 text-center">
                  <Icon className="mx-auto mb-4 h-12 w-12 text-vitalsense-teal" />
                  <h2 className="mb-2 text-2xl font-bold text-foreground">
                    {title}
                  </h2>
                  <p className="text-muted-foreground">{message}</p>
                </div>
              );
            };
            return FallbackComponent as T;
          })(),
        }))
  );
}
