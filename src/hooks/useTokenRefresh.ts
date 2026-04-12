/**
 * useTokenRefresh — Silent token refresh with automatic 401 retry.
 *
 * Leverages Auth0's refresh token rotation (configured in auth0Config)
 * to keep the session alive without forcing re-login.
 */

import { useCallback, useEffect, useRef } from 'react';

interface TokenRefreshConfig {
  /** How many ms before expiry to proactively refresh (default: 60_000 = 1 min) */
  refreshBufferMs?: number;
  /** Auth0 SDK getAccessTokenSilently, injected to avoid circular deps */
  getAccessTokenSilently?: (opts?: { cacheMode?: string }) => Promise<string>;
  /** Whether auth is enabled */
  enabled?: boolean;
}

interface TokenRefreshReturn {
  /** Call this to force a fresh access token (e.g. after a 401) */
  refreshToken: () => Promise<string | null>;
  /** Wrap a fetch call to auto-retry once on 401 with a refreshed token */
  fetchWithRefresh: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

export function useTokenRefresh(config: TokenRefreshConfig = {}): TokenRefreshReturn {
  const {
    refreshBufferMs = 60_000,
    getAccessTokenSilently,
    enabled = true,
  } = config;

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const refreshingRef = useRef<Promise<string | null> | null>(null);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!getAccessTokenSilently || !enabled) return null;

    // Deduplicate concurrent refresh calls
    const pending = refreshingRef.current;
    if (pending !== null) return pending;

    refreshingRef.current = (async () => {
      try {
        const token = await getAccessTokenSilently({ cacheMode: 'off' });
        return token;
      } catch (error) {
        console.error('[TokenRefresh] Silent refresh failed:', error);
        return null;
      } finally {
        refreshingRef.current = null;
      }
    })();

    return refreshingRef.current;
  }, [getAccessTokenSilently, enabled]);

  const fetchWithRefresh = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
      const response = await fetch(input, init);

      if (response.status !== 401 || !enabled) return response;

      // Try refreshing the token and retry once
      const newToken = await refreshToken();
      if (!newToken) return response;

      const retryInit: RequestInit = {
        ...init,
        headers: {
          ...Object.fromEntries(new Headers(init?.headers).entries()),
          Authorization: `Bearer ${newToken}`,
        },
      };

      return fetch(input, retryInit);
    },
    [refreshToken, enabled],
  );

  // Schedule proactive refresh based on token expiry
  useEffect(() => {
    if (!getAccessTokenSilently || !enabled) return;

    const scheduleRefresh = async () => {
      try {
        // Get token to read its expiry (cached, so cheap)
        const token = await getAccessTokenSilently();
        if (!token) return;

        const parts = token.split('.');
        if (parts.length < 2) return;

        const payloadStr = parts[1];
        if (!payloadStr) return;
        const payload = JSON.parse(atob(payloadStr));
        const expMs = (payload.exp as number) * 1000;
        const refreshAt = expMs - refreshBufferMs;
        const delayMs = refreshAt - Date.now();

        if (delayMs <= 0) {
          // Already expired or about to — refresh now
          void refreshToken();
          return;
        }

        timerRef.current = setTimeout(() => {
          void refreshToken();
        }, delayMs);
      } catch {
        // Can't schedule — token may not be available yet
      }
    };

    void scheduleRefresh();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [getAccessTokenSilently, enabled, refreshBufferMs, refreshToken]);

  return { refreshToken, fetchWithRefresh };
}
