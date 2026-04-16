import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  type ReactNode,
} from 'react';
import { useKV } from '@/hooks/useLocalKV';
import { HealthDataProcessor } from '@/lib/healthDataProcessor';
import type { ProcessedHealthData } from '@/types';

interface HealthDataContextValue {
  healthData: ProcessedHealthData | null;
  fallRiskScore: number;
  refreshData: () => Promise<void>;
}

const HealthDataContext = createContext<HealthDataContextValue | null>(null);

export function HealthDataProvider({ children }: { children: ReactNode }) {
  const [healthData, setHealthData] = useKV<ProcessedHealthData | null>(
    'health-data',
    null
  );

  const fallRiskScore = useMemo(() => {
    const ws = healthData?.metrics.walkingSteadiness?.average;
    if (ws == null) return 0;
    const score = (100 - ws) / 25;
    return Math.max(0, Math.min(4, Math.round(score * 10) / 10));
  }, [healthData?.metrics.walkingSteadiness?.average]);

  const refreshData = useCallback(async () => {
    const data = await HealthDataProcessor.processHealthData();
    setHealthData(data);
  }, [setHealthData]);

  const value = useMemo(
    () => ({ healthData: healthData ?? null, fallRiskScore, refreshData }),
    [healthData, fallRiskScore, refreshData]
  );

  return (
    <HealthDataContext.Provider value={value}>
      {children}
    </HealthDataContext.Provider>
  );
}

export function useHealthData(): HealthDataContextValue {
  const ctx = useContext(HealthDataContext);
  if (!ctx) throw new Error('useHealthData must be used within HealthDataProvider');
  return ctx;
}
