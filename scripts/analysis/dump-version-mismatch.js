#!/usr/bin/env node
/**
 * Dump current version mismatch debug buffer to a file or stdout.
 * Usage: node scripts/node/analytics/dump-version-mismatch.js [--out mismatch.json] [--url http://127.0.0.1:8789]
 */
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
function getArg(name, def) {
  const i = args.indexOf(name);
  if (i !== -1 && i + 1 < args.length) return args[i + 1];
  return def;
}
const help = args.includes('--help') || args.includes('-h');
if (help) {
  console.log('Dump analytics version mismatch events to JSON');
  console.log('--url <baseUrl>    Base URL (default http://127.0.0.1:8789)');
  console.log('--out <file>       Output file (if omitted, prints to stdout)');
  process.exit(0);
}
const baseUrl = getArg('--url', 'http://127.0.0.1:8789');
const outFile = getArg('--out', null);

async function run() {
  try {
    const res = await fetch(`${baseUrl}/api/_debug/version-mismatch-events`, {
      headers: { 'cache-control': 'no-store' },
    });
    const json = await res.json();
    if (!res.ok || !json?.ok) {
      console.error('Error fetching events:', json?.error || res.status);
      process.exit(1);
    }
    const data = {
      fetchedAt: new Date().toISOString(),
      count: (json.events || []).length,
      events: json.events || [],
    };
    const serialized = JSON.stringify(data, null, 2);
    if (outFile) {
      const abs = path.resolve(outFile);
      fs.writeFileSync(abs, serialized);
      console.log(`Wrote ${data.count} events → ${abs}`);
    } else {
      console.log(serialized);
    }
  } catch (e) {
    console.error('Failure:', e.message);
    process.exit(1);
  }
}
run();
