# PII Checklist — VitalSense

**Version**: 1.0  
**Date**: 2026-02-22  
**Owner**: Privacy Team  
**Review cadence**: Quarterly or on any material change to data processing

---

## Purpose

This checklist inventories every category of Personally Identifiable Information (PII) and Protected Health Information (PHI) collected, processed, or stored by VitalSense. It is the authoritative reference for HIPAA Privacy Rule compliance, GDPR Article 30 Records of Processing Activities (RoPA), and CCPA consumer-rights obligations.

---

## 1. PII / PHI Inventory

### 1.1 Direct Identifiers

| Field | Source | Storage location | Retention | Encrypted at rest | Access control |
|---|---|---|---|---|---|
| `userId` (UUID) | App onboarding / Auth0 JWT | Cloudflare KV, R2 | Account lifetime | Yes (KV/R2 platform + AES-GCM app layer) | Owner + authorized caregivers |
| `deviceId` | HealthKit / device OS | KV (metric records) | 30–365 days per metric type | Yes | Owner only |
| Emergency contact **name** | User input | KV (contacts store) | Account lifetime | Yes | Owner only |
| Emergency contact **phone number** | User input | KV (contacts store) | Account lifetime | Yes | Owner only |
| Emergency contact **email** | User input (optional) | KV (contacts store) | Account lifetime | Yes | Owner only |
| Emergency contact **relationship** | User input | KV (contacts store) | Account lifetime | Yes | Owner only |

### 1.2 Health / Biometric Data (PHI under HIPAA)

| Data type | Schema field | Metric enum | Retention | Notes |
|---|---|---|---|---|
| Heart rate | `healthMetricSchema.value` | `heart_rate` | 30 days | HealthKit source |
| Walking steadiness | `healthMetricSchema.value` | `walking_steadiness` | 180 days | Apple Watch fall-risk input |
| Step count | `healthMetricSchema.value` | `steps` | 30 days | HealthKit source |
| Sleep hours | `healthMetricSchema.value` | `sleep_hours` | 90 days | HealthKit source |
| Active energy (calories) | `healthMetricSchema.value` | `active_energy` | 90 days | HealthKit source |
| Distance walked | `healthMetricSchema.value` | `distance_walking` | 90 days | HealthKit source |
| Gait speed | `healthMetricSchema.value` | `gait_speed` | 90 days | Derived from sensors |
| Cadence | `healthMetricSchema.value` | `cadence` | 90 days | Derived from sensors |
| Stride length | `healthMetricSchema.value` | `stride_length` | 90 days | Derived from sensors |
| Step asymmetry | `healthMetricSchema.value` | `step_asymmetry` | 90 days | Derived from sensors |
| Double support time | `healthMetricSchema.value` | `double_support_time` | 90 days | Derived from sensors |
| Posture angle | `healthMetricSchema.value` | `posture_angle` | 90 days | Derived from sensors |
| Stability index | `healthMetricSchema.value` | `stability_index` | 90 days | Derived composite score |
| Sway / balance | `healthMetricSchema.value` | `sway_balance` | 90 days | Derived from sensors |
| Oxygen saturation (SpO₂) | `healthMetricSchema.value` | `oxygen_saturation` | 30 days | HealthKit source |
| Body weight | `healthMetricSchema.value` | `body_weight` | 90 days | HealthKit / manual |
| Blood pressure (systolic) | `healthMetricSchema.value` | `blood_pressure_systolic` | 30 days | HealthKit / manual |
| Blood pressure (diastolic) | `healthMetricSchema.value` | `blood_pressure_diastolic` | 30 days | HealthKit / manual |
| Body temperature | `healthMetricSchema.value` | `body_temperature` | 30 days | HealthKit / manual |
| Respiratory rate | `healthMetricSchema.value` | `respiratory_rate` | 30 days | HealthKit source |
| Fall event record | `healthMetricSchema.value` | `fall_event` | 365 days | Safety / regulatory |

### 1.3 Derived / Inferred Data

| Derived field | Source inputs | Retention | Notes |
|---|---|---|---|
| Fall risk score (0–1) | Steadiness, steps, sleep, HR | 90 days | Model output — not raw PHI, but re-identifiable with context |
| Risk level label (low/medium/high) | Fall risk score | 90 days | |
| Health score trend | Aggregated metrics | 90 days | |
| Anomaly flags | EWMA / z-score on metrics | 30 days | |
| 7/30-day health forecasts | Historical metric time-series | 30 days | |

### 1.4 Device and Technical Metadata

