#!/usr/bin/env node

import os from 'node:os';
import { execa } from 'execa';
import chalk from 'chalk';
import axios from 'axios';

function log(msg, color='white'){ console.log(chalk[color](msg)); }

async function getGitBranch(){
  try { const { stdout } = await execa('git', ['rev-parse','--abbrev-ref','HEAD']); return stdout.trim(); }
  catch { return 'unknown'; }
}

async function getNpmVersion(){
  try { const { stdout } = await execa('npm', ['-v']); return stdout.trim(); }
  catch { return 'unknown'; }
}

async function checkWorkerHealth(url='http://127.0.0.1:8789'){
  try { const r = await axios.get(`${url}/health`, { timeout: 3000 });
    return { ok: r.data?.status==='healthy', env: r.data?.environment||'unknown' };
  } catch { return { ok: false }; }
}

(async () => {
  log('🧭 Simple Context', 'cyan');
  log('================', 'cyan');
  const branch = await getGitBranch();
  const npm = await getNpmVersion();
  const node = process.version;
  const platform = `${os.type()} ${os.release()} (${os.arch()})`;
  const cpus = os.cpus()?.length || 0;
  const mem = `${Math.round(os.totalmem()/ (1024*1024))} MB RAM`;
  const health = await checkWorkerHealth();

  log(`Repo Branch   : ${branch}`);
  log(`Node          : ${node}`);
  log(`npm           : ${npm}`);
  log(`OS            : ${platform}`);
  log(`CPU Cores     : ${cpus}`);
  log(`Memory        : ${mem}`);
  log(`Worker Health : ${health.ok ? '✅ healthy' : '❌ not responding'}`);
  if (health.ok) log(`Environment   : ${health.env}`);
})();
