#!/usr/bin/env node
// VitalSense New User Onboarding Wizard (ESM)
// Guides a new contributor through environment checks and first-run setup with progress tracking.

import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';
import { execa } from 'execa';
import chalk from 'chalk';
import readline from 'readline/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '../../../..');

// CLI flags
const args = new Set(process.argv.slice(2));
const NON_INTERACTIVE = args.has('--yes') || args.has('-y') || args.has('--non-interactive');
const DRY_RUN = args.has('--dry-run') || args.has('--smoke-test');

// IO
const rl = NON_INTERACTIVE
  ? null
  : readline.createInterface({ input: process.stdin, output: process.stdout });

async function askYesNo(question, def = true) {
  if (NON_INTERACTIVE) return def;
  const suffix = def ? 'Y/n' : 'y/N';
  const answer = (await rl.question(`${question} (${suffix}) `)).trim().toLowerCase();
  if (!answer) return def;
  return ['y', 'yes'].includes(answer);
}

function banner() {
  const title = chalk.bold.cyan('VitalSense • New User Onboarding');
  const subtitle = chalk.dim('Guided setup for development on Windows with progress tracking');
  console.log('\n' + title);
  console.log(subtitle);
  console.log(chalk.dim('-'.repeat(60)) + '\n');
}

function renderProgress(current, total, label = '') {
  const width = 24;
  const ratio = Math.max(0, Math.min(1, current / Math.max(1, total)));
  const filled = Math.round(width * ratio);
  const bar = chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(width - filled));
  const pct = String(Math.round(ratio * 100)).padStart(3, ' ');
  const stepTxt = chalk.dim(`Step ${current}/${total}`);
  console.log(`${stepTxt}  ${bar}  ${chalk.bold(`${pct}%`)} ${label ? chalk.dim(`• ${label}`) : ''}`);
}

async function which(cmd) {
  const exe = os.platform() === 'win32' ? 'where' : 'which';
  try {
    const { stdout } = await execa(exe, [cmd]);
    return stdout.split(/\r?\n/)[0] || null;
  } catch {
    return null;
  }
}

async function runStep(id, label, fn) {
  const start = Date.now();
  try {
    const res = await fn();
    const dur = Date.now() - start;
    return { id, label, ok: true, detail: res?.detail, durationMs: dur };
  } catch (err) {
    const dur = Date.now() - start;
    return { id, label, ok: false, error: err?.message || String(err), durationMs: dur };
  }
}

async function copyEnvIfMissing() {
  const envPath = path.join(workspaceRoot, '.env');
  const examplePath = path.join(workspaceRoot, '.env.example');
  try {
    await fs.access(envPath);
    return { detail: '.env present' };
  } catch {
    try {
      await fs.access(examplePath);
      if (!DRY_RUN) {
        await fs.copyFile(examplePath, envPath);
        return { detail: 'Created .env from .env.example' };
      }
      return { detail: 'Would create .env from .env.example' };
    } catch {
      // create minimal
      const defaultEnv = 'DEVICE_JWT_SECRET=dev-local\n';
      if (!DRY_RUN) {
        await fs.writeFile(envPath, defaultEnv, 'utf8');
        return { detail: 'Generated minimal .env (DEVICE_JWT_SECRET=dev-local)' };
      }
      return { detail: 'Would generate minimal .env (DEVICE_JWT_SECRET=dev-local)' };
    }
  }
}

async function installDependencies() {
  const usePnpm = (await which('pnpm')) !== null && (await exists(path.join(workspaceRoot, 'pnpm-lock.yaml')));
  const useNpmCi = await exists(path.join(workspaceRoot, 'package-lock.json'));
  const cmd = usePnpm ? 'pnpm' : 'npm';
  const args = usePnpm ? ['install'] : useNpmCi ? ['ci'] : ['install'];
  if (DRY_RUN) {
    return { detail: `Would run: ${cmd} ${args.join(' ')}` };
  }
  await execa(cmd, args, { cwd: workspaceRoot, stdio: 'inherit' });
  return { detail: `${cmd} ${args.join(' ')} complete` };
}

async function exists(p) {
  try { await fs.access(p); return true; } catch { return false; }
}

async function checkTool(name, versionArgs = ['--version'], fixHint) {
  try {
    const { stdout } = await execa(name, versionArgs);
    const version = stdout.trim().split(/\r?\n/)[0];
    return { detail: `${name} ${version}` };
  } catch (e) {
    const hint = fixHint ? ` • ${fixHint}` : '';
    throw new Error(`${name} not found${hint}`);
  }
}

