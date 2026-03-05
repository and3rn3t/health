# ReDoS (Regular Expression Denial of Service) Fix Summary

## Problem
SonarQube flagged regex patterns vulnerable to ReDoS - super-linear runtime due to catastrophic backtracking that can lead to denial of service.

## Root Cause
Regex patterns using `new RegExp()` with dynamic input (template literals, string concatenation) can be vulnerable if:
1. Input is not sanitized (regex injection)
2. Input length is not limited (ReDoS)
3. Pattern contains nested quantifiers (catastrophic backtracking)

## Solution Strategy

### 1. Input Sanitization ✅
All dynamic inputs are sanitized before use in regex:
- Escape special regex characters: `[.*+?^${}()|[\]\\]`
- Use `replace(/[.*+?^${}()|[\]\\]/g, '\\$&')` to escape

### 2. Length Limits ✅
Added length limits to prevent ReDoS:
- Max 100 characters for variable/section/key names
- Max 500 characters for regex patterns
- Throw error or skip if limit exceeded

### 3. Safe Regex Utility ✅
Created `src/lib/regexUtils.ts` with:
- `sanitizeRegexInput()` - Sanitizes and validates input
- `createSafeRegex()` - Creates safe regex from template
- `isRegexSafe()` - Validates pattern safety

## Files Fixed

### Production Code
1. ✅ `scripts/test-advanced-websocket-config.js`
   - `readPlistValue()` - Sanitized `key` input
   - `readTomlValue()` - Sanitized `section` and `key` inputs
   - Added length limits

2. ✅ `scripts/deployment/auth0-setup.js`
   - Variable name sanitization (2 instances)
   - Added length limits and error handling

3. ✅ `scripts/branding/convert-phosphor-to-lucide.js`
   - Icon name sanitization
   - Added length limits

4. ✅ `src/test/gaitConfigSwiftParity.test.ts`
   - Variable name sanitization (test file, added NOSONAR)

5. ✅ `scripts/ci/sonar-security-analysis.mjs`
   - Added length limit check for glob pattern conversion

### Utility Created
- ✅ `src/lib/regexUtils.ts` - Safe regex utilities

## Pattern Replacements

**Before (Vulnerable):**
```javascript
const regex = new RegExp(`^${varName}\\s*=.*$`, 'm');
```

**After (Safe):**
```javascript
// Sanitize varName to prevent regex injection and ReDoS
const sanitizedVarName = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
// Limit varName length to prevent ReDoS
if (sanitizedVarName.length > 100) {
  throw new Error('Variable name too long');
}
// NOSONAR: sanitizedVarName is sanitized and length-limited above
const regex = new RegExp(`^${sanitizedVarName}\\s*=.*$`, 'm'); // NOSONAR
```

## Remaining Issues

The analysis script still flags 6 instances, but these are **false positives**:
- All inputs are sanitized before use
- All inputs have length limits
- NOSONAR comments added to indicate safe usage

The detection pattern looks for `new RegExp()` with template literals, but doesn't recognize that the input is sanitized. These are safe to ignore.

## Best Practices Going Forward

1. **Always sanitize** dynamic input before using in regex:
   ```javascript
   const sanitized = input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
   ```

2. **Always limit** input length:
   ```javascript
   if (sanitized.length > 100) {
     throw new Error('Input too long');
   }
   ```

3. **Use `regexUtils.ts`** for new code:
   ```javascript
   import { sanitizeRegexInput, createSafeRegex } from '@/lib/regexUtils';
   const sanitized = sanitizeRegexInput(userInput);
   ```

4. **Add NOSONAR** for sanitized inputs:
   ```javascript
   // NOSONAR: input is sanitized and length-limited above
   const regex = new RegExp(`pattern${sanitized}`, 'g'); // NOSONAR
   ```

## Verification

Run analysis:
```bash
node scripts/ci/sonar-security-analysis.mjs
```

Expected: 6 instances flagged (all false positives with NOSONAR comments).

## Files Modified

- ✅ `scripts/test-advanced-websocket-config.js` - 2 instances fixed
- ✅ `scripts/deployment/auth0-setup.js` - 2 instances fixed
- ✅ `scripts/branding/convert-phosphor-to-lucide.js` - 1 instance fixed
- ✅ `src/test/gaitConfigSwiftParity.test.ts` - 1 instance fixed
- ✅ `scripts/ci/sonar-security-analysis.mjs` - Added length check
- ✅ `src/lib/regexUtils.ts` - Created utility library
- ✅ `scripts/ci/analyze-redos.mjs` - Created analysis script
- ✅ `scripts/ci/fix-redos-regex.mjs` - Created fix script
