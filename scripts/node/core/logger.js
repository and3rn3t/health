#!/usr/bin/env node

/**
 * Core logging and utility functions for cross-platform script compatibility
 * Replaces VSCodeIntegration.psm1 PowerShell module
 */

import chalk from 'chalk';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';

const execAsync = promisify(exec);

/**
 * Logging Functions - VS Code and Copilot friendly output
 */

export function getTimestamp() {
  return new Date().toLocaleTimeString('en-US', { 
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
}

export function writeTaskStart(taskName, description = '') {
  const timestamp = getTimestamp();
  console.log(chalk.gray(`[${timestamp}] `) + chalk.cyan(`▶ ${taskName}`));
  if (description) {
    console.log(chalk.cyan(`  ${description}`));
  }
}

export function writeTaskComplete(taskName, result = '') {
  const timestamp = getTimestamp();
  console.log(chalk.gray(`[${timestamp}] `) + chalk.green(`✓ ${taskName}`));
  if (result) {
    console.log(chalk.green(`  ${result}`));
  }
}

export function writeTaskError(taskName, error) {
  const timestamp = getTimestamp();
  console.log(chalk.gray(`[${timestamp}] `) + chalk.red(`✗ ${taskName}`));
  console.log(chalk.red(`  ${error}`));
}

export function writeInfo(message) {
  console.log(chalk.blue(`ℹ ${message}`));
}

export function writeSuccess(message) {
  console.log(chalk.green(`✓ ${message}`));
}

export function writeWarning(message) {
  console.log(chalk.yellow(`⚠ ${message}`));
}

export function writeError(message) {
  console.log(chalk.red(`✗ ${message}`));
}

/**
 * Environment Information Gathering
 */

export async function getEnvironmentInfo() {
  const nodeVersion = process.version;
  const platform = `${os.type()} ${os.release()} (${os.arch()})`;
  const workingDirectory = process.cwd();
  
  let gitBranch = 'unknown';
  try {
    const { stdout } = await execAsync('git branch --show-current');
    gitBranch = stdout.trim();
  } catch (error) {
    // Git not available or not in a git repo
  }

  return {
    nodeVersion,
    platform,
    workingDirectory,
    gitBranch,
    timestamp: new Date().toISOString()
  };
}

/**
 * HTTP Utilities
 */

export async function makeHttpRequest(url, options = {}) {
  const { default: axios } = await import('axios');
  
  const defaultOptions = {
    timeout: 5000,
    validateStatus: () => true // Don't throw on non-2xx status codes
  };

  try {
    const response = await axios({
      url,
      ...defaultOptions,
      ...options
    });

    return {
      success: response.status >= 200 && response.status < 300,
      status: response.status,
      data: response.data,
      headers: response.headers
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      status: error.response?.status || 0
    };
  }
}

/**
 * Process Management
 */

export async function runCommand(command, args = [], options = {}) {
  const { execa } = await import('execa');
  
  try {
    const result = await execa(command, args, {
      stdio: options.quiet ? 'pipe' : 'inherit',
      ...options
    });

    return {
      success: true,
      exitCode: result.exitCode,
      stdout: result.stdout,
      stderr: result.stderr
    };
  } catch (error) {
    return {
      success: false,
      exitCode: error.exitCode || 1,
      stdout: error.stdout || '',
      stderr: error.stderr || error.message
    };
  }
}

/**
 * File System Utilities
 */

export async function ensureDirectory(dirPath) {
  try {
    await fs.ensureDir(dirPath);
    return true;
  } catch (error) {
    writeError(`Failed to create directory ${dirPath}: ${error.message}`);
    return false;
  }
}

export async function fileExists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile(filePath) {
  try {
    return await fs.readJson(filePath);
  } catch (error) {
    writeError(`Failed to read JSON file ${filePath}: ${error.message}`);
    return null;
  }
}

export async function writeJsonFile(filePath, data) {
  try {
    await fs.writeJson(filePath, data, { spaces: 2 });
    return true;
  } catch (error) {
    writeError(`Failed to write JSON file ${filePath}: ${error.message}`);
    return false;
  }
}

/**
 * Configuration Loading
 */

export async function loadConfig(configPath = 'package.json') {
  const fullPath = path.resolve(configPath);
  
  if (!(await fileExists(fullPath))) {
    writeError(`Configuration file not found: ${fullPath}`);
    return null;
  }

  return await readJsonFile(fullPath);
}

/**
 * Progress Utilities
 */

export async function withSpinner(message, asyncFn) {
  const { default: ora } = await import('ora');
  
  const spinner = ora(message).start();
  
  try {
    const result = await asyncFn();
    spinner.succeed();
    return result;
  } catch (error) {
    spinner.fail(`${message} - ${error.message}`);
    throw error;
  }
}

/**
 * Cross-platform path utilities
 */

export function resolvePath(...paths) {
  return path.resolve(...paths);
}

export function joinPath(...paths) {
  return path.join(...paths);
}

/**
 * Exit utilities
 */

export function exitWithError(message, code = 1) {
  writeError(message);
  process.exit(code);
}

export function exitWithSuccess(message = '') {
  if (message) {
    writeSuccess(message);
  }
  process.exit(0);
}

/**
 * Default exports for CommonJS compatibility
 */
export default {
  writeTaskStart,
  writeTaskComplete,
  writeTaskError,
  writeInfo,
  writeSuccess,
  writeWarning,
  writeError,
  getEnvironmentInfo,
  makeHttpRequest,
  runCommand,
  ensureDirectory,
  fileExists,
  readJsonFile,
  writeJsonFile,
  loadConfig,
  withSpinner,
  resolvePath,
  joinPath,
  exitWithError,
  exitWithSuccess
};
