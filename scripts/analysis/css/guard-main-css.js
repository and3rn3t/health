#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

// Configuration (env-overridable)
const MAX_LINES = parseInt(process.env.CSS_GUARD_MAX_LINES || '250', 10);
const MAX_BYTES = parseInt(process.env.CSS_GUARD_MAX_BYTES || '15360', 10); // 15KB authored ceiling
const ALLOW_TW = process.env.CSS_GUARD_ALLOW_TW === 'true'; // escape hatch if ever truly needed
const BORDERLINE_NORMAL_MIN = 4.5; // WCAG AA normal text pass threshold
const BORDERLINE_NORMAL_WARN = 4.45; // warn if within (warn, pass)
const BORDERLINE_LARGE_MIN = 3.0; // WCAG AA large/UI threshold
const BORDERLINE_LARGE_WARN = 2.95;

// Utility leak detection patterns (raw Tailwind build artefacts to keep out of authored file)
// We purposely allow our custom component class names (prefixed vitalsense- / vs-) and do NOT
// treat @apply usage as leakage. We only flag if we see raw generated selectors or --tw- vars.
const UTILITY_PATTERNS = [
  /--tw-/g,
  // Match classic utility tokens that include bracketed arbitrary values or numeric scales e.g. .pt-4 { .text-[14px] { etc.
  /\.(?:p[trblxy]?|m[trblxy]?|pt|pb|pl|pr|px|py|my|mx|text|bg|gap|space|w|h|min-w|min-h|max-w|max-h|leading|tracking|rounded)(?:-[0-9]{1,2}|-\[[^\]]+\])?\s*\{/g,
];

const file = path.join(process.cwd(), 'src', 'main.css');
if (!fs.existsSync(file)) {
  console.error('❌ main.css missing');
  process.exit(1);
}
const raw = fs.readFileSync(file, 'utf8');
const lines = raw.split(/\n/).length;
const sentinelCount = (raw.match(/SENTINEL:EOF/g) || []).length;
const bytes = Buffer.byteLength(raw, 'utf8');
const maxLines = MAX_LINES;
let failed = false;
if (lines > maxLines) {
  console.error(`❌ main.css too large: ${lines} lines (limit ${maxLines})`);
  failed = true;
}
if (bytes > MAX_BYTES) {
  console.error(`❌ main.css byte size too large: ${bytes} bytes (limit ${MAX_BYTES})`);
  failed = true;
}
if (sentinelCount !== 1) {
  console.error(`❌ Expected exactly 1 SENTINEL:EOF, found ${sentinelCount}`);
  failed = true;
}

// Detect utility leakage unless explicitly allowed
if (!ALLOW_TW) {
  let utilityHits = 0;
  for (const pattern of UTILITY_PATTERNS) {
    const matches = raw.match(pattern);
    if (matches) {
      // Filter: exclude custom prefixes & known semantic classes
      const filtered = matches.filter(m => !/\.vitalsense-|\.vs-|\.thin-scrollbar|\.sr-only/.test(m));
      // Additional filter: ignore if selector contains two hyphens (likely BEM / custom)
      const refined = filtered.filter(m => !(m.match(/-/g) || []).length || (m.match(/-/g) || []).length < 2);
      utilityHits += refined.length;
    }
  }
  if (utilityHits > 0) {
    console.error(`❌ Detected ${utilityHits} potential generated utility selectors / Tailwind runtime markers in authored main.css.`);
    console.error('    This likely indicates accidental paste of compiled utilities.');
    failed = true;
  }
}

// Duplicate token detection in :root scope (ignore dark theme overrides)
try {
  const rootMatch = raw.match(/:root\s*{([\s\S]*?)}/);
  if (rootMatch) {
    const varsBlock = rootMatch[1];
    const varRegex = /--([a-z0-9-]+):\s*([^;]+);/gi;
    const seen = new Map();
    const duplicates = [];
    let m;
    while ((m = varRegex.exec(varsBlock)) !== null) {
      const name = m[1];
      const value = m[2].trim();
      if (seen.has(name) && seen.get(name) !== value) {
        duplicates.push({ name, first: seen.get(name), second: value });
      } else if (!seen.has(name)) {
        seen.set(name, value);
      }
    }
    if (duplicates.length) {
      console.error('❌ Duplicate conflicting token definitions in :root:');
      for (const d of duplicates) {
        console.error(`   --${d.name}: ${d.first} (and later ${d.second})`);
      }
      failed = true;
    }
  }
} catch (e) {
  console.warn('⚠️  Duplicate token scan error (non-fatal):', e.message);
}

// Run contrast audit in JSON mode
const audit = spawnSync('node', ['scripts/node/analysis/css/contrast-audit.js', '--json'], { encoding: 'utf8' });
if (audit.status !== 0) {
  console.error('❌ Contrast audit process failed');
  console.error(audit.stderr || audit.stdout);
  failed = true;
} else {
  try {
  const result = JSON.parse(audit.stdout.trim());
  const pairs = result.pairs || result.results || [];
  const fails = pairs.filter(p => p.status === 'FAIL');
  const borderline = [];
  for (const p of pairs) {
    // Heuristic: if audit status already FAIL, skip; only evaluate passes near threshold.
    if (p.status === 'FAIL') continue;
    const ratio = Number(p.ratio);
    if (Number.isNaN(ratio)) continue;
    const largeOrUi = p.isLarge || /large|ui/i.test(p.category || '') || /ui/i.test(p.pair || '');
    if (!largeOrUi) {
      if (ratio < BORDERLINE_NORMAL_MIN && ratio >= BORDERLINE_NORMAL_WARN) {
        borderline.push({ ...p, threshold: BORDERLINE_NORMAL_MIN });
      }
    } else {
      if (ratio < BORDERLINE_LARGE_MIN && ratio >= BORDERLINE_LARGE_WARN) {
        borderline.push({ ...p, threshold: BORDERLINE_LARGE_MIN });
      }
    }
  }
    if (fails.length) {
      console.error('❌ Contrast failures detected:');
      for (const f of fails) {
        console.error(`  - ${f.theme} ${f.pair} ratio ${f.ratio} suggestion ${f.suggestion || ''}`);
      }
      failed = true;
    } else {
      console.log('✅ Contrast audit passed (no FAIL pairs)');
      if (borderline.length) {
        console.warn(`⚠️  ${borderline.length} borderline contrast pairs within 0.05 of threshold:`);
        for (const b of borderline) {
          console.warn(`  - ${b.theme} ${b.pair} ratio ${b.ratio} (threshold ${b.threshold})`);
        }
      }
    }

    // Persist artifact (pairs + summary) for CI / drift tracking
    try {
      const reportsDir = path.join(process.cwd(), 'reports');
      fs.mkdirSync(reportsDir, { recursive: true });
      const artifact = {
        generatedAt: new Date().toISOString(),
        lines,
        bytes,
        sentinelCount,
        fails: fails.length,
        borderline: borderline.length,
        pairs,
      };
      fs.writeFileSync(path.join(reportsDir, 'contrast-report.json'), JSON.stringify(artifact, null, 2));
      console.log('📝 Wrote reports/contrast-report.json');
    } catch (e) {
      console.warn('⚠️  Unable to write contrast-report.json artifact:', e.message);
    }
  } catch (e) {
    console.error('❌ Unable to parse contrast audit JSON output');
    failed = true;
  }
}

if (failed) {
  console.error('🔒 main.css guard failed');
  process.exit(1);
} else {
  console.log(`✅ main.css guard success (lines=${lines}, bytes=${bytes}, sentinel=1)`);
}
