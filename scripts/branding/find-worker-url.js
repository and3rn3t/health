#!/usr/bin/env node
// Node rewrite of find-worker-url.ps1 / find-url.ps1
import axios from 'axios';
import chalk from 'chalk';

const candidates = [
  'https://health-app-prod.workers.dev',
  'https://health-app.workers.dev',
  'https://health-prod.workers.dev',
  'https://health.workers.dev',
  'https://health-app-prod.and3rn3t.workers.dev',
  'https://health-app.and3rn3t.workers.dev',
  'https://health-app-prod.andernet.workers.dev',
  'https://health-app.andernet.workers.dev',
];

const custom = 'https://health.andernet.dev';

async function probe(root){
  const url = `${root}/health`;
  try {
    const r = await axios.get(url,{timeout:5000});
    console.log(chalk.green(`✅ ${root} (${r.status})`));
    const body = typeof r.data === 'string'? r.data : JSON.stringify(r.data);
    console.log(chalk.gray(`   Body: ${body.slice(0,120)}${body.length>120?'…':''}`));
    return true;
  } catch (e) {
    console.log(chalk.red(`❌ ${root}: ${e.message.split('\n')[0]}`));
    return false;
  }
}

console.log(chalk.cyan('Finding the correct Worker URL...'));
console.log(chalk.cyan('Testing possible worker URLs...'));

let found = null;
for (const c of candidates){
  process.stdout.write('\n');
  const ok = await probe(c);
  if (ok){ found = c; break; }
}

console.log('\nTesting custom domain...');
await probe(custom);

console.log('\nURL discovery complete!');
if (found) {
  console.log(chalk.green(`🎯 WORKING URL FOUND: ${found}`));
  process.exit(0);
} else {
  console.log(chalk.yellow('⚠️  No worker URL responded successfully.'));
  process.exit(1);
}
