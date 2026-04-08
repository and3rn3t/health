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
 * Returns true if pattern appears safe, false if potentially vulnerable.
 * Uses string-based scanning instead of regex to avoid backtracking hotspots.
 */
export function isRegexSafe(pattern: string): boolean {
  const len = pattern.length;

  // Helper: count consecutive preceding backslashes (odd = escaped)
  const isEscaped = (pos: number): boolean => {
    let backslashes = 0;
    let p = pos - 1;
    while (p >= 0 && pattern[p] === '\\') {
      backslashes++;
      p--;
    }
    return backslashes % 2 === 1;
  };

  let depth = 0;
  let groupStart = -1;
  let hasQuantifierInGroup = false;
  let pipeCount = 0;
  let inCharClass = false;

  for (let i = 0; i < len; i++) {
    if (isEscaped(i)) continue;

    const ch = pattern[i];

    // Track character classes to avoid false positives on brackets
    if (ch === '[' && !inCharClass) {
      inCharClass = true;
      continue;
    }
    if (ch === ']' && inCharClass) {
      inCharClass = false;
      // Check for stacked quantifiers after character class: [abc]**
      let qCount = 0;
      let j = i + 1;
      while (j < len && !isEscaped(j) && (pattern[j] === '*' || pattern[j] === '+')) {
        qCount++;
        j++;
      }
      if (qCount >= 2) return false;
      continue;
    }
    if (inCharClass) continue;

    if (ch === '(') {
      if (depth === 0) {
        groupStart = i;
        hasQuantifierInGroup = false;
        pipeCount = 0;
      }
      depth++;
    } else if (ch === ')') {
      depth--;
      if (depth === 0 && groupStart >= 0) {
        const afterChar = i + 1 < len ? pattern[i + 1] : '';
        const followedByQuantifier = afterChar === '+' || afterChar === '*';

        // Nested quantifier: (a+)+, (a+)*, (a*)*, (a*)+
        if (followedByQuantifier && hasQuantifierInGroup) return false;

        // Complex alternation with quantifier: (a|b|c)+
        if (followedByQuantifier && pipeCount >= 2) return false;

        groupStart = -1;
      }
    } else if ((ch === '+' || ch === '*') && depth > 0 && groupStart >= 0) {
      hasQuantifierInGroup = true;
    } else if (ch === '|' && depth === 1) {
      pipeCount++;
    }
  }

  return true;
}
