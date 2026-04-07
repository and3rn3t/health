# ADR-0001: Node Version Governance and Toolchain Stability

## Status

Accepted (baseline updated to Node ≥22.21.1 — see addendum below)

## Addendum — July 2025

The baseline runtime has been upgraded from Node 20.19.0 to `>=22.21.1` in `package.json engines`. The governance principles in this ADR still apply: changes to the engine constraint require updating `.nvmrc`, `engines`, running full CI, and documenting the rationale. The original decision text below is preserved for historical context.

## Context

Recent CI and local development instability surfaced due to:

- Mixing `npm` and `pnpm` installs causing optional native dependency (Rollup) resolution issues.
- Vite `7.1.5` introducing an `engines.node` constraint `^20.19.0 || >=22.12.0` while the repository pinned `20.18.1` in `.nvmrc` and `^20.18.0` in `package.json`.
- Developers running newer global Node versions (22.x) that passed loose engines but produced divergent lockfiles.
- PowerShell execution policy blocking the pnpm shim script after environment churn, leading to silent install failures.
- Absence of a fast‑fail guard early in install to alert when the active Node version diverged from the repository baseline.

These factors led to failed test runs (missing platform Rollup binary), inconsistent bundle outputs, and friction in validating new CI quality gates.

## Decision

1. **Baseline Runtime**: Standardize on Node `20.19.0` (latest 20.x meeting Vite 7.1.5 minimum) across local dev and CI.
2. **Authoritative File**: `.nvmrc` updated to `20.19.0`; `package.json engines.node` set to `^20.19.0`.
3. **Preinstall Enforcement**: `scripts/ci/ensure-node-version.mjs` runs on every `pnpm install` (via `preinstall`) and fails fast if the active version does not match `.nvmrc` & engines semver range.
4. **Explicit Vite Dependency**: Added `vite@7.1.5` to `devDependencies` (rather than relying on implicit transitive install) to make its engine requirement explicit in lock resolution.
5. **Types Alignment**: Downgraded `@types/node` to a Node 20 line (20.16.x) to avoid accidental usage of Node 22 APIs within the codebase destined for Cloudflare Workers and other Node 20-limited contexts.
6. **Diagnostic Script**: Introduced `scripts/diagnose-node-env.ps1` to surface PATH, execution policy, nvm presence, and version mismatches with actionable remediation guidance.
7. **Execution Policy Guidance**: Documented the requirement for `RemoteSigned` (CurrentUser scope) to permit pnpm PowerShell shims to run reliably.

## Alternatives Considered

- **Adopt Node 22.x immediately**: Rejected due to potential incompatibility with some Cloudflare Worker tooling and absence of explicit need for Node 22 features.
- **Loose Semver ( >=20.18.0 )**: Rejected—does not provide deterministic native optional dependency resolution, risks future subtle breakage when upstream packages ratchet their minimum Node.
- **CI-only Enforcement**: Rejected—developers would still produce divergent lockfiles before CI detects mismatch.
- **Use `.node-version` or `volta`**: Added tooling overhead; `.nvmrc` is already de facto standard and lightweight.

## Consequences

### Positive

- Deterministic dependency graph and native binary downloads (Rollup and Tailwind Oxide) across environments.
- Faster feedback loop when a developer is on the wrong Node version.
- Reduced risk of inconsistent builds or flaky test failures tied to mismatched engines.
- Clear upgrade path: future Node version raises require an intentional ADR update.

### Negative / Trade-offs

- Requires all contributors to install Node 20.19.0 (minor friction for those already on a different 20.x patch—mitigated by nvm).
- Potential need to update baseline when future tooling raises minimum (tracked via Dependabot / Renovate alerts).
- Additional maintenance to increment version in both `.nvmrc` and engines field (guarded by review + ADR reference).

## Implementation Notes

- Commit includes synchronized changes to `.nvmrc`, `package.json` engines, and added `vite` entry.
- Preinstall script reads `.nvmrc` then compares against `process.version`; allows override only via an explicit environment variable (future enhancement: CI override toggle).
- Team workflow: after pulling changes, run `nvm install 20.19.0 && nvm use 20.19.0 && pnpm install`.
- Any future Node uplift requires: (1) update `.nvmrc`, (2) update engines, (3) run full test + bundle size gates, (4) update this ADR with a new superseding ADR (e.g., `ADR-000X`).

## Rollback Plan

If unforeseen incompatibilities with Node 20.19.0 occur:

1. Create a hotfix branch.
2. Revert `.nvmrc` and engines field to prior version (20.18.1) and remove/adjust any dependency that forced the bump (e.g., pin older Vite).
3. Run full CI suite and smoke tests.
4. Publish a new ADR documenting the rollback rationale.

## References

- Vite 7.x Release Notes: engine requirement increase.
- Internal script: `scripts/ci/ensure-node-version.mjs`.
- Diagnostic tooling: `scripts/diagnose-node-env.ps1`.

## Future Work

- Add GitHub Action early step invoking the ensure-node-version script for clarity in logs.
- Consider Renovate/Dependabot rule to open an ADR draft PR when engine constraints change upstream.
- Add a small badge or docs snippet generated automatically indicating the current baseline Node version.
