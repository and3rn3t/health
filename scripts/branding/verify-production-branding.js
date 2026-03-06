#!/usr/bin/env node
// Node rewrite of verify-production-branding.ps1
import axios from 'axios';
import chalk from 'chalk';

const arg = (name, def) => {
  const flag = process.argv.find(a => a.startsWith(`--${name}=`));
  if (flag) return flag.split('=')[1];
  return def;
};

const baseUrl = arg('url', process.env.VITALSENSE_URL || 'https://health.andernet.dev');
const localDev = process.argv.includes('--local');
const targetUrl = localDev ? 'http://localhost:5000' : baseUrl;

console.log(chalk.cyan('\n🌐 VitalSense Production Branding Verification'));
console.log(chalk.cyan('============================================='));
console.log(chalk.white(`🔗 Checking: ${targetUrl}`));

async function fetchPage(url){
  try {
    const r = await axios.get(url, { timeout: 10000 });
    return r.data;
  } catch (e) {
    console.error(chalk.red(`❌ Failed to connect: ${e.message}`));
    process.exit(1);
  }
}

function check(pattern, content, expected, label){
  const found = content.includes(pattern);
  if (found === expected) {
    console.log(chalk.green(`   ✅ ${label}: ${expected ? 'Found' : 'Not found (good)'}`));
    return true;
  }
  console.log(chalk[expected ? 'red':'yellow'](`   ❌ ${label}: ${expected ? 'Missing' : 'Found (should remove)'}`));
  return false;
}

function technical(pattern, content, label){
  const found = content.includes(pattern);
  if (found) console.log(chalk.green(`   ✅ ${label}: Present`));
  else console.log(chalk.yellow(`   ⚠️  ${label}: Missing`));
  return found;
}

async function run(){
  const html = await fetchPage(targetUrl);
  console.log(chalk.green(`✅ Content length: ${html.length} bytes`));
  const titleMatch = html.match(/<title>(.*?)<\/title>/i);
  if (titleMatch) console.log(chalk.white(`📋 Page Title: ${titleMatch[1]}`));
  else console.log(chalk.yellow('⚠️  No title tag found'));

  console.log('\n🎯 VitalSense Branding Verification:');
  const branding = [
    ['VitalSense', true, 'VitalSense in content'],
    ['Apple Health', true, 'Apple Health'],
    ['Fall Risk', true, 'Fall Risk'],
    ['Health Score', true, 'Health Score'],
    ['Emergency', true, 'Emergency'],
    ['__VITALSENSE_KV_MODE', true, 'VitalSense components'],
    ['HealthGuard', false, 'Old HealthGuard branding']
  ];
  let passed = 0; let total = branding.length;
  for (const [pattern, expected, label] of branding){
    if (check(pattern, html, expected, label)) passed++;}

  console.log('\n📋 Technical Verification:');
  const tech = [
    ['<meta name="viewport"', 'Meta viewport'],
    ['/main.css', 'CSS loaded'],
    ['<script', 'JavaScript loaded'],
    ['id="root"', 'React root'],
    ['VITALSENSE_DISABLE_WEBSOCKET', 'VitalSense config']
  ];
  for (const [pattern,label] of tech){ if (technical(pattern, html, label)) passed++; total++; }

  console.log('\n🎯 Verification Summary:');
  console.log(chalk.white(`Passed: ${passed} / ${total} checks`));
  const ratio = passed/total;
  if (ratio === 1) console.log(chalk.green('\n🎉 VitalSense branding is PERFECT!'));
  else if (ratio >= 0.8) console.log(chalk.green('\n✅ VitalSense branding is GOOD (minor issues).'));
  else console.log(chalk.yellow('\n⚠️  VitalSense branding needs attention.'));

  console.log('\n📊 Site Performance:');
  console.log(chalk.white(`Content Size: ${(html.length/1024).toFixed(2)} KB`));
  if (titleMatch && /VitalSense/i.test(titleMatch[1])) {
    console.log(chalk.blue('\n💙 VitalSense - Where vital data becomes actionable insights!'));
  }
  process.exit(ratio === 1 ? 0 : (ratio >= 0.8 ? 0 : 1));
}

run();
