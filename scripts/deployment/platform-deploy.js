#!/usr/bin/env node

/**
 * Platform Deployment Manager - Node.js version
 * Replaces scripts/deploy-platform.ps1
 */

import { program } from 'commander';
import {
  writeTaskStart,
  writeTaskComplete,
  writeTaskError,
  writeInfo,
  writeSuccess,
  writeWarning,
  exitWithError,
  exitWithSuccess,
} from '../core/logger.js';
import fs from 'fs-extra';
import yaml from 'yaml';
import axios from 'axios';
import { execa } from 'execa';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

program
  .name('deploy-platform')
  .description('Comprehensive DNS + Worker deployment for Health Platform')
  .option(
    '--api-token <token>',
    'Cloudflare API token (or set CLOUDFLARE_API_TOKEN)'
  )
  .option('--phase <number>', 'Deployment phase (1, 2, 3)', '1')
  .option('--dry-run', 'Preview changes without applying them')
  .option('--dns-only', 'Deploy DNS records only')
  .option('--workers-only', 'Deploy Workers only')
  .option('--verify', 'Verify existing deployment')
  .option('--config <path>', 'Config file path', 'config/dns-config.yml')
  .option('-v, --verbose', 'Show detailed output')
  .parse();

const options = program.opts();

// Get API token from option or environment
const apiToken = options.apiToken || process.env.CLOUDFLARE_API_TOKEN;

const deploymentResults = [];

function addDeploymentResult(component, status, details = '') {
  deploymentResults.push({
    component,
    status,
    details,
    timestamp: new Date().toISOString(),
  });
}

async function readYamlConfig(configPath) {
  try {
    if (!(await fs.pathExists(configPath))) {
      throw new Error(`Config file not found: ${configPath}`);
    }

    const content = await fs.readFile(configPath, 'utf8');
    return yaml.parse(content);
  } catch (error) {
    writeTaskError('Config', `Failed to read config: ${error.message}`);
    // Fallback to basic config
    return {
      domain: 'andernet.dev',
      subdomains: {
        1: [
          {
            name: 'health',
            target: 'health-app.workers.dev',
            priority: 'critical',
          },
        ],
      },
    };
  }
}

async function validateEnvironment() {
  writeInfo('Validating environment...');

  if (!apiToken) {
    writeTaskError('Environment', 'Cloudflare API token required');
    writeInfo(
      'Set CLOUDFLARE_API_TOKEN environment variable or use --api-token'
    );
    writeInfo('Get token from: https://dash.cloudflare.com/profile/api-tokens');
    return false;
  }

  // Check if wrangler is available
  try {
    await execa('wrangler', ['--version']);
    writeSuccess('✓ Wrangler CLI available');
  } catch {
    writeWarning('Wrangler CLI not found - Workers deployment will be skipped');
  }

  // Check if npm is available
  try {
    await execa('npm', ['--version']);
    writeSuccess('✓ npm available');
  } catch {
    writeTaskError('Environment', 'npm not found - build process will fail');
    return false;
  }

  return true;
}

async function getCloudflareZoneId(domain = 'andernet.dev') {
  writeInfo(`Finding Zone ID for ${domain}...`);

  try {
    const response = await axios.get(
      `https://api.cloudflare.com/client/v4/zones?name=${domain}`,
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success && response.data.result.length > 0) {
      const zoneId = response.data.result[0].id;
      writeSuccess(`✓ Zone ID found: ${zoneId}`);
      return zoneId;
    } else {
      throw new Error('Zone not found');
    }
  } catch (error) {
    writeTaskError('DNS', `Failed to get zone ID: ${error.message}`);
    return null;
  }
}