async function main() {
  banner();

  const welcome = `${chalk.bold('Welcome!')} This wizard will check your environment and set up VitalSense for local development.`;
  console.log(welcome + '\n');

  const guided = await askYesNo('Run guided setup (recommended)?', true);
  console.log(chalk.dim(`Mode: ${guided ? 'Guided' : 'Quick'}${DRY_RUN ? ' • Dry Run' : ''}`));

  const steps = [
    { id: 'node', label: 'Check Node.js', action: () => checkTool('node') },
    { id: 'git', label: 'Check Git', action: () => checkTool('git') },
    { id: 'wrangler', label: 'Check Cloudflare Wrangler', action: () => checkTool('wrangler', ['--version'], 'Install: npm i -g wrangler') },
    { id: 'docker', label: 'Check Docker (optional)', action: async () => {
      try { return await checkTool('docker', ['--version']); } catch (e) { return { detail: 'Docker not found (skipping)' }; }
    } },
    { id: 'env', label: 'Ensure .env exists', action: copyEnvIfMissing },
    { id: 'install', label: 'Install dependencies', action: async () => {
      const doInstall = guided ? await askYesNo('Install JS dependencies now?', true) : true;
      if (!doInstall) return { detail: 'Skipped dependency install' };
      return installDependencies();
    } },
    { id: 'validate', label: 'Validate config', action: async () => {
      if (DRY_RUN) return { detail: 'Would run config validator' };
      await execa('node', ['scripts/node/utils/config-validator.js', '--verbose'], { cwd: workspaceRoot, stdio: 'inherit' });
      return { detail: 'Config valid' };
    } },
    { id: 'lint', label: 'Quick TypeScript lint', action: async () => {
      if (DRY_RUN) return { detail: 'Would run quick lint' };
      try {
        await execa('node', ['scripts/node/dev/lint-runner.js', '--typescript', '--quick'], { cwd: workspaceRoot, stdio: 'inherit' });
        return { detail: 'Lint completed' };
      } catch (e) {
        return { detail: 'Lint reported issues (see output)' };
      }
    } },
    { id: 'probe', label: 'Quick health probe (worker 8789)', action: async () => {
      const doProbe = guided ? await askYesNo('Probe local worker on http://127.0.0.1:8789/health?', true) : true;
      if (!doProbe) return { detail: 'Skipped probe' };
      if (DRY_RUN) return { detail: 'Would run health probe' };
      try {
        await execa('node', ['scripts/node/health/simple-probe.js', '--port', '8789'], { cwd: workspaceRoot, stdio: 'inherit' });
        return { detail: 'Probe ok (if worker running)' };
      } catch (e) {
        return { detail: 'Probe failed (start dev with VS Code task wrangler-dev-8789)' };
      }
    } },
  ];

  const results = [];
  let idx = 0;
  for (const s of steps) {
    idx += 1;
    renderProgress(idx - 1, steps.length, s.label);
    const res = await runStep(s.id, s.label, s.action);
    results.push(res);
    const icon = res.ok ? chalk.green('✔') : chalk.yellow('⚠');
    const msg = res.ok ? (res.detail || 'ok') : (res.error || 'failed');
    console.log(`${icon} ${chalk.bold(s.label)} — ${msg}`);
  }
  renderProgress(steps.length, steps.length, 'Setup complete');

  // Persist progress
  const progressPath = path.join(workspaceRoot, '.onboarding-progress.json');
  const summary = {
    completedAt: new Date().toISOString(),
    os: `${os.platform()} ${os.release()}`,
    results,
    dryRun: DRY_RUN,
    nonInteractive: NON_INTERACTIVE,
  };
  try {
    await fs.writeFile(progressPath, JSON.stringify(summary, null, 2), 'utf8');
  } catch {}

  console.log('\n' + chalk.bold.green('Next steps'));
  console.log('- Start the development worker: ' + chalk.cyan('Tasks: Run Task → wrangler-dev-8789'));
  console.log('- WebSocket (Docker optional): ' + chalk.cyan('Tasks: Run Task → 🐳 Docker: Dev Workflow (no logs)'));
  console.log('- Open the app preview: ' + chalk.cyan('http://127.0.0.1:8789'));
  console.log('- Explore docs: ' + chalk.cyan('docs/getting-started/NEW_USER_TUTORIAL.md'));

  if (rl) rl.close();
}

main().catch((e) => {
  console.error(chalk.red('Onboarding failed:'), e?.message || e);
  if (rl) rl.close();
  process.exitCode = 1;
});
