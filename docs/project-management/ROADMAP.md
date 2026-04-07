# VitalSense Product Roadmap

## Vision

Deliver a reliable, privacy-first health monitoring platform with Apple Health insights, fall risk detection, emergency alerts, and caregiver dashboards — across iOS and web.

## Guiding Principles

- **Privacy-first**: HealthKit data stays on-device unless explicitly synced. No PII in logs.
- **Edge-native**: Cloudflare Workers for low-latency API and WebSocket delivery.
- **Modular**: Separate concerns — React frontend, Worker backend, iOS native, config sync.
- **Tested**: Vitest unit tests, Playwright E2E, XCTest for iOS, bundle budgets in CI.

---

## Current State

- Web dashboard with health data visualization and real-time WebSocket updates
- Cloudflare Worker API with KV/R2 storage, rate limiting, and auth
- iOS app with HealthKit integration, gait analytics, and CoreML posture analysis
- Fall risk model (v0.1-baseline, hand-tuned logistic regression)
- Auth0 integration with JWT-based device and dashboard auth
- CI/CD with GitHub Actions, bundle budgets, and SwiftLint

## Near-Term Priorities

### Improve Fall Risk Model

- Replace hand-tuned weights with weights trained on a validated dataset
- Add age and biological sex as optional inputs
- Report calibration error and AUC stratified by demographic group
- Document reference population in a model card

### Caregiver Dashboard

- Role-based access for family members and healthcare providers
- Configurable alert thresholds per monitored user
- Privacy-respecting data sharing with granular consent

### Apple Watch Companion

- Extend HealthKit bridge to watchOS
- Background health data sync
- Fall detection and emergency alerts from the wrist

## Medium-Term

### Enhanced Analytics

- Health score trend forecasting (Holt-Winters, 7/30 day)
- Anomaly detection with contextual bandit recommendations
- Gait deterioration early warning

### Production Hardening

- Audit log storage with write-once properties (R2 + Object Lock)
- Per-user access controls and consent management
- Automated security testing (SAST, dependency scanning)

### iOS

- Assistive device mode for gait analytics
- Offline-first architecture with better sync conflict resolution
- Accessibility audit and VoiceOver optimization

## Long-Term

- Federated learning for on-device model personalization
- Multi-tenant caregiver organizations
- Integration with third-party health platforms (Google Health Connect)
- Clinical validation pathway
  
## Dependencies

- Caregiver dashboard depends on stable auth and API layer.
- Apple Watch companion depends on iOS app maturity and HealthKit bridge.
- Federated learning depends on validated on-device model pipeline.

---

## Risks and Mitigations

- **Data privacy regulations**: Evolving HIPAA/state laws → stay current, maintain BAAs, audit regularly.
- **Model accuracy**: Hand-tuned fall risk weights → validate against published datasets, report calibration metrics.
- **Platform fragmentation**: iOS-only HealthKit → plan Google Health Connect integration for broader reach.
- **Compute costs at scale**: Heavy analytics → edge caching, Cloudflare Workers Paid plan budgeting.

---

## Immediate Next Steps

- Train fall risk model on a validated gait/fall dataset to replace hand-tuned weights.
- Build caregiver invite flow with role-based access.
- Add model card documenting reference population, known limitations, and bias assessment results.
