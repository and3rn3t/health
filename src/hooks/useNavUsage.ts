import { useKV } from '@/hooks/useCloudflareKV';
import { useCallback, useMemo } from 'react';

export type NavUsageEntry = {
  id: string;
  visits: number;
  lastVisited: number; // epoch ms
};

type UsageMap = Record<string, NavUsageEntry>;

const KV_KEY = 'nav-usage';

export function useNavUsage() {
  const [usage, setUsage] = useKV<UsageMap>(KV_KEY, {});

  const recordUse = useCallback(
    (id: string) => {
      const current = usage?.[id];
      const next: UsageMap = {
        ...(usage || {}),
        [id]: {
          id,
          visits: (current?.visits || 0) + 1,
          lastVisited: Date.now(),
        },
      };
      setUsage(next);
    },
    [usage, setUsage]
  );

  const getVisits = useCallback(
    (id: string) => usage?.[id]?.visits || 0,
    [usage]
  );
  const getLastVisited = useCallback(
    (id: string) => usage?.[id]?.lastVisited || 0,
    [usage]
  );

  // Score: prioritize recent activity, then total visits
  const scoreOf = useCallback(
    (id: string) => {
      const entry = usage?.[id];
      if (!entry) return 0;
      const now = Date.now();
      const hoursAgo = Math.max(
        1,
        (now - entry.lastVisited) / (1000 * 60 * 60)
      );
      const recencyBoost = 100 / hoursAgo; // decays over time
      return recencyBoost + entry.visits * 2;
    },
    [usage]
  );

  const sortByUsage = useCallback(
    <T extends { id: string }>(items: T[]): T[] => {
      return [...items].sort((a, b) => scoreOf(b.id) - scoreOf(a.id));
    },
    [scoreOf]
  );

  const hasAnyUsage = useMemo(
    () => Object.keys(usage || {}).length > 0,
    [usage]
  );

  return {
    usage,
    recordUse,
    sortByUsage,
    getVisits,
    getLastVisited,
    hasAnyUsage,
  };
}
