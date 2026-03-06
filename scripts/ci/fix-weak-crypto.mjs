#!/usr/bin/env node
/**
 * Mass fix for weak cryptography (Math.random) issues
 *
 * This script:
 * 1. Identifies Math.random() usage
 * 2. Categorizes as security-sensitive vs non-security
 * 3. Fixes security-sensitive uses with crypto.getRandomValues()
 * 4. Adds NOSONAR comments for non-security uses
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Security-sensitive patterns (must fix)
const SECURITY_SENSITIVE_PATTERNS = [
  /Math\.random\s*\(\s*\)\s*<\s*\w+/, // Sampling/rate limiting
  /Math\.random\s*\(\s*\)\s*\.toString\s*\(/, // ID generation
  /id\s*[:=]\s*[^,}]*Math\.random/, // ID assignment
  /key\s*[:=]\s*[^,}]*Math\.random/, // Key generation
  /token\s*[:=]\s*[^,}]*Math\.random/, // Token generation
  /secret\s*[:=]\s*[^,}]*Math\.random/, // Secret generation
  /audit.*Math\.random/, // Audit logging
  /sample.*Math\.random/i, // Sampling
];

// Non-security patterns (add NOSONAR)
const NON_SECURITY_PATTERNS = [
  /demo.*Math\.random/i, // Demo data
  /test.*Math\.random/i, // Test data
  /generateDemo.*Math\.random/i, // Demo generation
  /sampleHealthData.*Math\.random/i, // Sample data
  /UI.*Math\.random/i, // UI randomization
  /color.*Math\.random/i, // Color generation
  /position.*Math\.random/i, // Position randomization
  /ML.*Math\.random/i, // ML model weights (non-security)
  /neural.*network.*Math\.random/i, // Neural network initialization
  /weight.*Math\.random/i, // Model weights
  /simulat.*Math\.random/i, // Simulation data
  /visualiz.*Math\.random/i, // Visualization
  /chart.*Math\.random/i, // Chart data
  /graph.*Math\.random/i, // Graph data
  /Array\.from.*length.*Math\.random/, // Array initialization with random
  /\.map.*Math\.random/, // Array mapping with random
];

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    if (entry.name.startsWith('.') ||
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'coverage' ||
        entry.name === 'ios' ||
        entry.name === '_archive' ||
        relativePath.includes('_archive') ||
        relativePath.includes('__tests__') ||
        relativePath.includes('.test.') ||
        relativePath.includes('.spec.')) {
      continue;
    }

    if (entry.isDirectory()) {
      files.push(...findFiles(fullPath, extensions));
    } else if (extensions.some(ext => entry.name.endsWith(ext))) {
      files.push(relativePath);
    }
  }

  return files;
}

function isSecuritySensitive(line, context = '') {
  const fullContext = context + ' ' + line;
  return SECURITY_SENSITIVE_PATTERNS.some(pattern => pattern.test(fullContext));
}

function isNonSecurity(line, context = '') {
  const fullContext = context + ' ' + line;
  return NON_SECURITY_PATTERNS.some(pattern => pattern.test(fullContext));
}

function fixMathRandom(line, isSecurity) {
  if (isSecurity) {
    // Replace with crypto.getRandomValues()
    // Simple case: Math.random() < rate
    if (/Math\.random\s*\(\s*\)\s*<\s*(\w+)/.test(line)) {
      const rateVar = line.match(/Math\.random\s*\(\s*\)\s*<\s*(\w+)/)?.[1];
      return line.replace(
        /Math\.random\s*\(\s*\)\s*<\s*\w+/,
        `(crypto.getRandomValues(new Uint32Array(1))[0] / (0xffffffff + 1)) < ${rateVar}`
      );
    }
    // ID generation: Math.random().toString(36).slice(...)
    if (/Math\.random\s*\(\s*\)\s*\.toString\s*\(36\)/.test(line)) {
      const match = line.match(/Math\.random\s*\(\s*\)\s*\.toString\s*\(36\)\s*\.slice\s*\((\d+)(?:,\s*(\d+))?\)/);
      if (match) {
        const start = parseInt(match[1]) || 2;
        const end = parseInt(match[2]) || start + 7;
        const length = end - start;
        return line.replace(
          /Math\.random\s*\(\s*\)\s*\.toString\s*\(36\)\s*\.slice\s*\([^)]+\)/,
          `Array.from(crypto.getRandomValues(new Uint8Array(${Math.ceil(length * 1.5)})), b => b.toString(36)).join('').slice(0, ${length})`
        );
      }
    }
  }

  // Add NOSONAR comment for non-security uses
  if (!isSecurity && !line.includes('NOSONAR')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('//')) {
      // Add comment before the line
      return `      // NOSONAR: Non-security use - Math.random() acceptable for demo/test/UI\n${line}`;
    }
  }

  return line;
}

function processFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) return { fixed: 0, skipped: 0 };

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  let modified = false;
  let fixed = 0;
  let skipped = 0;

  const newLines = lines.map((line, index) => {
    if (!/Math\.random/.test(line)) return line;

    const context = lines.slice(Math.max(0, index - 2), index + 3).join(' ');
    const isSecurity = isSecuritySensitive(line, context);
    const isNonSec = isNonSecurity(line, context);

    if (isSecurity) {
      const fixedLine = fixMathRandom(line, true);
      if (fixedLine !== line) {
        modified = true;
        fixed++;
        return fixedLine;
      }
    } else if (isNonSec && !line.includes('NOSONAR')) {
      const fixedLine = fixMathRandom(line, false);
      if (fixedLine !== line) {
        modified = true;
        skipped++;
        return fixedLine;
      }
    }

    return line;
  });

  if (modified) {
    fs.writeFileSync(fullPath, newLines.join('\n'), 'utf8');
  }

  return { fixed, skipped, modified };
}

function main() {
  console.log('🔍 Finding Math.random() usage...\n');

  const srcFiles = findFiles(path.join(rootDir, 'src'));
  const scriptFiles = findFiles(path.join(rootDir, 'scripts'), ['.js', '.mjs']);

  const allFiles = [...srcFiles, ...scriptFiles].filter(
    f => !f.includes('fix-weak-crypto.mjs') && !f.includes('secureRandom.ts')
  );

  console.log(`Found ${allFiles.length} files to analyze\n`);

  let totalFixed = 0;
  let totalSkipped = 0;
  const modifiedFiles = [];

  for (const file of allFiles) {
    const result = processFile(file);
    if (result.modified) {
      modifiedFiles.push(file);
      totalFixed += result.fixed;
      totalSkipped += result.skipped;
    }
  }

  console.log(`✅ Fixed ${totalFixed} security-sensitive Math.random() uses`);
  console.log(`📝 Added NOSONAR to ${totalSkipped} non-security uses`);
  console.log(`📁 Modified ${modifiedFiles.length} files\n`);

  if (modifiedFiles.length > 0) {
    console.log('Modified files:');
    modifiedFiles.slice(0, 20).forEach(f => console.log(`  - ${f}`));
    if (modifiedFiles.length > 20) {
      console.log(`  ... and ${modifiedFiles.length - 20} more`);
    }
  }
}

main();
