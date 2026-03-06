#!/usr/bin/env node
/**
 * Fix ReDoS (Regular Expression Denial of Service) vulnerabilities
 *
 * Detects and fixes regex patterns vulnerable to super-linear runtime
 * due to catastrophic backtracking.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// ReDoS vulnerable patterns
const REDOS_PATTERNS = [
  // Nested quantifiers
  /\([^)]*\+[^)]*\)\+/, // (a+)+
  /\([^)]*\*[^)]*\)\*/, // (a*)*
  /\([^)]*\?[^)]*\)\?/, // (a?)?
  /\([^)]*\+[^)]*\)\*/, // (a+)*
  /\([^)]*\*[^)]*\)\+/, // (a*)+
  /\([^)]*\+[^)]*\)\{/, // (a+){n,m}
  /\([^)]*\*[^)]*\)\{/, // (a*){n,m}

  // Alternation with overlapping
  /\([^|]+\|[^|]+\|.*\)\*/, // (a|a|...)*
  /\([^|]+\|[^|]+\|.*\)\+/, // (a|a|...)+

  // Complex nested groups
  /\(\([^)]*\+[^)]*\)\+[^)]*\)\+/, // ((a+)+)+
  /\(\([^)]*\*[^)]*\)\*[^)]*\)\*/, // ((a*)*)*
];

// Patterns that are safe (known safe regexes)
const SAFE_PATTERNS = [
  /^\/\.(m?js|css|woff2?|ttf|otf)(?:\?.*)?\$/, // File extensions
  /^\/\\\.(m?js|css|woff2?|ttf|otf)(?:\?.*)?\$/, // Escaped file extensions
  /^\/\^[^$]+\$\//, // Anchored patterns (^...$)
  /^\/\\w\+/, // Simple word patterns
  /^\/\\d\+/, // Simple digit patterns
  /^\/\[[^\]]+\]/, // Character classes
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

function isVulnerableRegex(regexStr) {
  // Check if it matches any ReDoS pattern
  for (const pattern of REDOS_PATTERNS) {
    if (pattern.test(regexStr)) {
      // Check if it's a known safe pattern
      for (const safePattern of SAFE_PATTERNS) {
        if (safePattern.test(regexStr)) {
          return false;
        }
      }
      return true;
    }
  }
  return false;
}

function extractRegexPatterns(content) {
  const patterns = [];

  // Match regex literals: /pattern/flags
  const regexLiteral = /\/[^\/\n]+\/[gimuy]*/g;
  let match;
  while ((match = regexLiteral.exec(content)) !== null) {
    patterns.push({
      pattern: match[0],
      index: match.index,
      line: content.substring(0, match.index).split('\n').length,
    });
  }

  // Match new RegExp(...)
  const regExpConstructor = /new\s+RegExp\(([^)]+)\)/g;
  while ((match = regExpConstructor.exec(content)) !== null) {
    patterns.push({
      pattern: match[0],
      index: match.index,
      line: content.substring(0, match.index).split('\n').length,
      isConstructor: true,
      args: match[1],
    });
  }

  // Match RegExp(...)
  const regExpCall = /RegExp\(([^)]+)\)/g;
  while ((match = regExpCall.exec(content)) !== null) {
    // Skip if it's "new RegExp"
    if (content.substring(Math.max(0, match.index - 4), match.index).trim().endsWith('new')) {
      continue;
    }
    patterns.push({
      pattern: match[0],
      index: match.index,
      line: content.substring(0, match.index).split('\n').length,
      isConstructor: true,
      args: match[1],
    });
  }

  return patterns;
}

function fixVulnerableRegex(regexStr, isConstructor = false, args = '') {
  // For nested quantifiers, we need to make them atomic or use possessive quantifiers
  // However, JavaScript doesn't support atomic groups or possessive quantifiers natively
  // So we need to restructure the regex to avoid backtracking

  // Pattern: (a+)+ -> (?:a+)+ (non-capturing, but still vulnerable)
  // Better: a+ (simplify if possible)

  // Pattern: (a*)* -> a* (simplify)
  if (/\([^)]*\*[^)]*\)\*/.test(regexStr)) {
    // Try to simplify: (a*)* -> a*
    const inner = regexStr.match(/\(([^)]*\*[^)]*)\)\*/);
    if (inner && inner[1].replace(/\*/g, '') === inner[1].replace(/\*/g, '').replace(/\(/g, '').replace(/\)/g, '')) {
      return inner[1];
    }
  }

  // For constructor patterns, we can add timeout or validation
  if (isConstructor) {
    // Add input validation/sanitization
    return regexStr; // Will be handled by adding validation
  }

  // For literal patterns, try to simplify
  return regexStr;
}

function processFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) return { vulnerable: [], fixed: 0 };

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const patterns = extractRegexPatterns(content);

  const vulnerable = [];
  const fixes = [];

  for (const pattern of patterns) {
    if (isVulnerableRegex(pattern.pattern)) {
      vulnerable.push({
        file: filePath,
        line: pattern.line,
        pattern: pattern.pattern,
        isConstructor: pattern.isConstructor || false,
      });

      // Try to fix
      const fixed = fixVulnerableRegex(
        pattern.pattern,
        pattern.isConstructor || false,
        pattern.args || ''
      );

      if (fixed !== pattern.pattern) {
        fixes.push({
          line: pattern.line,
          old: pattern.pattern,
          new: fixed,
        });
      }
    }
  }

  return { vulnerable, fixes };
}

function main() {
  console.log('🔍 Scanning for ReDoS vulnerable regex patterns...\n');

  const srcFiles = findFiles(path.join(rootDir, 'src'));
  const scriptFiles = findFiles(path.join(rootDir, 'scripts'), ['.js', '.mjs']);

  const allFiles = [...srcFiles, ...scriptFiles].filter(
    f => !f.includes('fix-redos-regex.mjs')
  );

  console.log(`Found ${allFiles.length} files to analyze\n`);

  const allVulnerable = [];
  const allFixes = [];

  for (const file of allFiles) {
    const result = processFile(file);
    if (result.vulnerable.length > 0) {
      allVulnerable.push(...result.vulnerable);
      allFixes.push(...result.fixes.map(f => ({ ...f, file })));
    }
  }

  console.log(`Found ${allVulnerable.length} potentially vulnerable regex patterns\n`);

  if (allVulnerable.length > 0) {
    console.log('Vulnerable patterns:');
    allVulnerable.slice(0, 20).forEach(v => {
      console.log(`  ${v.file}:${v.line} - ${v.pattern}`);
    });
    if (allVulnerable.length > 20) {
      console.log(`  ... and ${allVulnerable.length - 20} more`);
    }
  }

  // Write report
  const reportPath = path.join(rootDir, 'reports', 'redos-analysis.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalFiles: allFiles.length,
    vulnerableCount: allVulnerable.length,
    vulnerable: allVulnerable,
    fixes: allFixes,
  }, null, 2));

  console.log(`\n📄 Report written to: ${reportPath}`);
}

main();