async function createDnsRecord(zoneId, subdomain, target) {
  const recordName = subdomain.includes('.')
    ? subdomain
    : `${subdomain}.andernet.dev`;

  if (options.dryRun) {
    writeInfo(`[DRY RUN] Would create DNS record: ${recordName} → ${target}`);
    return { success: true, id: 'dry-run-id' };
  }

  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        type: 'CNAME',
        name: recordName,
        content: target,
        ttl: 300,
      },
      {
        headers: {
          Authorization: `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (response.data.success) {
      writeSuccess(`✓ Created DNS record: ${recordName} → ${target}`);
      addDeploymentResult(`DNS: ${recordName}`, 'SUCCESS', target);
      return response.data.result;
    } else {
      throw new Error(response.data.errors?.[0]?.message || 'Unknown error');
    }
  } catch (error) {
    if (error.response?.status === 409) {
      writeWarning(`DNS record already exists: ${recordName}`);
      addDeploymentResult(`DNS: ${recordName}`, 'EXISTS', target);
      return { success: true, existing: true };
    } else {
      writeTaskError('DNS', `Failed to create ${recordName}: ${error.message}`);
      addDeploymentResult(`DNS: ${recordName}`, 'FAILED', error.message);
      return { success: false, error: error.message };
    }
  }
}

async function deployDnsRecords(config, phase) {
  writeInfo(`Deploying DNS records for phase ${phase}...`);

  const zoneId = await getCloudflareZoneId(config.domain);
  if (!zoneId) {
    return false;
  }

  const subdomains = config.subdomains?.[phase] || [];
  let successCount = 0;

  for (const subdomain of subdomains) {
    const result = await createDnsRecord(
      zoneId,
      subdomain.name,
      subdomain.target
    );
    if (result.success) {
      successCount++;
    }
  }

  writeInfo(
    `DNS deployment complete: ${successCount}/${subdomains.length} records processed`
  );
  return successCount === subdomains.length;
}

async function buildApplication() {
  writeInfo('Building React application...');

  if (options.dryRun) {
    writeInfo('[DRY RUN] Would run: npm run build');
    return true;
  }

  try {
    await execa('npm', ['run', 'build'], {
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    writeSuccess('✓ Build completed successfully');
    addDeploymentResult('React Build', 'SUCCESS', 'Application built');
    return true;
  } catch (error) {
    writeTaskError('Build', `Build failed: ${error.message}`);
    addDeploymentResult('React Build', 'FAILED', error.message);
    return false;
  }
}

async function deployWorkers(phase) {
  writeInfo(`Deploying Workers for phase ${phase}...`);

  const environments = ['development', 'production'];
  let successCount = 0;

  for (const env of environments) {
    try {
      if (options.dryRun) {
        writeInfo(`[DRY RUN] Would deploy to ${env}`);
        successCount++;
        continue;
      }

      await execa('wrangler', ['deploy', '--env', env], {
        stdio: options.verbose ? 'inherit' : 'pipe',
      });

      writeSuccess(`✓ Deployed to ${env}`);
      addDeploymentResult(`Worker: ${env}`, 'SUCCESS', 'Deployed');
      successCount++;
    } catch (error) {
      writeTaskError('Workers', `Failed to deploy to ${env}: ${error.message}`);
      addDeploymentResult(`Worker: ${env}`, 'FAILED', error.message);
    }
  }

  return successCount === environments.length;
}

async function verifyDeployment(config, phase) {
  writeInfo('Verifying deployment...');

  const subdomains = config.subdomains?.[phase] || [];
  let successCount = 0;

  for (const subdomain of subdomains) {
    const baseUrl = subdomain.name.includes('.')
      ? subdomain.name
      : `${subdomain.name}.${config.domain}`;
    const url = `https://${baseUrl}/health`;

    try {
      const response = await axios.get(url, { timeout: 10000 });

      if (response.status === 200) {
        writeSuccess(`✓ ${url} is responding`);
        addDeploymentResult(
          `Verify: ${subdomain.name}`,
          'SUCCESS',
          `Status: ${response.status}`
        );
        successCount++;
      } else {
        writeWarning(`${url} returned status: ${response.status}`);
        addDeploymentResult(
          `Verify: ${subdomain.name}`,
          'WARNING',
          `Status: ${response.status}`
        );
      }
    } catch (error) {
      writeTaskError('Verify', `${url} failed: ${error.message}`);
      addDeploymentResult(`Verify: ${subdomain.name}`, 'FAILED', error.message);
    }
  }

  writeInfo(
    `Verification complete: ${successCount}/${subdomains.length} endpoints responding`
  );
  return successCount > 0;
}

function getStatusIcon(status) {
  if (status === 'SUCCESS') return '✅';
  if (status === 'WARNING') return '⚠️';
  return '❌';
}

function printDeploymentSummary() {
  const successful = deploymentResults.filter(
    (r) => r.status === 'SUCCESS'
  ).length;
  const failed = deploymentResults.filter((r) => r.status === 'FAILED').length;
  const warnings = deploymentResults.filter(
    (r) => r.status === 'WARNING'
  ).length;
  const total = deploymentResults.length;

  writeInfo('\n📊 Deployment Summary:');
  writeInfo(`   Total operations: ${total}`);
  writeSuccess(`   Successful: ${successful}`);
  if (warnings > 0) {
    writeWarning(`   Warnings: ${warnings}`);
  }
  if (failed > 0) {
    writeTaskError('Summary', `Failed: ${failed}`);
  }

  if (options.verbose) {
    writeInfo('\n📋 Detailed Results:');
    deploymentResults.forEach((result) => {
      const icon = getStatusIcon(result.status);
      writeInfo(`   ${icon} ${result.component}: ${result.details}`);
    });
  }

  return failed === 0;
}

async function runDeploymentPhase(config) {
  let allSuccess = true;

  // DNS deployment
  if (!options.workersOnly) {
    const dnsSuccess = await deployDnsRecords(config, options.phase);
    allSuccess = allSuccess && dnsSuccess;
  }

  // Workers deployment
  if (!options.dnsOnly) {
    // Build first
    const buildSuccess = await buildApplication();
    if (buildSuccess) {
      const workerSuccess = await deployWorkers(options.phase);
      allSuccess = allSuccess && workerSuccess;
    } else {
      allSuccess = false;
    }
  }

  // Verification
  if (allSuccess && !options.dryRun) {
    await verifyDeployment(config, options.phase);
  }

  return allSuccess;
}

async function main() {
  writeTaskStart(
    'Platform Deployment',
    `Phase ${options.phase} | Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`
  );

  try {
    // Validate environment
    if (!(await validateEnvironment())) {
      exitWithError('Environment validation failed', 1);
    }

    // Read configuration
    const config = await readYamlConfig(options.config);

    // Phase-specific deployment logic
    if (options.verify) {
      await verifyDeployment(config, options.phase);
    } else {
      await runDeploymentPhase(config);
    }

    const summaryOk = printDeploymentSummary();

    if (summaryOk) {
      writeTaskComplete(
        'Platform Deployment',
        'Deployment completed successfully!'
      );
      exitWithSuccess();
    } else {
      writeTaskError('Platform Deployment', 'Some operations failed');
      exitWithError('Deployment completed with errors', 1);
    }
  } catch (error) {
    writeTaskError('Platform Deployment', `Unexpected error: ${error.message}`);
    exitWithError('Deployment failed', 1);
  }
}

// Only run if this file is executed directly
if (process.argv[1] === __filename) {
  main().catch((error) => {
    writeTaskError('Deploy Platform', error.message);
    process.exit(1);
  });
}
