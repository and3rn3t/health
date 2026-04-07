---
description: 'Review a pull request for security, test coverage, branding compliance, accessibility, and code quality against VitalSense standards.'
agent: 'security-reviewer'
---

Perform a comprehensive pull request review. Analyze the changed files for:

1. **Security**: Input validation with zod, JWT auth on protected routes, no PII in logs/errors, secrets via `c.env`
2. **Test Coverage**: New code has corresponding tests, edge cases covered, no skipped tests
3. **Branding**: User-facing text uses "VitalSense" (not "Health App")
4. **Accessibility**: ARIA labels, keyboard navigation, focus management, WCAG AA contrast
5. **Code Quality**: TypeScript strict (no `any`), ESM imports, no circular dependencies
6. **Performance**: Lazy loading for components >50KB, memoization where appropriate, bundle size impact
7. **Worker Safety**: No Node.js APIs in Worker code, proper error responses, rate limiting on mutations
8. **iOS Compliance** (if Swift files changed): SwiftLint rules, HealthKit permissions, singleton patterns

Report findings grouped by severity:
- **CRITICAL**: Must fix before merge (security vulnerabilities, data exposure)
- **HIGH**: Should fix before merge (missing validation, broken accessibility)
- **MEDIUM**: Fix soon (test gaps, performance concerns)
- **LOW**: Nice to have (style improvements, documentation gaps)

End with a summary: APPROVE, REQUEST CHANGES, or NEEDS DISCUSSION.
