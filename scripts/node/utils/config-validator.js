#!/usr/bin/env node

/**
 * Configuration Validator - Node.js version
 * Replaces scripts/validate-configs.ps1
 */

import { program } from 'commander';
import { 
  writeTaskStart, 
  writeTaskComplete, 
  writeTaskError,
  writeInfo,
  writeSuccess,
  writeWarning,
  fileExists,
  readJsonFile,
  exitWithError,
  exitWithSuccess 
} from '../core/logger.js';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

program
  .name('config-validator')
  .description('Validates and ensures all configuration files are properly set up')
  .option('--fix', 'Automatically fix any issues found')
  .option('-v, --verbose', 'Show detailed output')
  .parse();

const options = program.opts();

let issuesFound = false;

const requiredConfigs = [
  {
    file: 'package.json',
    type: 'json',
    required: true,
    checks: ['name', 'version', 'scripts']
  },
  {
    file: 'tsconfig.json',
    type: 'json',
    required: true,
    checks: ['compilerOptions']
  },
  {
    file: 'vite.config.ts',
    type: 'file',
    required: true
  },
  {
    file: 'wrangler.toml',
    type: 'file',
    required: true
  },
  {
    file: '.gitignore',
    type: 'file',
    required: true
  },
  {
    file: '.eslintrc.json',
    type: 'json',
    required: false
  },
  {
    file: 'eslint.config.js',
    type: 'file',
    required: false
  },
  {
    file: '.prettierrc',
    type: 'json',
    required: true
  }
];

const requiredGitignoreEntries = [
  'node_modules/',
  'dist/',
  'dist-worker/',
  '.env',
  '.env.local',
  '.DS_Store',
  '*.log'
];

async function checkConfigFile(config) {
  const { file, type, required, checks } = config;
  
  if (options.verbose) {
    writeInfo(`Checking ${file}...`);
  }

  const exists = await fileExists(file);
  
  if (!exists) {
    return handleMissingFile(file, required);
  }

  if (type === 'json') {
    return await validateJsonFile(file, checks);
  }
  
  writeSuccess(`✓ ${file} exists`);
  return true;
}

function handleMissingFile(file, required) {
  if (required) {
    issuesFound = true;
    writeTaskError('Config Check', `Required file ${file} is missing`);
    return false;
  } else {
    writeWarning(`Optional file ${file} not found`);
    return true;
  }
}

async function validateJsonFile(file, checks) {
  try {
    const content = await readJsonFile(file);
    
    if (!content) {
      issuesFound = true;
      writeTaskError('Config Check', `Failed to parse JSON in ${file}`);
      return false;
    }

    validateJsonProperties(file, content, checks);
    
    writeSuccess(`✓ ${file} is valid`);
    return true;
  } catch (error) {
    issuesFound = true;
    writeTaskError('Config Check', `Invalid JSON in ${file}: ${error.message}`);
    return false;
  }
}

function validateJsonProperties(file, content, checks) {
  if (checks) {
    for (const check of checks) {
      if (!(check in content)) {
        issuesFound = true;
        writeTaskError('Config Check', `Missing required property '${check}' in ${file}`);
      }
    }
  }
}

async function checkGitignore() {
  writeInfo('Checking .gitignore...');
  
  if (!(await fileExists('.gitignore'))) {
    issuesFound = true;
    writeTaskError('Config Check', '.gitignore file is missing');
    
    if (options.fix) {
      writeInfo('Creating .gitignore file...');
      await fs.writeFile('.gitignore', requiredGitignoreEntries.join('\n') + '\n');
      writeSuccess('Created .gitignore file');
    }
    return;
  }

  try {
    const gitignoreContent = await fs.readFile('.gitignore', 'utf8');
    const lines = gitignoreContent.split('\n').map(line => line.trim());
    
    const missingEntries = requiredGitignoreEntries.filter(entry => 
      !lines.some(line => line === entry || line.includes(entry.replace('/', '')))
    );

    if (missingEntries.length > 0) {
      issuesFound = true;
      writeTaskError('Config Check', `Missing entries in .gitignore: ${missingEntries.join(', ')}`);
      
      if (options.fix) {
        writeInfo('Adding missing entries to .gitignore...');
        const newContent = gitignoreContent + '\n' + missingEntries.join('\n') + '\n';
        await fs.writeFile('.gitignore', newContent);
        writeSuccess('Updated .gitignore with missing entries');
      }
    } else {
      writeSuccess('✓ .gitignore has all required entries');
    }
  } catch (error) {
    issuesFound = true;
    writeTaskError('Config Check', `Failed to read .gitignore: ${error.message}`);
  }
}

