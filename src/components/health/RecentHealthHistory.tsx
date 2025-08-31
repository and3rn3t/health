import { useMemo, useState, useEffect } from 'react';
// removed useHealthDataQuery in favor of infinite query
import { useHealthDataInfiniteQuery } from '@/hooks/useHealthDataInfiniteQuery';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Skeleton } from '@/components/ui/skeleton';

type Metric =
  | 'heart_rate'
  | 'walking_steadiness'
  | 'steps'
  | 'oxygen_saturation';
type Props = { metric?: Metric; limit?: number; showFilter?: boolean };

export function RecentHealthHistory({
  metric,
  limit = 10,
  showFilter = true,
}: Props) {
  const [selected, setSelected] = useState<Metric>(metric || 'heart_rate');
  const [pageSize] = useState<number>(limit);
  useEffect(() => {
    if (metric && metric !== selected) setSelected(metric);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [metric]);

  const { data, isLoading, isError, refetch, fetchNextPage, hasNextPage } =
    useHealthDataInfiniteQuery({
      metric: selected,
      limit: pageSize,
    });
  const items = useMemo(() => {
    const pages = data?.pages ?? [];
    const flat = pages.flatMap((p) => p.items);
    return flat;
  }, [data]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2">
            Recent Health History
            {selected && <Badge variant="outline">{selected}</Badge>}
          </CardTitle>
          {showFilter && (
            <ToggleGroup
              type="single"
              value={selected}
              onValueChange={(v) => v && setSelected(v as Metric)}
            >
              <ToggleGroupItem value="heart_rate">HR</ToggleGroupItem>
              <ToggleGroupItem value="steps">Steps</ToggleGroupItem>
              <ToggleGroupItem value="walking_steadiness">
                Steady
              </ToggleGroupItem>
              <ToggleGroupItem value="oxygen_saturation">SpO₂</ToggleGroupItem>
            </ToggleGroup>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <ul className="space-y-2">
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
            <Skeleton className="h-5 w-full" />
          </ul>
        )}
        {isError && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-red-600">Failed to load</span>
            <button className="underline" onClick={() => refetch()}>
              Retry
            </button>
          </div>
        )}
        {!isLoading && !isError && items.length === 0 && (
          <div className="text-muted-foreground text-sm">No recent data.</div>
        )}
        <ul className="space-y-2">
          {items.map((row) => (
            <li
              key={`${row.type}:${row.processedAt}`}
              className="flex items-center justify-between text-sm"
            >
              <span className="font-medium">{row.type.replace('_', ' ')}</span>
              <span className="tabular-nums">{row.value}</span>
              <span className="text-muted-foreground">
                {new Date(row.processedAt).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
        {!isLoading && !isError && items.length > 0 && hasNextPage && (
          <div className="mt-3 text-right">
            <button
              type="button"
              className="text-sm underline"
              onClick={() => fetchNextPage()}
            >
              Load more
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default RecentHealthHistory;
