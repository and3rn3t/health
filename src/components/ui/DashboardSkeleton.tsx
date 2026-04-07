import { Skeleton } from '@/components/ui/skeleton';

/** Skeleton placeholder shown while lazy-loaded dashboard content is loading. */
export function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1600px] space-y-6" aria-busy="true" aria-label="Loading content">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-9 w-28 rounded-md" />
      </div>

      {/* Metric cards row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl border p-4 space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-32" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="rounded-xl border p-6 space-y-4">
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>

      {/* Two-column detail area */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
        <div className="rounded-xl border p-4 space-y-3">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    </div>
  );
}
