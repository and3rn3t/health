#!/usr/bin/env node
/**
 * SonarQube Security Hotspot Analysis
 * Identifies common security issues that need to be fixed
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

const SECURITY_PATTERNS = [
  {
    name: 'console.log (Information Disclosure)',
    pattern: /console\.(log|info|debug|warn|error)\(/g,
    severity: 'medium',
    fix: 'Use SafeLogger or remove in production',
    exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/scripts/**']
  },
  {
    name: 'innerHTML (XSS Risk)',
    pattern: /\.innerHTML\s*=/g,
    severity: 'high',
    fix: 'Use textContent or React.createElement',
    exclude: ['**/*.test.ts', '**/*.test.tsx', '**/_archive/**', '**/src/_archive/**']
  },
  {
    name: 'dangerouslySetInnerHTML (XSS Risk)',
    pattern: /dangerouslySetInnerHTML/g,
    severity: 'high',
    fix: 'Sanitize HTML or use React components',
    exclude: ['**/_archive/**', '**/src/_archive/**', '**/scripts/ci/sonar-*.mjs', '**/src/components/ui/chart.tsx']
  },
  {
    name: 'eval() (Code Injection)',
    pattern: /\beval\s*\(/g,
    severity: 'critical',
    fix: 'Use JSON.parse or Function constructor with validation',
    exclude: ['**/sonar-security-analysis.mjs', '**/scripts/**']
  },
  {
    name: 'document.write (XSS Risk)',
    pattern: /document\.write\s*\(/g,
    severity: 'high',
    fix: 'Use DOM manipulation methods',
    exclude: ['**/scripts/ci/sonar-*.mjs', '**/_archive/**']
  },
  {
    name: 'Hardcoded Secrets',
    pattern: /(password|secret|token|api[_-]?key|apikey)\s*[:=]\s*['"`][^'"`]{8,}['"`]/gi,
    severity: 'critical',
    fix: 'Move to environment variables or secrets manager',
    exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx']
  },
  {
    name: 'Unsafe Regex',
    pattern: /new RegExp\([^)]*\+[^)]*\)/g,
    severity: 'medium',
    fix: 'Validate and sanitize regex inputs',
    exclude: []
  },
  {
    name: 'Weak Crypto (MD5/SHA1)',
    pattern: /(md5|sha1)\s*\(/gi,
    severity: 'high',
    fix: 'Use SHA-256 or stronger',
    exclude: []
  },
  {
    name: 'SQL Injection Risk',
    pattern: /(query|execute|exec)\s*\(\s*['"`][^'"`]*\+/gi,
    severity: 'high',
    fix: 'Use parameterized queries',
    exclude: []
  },
  {
    name: 'Unvalidated Redirect',
    pattern: /(window\.location|location\.href|redirect)\s*=.*\$\{/g,
    severity: 'medium',
    fix: 'Validate redirect URLs against whitelist',
    exclude: []
  }
];

function shouldExclude(filePath, excludes) {
  if (!excludes || excludes.length === 0) return false;

  // Normalize path separators
  const normalizedPath = filePath.replace(/\\/g, '/');

  return excludes.some(pattern => {
    // Convert glob pattern to regex
    // ** matches any number of directories
    // * matches any characters except /
    let regexPattern = pattern
      .replace(/\*\*/g, '___DOUBLE_STAR___')
      .replace(/\*/g, '[^/]*')
      .replace(/___DOUBLE_STAR___/g, '.*');

    // Escape special regex characters except the ones we've already handled
    regexPattern = regexPattern.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    // Unescape the patterns we want
    regexPattern = regexPattern.replace(/\\\*/g, '[^/]*').replace(/\\\.\\\.\\\./g, '.*');

    const regex = new RegExp(regexPattern);
    return regex.test(normalizedPath);
  });
}

function findFiles(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    // Skip node_modules, dist, coverage, archived files, etc.
    if (entry.name.startsWith('.') ||
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'coverage' ||
        entry.name === 'ios' ||
        entry.name === '_archive' ||
        relativePath.includes('_archive')) {
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

function analyzeFile(filePath, pattern) {
  const fullPath = path.join(rootDir, filePath);

  if (!fs.existsSync(fullPath)) return [];

  const content = fs.readFileSync(fullPath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  lines.forEach((line, index) => {
    const matches = [...line.matchAll(pattern.pattern)];
    matches.forEach(match => {
      issues.push({
        file: filePath,
        line: index + 1,
        column: match.index + 1,
        pattern: pattern.name,
        severity: pattern.severity,
        fix: pattern.fix,
        snippet: line.trim().substring(0, 100)
      });
    });
  });

  return issues;
}

function main() {
  console.log('🔍 Analyzing codebase for security hotspots...\n');

  const srcFiles = findFiles(path.join(rootDir, 'src'));
  const scriptFiles = findFiles(path.join(rootDir, 'scripts'), ['.js', '.mjs']);
  // Exclude this analysis script from being analyzed
  const allFiles = [...srcFiles, ...scriptFiles].filter(
    file => !file.includes('sonar-security-analysis.mjs')
  );

  const allIssues = [];

  for (const pattern of SECURITY_PATTERNS) {
    const issues = [];

    for (const file of allFiles) {
      if (shouldExclude(file, pattern.exclude)) continue;

      const fileIssues = analyzeFile(file, pattern);
      issues.push(...fileIssues);
    }

    if (issues.length > 0) {
      allIssues.push({
        pattern: pattern.name,
        severity: pattern.severity,
        count: issues.length,
        issues: issues.slice(0, 10), // Top 10 per pattern
        fix: pattern.fix
      });
    }
  }

  // Sort by severity and count
  allIssues.sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return b.count - a.count;
  });

  // Generate report
  const report = {
    generatedAt: new Date().toISOString(),
    totalFiles: allFiles.length,
    totalIssues: allIssues.reduce((sum, p) => sum + p.count, 0),
    byPattern: allIssues.map(p => ({
      pattern: p.pattern,
      severity: p.severity,
      count: p.count,
      fix: p.fix
    })),
    topIssues: allIssues.flatMap(p => p.issues.slice(0, 5))
  };

  // Write JSON report
  const reportPath = path.join(rootDir, 'reports', 'sonar-security-analysis.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('📊 Security Hotspot Analysis Summary\n');
  console.log(`Total files analyzed: ${report.totalFiles}`);
  console.log(`Total issues found: ${report.totalIssues}\n`);

  console.log('Issues by Pattern:');
  report.byPattern.forEach(p => {
    const icon = p.severity === 'critical' ? '🔴' : p.severity === 'high' ? '🟠' : '🟡';
    console.log(`  ${icon} ${p.pattern}: ${p.count} issues (${p.severity})`);
    console.log(`     Fix: ${p.fix}`);
  });

  console.log(`\n📄 Full report: ${reportPath}`);

  // Exit with error if critical issues found
  const criticalCount = allIssues
    .filter(p => p.severity === 'critical')
    .reduce((sum, p) => sum + p.count, 0);

  if (criticalCount > 0) {
    console.log(`\n❌ Found ${criticalCount} critical security issues`);
    process.exit(1);
  }
}

main();
