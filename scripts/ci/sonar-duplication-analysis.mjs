#!/usr/bin/env node
/**
 * SonarQube Duplication Analysis
 * Identifies duplicated code blocks to reduce duplication below 3%
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '../..');

// Minimum lines to consider as duplication
const MIN_DUPLICATE_LINES = 5;

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8').split('\n');
  } catch {
    return [];
  }
}

function normalizeLine(line) {
  // Remove comments, normalize whitespace, remove string literals
  return line
    .replace(/\/\/.*$/, '') // Remove single-line comments
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove multi-line comments
    .replace(/['"`][^'"`]*['"`]/g, '""') // Normalize strings
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

function findDuplications(files) {
  const fileContents = new Map();
  const lineHashes = new Map(); // hash -> [{file, startLine}]

  // Read and normalize all files
  for (const file of files) {
    const fullPath = path.join(rootDir, file);
    if (!fs.existsSync(fullPath)) continue;

    const lines = readFile(fullPath);
    const normalized = lines.map(normalizeLine);
    fileContents.set(file, { original: lines, normalized });

    // Create sliding windows of MIN_DUPLICATE_LINES
    for (let i = 0; i <= normalized.length - MIN_DUPLICATE_LINES; i++) {
      const window = normalized.slice(i, i + MIN_DUPLICATE_LINES);
      const hash = window.join('\n');

      if (!lineHashes.has(hash)) {
        lineHashes.set(hash, []);
      }
      lineHashes.get(hash).push({ file, startLine: i + 1 });
    }
  }

  // Find duplicates (same hash appears in multiple files or multiple times in same file)
  const duplicates = [];

  for (const [hash, occurrences] of lineHashes.entries()) {
    if (occurrences.length < 2) continue;

    // Group by file
    const byFile = new Map();
    for (const occ of occurrences) {
      if (!byFile.has(occ.file)) {
        byFile.set(occ.file, []);
      }
      byFile.get(occ.file).push(occ.startLine);
    }

    // Only report if it appears in multiple files OR multiple times in same file
    if (byFile.size > 1 || (byFile.size === 1 && Array.from(byFile.values())[0].length > 1)) {
      duplicates.push({
        hash,
        occurrences,
        lines: hash.split('\n').length,
        files: Array.from(byFile.keys())
      });
    }
  }

  return duplicates.sort((a, b) => b.lines - a.lines);
}

function findFiles(dir, extensions = ['.ts', '.tsx']) {
  const files = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(rootDir, fullPath);

    // Skip exclusions
    if (entry.name.startsWith('.') ||
        entry.name === 'node_modules' ||
        entry.name === 'dist' ||
        entry.name === 'coverage' ||
        entry.name === 'ios' ||
        relativePath.includes('_archive') ||
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

function countTotalLines(files) {
  let total = 0;
  for (const file of files) {
    const fullPath = path.join(rootDir, file);
    if (fs.existsSync(fullPath)) {
      const lines = readFile(fullPath);
      total += lines.length;
    }
  }
  return total;
}

function main() {
  console.log('🔍 Analyzing codebase for code duplication...\n');

  const srcFiles = findFiles(path.join(rootDir, 'src'));
  const totalLines = countTotalLines(srcFiles);

  console.log(`Analyzing ${srcFiles.length} files (${totalLines} total lines)...`);

  const duplicates = findDuplications(srcFiles);

  // Calculate duplication percentage
  const duplicatedLines = duplicates.reduce((sum, dup) => {
    // Count unique lines per file (avoid double counting)
    const uniqueLines = new Set();
    for (const occ of dup.occurrences) {
      for (let i = 0; i < dup.lines; i++) {
        uniqueLines.add(`${occ.file}:${occ.startLine + i}`);
      }
    }
    return sum + uniqueLines.size;
  }, 0);

  const duplicationPercent = totalLines > 0 ? (duplicatedLines / totalLines) * 100 : 0;

  // Group duplicates by file pairs
  const byFilePair = new Map();
  for (const dup of duplicates) {
    const files = dup.files.sort().join(' <-> ');
    if (!byFilePair.has(files)) {
      byFilePair.set(files, []);
    }
    byFilePair.get(files).push(dup);
  }

  // Generate report
  const report = {
    generatedAt: new Date().toISOString(),
    totalFiles: srcFiles.length,
    totalLines,
    duplicatedLines,
    duplicationPercent: duplicationPercent.toFixed(2),
    targetPercent: 3.0,
    status: duplicationPercent < 3.0 ? 'PASS' : 'FAIL',
    duplicateBlocks: duplicates.length,
    topDuplicates: duplicates.slice(0, 20).map(dup => ({
      lines: dup.lines,
      files: dup.files,
      occurrences: dup.occurrences.length,
      sample: dup.hash.split('\n').slice(0, 3).join(' | ')
    })),
    byFilePair: Array.from(byFilePair.entries()).map(([files, dups]) => ({
      files,
      count: dups.length,
      totalLines: dups.reduce((sum, d) => sum + d.lines, 0)
    })).sort((a, b) => b.totalLines - a.totalLines).slice(0, 10)
  };

  // Write JSON report
  const reportPath = path.join(rootDir, 'reports', 'sonar-duplication-analysis.json');
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));

  // Print summary
  console.log('\n📊 Duplication Analysis Summary\n');
  console.log(`Total files: ${report.totalFiles}`);
  console.log(`Total lines: ${report.totalLines}`);
  console.log(`Duplicated lines: ${report.duplicatedLines}`);
  console.log(`Duplication: ${report.duplicationPercent}% (target: <3.0%)\n`);

  if (report.status === 'FAIL') {
    console.log('❌ FAIL: Duplication exceeds 3% threshold');
    console.log(`   Need to reduce by ${(duplicationPercent - 3.0).toFixed(2)}% (${Math.ceil((duplicationPercent - 3.0) * totalLines / 100)} lines)\n`);
  } else {
    console.log('✅ PASS: Duplication is below 3% threshold\n');
  }

  if (report.topDuplicates.length > 0) {
    console.log('Top Duplicate Blocks:');
    report.topDuplicates.slice(0, 10).forEach((dup, i) => {
      console.log(`\n  ${i + 1}. ${dup.lines} lines duplicated in ${dup.files.length} file(s) (${dup.occurrences} occurrences)`);
      console.log(`     Files: ${dup.files.join(', ')}`);
      console.log(`     Sample: ${dup.sample.substring(0, 80)}...`);
    });
  }

  console.log(`\n📄 Full report: ${reportPath}`);

  if (report.status === 'FAIL') {
    process.exit(1);
  }
}

main();
