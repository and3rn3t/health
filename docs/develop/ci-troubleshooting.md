# CI Troubleshooting Guide

## Common CI Failures and Solutions

### Observability Tests Failing

**Symptoms:**
- `test:observability` step fails in CI
- Tests pass locally but fail in GitHub Actions

**Potential Causes:**

1. **Missing Dependencies**
   - Ensure `compression` package is in `package.json` dependencies
   - Run `pnpm install` to update lockfile

2. **Module Resolution Issues**
   - Verify `.cjs` files exist in `scripts/observability/`
   - Check that test file uses correct paths: `../../../scripts/observability/logger.cjs`
   - Ensure no duplicate `.js` files that could cause conflicts

3. **Path Issues**
   - CI runs on Linux, paths are case-sensitive
   - Verify all file paths match exactly (no case mismatches)

**Solutions:**

```bash
# Verify dependencies
pnpm list compression

# Test locally
pnpm run test:observability

# Check file structure
ls -la scripts/observability/

# Verify test file paths
grep -r "observability" src/lib/__tests__/observability.test.ts
```

### Lockfile Drift

**Symptoms:**
- `pnpm install --frozen-lockfile` fails
- CI falls back to `--no-frozen-lockfile`

**Solution:**
```bash
# Update lockfile locally
pnpm install

# Commit updated lockfile
git add pnpm-lock.yaml
git commit -m "Update lockfile"
```

### Test File Not Found

**Symptoms:**
- `Error: Cannot find module` in CI
- Tests pass locally

**Solution:**
- Verify test file exists: `src/lib/__tests__/observability.test.ts`
- Check package.json script: `"test:observability": "vitest run src/lib/__tests__/observability.test.ts"`
- Ensure file is committed to git

### Module Import Errors

**Symptoms:**
- `require()` fails for `.cjs` files
- ES module import errors

**Solution:**
- Use `createRequire` for CommonJS in ES modules:
  ```typescript
  import { createRequire } from 'module'
  const require = createRequire(import.meta.url)
  const logger = require('../../../scripts/observability/logger.cjs')
  ```

## Debugging CI Failures

### Check CI Logs

1. Go to GitHub Actions tab
2. Click on failed workflow run
3. Expand the failing step
4. Look for error messages

### Reproduce Locally

```bash
# Install dependencies fresh
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Run the exact CI command
pnpm run test:observability

# Check for linting issues
pnpm run lint
```

### Common CI vs Local Differences

- **OS**: CI runs on Linux (Ubuntu), local might be Windows/Mac
- **Node version**: Check `.github/actions/setup-pnpm` for Node version
- **Environment variables**: CI might have different env vars
- **File paths**: Linux is case-sensitive, Windows is not

## Quick Fixes

### If Observability Tests Fail

1. **Check dependencies:**
   ```bash
   pnpm list compression
   ```

2. **Verify test file:**
   ```bash
   ls -la src/lib/__tests__/observability.test.ts
   ```

3. **Check observability modules:**
   ```bash
   ls -la scripts/observability/*.cjs
   ```

4. **Test locally:**
   ```bash
   pnpm run test:observability
   ```

5. **Update lockfile if needed:**
   ```bash
   pnpm install
   git add pnpm-lock.yaml
   git commit -m "Update lockfile"
   ```

### If Build Fails

1. **Check for TypeScript errors:**
   ```bash
   pnpm run build:worker
   ```

2. **Check for linting errors:**
   ```bash
   pnpm run lint
   ```

3. **Verify all dependencies installed:**
   ```bash
   pnpm install --frozen-lockfile
   ```

## Getting Help

If CI continues to fail:

1. Check the specific error message in GitHub Actions
2. Reproduce the error locally
3. Check recent changes in git history
4. Verify all files are committed
5. Check for merge conflicts or uncommitted changes
