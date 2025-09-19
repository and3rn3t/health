# CI Scorecard & Governance Roadmap

This document tracks planned enhancements to the CI Governance pipeline and `ci-scorecard` integration. It is intentionally incremental to keep the pipeline stable while adding clarity and resilience.

## Legend

- [ ] Not started
- [~] In progress (scaffolded / partial)
- [x] Complete & merged in this branch (pending main merge)
- (D) Deferred / optional

---

## 1. Baseline Integration (Current State)

- [x] Core workflow (`ci-governance.yml`) reconstructed without corruption
- [x] Jobs: build, lint_test, performance_slo, bundle_threshold, bundle_drift, privacy_guard, smoke, secrets_rotation, ws_schema_drift
- [x] Artifact collection (threshold, drift, perf SLO, WS schema, branding summary)
- [x] `ci-scorecard.mjs` generates markdown & attaches to run summary
- [x] Minimal gating (lint + perf SLO)

## 2. Full Gating Expansion

- [ ] Expand gating to treat any non-success governance job as failure (except allowed “degraded” states)
- [ ] Provide env var override (e.g. `ALLOW_DEGRADED=true`) for temporary unblock scenarios
- [ ] Document gating policy in `CONTRIBUTING.md`

## 3. Degraded vs Fail Semantics

- [ ] Define job classification table:
  - Critical: bundle_threshold, ws_schema_drift, secrets_rotation, lint_test
  - Strong: bundle_drift, privacy_guard
  - Advisory: performance_slo (degraded classifier), smoke, branding audit
- [ ] Update scorecard to show badge: PASS / DEGRADED / FAIL per row
- [ ] Add aggregated status line (already present globally) with breakdown counts

## 4. Scorecard Exit Codes / Machine Output

- [ ] Add `--json-out reports/ci-scorecard.json`
- [ ] Add structured summary: `{ overall, jobs: { name: {status, degradedReason?} } }`
- [ ] Optionally emit SARIF-lite for future annotations (defer if not needed)

## 5. PR Comment Automation

- [ ] Add `actions/github-script` step to create or update a PR comment containing the scorecard table
- [ ] Make comment idempotent (HTML marker comment)
- [ ] Include quick links to job logs / artifact downloads

## 6. Artifact Robustness & Validation

- [ ] Add script `scripts/ci/validate-artifacts.mjs` to:
  - Check JSON parse validity
  - Warn on missing expected keys
  - Append warnings to scorecard
- [ ] Fail (or degrade) if critical artifact malformed (e.g. bundle-threshold.json missing size fields)

## 7. Historical Trend Inline (Lightweight)

- [ ] Store last N (e.g. 10) data points in `reports/history/*.json` (persist via artifact)
- [ ] Rehydrate history in summary job, append sparkline (Unicode ▂▄▆█) for bundle size & perf latency
- [ ] Document retention & pruning strategy

## 8. Node / OS Spot Matrix (Selective)

- [ ] Add matrix for build + lint only: `{ os: [ubuntu-latest, macos-latest], node: [lts/*] }`
- [ ] Keep heavy governance jobs single-run to control duration
- [ ] Scorecard: show matrix cell pass/fail aggregation

## 9. Phased Gating Rollout Plan

- [ ] Week 1: All new jobs = advisory (warnings only)
- [ ] Week 2: Elevate bundle_threshold & secrets_rotation to critical
- [ ] Week 3: Elevate ws_schema_drift
- [ ] Week 4: Consider bundle_drift -> strong (still non-fatal) unless regression > threshold

## 10. Documentation & Developer Experience

- [ ] Add “CI Governance Overview” page under `docs/ci/`
- [ ] Update `CONTRIBUTING.md` with: how to read scorecard, how to override gating (temporary), adding new governance job pattern
- [ ] Provide a local dry-run script: `npm run ci:scorecard:local` that mocks artifact inputs

## 11. Future (Deferred / Optional)

- (D) Slack / Teams webhook push for FAIL or first DEGRADED after 7 clean runs
- (D) GitHub Check Annotations for per-file bundle deltas (needs mapping)
- (D) SLO Budget burn-down integration (rolling 7-day latency error budget)
- (D) Security scanning integration (dependency diff risk classification)

---

## Proposed Implementation Order (Short Iterations)

1. Full gating + degraded semantics (Sections 2 & 3)
2. Machine output + artifact validation (Sections 4 & 6)
3. PR comment automation (Section 5)
4. Historical trend (Section 7)
5. Phased gating activation (Section 9) + docs (Section 10)
6. Matrix (Section 8) once base is stable
7. Optional enhancements (Section 11)

## Risk / Mitigation Snapshot

| Area | Risk | Mitigation |
|------|------|------------|
| Gating expansion | False negatives blocking PRs | Start advisory → phased escalate |
| Artifact reliance | Missing/malformed JSON | Validation script + degrade not fail first |
| Trend history | Artifact bloat | Limit to N=10 & prune older |
| Matrix builds | Increased CI time | Restrict matrix to lint/type-check only |


## Open Questions

- Should performance “degraded” threshold be configurable per branch? (Environment variable vs config file)
- Do we want to auto-create GitHub issues on recurring (≥3) degraded runs?
- Where to store baseline bundle references (main branch artifact vs committed JSON)?

## Tracking

Add checklist progress updates in PR descriptions or commit messages referencing: `CI-ROADMAP: <section>/<item>`.

---

Maintainers: update this file as items move state. Keep commits small and focused.
