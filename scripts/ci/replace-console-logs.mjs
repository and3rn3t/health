#!/usr/bin/env node
/**
 * Script to help replace console.log with SafeLogger
 * This is a helper script - run manually and review changes
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Files to prioritize (critical paths)
const PRIORITY_FILES = [
  'src/lib/authTypes.ts',
  'src/lib/apiClient.ts',
  'src/lib/httpClient.ts',
  'src/lib/security.ts',
  'src/worker.ts',
  'src/components/auth/AuthenticatedApp.tsx',
  'src/App.tsx',
];

function findConsoleLogs(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    // Match console.log, console.error, console.warn, console.info, console.debug
    const consoleMatch = line.match(/console\.(log|error|warn|info|debug)\s*\(/);
    if (consoleMatch) {
      issues.push({
        line: index + 1,
        method: consoleMatch[1],
        content: line.trim(),
      });
    }
  });

  return issues;
}

function main() {
  console.log('🔍 Finding console.log statements in priority files...\n');

  const allIssues = [];

  for (const file of PRIORITY_FILES) {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) continue;

    const issues = findConsoleLogs(fullPath);
    if (issues.length > 0) {
      allIssues.push({ file, issues });
    }
  }

  if (allIssues.length === 0) {
    console.log('✅ No console.log statements found in priority files');
    return;
  }

  console.log('📊 Console.log statements in priority files:\n');

  for (const { file, issues } of allIssues) {
    console.log(`\n${file} (${issues.length} issues):`);
    issues.slice(0, 5).forEach(({ line, method, content }) => {
      console.log(`  Line ${line}: console.${method}() - ${content.substring(0, 60)}...`);
    });
    if (issues.length > 5) {
      console.log(`  ... and ${issues.length - 5} more`);
    }
  }

  console.log('\n💡 To fix:');
  console.log('  1. Import SafeLogger: import { SafeLogger } from "@/lib/errorHandling";');
  console.log('  2. Replace console.log() with SafeLogger.info()');
  console.log('  3. Replace console.error() with SafeLogger.error()');
  console.log('  4. Replace console.warn() with SafeLogger.warn()');
  console.log('  5. Replace console.debug() with SafeLogger.debug()');
  console.log('\n⚠️  Note: Review each replacement - some console.log may be intentional');
}

main();
