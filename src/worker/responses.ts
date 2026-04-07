/**
 * Standardized API response helpers.
 *
 * Target shape: `{ ok: boolean, data?: T, error?: string }`
 *
 * Usage:
 *   return apiOk(c, { metrics, count })
 *   return apiError(c, 'not_found', 404)
 *   return apiError(c, 'validation_error', 400, { details })
 */
import type { Context } from 'hono';

export function apiOk<T>(c: Context, data?: T, status: 200 | 201 = 200) {
  return c.json({ ok: true as const, data: data ?? null }, status);
}

export function apiError(
  c: Context,
  error: string,
  status: 400 | 401 | 403 | 404 | 409 | 422 | 429 | 500 | 502 | 503 = 400,
  extra?: Record<string, unknown>
) {
  return c.json({ ok: false as const, error, ...extra }, status);
}
