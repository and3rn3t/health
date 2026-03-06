#!/usr/bin/env node
/**
 * Dump raw src/main.css (or provided path) to stdout plus write copies under debug/.
 * Provides metadata: line count, byte size, sha256.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const target = process.argv[2] || path.join(process.cwd(), 'src', 'main.css');
if (!fs.existsSync(target)) {
  console.error('❌ File not found: ' + target);
  process.exit(1);
}
const raw = fs.readFileSync(target, 'utf8');
const lines = raw.split(/\n/).length;
const bytes = Buffer.byteLength(raw);
const hash = crypto.createHash('sha256').update(raw).digest('hex');
const debugDir = path.join(process.cwd(), 'debug');
fs.mkdirSync(debugDir, { recursive: true });
const stamp = new Date().toISOString().replace(/[:.]/g, '-');
const base = path.basename(target);
const dumpPath = path.join(debugDir, `${base}.raw-${stamp}.txt`);
const metaPath = path.join(debugDir, `${base}.meta-${stamp}.txt`);
fs.writeFileSync(dumpPath, raw, 'utf8');
fs.writeFileSync(metaPath, `FILE:${target}\nLINES:${lines}\nBYTES:${bytes}\nSHA256:${hash}\nDUMP:${dumpPath}\nMETA:${metaPath}\n`, 'utf8');

// Also attempt to isolate only authored section up to first SENTINEL marker for analysis.
let truncated = raw;
const sentinelIndex = raw.indexOf('/* SENTINEL:EOF */');
if (sentinelIndex !== -1) {
  // include sentinel line only once
  const afterSentinel = raw.indexOf('\n', sentinelIndex);
  truncated = raw.slice(0, afterSentinel === -1 ? raw.length : afterSentinel) + '\n';
  fs.writeFileSync(path.join(debugDir, `${base}.truncated-${stamp}.txt`), truncated, 'utf8');
}

console.log(`LINES:${lines}`);
console.log(`BYTES:${bytes}`);
console.log(`SHA256:${hash}`);
console.log(`RAW_DUMP:${dumpPath}`);
console.log(`META:${metaPath}`);
if (sentinelIndex !== -1) {
  console.log('NOTE: SENTINEL found at char', sentinelIndex, 'truncated copy written.');
}
console.log('---BEGIN-CONTENT---');
process.stdout.write(raw);
console.log('\n---END-CONTENT---');
