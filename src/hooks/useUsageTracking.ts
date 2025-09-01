import { useEffect, useRef } from 'react';
import { useKV } from '@github/spark/hooks';

interface UsagePattern {
  feature: string;
  visits: number;
  lastVisited: number;
  timeSpent: number;
  actions: number;
}

interface UseUsageTrackingOptions {
  trackTimeSpent?: boolean;
  trackActions?: boolean;
}

export function useUsageTracking(
  featureName: string,
  options: UseUsageTrackingOptions = {}
) {
  const [usagePatterns, setUsagePatterns] = useKV<UsagePattern[]>(
    'usage-patterns',
    []
  );
  const startTimeRef = useRef<number>(Date.now());
  const actionCountRef = useRef<number>(0);

  const { trackTimeSpent = true, trackActions = true } = options;

  // Track visit when component mounts
  useEffect(() => {
    startTimeRef.current = Date.now();

    setUsagePatterns((currentPatterns) => {
      const existingPattern = currentPatterns.find(
        (p) => p.feature === featureName
      );
      if (existingPattern) {
        return currentPatterns.map((p) =>
          p.feature === featureName
            ? {
                ...p,
                visits: p.visits + 1,
                lastVisited: Date.now(),
              }
            : p
        );
      } else {
        return [
          ...currentPatterns,
          {
            feature: featureName,
            visits: 1,
            lastVisited: Date.now(),
            timeSpent: 0,
            actions: 0,
          },
        ];
      }
    });
  }, [featureName, setUsagePatterns]);

  // Track time spent when component unmounts
  useEffect(() => {
    return () => {
      if (!trackTimeSpent) return;

      const timeSpent = Date.now() - startTimeRef.current;
      const actions = actionCountRef.current;

      setUsagePatterns((currentPatterns) =>
        currentPatterns.map((p) =>
          p.feature === featureName
            ? {
                ...p,
                timeSpent: p.timeSpent + timeSpent,
                actions: p.actions + actions,
              }
            : p
        )
      );
    };
  }, [featureName, trackTimeSpent, setUsagePatterns]);

  // Function to track actions
  const trackAction = (actionType?: string) => {
    if (!trackActions) return;

    actionCountRef.current += 1;

    // Optionally log specific action types
    if (actionType) {
      console.log(`Action tracked: ${actionType} in ${featureName}`);
    }
  };

  // Function to get current usage stats for this feature
  const getCurrentUsage = () => {
    return (
      usagePatterns.find((p) => p.feature === featureName) || {
        feature: featureName,
        visits: 0,
        lastVisited: 0,
        timeSpent: 0,
        actions: 0,
      }
    );
  };

  return {
    trackAction,
    getCurrentUsage,
    usagePatterns,
  };
}
