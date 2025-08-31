// Utilities for WS settings validation and helpers

export function isValidWsUrl(url: string): boolean {
  return /^wss?:\/\//i.test(url.trim());
}

export function isValidTtl(ttl: number): boolean {
  return Number.isFinite(ttl) && ttl >= 60 && ttl <= 3600;
}

export function clampTtl(ttl: number, fallback = 600): number {
  const n = Number(ttl) || fallback;
  if (n < 60) return 60;
  if (n > 3600) return 3600;
  return Math.floor(n);
}

export function decodeJwtExp(token: string): number | null {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const json = JSON.parse(atob(parts[1]));
    const exp = json?.exp;
    if (typeof exp === 'number' && Number.isFinite(exp)) return exp;
    return null;
  } catch {
    return null;
  }
}

export function formatCountdown(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`;
}
