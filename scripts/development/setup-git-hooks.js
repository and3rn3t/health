#!/usr/bin/env node
/**
 * Setup Git hooks for VitalSense project
 * Node.js version of setup-git-hooks.ps1
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');
const { program } = require('commander');

program
  .name('setup-git-hooks')
  .description('Setup Git hooks for VitalSense project')
  .option('-f, --force', 'Force overwrite existing hooks')
  .option('-v, --verbose', 'Verbose output')
  .option('--dry-run', 'Show what would be done without making changes')
  .parse();

const options = program.opts();

const HOOKS = {
  'pre-commit': `#!/bin/sh
# VitalSense pre-commit hook
echo "🔍 Running pre-commit checks..."

# Run TypeScript linting
echo "📝 Checking TypeScript..."
npm run lint:check || exit 1

# Run Swift linting if iOS files changed
if git diff --cached --name-only | grep -q "\\.swift$"; then
  echo "📱 Checking Swift files..."
  if command -v docker >/dev/null 2>&1; then
    docker run --rm -v "$(pwd)/ios:/workspace" ghcr.io/realm/swiftlint:latest swiftlint /workspace || exit 1
  else
    echo "⚠️  Docker not available, skipping Swift lint"
  fi
fi

# Check for VitalSense branding consistency
echo "🎯 Checking VitalSense branding..."
if git diff --cached --name-only | grep -E "\\.(ts|tsx|js|jsx|html)$" | xargs grep -l "Health App\\|HealthGuard" 2>/dev/null; then
  echo "❌ Found non-VitalSense branding in staged files"
  echo "Please use 'VitalSense' instead of generic health app references"
  exit 1
fi

echo "✅ Pre-commit checks passed"
`,

  'post-push': `#!/bin/sh
# VitalSense post-push hook - auto-deploy to development
echo "🚀 Post-push: Checking for auto-deploy..."

# Check if we're on main branch
BRANCH=$(git rev-parse --abbrev-ref HEAD)
if [ "$BRANCH" = "main" ]; then
  echo "📦 Auto-deploying to development environment..."
  if command -v node >/dev/null 2>&1; then
    node scripts/node/dev/deploy-worker-dev.js --auto || echo "⚠️  Auto-deploy failed"
  else
    echo "⚠️  Node.js not available, skipping auto-deploy"
  fi
fi
`,

  'pre-push': `#!/bin/sh
# VitalSense pre-push hook
echo "🔍 Running pre-push checks..."

# Run quick health check
echo "💓 Health check..."
if command -v node >/dev/null 2>&1; then
  node scripts/node/health/simple-probe.js --port 8787 --quick || {
    echo "⚠️  Health check failed, but allowing push"
  }
fi

# Check bundle size if dist exists
if [ -d "dist" ]; then
  echo "📦 Checking bundle size..."
  BUNDLE_SIZE=$(du -sh dist | cut -f1)
  echo "Bundle size: $BUNDLE_SIZE"
fi

echo "✅ Pre-push checks completed"
`
};

async function setupGitHooks() {
  console.log('🔧 Setting up VitalSense Git hooks...');
  
  try {
    // Check if we're in a git repository
    execSync('git rev-parse --git-dir', { stdio: 'pipe' });
  } catch (error) {
    console.error('❌ Not in a Git repository');
    process.exit(1);
  }

  const gitDir = execSync('git rev-parse --git-dir', { encoding: 'utf8' }).trim();
  const hooksDir = path.join(gitDir, 'hooks');

  // Ensure hooks directory exists
  try {
    await fs.access(hooksDir);
  } catch (error) {
    if (options.verbose) console.log(`📁 Creating hooks directory: ${hooksDir}`);
    await fs.mkdir(hooksDir, { recursive: true });
  }

  let hooksInstalled = 0;
  let hooksSkipped = 0;

  for (const [hookName, hookContent] of Object.entries(HOOKS)) {
    const hookPath = path.join(hooksDir, hookName);
    
    try {
      await fs.access(hookPath);
      if (!options.force) {
        console.log(`⚠️  Hook ${hookName} already exists (use --force to overwrite)`);
        hooksSkipped++;
        continue;
      }
    } catch (error) {
      // Hook doesn't exist, proceed with creation
    }

    if (options.dryRun) {
      console.log(`🔍 Would create/update hook: ${hookName}`);
      continue;
    }

    await fs.writeFile(hookPath, hookContent, { mode: 0o755 });
    console.log(`✅ Installed hook: ${hookName}`);
    hooksInstalled++;

    if (options.verbose) {
      console.log(`📄 Hook content preview (first 3 lines):`);
      const lines = hookContent.split('\\n').slice(0, 3);
      lines.forEach(line => console.log(`   ${line}`));
      console.log('');
    }
  }

  if (options.dryRun) {
    console.log(`\\n🔍 Dry run completed. Would install ${Object.keys(HOOKS).length} hooks.`);
  } else {
    console.log(`\\n🎉 Git hooks setup completed!`);
    console.log(`📊 Installed: ${hooksInstalled}, Skipped: ${hooksSkipped}`);
    
    if (hooksInstalled > 0) {
      console.log('\\n📋 Installed hooks:');
      console.log('  • pre-commit: TypeScript lint, Swift lint, branding check');
      console.log('  • post-push: Auto-deploy to development (main branch)');
      console.log('  • pre-push: Health check and bundle size info');
    }
  }
}

if (require.main === module) {
  setupGitHooks().catch(error => {
    console.error('❌ Error setting up Git hooks:', error.message);
    process.exit(1);
  });
}

module.exports = { setupGitHooks };