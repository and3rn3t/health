import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton placeholder shown while lazy-loaded dashboard content is loading. */
export function DashboardSkeleton() {
  return (
    <div
      className="mx-auto max-w-6xl space-y-6 px-3 py-4 sm:px-4 lg:px-6"
      aria-busy="true"
      aria-label="Loading content"
    >
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="flex items-end justify-between">
          <div className="space-y-2">
            <Skeleton className="h-9 w-52" />
            <Skeleton className="h-5 w-40" />
          </div>
          <Skeleton className="h-11 w-28 rounded-md" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Health Score Hero */}
          <div className="flex flex-col items-center rounded-xl border p-6">
            <Skeleton className="h-36 w-36 rounded-full" />
            <Skeleton className="mt-4 h-5 w-28" />
          </div>

          {/* Metric pills */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2 rounded-2xl border p-3">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>

          {/* Quick actions */}
          <div className="space-y-3">
            <Skeleton className="h-6 w-32" />
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-xl border p-4">
                  <Skeleton className="h-10 w-10 shrink-0 rounded-xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-40" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          <div className="flex flex-col items-center rounded-2xl border p-5">
            <Skeleton className="h-32 w-32 rounded-full" />
            <div className="mt-4 flex gap-4">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-3 w-16" />
            </div>
          </div>
          <div className="space-y-3 rounded-xl border p-4">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
