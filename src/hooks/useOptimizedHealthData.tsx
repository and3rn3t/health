import { aggregateHealthRecords } from '@/lib/aggregateHealthRecords';
import type { ProcessedHealthRecord } from '@/types';
import React, { useMemo, useReducer } from 'react';
import {
  HealthDataContext,
  healthDataReducer,
  initialState,
  useDerivedHealthValues,
  useHealthDataActions,
} from './optimizedHealthDataCore';

// Provider component with optimized performance
interface HealthDataProviderProps {
  children: React.ReactNode;
  userId: string;
}

export function HealthDataProvider({
  children,
  userId: _userId,
}: HealthDataProviderProps) {
  const [state, dispatch] = useReducer(healthDataReducer, initialState);

  // Memoized action creators to prevent unnecessary re-renders
  const actions = useHealthDataActions(dispatch);

  // Wrap raw data update to also compute aggregated metrics.
  const updateRawData = React.useCallback(
    (data: ProcessedHealthRecord[]) => {
      actions.updateRawData(data);
      const aggregated = aggregateHealthRecords(data);
      actions.updateAggregatedMetrics(aggregated);
    },
    [actions]
  );

  // Memoized derived values to prevent unnecessary computations
  const derivedValues = useDerivedHealthValues(state);

  // Combine state, actions, and derived values
  const contextValue = useMemo(
    () => ({
      ...state,
      ...actions,
      updateRawData, // override with wrapped aggregator version
      ...derivedValues,
    }),
    [state, actions, updateRawData, derivedValues]
  );

  return (
    <HealthDataContext.Provider value={contextValue}>
      {children}
    </HealthDataContext.Provider>
  );
}
// Hooks moved to a separate lightweight entry to satisfy fast refresh rules.
export default HealthDataProvider;
