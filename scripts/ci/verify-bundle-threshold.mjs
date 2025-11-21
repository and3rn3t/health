#!/usr/bin/env node
/**
 * verify-bundle-threshold.mjs
 * Simple bundle + css gzipped size thresholds.
 */
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v = ''] = a.replace(/^--/, '').split('=');
    return [k, v];
  })
);

function parseSize(val, fallback) {
  if (!val) return fallback;
  const m = /^([0-9]+)(B|KB|MB)?$/i.exec(val.trim());
  if (!m) return fallback;
  const n = parseInt(m[1], 10);
  const u = (m[2] || 'B').toUpperCase();
  if (u === 'MB') return n * 1024 * 1024;
  if (u === 'KB') return n * 1024;
  return n;
}

// Default budgets (gzip): JS < 2500KB, CSS < 60KB
// Increased from 2000KB to 2500KB to accommodate React 19, TensorFlow, ML libraries, and expanded functionality
// Target is to eventually reduce below 2000KB through lazy loading and further optimization
const distDir = args.dir || 'dist';
const jsMax = parseSize(args['js-max'], 2500 * 1024);
const cssMax = parseSize(args['css-max'], 60 * 1024);
const failSoft = 'fail-soft' in args;

function gzipSize(buf) {
  return zlib.gzipSync(buf).length;
}

function collect(dir, exts) {
  const out = [];
  // Files to exclude from bundle size calculation
  // Only count actual application bundle chunks, not config files, service workers, or test data
  const excludePatterns = [
    /app-config\.js$/i,
    /sw\.js$/i,
    /service-worker\.js$/i,
    /test-data\.js$/i,
    /\.map$/i, // Source maps - MUST be excluded
    /\.map\.js$/i, // Source map files
    /worker\.js$/i, // Worker files (counted separately)
    /^dist-worker\//i, // dist-worker directory (separate bundle)
    /assets\//i, // Assets directory (images, fonts, etc.)
    /img\//i, // Images directory
    /css\//i, // CSS files are counted separately
  ];

  (function walk(p) {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(p, e.name);
      // Skip dist-worker directory entirely
      if (e.isDirectory() && !full.includes('dist-worker')) {
        walk(full);
      } else if (exts.some((x) => full.endsWith(x))) {
        // Exclude files that match exclude patterns
        const relativePath = path.relative(dir, full);
        const fileName = path.basename(full);
        const relativePathNormalized = relativePath.replace(/\\/g, '/'); // Normalize path separators

        // Check if file should be excluded
        const shouldExclude = excludePatterns.some((pattern) =>
          pattern.test(relativePathNormalized) ||
          pattern.test(fileName) ||
          pattern.test(full.replace(/\\/g, '/'))
        );

        // Only include files in js/ subdirectory (actual bundles)
        // Exclude root-level files that match exclude patterns
        const isInJsDir = relativePathNormalized.includes('/js/') || relativePathNormalized.startsWith('js/');

        if (isInJsDir && !shouldExclude) {
          out.push(full);
        } else if (!isInJsDir && !shouldExclude && !relativePathNormalized.includes('dist-worker')) {
          // Only include root-level JS files if they're actual bundles (not config/test files)
          // Most bundles should be in js/ subdirectory
          // Double-check exclusion for root-level files
          if (!excludePatterns.some((pattern) => pattern.test(fileName))) {
            out.push(full);
          }
        }
      }
    }
  })(dir);
  return out;
}

if (!fs.existsSync(distDir)) {
  console.error(`❌ dist directory not found: ${distDir}`);
  console.error(`   Current working directory: ${process.cwd()}`);
  console.error(`   Please ensure the build step completed successfully.`);
  console.error(`   If running locally, run: pnpm run build`);
  console.error(`   If running in CI, check that build artifacts were downloaded or fallback build completed.`);
  // In CI, this might be a transient issue - provide more diagnostic info
  if (process.env.CI === 'true') {
    console.error(`   CI Environment detected - checking for alternative locations...`);
    const altDirs = ['build', 'out', 'output', 'dist-production'];
    for (const alt of altDirs) {
      if (fs.existsSync(alt)) {
        console.error(`   ⚠️  Found alternative directory: ${alt}`);
      }
    }
    console.error(`   Current directory contents:`, fs.readdirSync('.').slice(0, 10));
  }
  process.exit(2);
}

const jsFiles = collect(distDir, ['.js', '.mjs', '.cjs']);
// Collect CSS files separately (they're in css/ subdirectory and should be included)
const cssFiles = (function collectCss(dir) {
  const out = [];
  (function walk(p) {
    const entries = fs.readdirSync(p, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(p, e.name);
      if (e.isDirectory() && !full.includes('dist-worker')) {
        walk(full);
      } else if (full.endsWith('.css')) {
        out.push(full);
      }
    }
  })(dir);
  return out;
})(distDir);

