#!/usr/bin/env node

/**
 * Enhanced task runner with progress tracking - Node.js version
 * Replaces scripts/run-task.ps1
 */

import { program } from 'commander';
import {
  writeTaskStart,
  writeTaskComplete,
  writeTaskError,
  writeInfo,
  runCommand,
  withSpinner,
  exitWithError,
  exitWithSuccess,
} from '../core/logger.js';

program
  .name('task-runner')
  .description(
    'Enhanced task runner with VS Code integration and progress tracking'
  )
  .argument('[task]', 'Task to run: dev, test, build, probe, deploy, clean')
  .option('-e, --environment <env>', 'Environment', 'development')
  .option('-p, --port <port>', 'Port number', '8787')
  .option('-b, --background', 'Run task in background')
  .option('-v, --verbose', 'Verbose output')
  .option('-j, --json', 'JSON output')
  .parse();

const [task] = program.args;
const options = program.opts();

// Task definitions
const tasks = {
  dev: {
    name: 'Development Server',
    description: 'Start Wrangler development server',
    command: 'wrangler',
    args: ['dev', '--env', options.environment, '--port', options.port],
    background: true,
  },
  test: {
    name: 'Run Tests',
    description: 'Execute test suite',
    command: 'npm',
    args: ['test'],
    background: false,
  },
  build: {
    name: 'Build Project',
    description: 'Build application and worker',
    command: 'npm',
    args: ['run', 'build'],
    background: false,
  },
  probe: {
    name: 'Health Probe',
    description: 'Run health checks',
    command: 'node',
    args: ['scripts/node/health/probe.js', '--port', options.port],
    background: false,
  },
  deploy: {
    name: 'Deploy Application',
    description: `Deploy to ${options.environment}`,
    command: 'npm',
    args: [
      'run',
      `deploy:${options.environment === 'production' ? 'prod' : 'dev'}`,
    ],
    background: false,
  },
  clean: {
    name: 'Clean Build',
    description: 'Clean build artifacts',
    command: 'npm',
    args: ['run', 'clean'],
    background: false,
  },
};

async function validateTask(taskName) {
  const taskDef = tasks[taskName];

  if (!taskDef) {
    const availableTasks = Object.keys(tasks).join(', ');
    exitWithError(
      `Unknown task: ${taskName}. Available tasks: ${availableTasks}`
    );
  }

  return taskDef;
}

async function runBackgroundTask(taskDef, taskName) {
  writeInfo('Starting background process...');
  const result = await runCommand(taskDef.command, taskDef.args, {
    detached: true,
    stdio: 'ignore',
  });

  if (result.success) {
    writeTaskComplete(taskDef.name, 'Background process started');
  } else {
    writeTaskError(taskDef.name, `Failed to start: ${result.stderr}`);
    exitWithError(`Task failed: ${taskName}`, result.exitCode);
  }
}

async function runForegroundTask(taskDef, taskName) {
  let result;

  if (options.verbose) {
    result = await runCommand(taskDef.command, taskDef.args, { quiet: false });
  } else {
    result = await withSpinner(`Running ${taskDef.name}...`, () =>
      runCommand(taskDef.command, taskDef.args, { quiet: true })
    );
  }

  if (result.success) {
    writeTaskComplete(
      taskDef.name,
      `Completed successfully (exit code: ${result.exitCode})`
    );

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            task: taskName,
            success: true,
            exitCode: result.exitCode,
            stdout: result.stdout,
          },
          null,
          2
        )
      );
    }
  } else {
    writeTaskError(taskDef.name, `Failed with exit code: ${result.exitCode}`);

    if (result.stderr) {
      console.error(result.stderr);
    }

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            task: taskName,
            success: false,
            exitCode: result.exitCode,
            stderr: result.stderr,
          },
          null,
          2
        )
      );
    }

    exitWithError(`Task failed: ${taskName}`, result.exitCode);
  }
}

async function runTask(taskName) {
  const taskDef = validateTask(taskName);

  writeTaskStart(taskDef.name, taskDef.description);

  if (options.verbose) {
    writeInfo(`Command: ${taskDef.command} ${taskDef.args.join(' ')}`);
  }

  const isBackground = options.background || taskDef.background;

  try {
    if (isBackground) {
      await runBackgroundTask(taskDef, taskName);
    } else {
      await runForegroundTask(taskDef, taskName);
    }
  } catch (error) {
    writeTaskError(taskDef.name, `Unexpected error: ${error.message}`);
    exitWithError(`Task failed: ${taskName}`, 1);
  }
}

async function listTasks() {
  console.log('\n📋 Available Tasks:\n');

  for (const [name, def] of Object.entries(tasks)) {
    console.log(`  ${name.padEnd(10)} - ${def.description}`);
  }

  console.log('\n💡 Usage: node task-runner.js <task> [options]');
  console.log('   Example: node task-runner.js dev --port 8788 --verbose\n');
}

async function main() {
  if (!task) {
    await listTasks();
    exitWithSuccess();
  }

  await runTask(task);
  exitWithSuccess();
}

// Only run if this file is executed directly
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === __filename) {
  main().catch((error) => {
    writeTaskError('Task Runner', error.message);
    process.exit(1);
  });
}
