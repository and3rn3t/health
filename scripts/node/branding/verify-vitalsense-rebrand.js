#!/usr/bin/env node
// Node rewrite of verify-vitalsense-rebrand.ps1
import fs from 'node:fs';
import path from 'node:path';
import chalk from 'chalk';

const exts = new Set(['.md','.tsx','.ts','.json','.ps1','.html']);
const roots = ['.'];
const ignore = ['node_modules','dist','.git','scripts/node/node_modules'];

const vitalChecks = [
  { file: 'src/App.tsx', expected: 'VitalSense' },
  { file: 'index.html', expected: 'VitalSense' },
  { file: 'package.json', expected: 'vitalsense-app' },
  { file: 'README.md', expected: 'VitalSense' },
  { file: 'ios/Info.plist', expected: 'VitalSense' },
  { file: 'privacy-policy.md', expected: 'VitalSense' }
];

let healthGuardRefs = [];
let lowerRefs = [];

function walk(dir){
  for (const entry of fs.readdirSync(dir,{withFileTypes:true})){
    if (ignore.some(i=>entry.name===i)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) { walk(full); continue; }
    const ext = path.extname(entry.name);
    if (!exts.has(ext)) continue;
    let content;
    try { content = fs.readFileSync(full,'utf8'); } catch { continue; }
    if (/HealthGuard/.test(content)) {
      const lines = content.split(/\r?\n/);
      lines.forEach((l,i)=>{ if (l.includes('HealthGuard')) healthGuardRefs.push({file:full,line:i+1,text:l.trim().slice(0,160)}); });
    }
    if (/healthguard/.test(content)) {
      const lines = content.split(/\r?\n/);
      lines.forEach((l,i)=>{ if (l.includes('healthguard')) lowerRefs.push({file:full,line:i+1,text:l.trim().slice(0,160)}); });
    }
  }
}

console.log(chalk.cyan('🔍 VitalSense Rebranding Verification'));
console.log(chalk.cyan('===================================='));
roots.forEach(r=>walk(r));

function report(title, refs){
  console.log('\n'+chalk.yellow(title));
  if (refs.length===0){
    console.log(chalk.green('  ✅ None found'));
  } else {
    refs.slice(0,100).forEach(r=>{
      console.log(chalk.red(`  ⚠️  ${r.file}:${r.line} - ${r.text}`));
    });
    if (refs.length>100) console.log(chalk.gray(`  ... ${refs.length-100} more`));
  }
}

report("Remaining 'HealthGuard' references", healthGuardRefs);
report("Remaining 'healthguard' references", lowerRefs);

console.log('\n✅ Verifying VitalSense branding...');
for (const check of vitalChecks){
  if (fs.existsSync(check.file)) {
    const content = fs.readFileSync(check.file,'utf8');
    if (content.includes(check.expected)) console.log(chalk.green(`  ✓ ${check.file} contains '${check.expected}'`));
    else console.log(chalk.red(`  ✗ ${check.file} missing '${check.expected}'`));
  } else {
    console.log(chalk.yellow(`  ⚠ File not found: ${check.file}`));
  }
}

const complete = healthGuardRefs.length===0 && lowerRefs.length===0;
console.log('\n🎯 Summary:');
if (complete) {
  console.log(chalk.green('🎉 VitalSense rebranding is COMPLETE!'));
} else {
  console.log(chalk.yellow('⚠️  Rebranding incomplete. Review above references.'));
}

console.log('\n📋 Next Steps:');
console.log(' 1. Build and test: npm run build');
console.log(' 2. Deploy: npm run deploy:prod');
console.log(' 3. Review brand guidelines in docs');
console.log(chalk.blue('\n💙 VitalSense - Where vital data becomes actionable insights!'));

process.exit(complete ? 0 : 1);