async function checkVSCodeSettings() {
  writeInfo('Checking VS Code configuration...');
  
  const vscodeDir = '.vscode';
  const settingsFile = path.join(vscodeDir, 'settings.json');
  const tasksFile = path.join(vscodeDir, 'tasks.json');

  if (!(await fileExists(vscodeDir))) {
    writeWarning('.vscode directory not found');
    return;
  }

  if (await fileExists(settingsFile)) {
    const settings = await readJsonFile(settingsFile);
    if (settings) {
      writeSuccess('✓ VS Code settings.json is valid');
    } else {
      issuesFound = true;
      writeTaskError('Config Check', 'VS Code settings.json is invalid');
    }
  }

  if (await fileExists(tasksFile)) {
    const tasks = await readJsonFile(tasksFile);
    if (tasks) {
      writeSuccess('✓ VS Code tasks.json is valid');
    } else {
      issuesFound = true;
      writeTaskError('Config Check', 'VS Code tasks.json is invalid');
    }
  }
}

async function checkEnvironmentFiles() {
  writeInfo('Checking environment configuration...');
  
  if (await fileExists('.env.example')) {
    writeSuccess('✓ .env.example exists');
  } else {
    writeWarning('.env.example not found (recommended for documentation)');
  }

  if (await fileExists('.env')) {
    writeWarning('.env file exists (should not be committed to git)');
  }

  if (await fileExists('.env.local')) {
    writeInfo('✓ .env.local exists (local development config)');
  }
}

async function validatePackageScripts() {
  writeInfo('Validating package.json scripts...');
  
  const pkg = await readJsonFile('package.json');
  if (!pkg?.scripts) {
    issuesFound = true;
    writeTaskError('Config Check', 'package.json missing scripts section');
    return;
  }

  const requiredScripts = ['dev', 'build', 'lint', 'test'];
  const missingScripts = requiredScripts.filter(script => !(script in pkg.scripts));

  if (missingScripts.length > 0) {
    issuesFound = true;
    writeTaskError('Config Check', `Missing package.json scripts: ${missingScripts.join(', ')}`);
  } else {
    writeSuccess('✓ All required npm scripts are present');
  }
}

async function main() {
  writeTaskStart('Config Validation', 'Validating and ensuring all configuration files are properly set up');

  try {
    // Check all configuration files
    for (const config of requiredConfigs) {
      await checkConfigFile(config);
    }

    // Special checks
    await checkGitignore();
    await checkVSCodeSettings();
    await checkEnvironmentFiles();
    await validatePackageScripts();

    if (issuesFound) {
      writeTaskError('Config Validation', 'Configuration validation completed with issues');
      if (!options.fix) {
        writeInfo('Run with --fix to automatically fix some issues');
      }
      exitWithError('Configuration issues found', 1);
    } else {
      writeTaskComplete('Config Validation', 'All configuration files are valid!');
      exitWithSuccess();
    }
  } catch (error) {
    writeTaskError('Config Validation', `Unexpected error: ${error.message}`);
    exitWithError('Validation failed', 1);
  }
}

// Only run if this file is executed directly
if (process.argv[1] === __filename) {
  main().catch(error => {
    writeTaskError('Config Validator', error.message);
    process.exit(1);
  });
}
