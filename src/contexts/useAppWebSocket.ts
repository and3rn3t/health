import { useContext } from 'react';
import { AppWsContext } from './AppWebSocketContext';

export function useAppWebSocket() {
  const ctx = useContext(AppWsContext);
  if (!ctx)
    throw new Error('useAppWebSocket must be used within AppWebSocketProvider');
  return ctx;
}
