#!/usr/bin/env node
/**
 * generate-changelog.mjs
 * Lightweight changelog fragment generator for CI.
 *
 * Features:
 *  - Determines previous tag (v*) and collects commits in previousTag..HEAD (or current tag range when HEAD is tagged)
 *  - Conventional commit style grouping (feat, fix, perf, refactor, docs, test, build/ci, chore, revert)
 *  - Falls back gracefully if no tags exist (initial release)
 *  - Writes a markdown fragment suitable for release notes / CHANGELOG append
 *
 * Usage:
 *  node scripts/ci/generate-changelog.mjs --output reports/release-notes.md [--range prev|auto|<git-range>] [--append CHANGELOG.md]
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function getFlag(name, def = null) {
  const idx = args.findIndex(a => a === `--${name}` || a.startsWith(`--${name}=`));
  if (idx === -1) return def;
  const eq = args[idx].indexOf('=');
  if (eq !== -1) return args[idx].slice(eq + 1);
  return args[idx + 1] && !args[idx + 1].startsWith('--') ? args[idx + 1] : true;
}

const output = getFlag('output', 'release-notes.md');
const rangeArg = getFlag('range', 'auto');
const appendFile = getFlag('append', null);

function sh(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim();
}

function safeSh(cmd) {
  try { return sh(cmd); } catch { return ''; }
}

function listTags() {
  const out = safeSh('git tag --list "v*" --sort=creatordate');
  return out ? out.split(/\r?\n/).filter(Boolean) : [];
}

const tags = listTags();
const headTag = safeSh('git describe --exact-match --tags 2>/dev/null');

let currentTag = '';
if (headTag && /^v/.test(headTag)) currentTag = headTag;
// If HEAD not tagged and we are on a tagged ref (GitHub passes ref), allow env override
if (!currentTag && process.env.GITHUB_REF && process.env.GITHUB_REF.startsWith('refs/tags/v')) {
  currentTag = process.env.GITHUB_REF.replace('refs/tags/', '');
}

let prevTag = '';
if (currentTag) {
  // previous is the largest tag older than currentTag by creation date
  const ordered = listTags();
  const idx = ordered.indexOf(currentTag);
  if (idx > 0) prevTag = ordered[idx - 1];
} else {
  // HEAD not tagged yet: previous tag is latest; current (future) tag unknown
  if (tags.length) prevTag = tags[tags.length - 1];
}

// Determine range
let range;
if (/^v.+\.{2}v.+/.test(rangeArg)) {
  range = rangeArg; // explicit
} else if (rangeArg === 'auto') {
  if (currentTag && prevTag) range = `${prevTag}..${currentTag}`;
  else if (prevTag) range = `${prevTag}..HEAD`;
  else range = ''; // initial
} else if (rangeArg === 'prev') {
  if (prevTag) range = `${prevTag}..HEAD`; else range = '';
} else {
  range = rangeArg; // custom
}

// Collect commits
let rawCommits = '';
if (range) rawCommits = safeSh(`git log --pretty=format:%H:::%s:::%an:::%ad --date=short ${range}`);
else rawCommits = safeSh('git log --pretty=format:%H:::%s:::%an:::%ad --date=short'); // initial release

const commits = rawCommits
  .split(/\r?\n/)
  .filter(Boolean)
  .map(line => {
    const [hash, subject, author, date] = line.split(':::');
    return { hash: hash.slice(0, 10), subject, author, date };
  });

function classify(subject) {
  const lower = subject.toLowerCase();
  const match = /^(feat|fix|perf|refactor|docs|test|build|ci|chore|revert)(\([^)]*\))?!?:/.exec(lower);
  if (match) return match[1];
  return 'other';
}

const groups = new Map([
  ['feat', 'Features'],
  ['fix', 'Fixes'],
  ['perf', 'Performance'],
  ['refactor', 'Refactors'],
  ['docs', 'Documentation'],
  ['test', 'Tests'],
  ['build', 'Build System'],
  ['ci', 'CI'],
  ['chore', 'Chores'],
  ['revert', 'Reverts'],
  ['other', 'Other Changes']
]);

const bucket = {};
for (const c of commits) {
  const k = classify(c.subject);
  (bucket[k] ||= []).push(c);
}

const today = new Date().toISOString().slice(0, 10);
let titleTag = currentTag || process.env.RELEASE_TAG || 'UNRELEASED';
// Normalize if we are preparing for a tag creation (no current tag yet)
if (titleTag === 'UNRELEASED' && prevTag) {
  // Suggest a next version: naive bump minor if feat present else patch
  const last = prevTag.replace(/^v/, '');
  const parts = last.split('.').map(n => parseInt(n, 10) || 0);
  while (parts.length < 3) parts.push(0);
  if (bucket.feat && bucket.feat.length) parts[1] += 1; else parts[2] += 1;
  parts[2] = bucket.feat && bucket.feat.length ? 0 : parts[2];
  titleTag = 'v' + parts.join('.');
}

let md = `## ${titleTag} (${today})\n\n`;
if (range) md += `Range: ${range}\n\n`;

const order = Array.from(groups.keys());
for (const key of order) {
  const arr = bucket[key];
  if (!arr || !arr.length) continue;
  md += `### ${groups.get(key)}\n`;
  for (const c of arr) {
    // Strip conventional prefix for readability
    const pretty = c.subject.replace(/^(feat|fix|perf|refactor|docs|test|build|ci|chore|revert)(\([^)]*\))?!?:\s*/, '');
    md += `- ${pretty} (${c.hash}, ${c.date})\n`;
  }
  md += '\n';
}

if (!commits.length) md += '_No commits in range._\n';

fs.mkdirSync(path.dirname(output), { recursive: true });
fs.writeFileSync(output, md, 'utf8');
console.log(`[changelog] Wrote ${output} (${commits.length} commits)`);

if (appendFile) {
  let existing = '';
  if (fs.existsSync(appendFile)) existing = fs.readFileSync(appendFile, 'utf8');
  const updated = existing.includes('# Changelog') ? existing.replace('# Changelog', `# Changelog\n\n${md}`) : `# Changelog\n\n${md}\n${existing}`;
  fs.writeFileSync(appendFile, updated, 'utf8');
  console.log(`[changelog] Updated ${appendFile}`);
}
