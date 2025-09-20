# Legacy Workflow Archive

These workflows were decommissioned in favor of the consolidated `ci-core.yml` pipeline plus a minimal set of specialized workflows.

Archived on: 2025-09-18
Branch: ci/workflows-stabilization

Removed Files:

- ci-governance.yml
- optimized-pipeline.yml
- smoke.yml
- branding-audit.yml
- ios-tests.yml
- ios-tests-simple.yml
- deploy.yml
- security-quality.yml

Rationale:

- Duplicate build/lint/test steps causing parallel redundant executions.
- Fragmented branding, smoke, and bundle checks now unified under gating summary.
  Deployment folded into core pipeline deploy job (conditional on branch and gating success).
  iOS workflows consolidated; retain `ios-ci.yml` as the canonical iOS pipeline.
  Security + quality (audit, license, Semgrep, Sonar, dependency review) folded
  into `ci-core.yml` as dedicated jobs (`security_scan`, `code_quality`,
  `semgrep_scan`, `sonar_scan`, `dependency_review`). Only `security_scan` and
  `code_quality` are currently gating (via `summary`).

If any step from these is needed again, prefer adding a focused job to `ci-core.yml` or a scheduled security/maintenance workflow rather than reinstating entire legacy files.
