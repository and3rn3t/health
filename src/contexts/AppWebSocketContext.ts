import type { WebSocketClient } from '@/lib/websocketClient';
import { createContext } from 'react';

export interface AppWsContextValue {
  client: WebSocketClient | null;
  socket: WebSocket | null;
  lastMetrics: Record<string, number>;
}

export const AppWsContext = createContext<AppWsContextValue | undefined>(
  undefined
);
