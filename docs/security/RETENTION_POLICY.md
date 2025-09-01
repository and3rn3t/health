# Data Retention Policy (baseline)

This file documents baseline retention targets for health data. Values should be reviewed by compliance and product stakeholders and adjusted per policy.

Summary (by type)

- heart_rate: 30 days
- steps: 30 days
- walking_steadiness: 180 days
- sleep: 90 days
- activity: 90 days
- fall_event: 365 days

Implementation

- The Worker uses `getTtlSecondsForType(type, ENVIRONMENT)` to set `expirationTtl` on KV writes.
- Non-production TTLs are capped at 2 days for safety.
- For long-lived storage (beyond KV TTL), use R2 with server-side and app-level encryption, and document retention windows per object class.

Review cadence

- Quarterly or on material changes to processing activities, regulatory guidance, or customer agreements.
