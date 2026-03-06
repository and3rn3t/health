#!/usr/bin/env node
/**
 * VitalSense Contrast Audit
 * -------------------------------------------------------------
 * Scans design token color variables in a CSS file (default: src/main.css)
 * and computes WCAG 2.1 contrast ratios for key foreground/background pairs
 * in both light (:root) and dark ([data-appearance='dark']) themes.
 *
 * Usage:
 *   node scripts/node/analysis/css/contrast-audit.js [optional-css-file]
 *
 * Environment flags:
 *   WCAG_MIN_NORMAL   (default 4.5)
 *   WCAG_MIN_UI       (default 3.0)  // for large text / non-text UI targets
 *   CONTRAST_FAIL_MODE=hard          // exit(2) if any failures
 *
 * Output:
 *   Human-readable table + JSON summary (if --json)
 *
 * Pair logic:
 *   For each token group: background/foreground, card, popover, primary,
 *   secondary, muted, accent, destructive.
 * -------------------------------------------------------------
 */

import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const wantJson = args.includes('--json');
const fileArg = args.find((a) => !a.startsWith('--'));
const target = fileArg || path.join(process.cwd(), 'src', 'main.css');

if (!fs.existsSync(target)) {
  console.error(`❌ CSS file not found: ${target}`);
  process.exit(1);
}

const css = fs.readFileSync(target, 'utf8');

// Simple parser: extract blocks for :root and [data-appearance='dark']
function extractBlock(selector) {
  const idx = css.indexOf(selector);
  if (idx === -1) return '';
  const braceStart = css.indexOf('{', idx);
  if (braceStart === -1) return '';
  let depth = 0;
  for (let i = braceStart; i < css.length; i++) {
    const ch = css[i];
    if (ch === '{') depth++;
    else if (ch === '}') {
      depth--;
      if (depth === 0) {
        return css.slice(braceStart + 1, i); // inside content
      }
    }
  }
  return '';
}

function parseVars(block) {
  const map = new Map();
  block.split(/;\n?|\n/).forEach((lineRaw) => {
    const line = lineRaw.trim();
    if (!line.startsWith('--')) return;
    const [name, value] = line.split(':').map((s) => s.trim());
    if (!value) return;
    // Strip trailing commas or comments
    const cleaned = value.replace(/[,;].*$/, '').trim();
    map.set(name, cleaned);
  });
  return map;
}

const lightBlock = parseVars(extractBlock(':root'));
const darkBlock = parseVars(extractBlock("[data-appearance='dark']"));

function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return { r, g, b };
}

function relLuminance(rgb) {
  const transform = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  return 0.2126 * transform(rgb.r) + 0.7152 * transform(rgb.g) + 0.0722 * transform(rgb.b);
}

function contrast(aHex, bHex) {
  const a = hexToRgb(aHex);
  const b = hexToRgb(bHex);
  if (!a || !b) return null;
  const l1 = relLuminance(a);
  const l2 = relLuminance(b);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

const pairs = [
  ['foreground', 'background'],
  ['card-foreground', 'card'],
  ['popover-foreground', 'popover'],
  ['primary-foreground', 'primary'],
  ['secondary-foreground', 'secondary'],
  ['muted-foreground', 'muted'],
  ['accent-foreground', 'accent'],
  ['destructive-foreground', 'destructive'],
];

const thresholdNormal = parseFloat(process.env.WCAG_MIN_NORMAL || '4.5');
const thresholdUI = parseFloat(process.env.WCAG_MIN_UI || '3');

function audit(themeName, varMap) {
  const results = [];
  for (const [fgName, bgName] of pairs) {
    const fg = varMap.get(`--${fgName}`);
    const bg = varMap.get(`--${bgName}`);
    if (!fg || !bg) continue;
    if (!fg.startsWith('#') || !bg.startsWith('#')) continue; // Skip non-hex (e.g., rgba, vars)
    const ratio = contrast(fg, bg);
    if (!ratio) continue;
    const passLevel = ratio >= thresholdNormal ? 'AA (normal)' : ratio >= thresholdUI ? 'AA (large/UI)' : 'FAIL';
    const suggest = passLevel === 'FAIL' ? suggestFix(fg, bg, thresholdNormal) : null;
    results.push({ theme: themeName, pair: `${fgName} on ${bgName}`, fg, bg, ratio: +ratio.toFixed(2), status: passLevel, suggestion: suggest });
  }
  return results;
}

function adjustHex(hex, factor) {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const adj = (c) => Math.max(0, Math.min(1, c * factor));
  const r = Math.round(adj(rgb.r) * 255).toString(16).padStart(2, '0');
  const g = Math.round(adj(rgb.g) * 255).toString(16).padStart(2, '0');
  const b = Math.round(adj(rgb.b) * 255).toString(16).padStart(2, '0');
  return `#${r}${g}${b}`;
}

function suggestFix(fg, bg, target) {
  // Attempt to darken or lighten fg in small steps until ratio meets target.
  let best = null;
  const maxSteps = 20;
  for (const direction of ['lighter', 'darker']) {
    for (let step = 1; step <= maxSteps; step++) {
      const factor = direction === 'lighter' ? 1 + step * 0.05 : 1 - step * 0.05;
      const trial = adjustHex(fg, factor);
      const r = contrast(trial, bg);
      if (r && r >= target) {
        best = { newColor: trial, ratio: +r.toFixed(2), steps: step, direction };
        break;
      }
    }
    if (best) break;
  }
  return best;
}

const lightResults = audit('light', lightBlock);
const darkResults = audit('dark', darkBlock);
const all = [...lightResults, ...darkResults];

if (!wantJson) {
  console.log(`\n🎨 VitalSense Contrast Audit for ${path.basename(target)}`);
  console.log(`Thresholds: normal=${thresholdNormal} large/UI=${thresholdUI}`);
  const pad = (s, n) => s.toString().padEnd(n, ' ');
  console.log(pad('Theme', 7), pad('Pair', 32), pad('Ratio', 7), pad('Status', 15), 'Suggestion');
  console.log('-'.repeat(90));
  all.forEach((r) => {
    const sugg = r.suggestion
      ? `→ ${r.suggestion.newColor} (${r.suggestion.ratio}, ${r.suggestion.direction}, ${r.suggestion.steps} steps)`
      : '';
    console.log(
      pad(r.theme, 7),
      pad(r.pair, 32),
      pad(r.ratio, 7),
      pad(r.status, 15),
      sugg
    );
  });
  const fails = all.filter((r) => r.status === 'FAIL');
  console.log('\nSummary:');
  console.log(`  Total pairs checked: ${all.length}`);
  console.log(`  Fails: ${fails.length}`);
  if (fails.length && process.env.CONTRAST_FAIL_MODE === 'hard') {
    console.error('❌ Contrast failures detected');
    process.exit(2);
  } else if (fails.length) {
    console.warn('⚠️  Contrast issues present (non-blocking mode)');
  } else {
    console.log('✅ All checked pairs meet at least UI / large text threshold');
  }
} else {
  const json = {
    pairs: all,
    counts: {
      total: all.length,
      fails: all.filter(r => r.status === 'FAIL').length,
      normalPass: all.filter(r => r.status === 'AA (normal)').length,
      largeOnly: all.filter(r => r.status === 'AA (large/UI)').length
    }
  };
  console.log(JSON.stringify(json, null, 2));
  const fails = all.filter((r) => r.status === 'FAIL');
  if (fails.length && process.env.CONTRAST_FAIL_MODE === 'hard') process.exit(2);
}
