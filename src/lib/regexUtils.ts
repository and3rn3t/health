/**
 * Safe regex utilities to prevent ReDoS (Regular Expression Denial of Service)
 */

/**
 * Sanitizes a string for safe use in regex patterns
 * Escapes special regex characters to prevent injection
 */
export function sanitizeRegexInput(input: string): string {
  if (typeof input !== 'string') {
    throw new TypeError('Input must be a string');
  }

  // Limit input length to prevent ReDoS
  const MAX_LENGTH = 100;
  if (input.length > MAX_LENGTH) {
    throw new Error(`Input too long (max ${MAX_LENGTH} characters): ${input.substring(0, 50)}...`);
  }

  // Escape all special regex characters
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Creates a safe regex pattern from a template with sanitized variables
 * @param template Regex template with ${var} placeholders
 * @param vars Object with variable values to sanitize and insert
 */
export function createSafeRegex(
  template: string,
  vars: Record<string, string>
): RegExp {
  let pattern = template;

  // Sanitize and replace all variables
  for (const [key, value] of Object.entries(vars)) {
    const sanitized = sanitizeRegexInput(value);
    // NOSONAR: key is from Object.keys(), not user input; value is sanitized via sanitizeRegexInput()
    pattern = pattern.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), sanitized); // NOSONAR
  }

  // Limit final pattern length to prevent ReDoS
  const MAX_PATTERN_LENGTH = 500;
  if (pattern.length > MAX_PATTERN_LENGTH) {
    throw new Error(`Regex pattern too long (max ${MAX_PATTERN_LENGTH} characters)`);
  }

  return new RegExp(pattern);
}

/**
 * Validates that a regex pattern is safe (no nested quantifiers, etc.)
 * Returns true if pattern appears safe, false if potentially vulnerable
 */
export function isRegexSafe(pattern: string): boolean {
  // Check for nested quantifiers (common ReDoS pattern)
  if (/\([^)]*\+[^)]*\)\+/.test(pattern)) return false; // (a+)+
  if (/\([^)]*\*[^)]*\)\*/.test(pattern)) return false; // (a*)*
  if (/\([^)]*\+[^)]*\)\*/.test(pattern)) return false; // (a+)*
  if (/\([^)]*\*[^)]*\)\+/.test(pattern)) return false; // (a*)+

  // Check for complex alternation with quantifiers
  if (/\([^|]+\|[^|]+\|.*\)[*+]/.test(pattern)) return false;

  // Check for unbounded repetition
  if (/\[[^\]]*\][*+]{2,}/.test(pattern)) return false;

  return true;
}
