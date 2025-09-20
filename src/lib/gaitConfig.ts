/** Centralized gait analytics configuration (thresholds & normalizers). */
export const gaitConfig = {
  // Order of keys matters for stable hashing (mirrors export artifact & Swift parity)
  magnitude: {
    moderate: 0.02,
    strong: 0.04,
  },
  minimumConfidence: 0.15,
  momentum: {
    downwardThreshold: -0.6,
    fallbackRelative: 0.5,
    relativeSlopeNormalizer: 0.05,
    upwardThreshold: 0.6,
  },
  stabilityRelativeSlopeThreshold: 0.01,
} as const;
export type GaitConfig = typeof gaitConfig;

/**
 * Deterministic short hash (FNV‑1a 32-bit) of the stable JSON form of gaitConfig.
 * Used for cross-language parity (Swift) and API exposure so clients can assert
 * they are interpreting analytics with matching threshold configuration.
 */
function hashConfig(obj: unknown): string {
  const json = JSON.stringify(obj);
  let h = 0x811c9dc5; // FNV offset basis
  for (let i = 0; i < json.length; i++) {
    h ^= json.charCodeAt(i);
    // unsigned 32-bit FNV prime multiplication (×16777619) with overflow
    h = (h >>> 0) * 0x01000193;
  }
  return ('00000000' + (h >>> 0).toString(16)).slice(-8);
}

export const GAIT_ANALYTICS_VERSION = hashConfig(gaitConfig);
