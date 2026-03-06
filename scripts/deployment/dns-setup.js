#!/usr/bin/env node

/**
 * DNS Setup Manager - Node.js version
 * Replaces scripts/dns-setup.ps1
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
import axios from 'axios';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

program
  .name('dns-setup')
  .description(
    'Automated DNS subdomain configuration for andernet.dev Health Platform'
  )
  .requiredOption('--api-token <token>', 'Cloudflare API token (required)')
  .option(
    '--zone-id <id>',
    'Cloudflare Zone ID (auto-detected if not provided)'
  )
  .option('--phase <number>', 'DNS setup phase (1, 2, 3)', '1')
  .option('--dry-run', 'Preview changes without applying them')
  .option('--cleanup', 'Remove all health-related DNS records')
  .option('-v, --verbose', 'Show detailed output')
  .parse();

const options = program.opts();

// Health platform subdomain configuration
const subdomains = {
  1: [
    { name: 'health', target: 'health-app.workers.dev', priority: 'critical' },
  ],
  2: [
    { name: 'api.health', target: 'health-api.workers.dev', priority: 'high' },
    { name: 'ws.health', target: 'health-ws.workers.dev', priority: 'high' },
  ],
  3: [
    {
      name: 'emergency.health',
      target: 'health-emergency.workers.dev',
      priority: 'critical',
    },
    {
      name: 'files.health',
      target: 'health-files.workers.dev',
      priority: 'medium',
    },
    {
      name: 'caregiver.health',
      target: 'health-caregiver.workers.dev',
      priority: 'high',
    },
  ],
};

const cloudflareConfig = {
  baseUrl: 'https://api.cloudflare.com/client/v4',
  headers: {
    Authorization: `Bearer ${options.apiToken}`,
    'Content-Type': 'application/json',
  },
};

const dnsResults = [];

function addDnsResult(action, name, status, details = '') {
  dnsResults.push({
    action,
    name,
    status,
    details,
    timestamp: new Date().toISOString(),
  });
}

async function getZoneId(domain = 'andernet.dev') {
  if (options.zoneId) {
    writeInfo(`Using provided Zone ID: ${options.zoneId}`);
    return options.zoneId;
  }

  writeInfo(`Finding Zone ID for ${domain}...`);

  try {
    const response = await axios.get(
      `${cloudflareConfig.baseUrl}/zones?name=${domain}`,
      {
        headers: cloudflareConfig.headers,
      }
    );

    if (response.data.success && response.data.result.length > 0) {
      const zoneId = response.data.result[0].id;
      writeSuccess(`✅ Found Zone ID: ${zoneId}`);
      return zoneId;
    } else {
      throw new Error('Zone not found');
    }
  } catch (error) {
    writeTaskError('DNS', `Error fetching zone information: ${error.message}`);
    return null;
  }
}

async function createDnsRecord(zoneId, name, target, priority) {
  const fullName = name.includes('andernet.dev')
    ? name
    : `${name}.andernet.dev`;

  const recordData = {
    type: 'CNAME',
    name: fullName,
    content: target,
    ttl: 300, // 5 minutes for development, increase for production
  };

  if (options.dryRun) {
    writeInfo(`[DRY RUN] Would create: ${fullName} → ${target} (${priority})`);
    addDnsResult('CREATE', fullName, 'DRY_RUN', target);
    return true;
  }

  try {
    const response = await axios.post(
      `${cloudflareConfig.baseUrl}/zones/${zoneId}/dns_records`,
      recordData,
      { headers: cloudflareConfig.headers }
    );

    if (response.data.success) {
      writeSuccess(`✅ Created: ${fullName} → ${target}`);
      addDnsResult('CREATE', fullName, 'SUCCESS', target);
      return true;
    } else {
      const errorMsg = response.data.errors?.[0]?.message || 'Unknown error';
      writeTaskError('DNS', `Failed: ${fullName} - ${errorMsg}`);
      addDnsResult('CREATE', fullName, 'FAILED', errorMsg);
      return false;
    }
  } catch (error) {
    if (error.response?.status === 409) {
      writeWarning(`Record already exists: ${fullName}`);
      addDnsResult('CREATE', fullName, 'EXISTS', target);
      return true;
    } else {
      writeTaskError('DNS', `Error creating ${fullName}: ${error.message}`);
      addDnsResult('CREATE', fullName, 'FAILED', error.message);
      return false;
    }
  }
}

async function listExistingRecords(zoneId) {
  writeInfo('Fetching existing DNS records...');

  try {
    const response = await axios.get(
      `${cloudflareConfig.baseUrl}/zones/${zoneId}/dns_records?type=CNAME`,
      { headers: cloudflareConfig.headers }
    );

    if (response.data.success) {
      const healthRecords = response.data.result.filter(
        (record) =>
          record.name.includes('health') || record.content.includes('health')
      );

      writeInfo(
        `Found ${healthRecords.length} existing health-related records:`
      );
      healthRecords.forEach((record) => {
        writeInfo(`  ${record.name} → ${record.content}`);
      });

      return healthRecords;
    } else {
      throw new Error('Failed to fetch records');
    }
  } catch (error) {
    writeTaskError('DNS', `Error fetching records: ${error.message}`);
    return [];
  }
}

async function deleteRecord(zoneId, recordId, recordName) {
  if (options.dryRun) {
    writeInfo(`[DRY RUN] Would delete: ${recordName}`);
    addDnsResult('DELETE', recordName, 'DRY_RUN', 'Cleanup');
    return true;
  }

  try {
    const response = await axios.delete(
      `${cloudflareConfig.baseUrl}/zones/${zoneId}/dns_records/${recordId}`,
      { headers: cloudflareConfig.headers }
    );

    if (response.data.success) {
      writeSuccess(`✅ Deleted: ${recordName}`);
      addDnsResult('DELETE', recordName, 'SUCCESS', 'Cleanup');
      return true;
    } else {
      writeTaskError('DNS', `Failed to delete: ${recordName}`);
      addDnsResult('DELETE', recordName, 'FAILED', 'Delete failed');
      return false;
    }
  } catch (error) {
    writeTaskError('DNS', `Error deleting ${recordName}: ${error.message}`);
    addDnsResult('DELETE', recordName, 'FAILED', error.message);
    return false;
  }
}

async function cleanupDnsRecords(zoneId) {
  writeInfo('🧹 Cleaning up health-related DNS records...');

  const existingRecords = await listExistingRecords(zoneId);
  let deletedCount = 0;

  for (const record of existingRecords) {
    const success = await deleteRecord(zoneId, record.id, record.name);
    if (success) {
      deletedCount++;
    }
  }

  writeInfo(
    `Cleanup complete: ${deletedCount}/${existingRecords.length} records removed`
  );
  return deletedCount;
}

async function createPhaseRecords(zoneId, phase) {
  writeInfo(`🌐 Creating DNS records for Phase ${phase}...`);

  const phaseSubdomains = subdomains[phase] || [];
  let successCount = 0;

  for (const subdomain of phaseSubdomains) {
    const success = await createDnsRecord(
      zoneId,
      subdomain.name,
      subdomain.target,
      subdomain.priority
    );

    if (success) {
      successCount++;
    }
  }

  writeInfo(
    `Phase ${phase} complete: ${successCount}/${phaseSubdomains.length} records processed`
  );
  return successCount === phaseSubdomains.length;
}

async function verifyDnsRecords(phase) {
  writeInfo('🔍 Verifying DNS propagation...');

  const phaseSubdomains = subdomains[phase] || [];
  let verifiedCount = 0;

  for (const subdomain of phaseSubdomains) {
    const fullName = subdomain.name.includes('andernet.dev')
      ? subdomain.name
      : `${subdomain.name}.andernet.dev`;

    try {
      // Simple check - try to resolve the domain
      const response = await axios.get(
        `https://1.1.1.1/dns-query?name=${fullName}&type=CNAME`,
        {
          headers: { Accept: 'application/dns-json' },
          timeout: 5000,
        }
      );

      if (response.data.Answer && response.data.Answer.length > 0) {
        writeSuccess(`✅ ${fullName} is resolving`);
        verifiedCount++;
      } else {
        writeWarning(`⚠️ ${fullName} not yet propagated`);
      }
    } catch (error) {
      writeWarning(`⚠️ ${fullName} verification failed: ${error.message}`);
    }
  }

  writeInfo(
    `Verification complete: ${verifiedCount}/${phaseSubdomains.length} records verified`
  );
  return verifiedCount;
}

function getDnsStatusIcon(status) {
  if (status === 'SUCCESS' || status === 'EXISTS') return '✅';
  if (status === 'DRY_RUN') return '🔍';
  return '❌';
}

function printDnsSummary() {
  const successful = dnsResults.filter(
    (r) => r.status === 'SUCCESS' || r.status === 'EXISTS'
  ).length;
  const failed = dnsResults.filter((r) => r.status === 'FAILED').length;
  const dryRun = dnsResults.filter((r) => r.status === 'DRY_RUN').length;
  const total = dnsResults.length;

  writeInfo('\n📊 DNS Operation Summary:');
  writeInfo(`   Total operations: ${total}`);

  if (dryRun > 0) {
    writeInfo(`   Dry run operations: ${dryRun}`);
  } else {
    writeSuccess(`   Successful: ${successful}`);
    if (failed > 0) {
      writeTaskError('Summary', `Failed: ${failed}`);
    }
  }

  if (options.verbose) {
    writeInfo('\n📋 Detailed Results:');
    dnsResults.forEach((result) => {
      const icon = getDnsStatusIcon(result.status);
      writeInfo(
        `   ${icon} ${result.action} ${result.name}: ${result.details}`
      );
    });
  }

  return failed === 0;
}

async function main() {
  writeTaskStart(
    'DNS Setup',
    `Domain: andernet.dev | Phase: ${options.phase} | Mode: ${options.dryRun ? 'DRY RUN' : 'LIVE'}`
  );

  try {
    // Get Zone ID
    const zoneId = await getZoneId();
    if (!zoneId) {
      exitWithError('Could not determine Zone ID', 1);
    }

    // Execute based on mode
    if (options.cleanup) {
      await cleanupDnsRecords(zoneId);
    } else {
      // Show existing records first
      if (options.verbose) {
        await listExistingRecords(zoneId);
      }

      // Create phase records
      const success = await createPhaseRecords(zoneId, options.phase);

      // Verify if not dry run
      if (success && !options.dryRun) {
        writeInfo('Waiting 10 seconds for DNS propagation...');
        await new Promise((resolve) => globalThis.setTimeout(resolve, 10000));
        await verifyDnsRecords(options.phase);
      }
    }

    const summaryOk = printDnsSummary();

    if (summaryOk || options.dryRun) {
      writeTaskComplete(
        'DNS Setup',
        'DNS configuration completed successfully!'
      );

      if (!options.dryRun && !options.cleanup) {
        writeInfo('\n🔗 Your health platform is now accessible at:');
        const phaseSubdomains = subdomains[options.phase] || [];
        phaseSubdomains.forEach((subdomain) => {
          const fullName = subdomain.name.includes('andernet.dev')
            ? subdomain.name
            : `${subdomain.name}.andernet.dev`;
          writeInfo(`   https://${fullName}`);
        });
      }

      exitWithSuccess();
    } else {
      writeTaskError('DNS Setup', 'Some operations failed');
      exitWithError('DNS setup completed with errors', 1);
    }
  } catch (error) {
    writeTaskError('DNS Setup', `Unexpected error: ${error.message}`);
    exitWithError('DNS setup failed', 1);
  }
}

// Only run if this file is executed directly
if (process.argv[1] === __filename) {
  main().catch((error) => {
    writeTaskError('DNS Setup', error.message);
    process.exit(1);
  });
}
