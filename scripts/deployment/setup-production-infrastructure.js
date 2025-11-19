/**
 * Production Infrastructure Setup
 * Node.js implementation replacing setup-production-infrastructure.ps1
 */

import { setTimeout } from 'node:timers/promises';
import { spawnSync } from 'node:child_process';
import axios from 'axios';
import chalk from 'chalk';
import { config } from 'dotenv';

// Load environment variables
config();

class ProductionInfrastructureManager {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.dryRun = options.dryRun || false;
    this.environment = options.environment || 'production';

    this.config = {
      workerName: 'vitalsense-health-app',
      domain: 'andernet.dev',
      subdomain: 'health',
      zones: {
        production: process.env.CLOUDFLARE_ZONE_ID,
        development: process.env.CLOUDFLARE_DEV_ZONE_ID,
      },
      apiToken: process.env.CLOUDFLARE_API_TOKEN,
    };

    this.deploymentSteps = {
      build: false,
      deploy: false,
      dns: false,
      waf: false,
      observability: false,
      secrets: false,
    };
  }

  log(message, color = 'white') {
    const timestamp = new Date().toISOString();
    const prefix = this.dryRun ? '[DRY-RUN] ' : '';
    console.log(chalk[color](`${prefix}[${timestamp}] ${message}`));
  }

  async executeCommand(command, description) {
    this.log(`🔧 ${description}`, 'cyan');

    if (this.dryRun) {
      this.log(`Would execute: ${command}`, 'yellow');
      return { success: true, output: 'DRY RUN - Command not executed' };
    }

    try {
      if (this.verbose) {
        this.log(`Executing: ${command}`, 'gray');
      }

      // Parse command into executable and arguments to prevent injection
      const parts = command.trim().split(/\s+/);
      const executable = parts[0];
      const args = parts.slice(1);

      const result = spawnSync(executable, args, {
        encoding: 'utf8',
        stdio: this.verbose ? 'inherit' : 'pipe',
        shell: false, // Disable shell to prevent injection
      });

      if (result.error) {
        throw result.error;
      }

      if (result.status !== 0) {
        throw new Error(`Command failed with exit code ${result.status}: ${result.stderr || 'Unknown error'}`);
      }

      const output = result.stdout?.toString() || '';

      this.log(`✅ ${description} completed`, 'green');
      return { success: true, output };
    } catch (error) {
      this.log(`❌ ${description} failed: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }

  async buildApplication() {
    this.log('🏗️ Building VitalSense Application', 'blue');

    const buildSteps = [
      { cmd: 'npm run build', desc: 'Building React application' },
      { cmd: 'npm run build:worker', desc: 'Building Cloudflare Worker' },
    ];

    for (const step of buildSteps) {
      const result = await this.executeCommand(step.cmd, step.desc);
      if (!result.success && !this.dryRun) {
        throw new Error(`Build failed: ${result.error}`);
      }
    }

    this.deploymentSteps.build = true;
    this.log('🎉 Application build completed successfully', 'green');
  }

  async deployToCloudflare() {
    this.log('🚀 Deploying to Cloudflare Workers', 'blue');

    // Using consolidated wrangler.toml with --env flag
    const deployCmd = `wrangler deploy --env ${this.environment}`;
    const result = await this.executeCommand(
      deployCmd,
      'Deploying to Cloudflare Workers'
    );

    if (!result.success && !this.dryRun) {
      throw new Error(`Deployment failed: ${result.error}`);
    }

    this.deploymentSteps.deploy = true;

    // Wait for deployment to propagate
    if (!this.dryRun) {
      this.log('⏳ Waiting for deployment to propagate...', 'yellow');
      await setTimeout(5000);
    }

    this.log('🎉 Deployment completed successfully', 'green');
  }

  async configureDNS() {
    this.log('🌐 Configuring DNS Records', 'blue');

    if (!this.config.apiToken) {
      throw new Error('CLOUDFLARE_API_TOKEN environment variable is required');
    }

    const zoneId = this.config.zones[this.environment];
    if (!zoneId) {
      throw new Error(
        `Zone ID not configured for environment: ${this.environment}`
      );
    }

    const dnsRecords = [
      {
        type: 'CNAME',
        name: this.config.subdomain,
        content: `${this.config.workerName}.${this.config.domain}.workers.dev`,
        proxied: true,
      },
    ];

    for (const record of dnsRecords) {
      await this.createOrUpdateDNSRecord(zoneId, record);
    }

    this.deploymentSteps.dns = true;
    this.log('🎉 DNS configuration completed', 'green');
  }

  async createOrUpdateDNSRecord(zoneId, record) {
    if (this.dryRun) {
      this.log(
        `Would create/update DNS record: ${record.name} -> ${record.content}`,
        'yellow'
      );
      return;
    }

    try {
      // Check if record exists
      const existingResponse = await axios.get(
        `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?name=${record.name}.${this.config.domain}`,
        {
          headers: {
            Authorization: `Bearer ${this.config.apiToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const existingRecord = existingResponse.data.result[0];

      if (existingRecord) {
        // Update existing record
        this.log(`📝 Updating existing DNS record: ${record.name}`, 'cyan');
        await axios.put(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records/${existingRecord.id}`,
          record,
          {
            headers: {
              Authorization: `Bearer ${this.config.apiToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      } else {
        // Create new record
        this.log(`➕ Creating new DNS record: ${record.name}`, 'cyan');
        await axios.post(
          `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
          record,
          {
            headers: {
              Authorization: `Bearer ${this.config.apiToken}`,
              'Content-Type': 'application/json',
            },
          }
        );
      }

      this.log(`✅ DNS record configured: ${record.name}`, 'green');
    } catch (error) {
      this.log(`❌ DNS configuration failed: ${error.message}`, 'red');
      throw error;
    }
  }

  async setupWAF() {
    this.log('🛡️ Configuring Web Application Firewall', 'blue');

    if (this.dryRun) {
      this.log('Would configure WAF rules and rate limiting', 'yellow');
      this.deploymentSteps.waf = true;
      return;
    }

    const wafCommands = [
      'wrangler kv:namespace create "RATE_LIMIT_KV" --env production',
      'wrangler kv:namespace create "SECURITY_LOG_KV" --env production',
    ];

    for (const cmd of wafCommands) {
      const result = await this.executeCommand(
        cmd,
        'Creating WAF KV namespaces'
      );
      if (!result.success) {
        this.log(
          `⚠️ WAF command failed (may already exist): ${result.error}`,
          'yellow'
        );
      }
    }

    this.deploymentSteps.waf = true;
    this.log('🎉 WAF configuration completed', 'green');
  }

  async setupObservability() {
    this.log('📊 Setting up Observability', 'blue');

    const observabilitySteps = [
      'wrangler analytics create --name vitalsense-analytics',
      'wrangler logpush create --name vitalsense-logs',
    ];

    for (const cmd of observabilitySteps) {
      const result = await this.executeCommand(cmd, 'Setting up observability');
      if (!result.success) {
        this.log(
          `⚠️ Observability setup failed (may already exist): ${result.error}`,
          'yellow'
        );
      }
    }

    this.deploymentSteps.observability = true;
    this.log('🎉 Observability setup completed', 'green');
  }

  async setupSecrets() {
    this.log('🔐 Configuring Production Secrets', 'blue');

    const secrets = [
      { name: 'DEVICE_JWT_SECRET', value: process.env.DEVICE_JWT_SECRET },
      { name: 'AUTH0_DOMAIN', value: process.env.AUTH0_DOMAIN },
      { name: 'AUTH0_CLIENT_ID', value: process.env.AUTH0_CLIENT_ID },
    ];

    for (const secret of secrets) {
      if (secret.value) {
        const cmd = `echo "${secret.value}" | wrangler secret put ${secret.name} --env ${this.environment}`;
        await this.executeCommand(cmd, `Setting secret: ${secret.name}`);
      } else {
        this.log(
          `⚠️ Secret ${secret.name} not found in environment variables`,
          'yellow'
        );
      }
    }

    this.deploymentSteps.secrets = true;
    this.log('🎉 Secrets configuration completed', 'green');
  }

  async verifyDeployment() {
    this.log('🔍 Verifying Deployment', 'blue');

    const healthUrl = `https://${this.config.subdomain}.${this.config.domain}/health`;

    try {
      const response = await axios.get(healthUrl, { timeout: 10000 });

      if (response.status === 200) {
        this.log(`✅ Health check passed: ${healthUrl}`, 'green');
        this.log(
          `📊 Response: ${JSON.stringify(response.data, null, 2)}`,
          'cyan'
        );
        return true;
      } else {
        this.log(`❌ Health check failed: ${response.status}`, 'red');
        return false;
      }
    } catch (error) {
      this.log(`❌ Health check error: ${error.message}`, 'red');
      return false;
    }
  }

  printSummary() {
    this.log('\n📊 Deployment Summary', 'blue');
    this.log('═'.repeat(50), 'blue');

    const steps = Object.entries(this.deploymentSteps);
    const completed = steps.filter(([, status]) => status).length;
    const total = steps.length;

    this.log(`📈 Progress: ${completed}/${total} steps completed`, 'cyan');

    steps.forEach(([step, status]) => {
      const icon = status ? '✅' : '❌';
      const color = status ? 'green' : 'red';
      this.log(
        `${icon} ${step.charAt(0).toUpperCase() + step.slice(1)}`,
        color
      );
    });

    if (completed === total) {
      this.log(
        '\n🎉 Production infrastructure setup completed successfully!',
        'green'
      );
      this.log(
        `🌐 Application URL: https://${this.config.subdomain}.${this.config.domain}`,
        'blue'
      );
    } else {
      this.log(
        '\n⚠️ Some steps failed. Check the logs above for details.',
        'yellow'
      );
    }

    return { completed, total, success: completed === total };
  }

  async runFullSetup(options = {}) {
    const {
      build = true,
      deploy = true,
      dns = true,
      waf = true,
      observability = true,
      secrets = true,
      verify = true,
    } = options;

    this.log('🚀 Starting Production Infrastructure Setup', 'green');
    this.log(`Environment: ${this.environment}`, 'cyan');
    this.log(`Domain: ${this.config.subdomain}.${this.config.domain}`, 'cyan');

    if (this.dryRun) {
      this.log('🧪 DRY RUN MODE - No actual changes will be made', 'yellow');
    }

    this.log('═'.repeat(60), 'blue');

    try {
      if (build) await this.buildApplication();
      if (deploy) await this.deployToCloudflare();
      if (dns) await this.configureDNS();
      if (waf) await this.setupWAF();
      if (observability) await this.setupObservability();
      if (secrets) await this.setupSecrets();

      if (verify && !this.dryRun) {
        await this.verifyDeployment();
      }

      return this.printSummary();
    } catch (error) {
      this.log(`💥 Setup failed: ${error.message}`, 'red');
      if (this.verbose) {
        console.error(error.stack);
      }
      return { success: false, error: error.message };
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    dryRun: args.includes('--dry-run') || args.includes('--test'),
    environment:
      args.find((arg) => arg.startsWith('--env='))?.split('=')[1] ||
      'production',
  };

  // Parse step options
  const stepOptions = {
    build: !args.includes('--no-build'),
    deploy: args.includes('--deploy') || args.includes('--all'),
    dns: args.includes('--dns') || args.includes('--all'),
    waf: args.includes('--waf') || args.includes('--all'),
    observability: args.includes('--observability') || args.includes('--all'),
    secrets: args.includes('--secrets') || args.includes('--all'),
    verify: args.includes('--verify') || args.includes('--all'),
  };

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🚀 VitalSense Production Infrastructure Setup

Usage: node setup-production-infrastructure.js [options]

Options:
  --verbose, -v          Verbose output
  --dry-run, --test      Test mode - no actual changes
  --env=<environment>    Target environment (default: production)

Setup Steps:
  --deploy               Deploy to Cloudflare Workers
  --dns                  Configure DNS records
  --waf                  Setup Web Application Firewall
  --observability        Setup monitoring and analytics
  --secrets              Configure production secrets
  --verify               Verify deployment health
  --all                  Run all setup steps
  --no-build             Skip application build

Examples:
  node setup-production-infrastructure.js --all --verbose
  node setup-production-infrastructure.js --deploy --dns --verify
  node setup-production-infrastructure.js --dry-run --all
  node setup-production-infrastructure.js --env=staging --deploy
    `);
    process.exit(0);
  }

  try {
    const manager = new ProductionInfrastructureManager(options);
    const result = await manager.runFullSetup(stepOptions);

    process.exitCode = result.success ? 0 : 1;
    return result;
  } catch (error) {
    console.error(chalk.red(`💥 Setup failed: ${error.message}`));
    if (options.verbose) {
      console.error(error.stack);
    }
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { ProductionInfrastructureManager };
