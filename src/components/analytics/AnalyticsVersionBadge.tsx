import useAnalyticsVersionMonitor from '@/hooks/useAnalyticsVersionMonitor';
import React from 'react';

interface Props {
  className?: string;
  /** Show detailed mismatch text instead of simple indicator. */
  verbose?: boolean;
}

export const AnalyticsVersionBadge: React.FC<Props> = ({
  className = '',
  verbose = false,
}) => {
  const { gait, fallRisk, loading, error, lastChecked, refresh } =
    useAnalyticsVersionMonitor({ intervalMs: 300_000 });

  const mismatches: string[] = [];
  if (gait.remote && !gait.inSync)
    mismatches.push(
      `Gait mismatch (local ${gait.local} ≠ remote ${gait.remote})`
    );
  if (fallRisk.remote && !fallRisk.inSync)
    mismatches.push(
      `FallRisk mismatch (local ${fallRisk.local} ≠ remote ${fallRisk.remote})`
    );

  const statusColor = error
    ? 'bg-red-500'
    : mismatches.length > 0
      ? 'bg-amber-500'
      : 'bg-emerald-600';

  const title = error
    ? `Analytics version check failed: ${error}`
    : mismatches.length > 0
      ? mismatches.join('; ')
      : 'Analytics configs in sync';

  return (
    <button
      type="button"
      onClick={() => refresh()}
      title={
        title +
        (lastChecked ? ` (Last: ${lastChecked.toLocaleTimeString()})` : '')
      }
      className={`py-0.5 text-xs inline-flex items-center gap-1 rounded-md px-2 font-medium text-white shadow-sm transition-colors ${statusColor} focus:ring-blue-500 hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-1 ${className}`}
    >
      <span>Analytics</span>
      {loading && <span className="animate-pulse">…</span>}
      {!loading && mismatches.length === 0 && !error && <span>✓</span>}
      {!loading && error && <span>!</span>}
      {!loading && mismatches.length > 0 && <span>⚠</span>}
      {verbose && !loading && (
        <span className="ml-1 max-w-[12rem] truncate">
          {error
            ? 'error'
            : mismatches.length > 0
              ? mismatches.join(', ')
              : 'in sync'}
        </span>
      )}
    </button>
  );
};

export default AnalyticsVersionBadge;
