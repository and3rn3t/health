/**
 * Secure ID Generation Utilities
 * Uses crypto.getRandomValues() for cryptographically secure ID generation
 */

import { secureRandom } from './secureRandom';

/**
 * Generate a secure random ID using crypto.getRandomValues()
 * Format: prefix-timestamp-randomString
 * @param prefix - Optional prefix for the ID (e.g., 'member', 'share', 'activity')
 * @returns A secure random ID string
 */
export function generateSecureId(prefix?: string): string {
  // Use crypto.getRandomValues for secure random bytes
  const randomBytes = new Uint8Array(9);
  crypto.getRandomValues(randomBytes);

  // Convert to base36 string (alphanumeric)
  const randomString = Array.from(randomBytes, byte => byte.toString(36)).join('').slice(0, 9);
  const timestamp = Date.now();

  return prefix ? `${prefix}-${timestamp}-${randomString}` : `${timestamp}-${randomString}`;
}

/**
 * Generate a secure UUID-like ID
 * Uses crypto.randomUUID() if available, falls back to secure random generation
 * @returns A UUID string
 */
export function generateSecureUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  // Fallback: generate UUID v4 format using secure random
  const randomBytes = new Uint8Array(16);
  crypto.getRandomValues(randomBytes);

  // Set version (4) and variant bits
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40; // Version 4
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80; // Variant 10

  // Convert to UUID format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
}
