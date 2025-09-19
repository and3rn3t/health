#!/usr/bin/env node
/**
 * ci-scorecard.mjs
 * Produces a human-readable CI status scoreboard with PASS / DEGRADED / FAIL.
 * Inputs: passed as CLI flags (e.g. --lint=success) plus optional artifact JSON files in ./reports.
 * Degradation sources (non-fatal): perf-slo.json status === 'degraded'.
 */
import fs from 'node:fs';
import path from 'node:path';

const args = Object.fromEntries(process.argv.slice(2).map(a=>{const [k,v='']=a.replace(/^--/,'').split('=');return [k,v];}));

function readJson(p){ try { return JSON.parse(fs.readFileSync(p,'utf8')); } catch { return null; } }

const reportsDir = path.resolve('reports');
const perf = readJson(path.join(reportsDir,'perf-slo.json'));
const drift = readJson(path.join(reportsDir,'bundle-drift.json'));
const threshold = readJson(path.join(reportsDir,'bundle-threshold.json'));
const ws = readJson(path.join(reportsDir,'ws-schema-drift.json'));

function statusEmoji(result){
  if(result === 'success') return '✅';
  if(result === 'failure' || result === 'cancelled' || result === 'timed_out') return '❌';
  return '⚠️';
}

let degradedReasons = [];
if(perf && perf.status === 'degraded') degradedReasons.push('Performance SLO (import latency or bundle near limit)');

// Determine overall
const gatingKeys = ['lint','bundle','drift','privacy','smoke','secrets','ws','perfJob'];
const gatingMap = {
  lint: args.lint,
  bundle: args.bundle,
  drift: args.drift,
  privacy: args.privacy,
  smoke: args.smoke,
  secrets: args.secrets,
  ws: args.ws,
  perfJob: args.perf
};
const anyFail = gatingKeys.some(k => gatingMap[k] && gatingMap[k] !== 'success');
let overall;
if(anyFail) overall = 'FAIL'; else if(degradedReasons.length) overall = 'DEGRADED'; else overall = 'PASS';

let md = '# CI Scorecard\n\n';
md += `**Overall:** ${overall === 'PASS' ? '✅ PASS' : overall === 'DEGRADED' ? '⚠️ DEGRADED' : '❌ FAIL'}\n\n`;
md += '| Category | Result | Notes |\n|----------|--------|-------|\n';
md += `| Lint & Tests | ${statusEmoji(gatingMap.lint)} ${gatingMap.lint} |  |\n`;
md += `| Bundle Threshold | ${statusEmoji(gatingMap.bundle)} ${gatingMap.bundle} | ${(threshold && threshold.total) ? `${threshold.total.jsGzipKB}KB js / ${threshold.total.cssGzipKB}KB css` : ''} |\n`;
if(drift){
  const jsDelta = drift.js?.deltaBytes != null ? `${(drift.js.deltaBytes/1024).toFixed(2)}KB` : '';
  const cssDelta = drift.css?.deltaBytes != null ? `${(drift.css.deltaBytes/1024).toFixed(2)}KB` : '';
  md += `| Bundle Drift | ${statusEmoji(gatingMap.drift)} ${gatingMap.drift} | Δ JS ${jsDelta} / Δ CSS ${cssDelta} |\n`;
} else {
  md += `| Bundle Drift | ${statusEmoji(gatingMap.drift)} ${gatingMap.drift} |  |\n`;
}
md += `| Privacy Guard | ${statusEmoji(gatingMap.privacy)} ${gatingMap.privacy} |  |\n`;
md += `| Smoke & Branding | ${statusEmoji(gatingMap.smoke)} ${gatingMap.smoke} |  |\n`;
if(ws){
  md += `| WS Schema | ${statusEmoji(gatingMap.ws)} ${gatingMap.ws} | unexpected=${ws.unexpected?.length||0} missing=${ws.missing?.length||0} |\n`;
} else {
  md += `| WS Schema | ${statusEmoji(gatingMap.ws)} ${gatingMap.ws} |  |\n`;
}
if(perf){
  const jsKB = (perf.bundles?.jsGzipBytes||0)/1024;
  const cssKB = (perf.bundles?.cssGzipBytes||0)/1024;
  md += `| Perf SLO | ${statusEmoji(gatingMap.perfJob)} ${perf.status} | js ${jsKB.toFixed(1)}KB / css ${cssKB.toFixed(1)}KB / import ${perf.importLatencyMs}ms |\n`;
} else {
  md += `| Perf SLO | ${statusEmoji(gatingMap.perfJob)} ${gatingMap.perfJob} |  |\n`;
}
md += `| Secrets Rotation | ${statusEmoji(gatingMap.secrets)} ${gatingMap.secrets} |  |\n`;

if(degradedReasons.length){
  md += '\n**Degraded Reasons:**\n';
  for(const r of degradedReasons) md += `- ${r}\n`;
}

console.log('\n==== CI SCORECARD (Markdown) ====');
console.log(md);

if(process.env.GITHUB_STEP_SUMMARY){
  try { fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + '\n'); } catch(e){ console.error('Failed to append scorecard summary:', e.message); }
}

// Write artifact
try {
  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(path.join(reportsDir,'ci-scorecard.md'), md);
  console.log('💾 Wrote reports/ci-scorecard.md');
} catch(e){ console.error('Unable to write ci-scorecard artifact:', e.message); }

// Exit code intentionally always 0 (gating handled separately)
process.exit(0);