| Field | Purpose | Retention | PII risk |
|---|---|---|---|
| Device OS version | Debugging / compatibility | 30 days | Low |
| App version | Release tracking | 30 days | Low |
| Request correlation IDs | Structured logging | 7 days | None (no PHI in logs) |
| WebSocket session tokens | Connection auth | Session lifetime | Medium — stored in memory only |

### 1.5 Location Data

| Data | When collected | Retention | Notes |
|---|---|---|---|
| GPS coordinates | Emergency events only | 365 days (as part of fall event record) | Not collected during normal use; requires explicit in-app permission |

---

## 2. Data Flow Summary

```
iOS App (HealthKit / sensors)
    │  HTTPS / WSS (TLS 1.3)
    ▼
Cloudflare Worker (edge)
    │  JWT auth checked; input validated by zod schemas
    │  PHI written with AES-GCM app-layer encryption + platform encryption
    ▼
Cloudflare KV / R2
    │  TTL set per metric type (see RETENTION_POLICY.md)
    ▼
Caregiver dashboard (with explicit user permission)
```

Telemetry emitted by the app (`src/lib/telemetry.ts`) is **PII-safe by design**: only aggregate/system metrics are emitted; raw health values and identifiers are explicitly redacted before any `console.debug` or listener call.

---

## 3. Third-Party Data Processors

| Processor | Data shared | BAA required? | Notes |
|---|---|---|---|
| Apple HealthKit | None — data flows **from** HealthKit to app only | N/A | Apple's own privacy controls apply |
| Cloudflare (Workers/KV/R2) | Encrypted ciphertext only (no plaintext PHI) | Yes | Sign BAA via Cloudflare enterprise agreement |
| Auth0 | `userId` tokens, login events | Yes | HIPAA BAA available on enterprise tier |
| CI/CD (GitHub Actions) | No PHI — only build artifacts | N/A | Secrets stored via GitHub encrypted secrets, not in code |

---

## 4. User Rights and Controls

| Right | Mechanism | Notes |
|---|---|---|
| Access | In-app data export, API `/api/export` | Standard formats (JSON) |
| Rectification | In-app profile edit | |
| Erasure ("right to be forgotten") | Account deletion → Worker deletes all KV/R2 records within 30 days | Anonymized usage stats may be retained |
| Restriction / opt-out | PrivacyControls component; HealthKit permission toggles in iOS Settings | Granular per-metric |
| Data portability | JSON export | See access row above |
| Withdraw consent | Discontinue app + request account deletion | Consent recorded at onboarding |

---

## 5. PII Handling Controls Checklist

- [x] All PHI encrypted in transit (TLS 1.3, HTTPS/WSS enforced)
- [x] All PHI encrypted at rest (Cloudflare platform + AES-GCM app layer)
- [x] PHI excluded from logs — telemetry layer explicitly redacts health values
- [x] PHI excluded from error reports — `src/lib/errorHandling.ts` filters PII
- [x] Input validation at every API and WebSocket boundary (zod schemas)
- [x] Retention TTLs set per data type (see `RETENTION_POLICY.md`)
- [x] Caregiver access gated by explicit user consent
- [x] Emergency location collected only on explicit trigger, not passively
- [x] Children under 13 excluded (app store age gate + policy)
- [ ] BAAs signed with all PHI-handling processors — **action required**: confirm Cloudflare and Auth0 BAAs are in place before production launch
- [ ] Formal HIPAA Risk Analysis documented and reviewed by compliance counsel
- [ ] GDPR Article 30 RoPA filed with DPO
- [ ] CCPA "Do Not Sell" mechanism verified (N/A if data is never sold; confirm in policy)
- [ ] Penetration test of auth and data-access endpoints completed

---

## 6. Open Issues / Action Items

| # | Issue | Owner | Due |
|---|---|---|---|
| 1 | Confirm Cloudflare BAA signed before production | Engineering lead | Pre-launch |
| 2 | Confirm Auth0 HIPAA BAA active | Engineering lead | Pre-launch |
| 3 | Complete formal HIPAA Risk Analysis with compliance counsel | Privacy Officer | Pre-launch |
| 4 | File GDPR Article 30 RoPA with DPO | Privacy Officer / DPO | Pre-launch |
| 5 | Verify `/api/export` and account-deletion endpoints are implemented and tested | Engineering | M2 milestone |
| 6 | Add automated PII-in-logs detection to CI pipeline | Security Eng | M3 milestone |

---

*Last reviewed: 2026-02-22 — Review again by 2026-05-22 or on any material change to data processing.*
