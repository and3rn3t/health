---
description: 'Review code for security vulnerabilities, health data privacy compliance, and OWASP Top 10 issues specific to the VitalSense platform.'
agent: 'security-reviewer'
---

Perform a security review of the provided code. Focus on:

1. **Input Validation**: Verify zod schemas validate all inputs at boundaries
2. **Authentication**: Check JWT verification on protected routes
3. **Data Privacy**: Ensure no PII or raw health data in logs/errors
4. **Injection Prevention**: Check for XSS, SQL injection, command injection
5. **Secrets Management**: Verify secrets use `c.env` bindings, not hardcoded
6. **Rate Limiting**: Confirm mutation endpoints use RateLimiter DO
7. **CORS**: Verify proper origin restrictions in Worker middleware
8. **WebSocket Security**: Auth-gated upgrade, message validation with zod

Report findings by severity: CRITICAL, HIGH, MEDIUM, LOW
