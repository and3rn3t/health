/**
 * React Query hooks wrapping the typed API client.
 *
 * Co-locates query keys with their hooks per project convention.
 * Uses the singleton ApiClient initialised via `initApiClient()`.
 */

import {
  type UseMutationOptions,
  type UseMutationResult,
  useMutation,
  useQuery,
  type UseQueryResult,
} from '@tanstack/react-query';
import {
  type ApiError,
  type DeviceAuthRequest,
  type DeviceAuthResponse,
  type TwoFactorStatusResponse,
  type TwoFactorToggleResponse,
  type WsUrlResponse,
  getApiClient,
} from '@/lib/api-client';

// ---------------------------------------------------------------------------
// Query keys
// ---------------------------------------------------------------------------

export const apiKeys = {
  twoFactor: ['user', '2fa'] as const,
  wsUrl: ['ws', 'url'] as const,
} as const;

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

/** GET /api/user/2fa/status */
export function use2FAStatus(): UseQueryResult<TwoFactorStatusResponse, ApiError> {
  return useQuery({
    queryKey: apiKeys.twoFactor,
    queryFn: () => getApiClient().get2FAStatus(),
  });
}

/** GET /api/ws-url */
export function useWsUrl(): UseQueryResult<WsUrlResponse, ApiError> {
  return useQuery({
    queryKey: apiKeys.wsUrl,
    queryFn: () => getApiClient().getWsUrl(),
  });
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

/** POST /api/device/auth */
export function useDeviceAuth(
  options?: UseMutationOptions<DeviceAuthResponse, ApiError, DeviceAuthRequest>,
): UseMutationResult<DeviceAuthResponse, ApiError, DeviceAuthRequest> {
  return useMutation({
    mutationFn: (body: DeviceAuthRequest) => getApiClient().deviceAuth(body),
    ...options,
  });
}

/** POST /api/user/2fa/enable */
export function useEnable2FA(
  options?: UseMutationOptions<TwoFactorToggleResponse, ApiError, void>,
): UseMutationResult<TwoFactorToggleResponse, ApiError, void> {
  return useMutation({
    mutationFn: () => getApiClient().enable2FA(),
    ...options,
  });
}

/** POST /api/user/2fa/disable */
export function useDisable2FA(
  options?: UseMutationOptions<TwoFactorToggleResponse, ApiError, void>,
): UseMutationResult<TwoFactorToggleResponse, ApiError, void> {
  return useMutation({
    mutationFn: () => getApiClient().disable2FA(),
    ...options,
  });
}

/** GET /api/user/export (returns blob) */
export function useExportUserData(
  options?: UseMutationOptions<Response, ApiError, void>,
): UseMutationResult<Response, ApiError, void> {
  return useMutation({
    mutationFn: () => getApiClient().exportUserData(),
    ...options,
  });
}
