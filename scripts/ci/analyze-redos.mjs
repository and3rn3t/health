#!/usr/bin/env node
/**
 * Analyze ReDoS vulnerabilities in regex patterns
 * Identifies patterns vulnerable to super-linear runtime
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// ReDoS vulnerability patterns
const VULNERABLE_PATTERNS = [
  {
    name: 'Nested quantifiers (a+)+',
    pattern: /\([^)]*\+[^)]*\)\+/,
    severity: 'high',
    fix: 'Simplify nested quantifiers or use atomic groups',
  },
  {
    name: 'Nested quantifiers (a*)*',
    pattern: /\([^)]*\*[^)]*\)\*/,
    severity: 'high',
    fix: 'Simplify nested quantifiers',
  },
  {
    name: 'Nested quantifiers (a+)*',
    pattern: /\([^)]*\+[^)]*\)\*/,
    severity: 'high',
    fix: 'Simplify nested quantifiers',
  },
  {
    name: 'Complex alternation with quantifiers',
    pattern: /\([^|]+\|[^|]+\|.*\)[\*\+]/,
    severity: 'medium',
    fix: 'Reorder alternation to match most specific first',
  },
  {
    name: 'Unbounded repetition in character class',
    pattern: /\[[^\]]*\][\*\+]{2,}/,
    severity: 'medium',
    fix: 'Limit repetition or use possessive quantifiers',
  },
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

function extractRegexPatterns(content) {
  const patterns = [];
  const lines = content.split('\n');

  // Match regex literals: /pattern/flags
  const regexLiteral = /\/[^\/\n]+\/[gimuy]*/g;
  let match;
  while ((match = regexLiteral.exec(content)) !== null) {
    const lineNum = content.substring(0, match.index).split('\n').length;
    patterns.push({
      pattern: match[0],
      index: match.index,
      line: lineNum,
      context: lines[lineNum - 1]?.trim() || '',
    });
  }

  // Match new RegExp(...) and RegExp(...)
  const regExpPatterns = [
    /new\s+RegExp\(([^)]+)\)/g,
    /(?:^|[^n])RegExp\(([^)]+)\)/g, // Not preceded by 'new'
  ];

  for (const pattern of regExpPatterns) {
    while ((match = pattern.exec(content)) !== null) {
      const lineNum = content.substring(0, match.index).split('\n').length;
      patterns.push({
        pattern: match[0],
        index: match.index,
        line: lineNum,
        context: lines[lineNum - 1]?.trim() || '',
        isConstructor: true,
        args: match[1],
      });
    }
  }

  return patterns;
}

function isVulnerable(regexStr, vulnerablePatterns) {
  for (const vp of vulnerablePatterns) {
    if (vp.pattern.test(regexStr)) {
      return vp;
    }
  }
  return null;
}

function analyzeFile(filePath) {
  const fullPath = path.join(rootDir, filePath);
  if (!fs.existsSync(fullPath)) return [];

  const content = fs.readFileSync(fullPath, 'utf8');
  const patterns = extractRegexPatterns(content);
  const vulnerabilities = [];

  for (const pattern of patterns) {
    const vuln = isVulnerable(pattern.pattern, VULNERABLE_PATTERNS);
    if (vuln) {
      vulnerabilities.push({
        file: filePath,
        line: pattern.line,
        pattern: pattern.pattern,
        context: pattern.context,
        vulnerability: vuln.name,
        severity: vuln.severity,
        fix: vuln.fix,
        isConstructor: pattern.isConstructor || false,
      });
    }
  }

  return vulnerabilities;
}

function main() {
  console.log('🔍 Analyzing regex patterns for ReDoS vulnerabilities...\n');

  const srcFiles = findFiles(path.join(rootDir, 'src'));
  const scriptFiles = findFiles(path.join(rootDir, 'scripts'), ['.js', '.mjs']);

  const allFiles = [...srcFiles, ...scriptFiles].filter(
    f => !f.includes('analyze-redos.mjs') && !f.includes('fix-redos-regex.mjs')
  );

  console.log(`Analyzing ${allFiles.length} files...\n`);

  const allVulnerabilities = [];

  for (const file of allFiles) {
    const vulns = analyzeFile(file);
    allVulnerabilities.push(...vulns);
  }

  // Group by severity
  const bySeverity = {
    high: allVulnerabilities.filter(v => v.severity === 'high'),
    medium: allVulnerabilities.filter(v => v.severity === 'medium'),
  };

  console.log(`Found ${allVulnerabilities.length} potentially vulnerable regex patterns:\n`);
  console.log(`  🔴 High: ${bySeverity.high.length}`);
  console.log(`  🟡 Medium: ${bySeverity.medium.length}\n`);

  if (allVulnerabilities.length > 0) {
    console.log('Vulnerable patterns:');
    allVulnerabilities.slice(0, 20).forEach(v => {
      const icon = v.severity === 'high' ? '🔴' : '🟡';
      console.log(`  ${icon} ${v.file}:${v.line}`);
      console.log(`     Pattern: ${v.pattern}`);
      console.log(`     Issue: ${v.vulnerability}`);
      console.log(`     Fix: ${v.fix}\n`);
    });
    if (allVulnerabilities.length > 20) {
      console.log(`  ... and ${allVulnerabilities.length - 20} more\n`);
    }
  }

  // Write report
  const reportPath = path.join(rootDir, 'reports', 'redos-vulnerabilities.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify({
    generatedAt: new Date().toISOString(),
    totalFiles: allFiles.length,
    totalVulnerabilities: allVulnerabilities.length,
    bySeverity: {
      high: bySeverity.high.length,
      medium: bySeverity.medium.length,
    },
    vulnerabilities: allVulnerabilities,
  }, null, 2));

  console.log(`📄 Report written to: ${reportPath}`);

  if (allVulnerabilities.length > 0) {
    process.exit(1);
  }
}

main();
