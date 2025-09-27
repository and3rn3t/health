#!/usr/bin/env node

import axios from 'axios';
import chalk from 'chalk';

const baseUrl = process.env.BASE_URL || process.argv.find(a=>a.startsWith('--baseUrl='))?.split('=')[1] || 'https://health-app-prod.workers.dev';
const custom = process.env.CUSTOM_DOMAIN || process.argv.find(a=>a.startsWith('--customDomain='))?.split('=')[1];
const local = process.env.LOCAL_URL || process.argv.find(a=>a.startsWith('--localUrl='))?.split('=')[1];
const verbose = process.argv.includes('--verbose');

const endpoints = [
  { path: '/health', name: 'Basic Health Check', method: 'GET' },
  { path: '/api/_selftest', name: 'Self Test', method: 'GET' },
  { path: '/api/health-data', name: 'Health Data API', method: 'GET' },
  { path: '/', name: 'React App', method: 'GET' },
  { path: '/docs', name: 'API Documentation', method: 'GET' },
];

async function testUrl(url, name) {
  try {
    const r = await axios.get(url, { timeout: 10000 });
    console.log(chalk.green(`✅ ${name}: ${r.status}`));
    if (verbose) {
      const text = typeof r.data === 'string' ? r.data : JSON.stringify(r.data);
      console.log(chalk.cyan(`   Content preview: ${text.slice(0, 200)}`));
    }
    return { success: true, status: r.status, length: String(r.data||'').length };
  } catch (e) {
    console.log(chalk.red(`❌ ${name}: ${e.message}`));
    return { success: false, error: e.message };
  }
}

async function runSuite(domainLabel, root) {
  console.log(chalk.magenta(`\n🌐 Testing ${domainLabel}: ${root}`));
  const results = [];
  for (const ep of endpoints) {
    results.push(await testUrl(`${root}${ep.path}`, ep.name));
  }
  return results;
}

(async () => {
  let results = [];
  results.push(...(await runSuite('Primary', baseUrl)));
  if (custom) results.push(...(await runSuite('Custom', custom)));
  if (local) results.push(...(await runSuite('Local', local)));
  const ok = results.filter(r=>r.success).length;
  const total = results.length;
  console.log(chalk.blue(`\n📊 Successful: ${ok}/${total}`));
  process.exitCode = ok === total ? 0 : 1;
})();
