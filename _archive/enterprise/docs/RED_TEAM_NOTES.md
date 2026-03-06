# Red-Team Notes — VitalSense

**Version**: 1.0  
**Date**: 2026-02-22  
**Owner**: Security Team  
**Classification**: Internal — do not publish publicly  
**Review cadence**: Before each major release and quarterly

---

## Purpose

This document records adversarial thinking and red-team findings for VitalSense. It is not a penetration test report (which requires dedicated tooling and scope authorization), but a structured record of threat scenarios, observed weaknesses, and recommended hardening actions. Findings should feed back into the risk register referenced in `SECURITY_BASELINE.md`.

---

## 1. Threat Model Summary

**Asset**: PHI and PII stored in Cloudflare KV/R2 and transmitted over WebSocket/HTTPS.  
**Adversary profiles**:
- External attacker (no prior access) targeting the Cloudflare Worker API
- Malicious caregiver (authorized user attempting privilege escalation)
- Compromised CI/CD pipeline (supply-chain attacker)
- Physical device attacker (stolen phone)

**Trust boundaries**:
1. iOS App ↔ Cloudflare Worker edge (TLS)
2. Cloudflare Worker ↔ KV/R2 (internal Cloudflare network)
3. Node WebSocket bridge ↔ Worker (local network; authenticated by optional API key)
4. Auth0 ↔ Worker (JWT validation)

---

## 2. Findings

### 2.1 Authentication and Authorization

#### F-01 — WebSocket bridge uses optional API-key auth (Medium)

**Scenario**: The Node.js WebSocket bridge validates the `Origin` header and an optional `WS_API_KEY`. Without the key set, any client on the same network can send messages to the bridge.

**Attack**: Internal network attacker or misconfigured Docker container forges health update messages, injecting false data (e.g., fake fall events triggering emergency notifications).

**Current state**: `SECURITY_BASELINE.md` already notes this gap; the key is optional in development.

**Recommendation**:
- Make `WS_API_KEY` mandatory in production; Worker should reject connections without it.
- Replace the Node bridge with an authenticated Durable Object or Cloudflare Socket Worker for production.
- Add a `x-request-id` / nonce to WebSocket messages to prevent replay attacks.

#### F-02 — JWT claims validation completeness (Low–Medium)

**Scenario**: The Worker validates `iss`, `aud`, `exp`, `nbf` per `SECURITY_BASELINE.md`. However, there is no documented check of the `sub` claim against an allow-list of registered users.

**Attack**: An attacker with a valid JWT from a different tenant (if Auth0 is shared) could access another user's health data by guessing or enumerating user IDs in request paths.

**Recommendation**:
- Validate that the `sub` claim in the JWT matches the `userId` in the requested resource path.
- Add integration test asserting cross-user data access returns 403.

#### F-03 — Caregiver privilege escalation (Medium)

**Scenario**: Caregiver access is gated by user consent. If the consent check is performed client-side or in an easily-forged token claim, a malicious caregiver could elevate their own access.

**Attack**: Caregiver modifies their Auth0 JWT payload (before signing — not possible — or via compromised Auth0 credentials) to add additional user IDs to their access scope.

**Recommendation**:
- Store caregiver authorization server-side in KV; never derive access rights from token claims alone.
- Add audit log entry on every caregiver data access.

---

### 2.2 Data Injection and Input Validation

#### F-04 — Health metric value range not enforced (Medium)

**Scenario**: The `healthMetricSchema` validates metric type and timestamp but does not restrict the numeric `value` range (e.g., heart rate of 99999 bpm is schema-valid).

**Attack**: Attacker submits extreme metric values to skew the fall risk model output (model poisoning), trigger false anomaly alerts, or cause downstream integer overflow / denial of service in analytics.

**Code location**: `src/schemas/health.ts` — `healthMetricSchema.value: z.number()`

**Recommendation**:
- Add per-type range validation (e.g., `heart_rate`: 20–300, `steps`: 0–100 000/day, `walking_steadiness`: 0–1).
- Reject out-of-range values with a descriptive 400 response; log (without PHI) for anomaly detection.

#### F-05 — Batch upload size not bounded (Low)

**Scenario**: `healthMetricBatchSchema.metrics` is an unbounded array.

**Attack**: Attacker sends a single request with millions of metric records, causing memory exhaustion or CPU timeout in the Cloudflare Worker.

**Recommendation**:
- Add `z.array(healthMetricSchema).max(1000)` (or appropriate batch limit) to the batch schema.
- Add a Cloudflare WAF rate-limiting rule on `POST /api/metrics/batch`.

---

### 2.3 Emergency Alert Abuse

#### F-06 — Emergency alert spam (High)

**Scenario**: The app sends emergency notifications to designated contacts when a fall event or critical health anomaly is detected.

**Attack**: Attacker with access to the API (valid JWT) repeatedly posts `fall_event` metrics, spamming emergency contacts with false alerts. This could cause harm (unnecessary emergency responses, caregiver fatigue) and constitutes a reputational risk.

**Recommendation**:
- Implement server-side deduplication: suppress duplicate emergency alerts within a configurable window (e.g., 10 minutes).
- Rate-limit `fall_event` submissions per user per hour.
- Add an alert-confirmation step in the iOS app before dispatching to contacts (already partially implemented per `SECURITY_BASELINE.md` debounce note).

