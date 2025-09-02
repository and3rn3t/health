import {
  HealthDataContext,
  healthDataReducer,
  initialState,
  useDerivedHealthValues,
  useHealthDataActions,
  type HealthDataContextValue,
} from '@/hooks/optimizedHealthDataCore';
import React, { useMemo, useReducer } from 'react';

// Provider component with optimized performance
interface HealthDataProviderProps {
  children: React.ReactNode;
}

export function HealthDataProvider({ children }: HealthDataProviderProps) {
  const [state, dispatch] = useReducer(healthDataReducer, initialState);

  // Memoized action creators to prevent unnecessary re-renders
  const actions = useHealthDataActions(dispatch);

  // Memoized derived values to prevent unnecessary computations
  const derivedValues = useDerivedHealthValues(state);

  // Combine state, actions, and derived values
  const contextValue: HealthDataContextValue = useMemo(
    () => ({
      ...state,
      ...actions,
      ...derivedValues,
    }),
    [state, actions, derivedValues]
  );

  return (
    <HealthDataContext.Provider value={contextValue}>
      {children}
    </HealthDataContext.Provider>
  );
}
