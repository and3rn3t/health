/**
 * Cryptographically secure random number utilities
 * Replaces Math.random() for security-sensitive operations
 */

/**
 * Generate a cryptographically secure random number between 0 and 1
 * Use this instead of Math.random() for security-sensitive operations
 */
export function secureRandom(): number {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  // Convert to 0-1 range (divide by max 32-bit unsigned int)
  return array[0] / (0xffffffff + 1);
}

/**
 * Generate a cryptographically secure random integer in a range [min, max)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 */
export function secureRandomInt(min: number, max: number): number {
  const range = max - min;
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % range);
}

/**
 * Generate a cryptographically secure random float in a range [min, max)
 * @param min Minimum value (inclusive)
 * @param max Maximum value (exclusive)
 */
export function secureRandomFloat(min: number, max: number): number {
  return min + secureRandom() * (max - min);
}

/**
 * Generate a cryptographically secure random boolean
 */
export function secureRandomBoolean(): boolean {
  return secureRandom() < 0.5;
}

/**
 * Select a random element from an array using cryptographically secure randomness
 */
export function secureRandomChoice<T>(array: T[]): T {
  if (array.length === 0) {
    throw new Error('Cannot select from empty array');
  }
  return array[secureRandomInt(0, array.length)];
}

/**
 * Shuffle an array using cryptographically secure randomness (Fisher-Yates)
 */
export function secureShuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = secureRandomInt(0, i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