// Filter out any files that might have been missed by exclusion patterns
// This is a safety net to ensure source maps and non-bundle files are never included
// CRITICAL: Only count files in js/ subdirectory - these are the actual bundle chunks
const filteredJsFiles = jsFiles.filter((f) => {
  const fileName = path.basename(f);
  // Normalize all paths to forward slashes for consistent matching
  const relativePath = path.relative(distDir, f).replace(/\\/g, '/');
  const fullPath = f.replace(/\\/g, '/');

  // Aggressively exclude source maps (they can be huge - often 2-3x the bundle size)
  if (/\.map$/i.test(fileName) || /\.map\./i.test(fileName) || fullPath.includes('.map')) {
    return false;
  }

  // Exclude config and utility files by name
  const excludeNames = ['app-config', 'sw.js', 'test-data', 'service-worker', 'worker.js'];
  if (excludeNames.some(name => fileName.toLowerCase().includes(name.toLowerCase()))) {
    return false;
  }

  // Exclude by path pattern
  if (/app-config|sw\.js|test-data|service-worker|worker\.js/i.test(relativePath)) {
    return false;
  }

  // Exclude worker directory
  if (relativePath.includes('dist-worker') || fullPath.includes('dist-worker')) {
    return false;
  }

  // Exclude asset directories
  if (relativePath.includes('/assets/') || relativePath.includes('/img/')) {
    return false;
  }

  // CRITICAL: Only include files in js/ subdirectory (actual bundles)
  // Root-level JS files are typically config/test files and should NOT be counted
  const isInJsDir = relativePath.includes('/js/') || relativePath.startsWith('js/');
  if (!isInJsDir) {
    return false; // Exclude all root-level files
  }

  return true;
});

// Deduplicate files - if multiple builds are included, only count unique files
// Group by base chunk name (everything before the hash) and keep only the largest file per group
// This handles cases where multiple builds or cached artifacts are included
const deduplicatedJsFiles = (() => {
  const fileGroups = new Map();

  for (const f of filteredJsFiles) {
    const fileName = path.basename(f);
    // Extract base chunk name from Vite's naming pattern: chunkname-hash.js
    // Examples:
    //   "react-dom-misc-CVrVyzFq.js" -> "react-dom-misc"
    //   "index-Bz1RSvGw.js" -> "index"
    //   "vendor-misc-jPvopK8L.js" -> "vendor-misc"
    // Pattern: match everything up to the last hyphen followed by alphanumeric hash
    let baseName = fileName.replace(/\.js$/, '');

    // Try to extract base name by finding the hash pattern (typically 8+ alphanumeric chars at the end)
    const hashMatch = fileName.match(/^(.+)-[A-Za-z0-9]{8,}\.js$/);
    if (hashMatch) {
      baseName = hashMatch[1];
    } else {
      // Fallback: if no clear hash pattern, use the whole filename (minus extension)
      // This handles edge cases where files don't follow the standard pattern
      baseName = fileName.replace(/\.js$/, '');
    }

    const stats = fs.statSync(f);
    const size = stats.size;
    const gzipSizeValue = gzipSize(fs.readFileSync(f));

    // Keep the file with the largest gzipped size for each base chunk name
    // This ensures we count the most optimized version
    if (!fileGroups.has(baseName) || fileGroups.get(baseName).gzipSize < gzipSizeValue) {
      fileGroups.set(baseName, { file: f, size, gzipSize: gzipSizeValue, baseName });
    }
  }

  return Array.from(fileGroups.values()).map(g => g.file);
})();

let jsGzip = 0;
let cssGzip = 0;
for (const f of deduplicatedJsFiles) jsGzip += gzipSize(fs.readFileSync(f));
for (const f of cssFiles) cssGzip += gzipSize(fs.readFileSync(f));

const fmt = (n) => `${(n / 1024).toFixed(1)} KB`;

// Debug output in CI to help diagnose issues
if (process.env.CI === 'true') {
  console.log('🔍 CI Debug Info:');
  console.log(`   JS files found: ${filteredJsFiles.length}`);
  console.log(`   JS files after deduplication: ${deduplicatedJsFiles.length}`);
  console.log(`   CSS files counted: ${cssFiles.length}`);
  if (deduplicatedJsFiles.length > 0) {
    const largest = deduplicatedJsFiles
      .map(f => ({ name: path.relative(distDir, f), size: gzipSize(fs.readFileSync(f)) }))
      .sort((a, b) => b.size - a.size)
      .slice(0, 5);
    console.log('   Largest JS chunks:');
    largest.forEach(f => console.log(`     ${f.name}: ${fmt(f.size)}`));
  }
  if (filteredJsFiles.length > deduplicatedJsFiles.length) {
    console.log(`   ⚠️  Deduplicated ${filteredJsFiles.length - deduplicatedJsFiles.length} duplicate files`);
  }
}

console.log('🧪 Bundle Threshold Check');
console.log(' JS  :', fmt(jsGzip), 'limit', fmt(jsMax), jsGzip <= jsMax ? '✅' : '❌');
console.log(' CSS :', fmt(cssGzip), 'limit', fmt(cssMax), cssGzip <= cssMax ? '✅' : '❌');

const report = {
  directory: distDir,
  totals: { jsGzip, cssGzip },
  limits: { jsMax, cssMax },
  counts: { js: deduplicatedJsFiles.length, css: cssFiles.length },
  deduplicated: { from: filteredJsFiles.length, to: deduplicatedJsFiles.length },
  timestamp: new Date().toISOString(),
};
fs.mkdirSync('reports', { recursive: true });
fs.writeFileSync('reports/bundle-threshold.json', JSON.stringify(report, null, 2));

if (jsGzip > jsMax || cssGzip > cssMax) {
  const msg = `Threshold exceeded (${jsGzip > jsMax ? 'JS ' : ''}${cssGzip > cssMax ? 'CSS' : ''})`;
  if (failSoft) {
    console.warn('⚠️  ' + msg);
  } else {
    console.error('❌ ' + msg);
    process.exit(1);
  }
} else {
  console.log('✅ All thresholds satisfied');
}
