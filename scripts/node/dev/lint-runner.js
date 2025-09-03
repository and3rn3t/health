#!/usr/bin/env node

/**
 * Unified Linting Runner - Node.js version
 * Replaces scripts/lint-all.ps1
 */

import { program } from 'commander';
import { 
  writeTaskStart, 
  writeTaskComplete, 
  writeTaskError,
  writeInfo,
  writeSuccess,
  writeWarning,
  runCommand,
  fileExists,
  exitWithError,
  exitWithSuccess 
} from '../core/logger.js';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

program
  .name('lint-runner')
  .description('Unified linting script for TypeScript/React and Swift code')
  .option('--fix', 'Auto-fix linting issues where possible')
  .option('--strict', 'Run in strict mode with extra checks')
  .option('--swift-only', 'Only run Swift linting')
  .option('--ts-only', 'Only run TypeScript/React linting')
  .option('--path <path>', 'Path to lint', '.')
  .option('-v, --verbose', 'Verbose output')
  .parse();

const options = program.opts();

let hasErrors = false;

async function runESLint() {
  if (options.fix) {
    writeInfo('🔧 Auto-fixing ESLint issues...');
    const result = await runCommand('npm', ['run', 'lint', '--', '--fix'], {
      quiet: !options.verbose
    });
    
    if (!result.success) {
      hasErrors = true;
      writeTaskError('ESLint Fix', 'ESLint auto-fix encountered issues');
    } else {
      writeSuccess('ESLint auto-fix completed');
    }
  } else {
    const result = await runCommand('npm', ['run', 'lint'], {
      quiet: !options.verbose
    });
    
    if (!result.success) {
      hasErrors = true;
      writeTaskError('ESLint', 'ESLint found issues');
    } else {
      writeSuccess('ESLint passed');
    }
  }
}

async function runPrettier() {
  writeInfo('🎨 Checking Prettier formatting...');
  
  if (options.fix) {
    const result = await runCommand('npm', ['run', 'format'], {
      quiet: !options.verbose
    });
    
    if (!result.success) {
      hasErrors = true;
      writeTaskError('Prettier Fix', 'Prettier formatting failed');
    } else {
      writeSuccess('Prettier formatting applied');
    }
  } else {
    const result = await runCommand('npm', ['run', 'format:check'], {
      quiet: !options.verbose
    });
    
    if (!result.success) {
      hasErrors = true;
      writeTaskError('Prettier', 'Code formatting issues found');
      writeInfo('Run with --fix to auto-format code');
    } else {
      writeSuccess('Prettier formatting passed');
    }
  }
}

async function runTypeScriptCheck() {
  writeInfo('🔍 Checking TypeScript compilation...');
  const tscResult = await runCommand('npx', ['tsc', '--noEmit'], {
    quiet: !options.verbose
  });
  
  if (!tscResult.success) {
    hasErrors = true;
    writeTaskError('TypeScript', 'TypeScript compilation errors found');
  } else {
    writeSuccess('TypeScript compilation passed');
  }
}

async function runTypeScriptLinting() {
  if (options.swiftOnly) {
    return;
  }

  writeInfo('📝 Checking TypeScript/React code...');

  await runESLint();
  await runPrettier();
  await runTypeScriptCheck();
}

async function runSwiftLinting() {
  if (options.tsOnly) {
    return;
  }

  const swiftLintScript = 'ios/scripts/swift-lint-windows.ps1';
  
  if (!(await fileExists(swiftLintScript))) {
    writeWarning('Swift linting script not found, skipping Swift checks');
    return;
  }

  writeInfo('🍎 Checking Swift code...');

  const swiftArgs = options.fix ? ['-Fix'] : [];
  const result = await runCommand('pwsh', [
    '-NoProfile', 
    '-File', 
    swiftLintScript,
    ...swiftArgs
  ], {
    quiet: !options.verbose
  });

  if (!result.success) {
    hasErrors = true;
    writeTaskError('SwiftLint', 'Swift code issues found');
  } else {
    writeSuccess('SwiftLint passed');
  }
}

async function runAdditionalChecks() {
  if (!options.strict) {
    return;
  }

  writeInfo('🔍 Running additional strict checks...');

  // Search for development comments that should be addressed
  const todoResult = await runCommand('grep', [
    '-r', 
    '--include=*.ts', 
    '--include=*.tsx', 
    '--include=*.js', 
    '--include=*.jsx',
    '-n',
    'TODO\\|FIXME\\|XXX',
    options.path
  ], {
    quiet: true
  });

  if (todoResult.success && todoResult.stdout.trim()) {
    writeWarning('TODO/FIXME comments found:');
    console.log(todoResult.stdout);
  }

  // Check for console.log statements (excluding this file)
  const consoleResult = await runCommand('grep', [
    '-r',
    '--include=*.ts',
    '--include=*.tsx', 
    '--exclude-dir=node_modules',
    '--exclude-dir=dist',
    '-n',
    'console\\.log',
    options.path
  ], {
    quiet: true
  });

  if (consoleResult.success && consoleResult.stdout.trim()) {
    writeWarning('console.log statements found (consider using proper logging):');
    console.log(consoleResult.stdout);
  }
}

async function main() {
  writeTaskStart('Unified Linting', '🔍 Running unified linting across project...');

  try {
    await runTypeScriptLinting();
    await runSwiftLinting();
    await runAdditionalChecks();

    if (hasErrors) {
      writeTaskError('Unified Linting', 'Linting completed with errors');
      exitWithError('Linting failed', 1);
    } else {
      writeTaskComplete('Unified Linting', 'All linting checks passed!');
      exitWithSuccess();
    }
  } catch (error) {
    writeTaskError('Unified Linting', `Unexpected error: ${error.message}`);
    exitWithError('Linting failed', 1);
  }
}

// Only run if this file is executed directly
if (process.argv[1] === __filename) {
  main().catch(error => {
    writeTaskError('Lint Runner', error.message);
    process.exit(1);
  });
}
