---
title: "ADR-0002: Staged HealthKit Permission Strategy"
date: 2025-09-18
status: Accepted
context: |
  Requesting a large, mixed set of HealthKit types at first launch produced lower acceptance and a poor user explanation surface. We need a branded, progressive disclosure model aligned with VitalSense value messaging.
decision: |
  Implement a staged permission coordinator with discrete phases: initial (steps), movementCore (distance/energy/heart rate), fallRisk (advanced gait), cardioRecovery (HRV/VO2). Persist progress; expose diagnostics; emit notifications on advancement.
consequences: |
  Pros: Higher acceptance, clearer analytics attribution, easier debugging. Cons: Slightly longer path to full data set; requires UI gating logic. Future: Add adaptive ordering based on user profile.
---

## Details

See `HealthKitPermissionCoordinator` for implementation. Diagnostics view allows quick audit of missing types. Notification `.permissionsStageAdvanced` enables deferred initialization in other managers.