---

### 2.4 Data Exfiltration

#### F-07 — Bulk export endpoint lacks rate limiting (Medium)

**Scenario**: A user (or attacker with stolen credentials) can call `/api/export` repeatedly to exfiltrate the full health record history.

**Attack**: Credential-stuffing attack on Auth0 followed by bulk export of the victim's PHI.

**Recommendation**:
- Rate-limit export endpoint (e.g., 1 full export per 24 hours per user).
- Send in-app notification when a data export is initiated.
- Require step-up authentication (re-enter password / MFA) before export.

#### F-08 — R2 object keys may be guessable (Low)

**Scenario**: If R2 object keys are derived from predictable patterns (e.g., `userId/date/type`), an attacker who compromises the Cloudflare API token could enumerate and download objects for arbitrary users.

**Recommendation**:
- Use opaque, random object key prefixes (UUID-based) rather than human-readable paths.
- Restrict R2 access to the Worker service binding; no direct public R2 bucket access.

---

### 2.5 Supply Chain and CI/CD

#### F-09 — No dependency provenance attestation (Medium)

**Scenario**: The project uses `pnpm` with a lock file and Renovate for updates, but there is no SLSA provenance verification or npm package signing check.

**Attack**: A compromised npm package (e.g., via a dependency confusion or typosquatting attack) is silently installed during CI, injecting malicious code into the Worker or iOS app.

**Recommendation**:
- Enable `npm audit` / `pnpm audit` as a required CI gate (check if already in Makefile).
- Add `--frozen-lockfile` to all CI install commands to prevent lock file tampering.
- Consider enabling GitHub dependency review action for PRs.
- Evaluate npm provenance attestation for first-party published packages.

#### F-10 — Secrets in environment variables accessible to Worker bindings (Low)

**Scenario**: `ENC_KEY`, `API_AUD`, `API_ISS` are stored as Wrangler secrets. If a Worker code path inadvertently returns environment variables in an error response or logs them, secrets could be exposed.

**Current mitigations**: Structured logging is documented to omit PHI and secrets.

**Recommendation**:
- Add a CI lint rule or test asserting that no Worker response body contains the string patterns of known secret keys.
- Rotate `ENC_KEY` and auth credentials on any suspected exposure (see `SECRET_ROTATION.md`).

---

### 2.6 Physical and Device Security

#### F-11 — App state visible in iOS task switcher (Low)

**Scenario**: The iOS app may display sensitive health data (heart rate, fall risk score) in the app preview shown in the iOS task switcher.

**Attack**: Physical attacker (e.g., stolen phone before lock) views health data without authentication.

**Recommendation**:
- Implement `UIApplicationDelegate.applicationDidEnterBackground` to overlay a privacy screen (blank or branded splash) before the system captures the task-switcher screenshot.

#### F-12 — No automatic session timeout (Medium)

**Scenario**: A valid JWT may remain cached in the iOS app indefinitely if the token TTL is long (e.g., 24 hours). A stolen unlocked device retains full access for that duration.

**Recommendation**:
- Set JWT `exp` to ≤ 1 hour for access tokens; use refresh tokens with short idle timeout.
- Require re-authentication (biometric or PIN) when the app moves from background to foreground after > 5 minutes.

---

## 3. Risk Register Summary

| ID | Title | Severity | Status | Priority action |
|---|---|---|---|---|
| F-01 | WebSocket bridge optional auth | Medium | Open | Require `WS_API_KEY` in production |
| F-02 | JWT sub claim not matched to resource | Low–Medium | Open | Add cross-user 403 test |
| F-03 | Caregiver privilege escalation | Medium | Open | Server-side authorization store |
| F-04 | Metric value range not validated | Medium | Open | Add per-type range to zod schema |
| F-05 | Batch upload unbounded | Low | Open | Add array size limit |
| F-06 | Emergency alert spam | High | Open | Server-side dedup + rate limit |
| F-07 | Bulk export no rate limit | Medium | Open | Rate-limit + step-up auth |
| F-08 | R2 keys guessable | Low | Open | Use opaque UUID-based keys |
| F-09 | No dependency provenance | Medium | Open | `pnpm audit` CI gate |
| F-10 | Secrets in Worker env | Low | Open | CI lint for secret leakage |
| F-11 | Task-switcher data exposure | Low | Open | Privacy overlay on background |
| F-12 | No session timeout | Medium | Open | Short JWT TTL + re-auth on resume |

---

## 4. Scope and Methodology

This review was conducted as a structured threat-model walk-through (not an automated penetration test) covering:
- Source code review (`src/`, `server/`, `wrangler.toml`, `docker-compose*.yml`)
- Architecture documentation (`docs/architecture/`, `docs/security/`)
- Schema and validation review (`src/schemas/`)
- Dependency manifest review (`package.json`, `pnpm-lock.yaml`)

**Not in scope** (requires separate engagement):
- Cloudflare infrastructure configuration (WAF rules, firewall policies)
- Auth0 tenant configuration
- iOS binary / IPA analysis
- Automated fuzzing or DAST scanning

---

## 5. Responsible Disclosure

Findings in this document are for internal use only. External security researchers should follow the disclosure process in `SECURITY.md`.

---

*Last reviewed: 2026-02-22 — Review again before next major release or by 2026-05-22.*
