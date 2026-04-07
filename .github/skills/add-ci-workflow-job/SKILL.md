---
name: add-ci-workflow-job
description: "Add a new job to a GitHub Actions CI workflow. Use when adding quality gates (Lighthouse, bundle size), security scans, deployment steps, or new test runs to CI. Includes caching, concurrency, and artifact patterns."
argument-hint: "Job type and target workflow (e.g., 'bundle size check to ci-core', 'Lighthouse audit to PR')"
---

# Add CI Workflow Job

## When to Use
- Add a quality gate (bundle size regression, Lighthouse score, coverage threshold)
- Add a security scan (dependency audit, secret scanning)
- Add a new test run (E2E, visual regression, performance)
- Add a deployment or preview step

## Prerequisites
- Workflows: `.github/workflows/` (ci-core.yml, ios-ci.yml, posture-ci.yml, ios-build.yml)
- Actions: `.github/actions/setup-pnpm/` (reusable setup)
- Concurrency: All workflows use `group: ci-${{ github.event.pull_request.number || github.ref }}` + `cancel-in-progress: true`

## Procedure

### 1. Choose the Target Workflow
- **ci-core.yml** — Web: lint, type-check, test, build, SonarCloud
- **ios-ci.yml** — iOS: unit + UI tests on PR
- **posture-ci.yml** — iOS rebuild on path changes
- **ios-build.yml** — Manual iOS dispatch

### 2. Add the Job
Add after existing jobs in the target workflow:

```yaml
  new-job-name:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    needs: [ci]  # Run after main CI passes
    steps:
      - uses: actions/checkout@v4
      - uses: ./.github/actions/setup-pnpm

      - name: Install
        run: pnpm install --frozen-lockfile

      - name: Run Check
        run: pnpm run <command>
```

### 3. Common Patterns

**Bundle size check:**
```yaml
      - name: Build
        run: pnpm build
      - name: Check bundle size
        run: |
          SIZE=$(stat -f%z dist/assets/*.js | awk '{s+=$1}END{print s}')
          echo "Bundle size: $SIZE bytes"
          if [ "$SIZE" -gt 200000 ]; then
            echo "::error::Bundle exceeds 200KB target"
            exit 1
          fi
```

**Dependency audit:**
```yaml
      - name: Audit dependencies
        run: pnpm audit --audit-level=high
```

**Lighthouse (via CI action):**
```yaml
      - name: Build
        run: pnpm build
      - uses: treosh/lighthouse-ci-action@v12
        with:
          urls: http://localhost:4173
          uploadArtifacts: true
```

**Upload artifacts:**
```yaml
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: report
          path: output/
          retention-days: 7
```

### 4. Caching
The `setup-pnpm` action handles pnpm store caching. For additional caches:

```yaml
      - uses: actions/cache@v4
        with:
          path: ~/.cache/specific-tool
          key: ${{ runner.os }}-tool-${{ hashFiles('**/lockfile') }}
```

### 5. Path Filtering (optional)
Only run on relevant file changes:
```yaml
on:
  pull_request:
    paths:
      - 'src/**'
      - 'package.json'
      - 'pnpm-lock.yaml'
```

## Checklist
- [ ] Job has `timeout-minutes` set (prevent runaway jobs)
- [ ] Uses `--frozen-lockfile` for installs
- [ ] `needs:` correctly chains after prerequisite jobs
- [ ] Concurrency group matches existing pattern
- [ ] Path filtering applied if job is scoped to specific changes
- [ ] Artifacts uploaded for debugging failures
- [ ] Secrets accessed via `${{ secrets.NAME }}` (never hardcoded)
- [ ] `if: always()` on cleanup/artifact steps (run even on failure)
