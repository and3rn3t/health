#!/usr/bin/env node
// Archive cleanup script: moves unused variants, tests, and backup docs into _archive folders
// Also ensures tsconfig.json excludes src/_archive/**/*.
// ESM only.

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Resolve repository root based on this file location so it works from any CWD
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '../../..');

const filesToArchiveApp = [
  'src/App-CodeSplit.tsx.disabled',
  'src/App-minimal.tsx',
  'src/App-Original-Backup.tsx.disabled',
  'src/App-Phase1B.tsx',
  'src/App-simple.tsx',
  'src/App-splitting-template.tsx',
  'src/App.optimized.tsx',
  'src/App.tsx.backup',
  'src/App.tsx.corrupted',
  'src/App.tsx.fixed',
  'src/App_new.tsx',
  'src/main-backup.tsx',
  'src/main-complex.tsx',
  'src/main-minimal.tsx',
  'src/main-simple.tsx',
  'src/debug-test.js',
  'src/DirectApp.js',
  'src/MinimalApp.tsx',
  'src/SimpleApp.tsx',
  'src/TestApp.tsx',
  'src/ultra-simple-test.js',
];

const filesToArchiveCss = [
  'src/css-backup/index.css.old',
  'src/css-backup/main.css.old',
  'src/css-backup/theme.css.old',
  'src/css-backup/vitalsense-classes.css.old',
];

const docsToArchive = [
  'docs/BUNDLE_OPTIMIZATION_PHASE2_STATUS.md',
  'docs/BUNDLE_OPTIMIZATION_SUCCESS_REPORT.md',
  'docs/DEPLOYMENT_VERIFICATION.md',
  'docs/ENHANCED_GAIT_ANALYSIS_COMPLETE.md',
  'docs/OPTIMIZATION_DEPLOYMENT_COMPLETE.md',
  'docs/WORKFLOW_OPTIMIZATION_COMPLETE.md',
  'docs/_REORGANIZATION_COMPLETE.md',
  'docs/_REORGANIZATION_PLAN.md',
];

const destApp = 'src/_archive/app-variants';
const destCss = 'src/_archive/css';
const destDocs = 'docs/_archive/optimizations';

/**
 * Utilities
 */
async function ensureDir(dir) {
  await fs.mkdir(path.join(root, dir), { recursive: true });
}

async function exists(p) {
  try {
    await fs.access(path.join(root, p));
    return true;
  } catch {
    return false;
  }
}

async function moveFile(srcRel, destRelDir) {
  const srcAbs = path.join(root, srcRel);
  const destAbsDir = path.join(root, destRelDir);
  const destAbs = path.join(destAbsDir, path.basename(srcRel));
  await ensureDir(destRelDir);
  await fs.rename(srcAbs, destAbs);
  return { from: srcRel, to: path.join(destRelDir, path.basename(srcRel)) };
}

async function updateTsconfigExclude() {
  const tsconfigPath = path.join(root, 'tsconfig.json');
  if (!(await exists('tsconfig.json'))) {
    return { updated: false, reason: 'tsconfig.json not found' };
  }
  const raw = await fs.readFile(tsconfigPath, 'utf8');
  let json;
  try {
    json = JSON.parse(raw);
  } catch (e) {
    return { updated: false, reason: 'tsconfig.json is not valid JSON' };
  }
  const exclude = Array.isArray(json.exclude) ? json.exclude : [];
  const needed = 'src/_archive/**/*';
  if (!exclude.includes(needed)) {
    exclude.push(needed);
    json.exclude = exclude;
    await fs.writeFile(tsconfigPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
    return { updated: true };
  }
  return { updated: false, reason: 'already present' };
}

async function main() {
  const operations = [];

  // Safety checks
  for (const mustExist of ['src/App.tsx', 'src/main.tsx']) {
    if (!(await exists(mustExist))) {
      console.error(`❌ Safety check failed: ${mustExist} not found`);
      process.exitCode = 1;
      return;
    }
  }

  // Archive app files
  for (const f of filesToArchiveApp) {
    if (await exists(f)) {
      try {
        const op = await moveFile(f, destApp);
        operations.push(op);
        console.log(`📦 Moved: ${op.from} -> ${op.to}`);
      } catch (e) {
        console.warn(`⚠️  Failed to move ${f}: ${e.message}`);
      }
    } else {
      console.log(`ℹ️  Skip (not found): ${f}`);
    }
  }

  // Archive css backups
  for (const f of filesToArchiveCss) {
    if (await exists(f)) {
      try {
        const op = await moveFile(f, destCss);
        operations.push(op);
        console.log(`🎨 Moved: ${op.from} -> ${op.to}`);
      } catch (e) {
        console.warn(`⚠️  Failed to move ${f}: ${e.message}`);
      }
    } else {
      console.log(`ℹ️  Skip (not found): ${f}`);
    }
  }

  // Archive docs
  for (const f of docsToArchive) {
    if (await exists(f)) {
      try {
        const op = await moveFile(f, destDocs);
        operations.push(op);
        console.log(`📚 Moved: ${op.from} -> ${op.to}`);
      } catch (e) {
        console.warn(`⚠️  Failed to move ${f}: ${e.message}`);
      }
    } else {
      console.log(`ℹ️  Skip (not found): ${f}`);
    }
  }

  // Update tsconfig exclude
  const tsResult = await updateTsconfigExclude();
  if (tsResult.updated) {
    console.log('🛠️  Updated tsconfig.json to exclude src/_archive/**/*');
  } else {
    console.log(`ℹ️  tsconfig.json exclude unchanged (${tsResult.reason || 'no change'})`);
  }

  // Write cleanup summary
  const summaryLines = [
    `# Documentation & Components Cleanup Summary`,
    '',
    `Date: ${new Date().toISOString()}`,
    '',
    'The following files were archived:',
    '',
    '## App variants, mains, and debug/test → src/_archive/app-variants/',
    ...operations
      .filter((o) => o.to.startsWith(destApp))
      .map((o) => `- ${o.from} → ${o.to}`),
    '',
    '## CSS backups → src/_archive/css/',
    ...operations
      .filter((o) => o.to.startsWith(destCss))
      .map((o) => `- ${o.from} → ${o.to}`),
    '',
    '## Documentation → docs/_archive/optimizations/',
    ...operations
      .filter((o) => o.to.startsWith(destDocs))
      .map((o) => `- ${o.from} → ${o.to}`),
    '',
    'Notes:',
    '- Updated tsconfig.json to exclude archived code: src/_archive/**/*',
    '- If any README or index links point to moved docs, they should be updated to new paths under docs/_archive/optimizations/.',
  ].join('\n');

  const summaryPath = path.join(root, 'docs', '_archive', 'optimizations', 'CLEANUP_SUMMARY.md');
  await ensureDir('docs/_archive/optimizations');
  await fs.writeFile(summaryPath, summaryLines + '\n', 'utf8');
  console.log(`📝 Wrote summary: ${path.relative(root, summaryPath)}`);
}

main().catch((e) => {
  console.error('❌ Archive cleanup failed:', e);
  process.exitCode = 1;
});
