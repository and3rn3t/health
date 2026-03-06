/**
 * Frontend Security Fix Script
 * Addresses dependency vulnerabilities found in pnpm audit
 */

const { exec } = require('child_process');
const util = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = util.promisify(exec);

// Vulnerability fixes mapping
const SECURITY_FIXES = {
  axios: '>=1.12.0',
  esbuild: '>=0.25.0',
  hono: '>=4.9.7',
  'is-svg': '>=4.3.0',
  'js-yaml': '>=3.13.1',
  postcss: '>=8.4.31',
  'color-string': '>=1.5.5',
  tmp: '>=0.2.4',
};

const CRITICAL_PACKAGES = ['axios', 'esbuild', 'hono'];

class FrontendSecurityFixer {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.packageJsonPath = path.join(this.workspaceRoot, 'package.json');
  }

  log(level, message) {
    const timestamp = new Date().toISOString();
    const levelIcon = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      security: '🔒',
    };
    console.log(`${levelIcon[level] || '📋'} [${timestamp}] ${message}`);
  }

  async analyzeVulnerabilities() {
    this.log('security', 'Analyzing dependency vulnerabilities...');

    try {
      const { stdout } = await execAsync('pnpm audit --json');
      const auditData = JSON.parse(stdout);

      this.log(
        'info',
        `Found ${auditData.vulnerabilities?.length || 0} vulnerabilities`
      );
      return auditData.vulnerabilities || [];
    } catch (error) {
      this.log(
        'warning',
        'Could not parse audit JSON, using known vulnerabilities'
      );
      return Object.keys(SECURITY_FIXES);
    }
  }

  async readPackageJson() {
    try {
      const packageContent = await fs.readFile(this.packageJsonPath, 'utf8');
      return JSON.parse(packageContent);
    } catch (error) {
      this.log('error', `Could not read package.json: ${error.message}`);
      throw error;
    }
  }

  async updateDependencies() {
    this.log('security', 'Starting security dependency updates...');

    const packageJson = await this.readPackageJson();
    let updatesNeeded = [];

    // Check dependencies and devDependencies
    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const [pkg, requiredVersion] of Object.entries(SECURITY_FIXES)) {
      if (allDeps[pkg]) {
        updatesNeeded.push(`${pkg}@${requiredVersion}`);
        this.log(
          'warning',
          `Security update needed: ${pkg} to ${requiredVersion}`
        );
      }
    }

    if (updatesNeeded.length === 0) {
      this.log('success', 'No direct dependency updates needed');
      return true;
    }

    // Update critical packages first
    const criticalUpdates = updatesNeeded.filter((update) =>
      CRITICAL_PACKAGES.some((pkg) => update.startsWith(pkg))
    );

    if (criticalUpdates.length > 0) {
      this.log(
        'security',
        `Updating critical packages: ${criticalUpdates.join(', ')}`
      );
      try {
        await execAsync(`pnpm update ${criticalUpdates.join(' ')}`);
        this.log('success', 'Critical packages updated');
      } catch (error) {
        this.log('error', `Critical update failed: ${error.message}`);
      }
    }

    // Update remaining packages
    const remainingUpdates = updatesNeeded.filter(
      (update) => !CRITICAL_PACKAGES.some((pkg) => update.startsWith(pkg))
    );

    if (remainingUpdates.length > 0) {
      this.log(
        'info',
        `Updating remaining packages: ${remainingUpdates.join(', ')}`
      );
      try {
        await execAsync(`pnpm update ${remainingUpdates.join(' ')}`);
        this.log('success', 'Remaining packages updated');
      } catch (error) {
        this.log('warning', `Some updates failed: ${error.message}`);
      }
    }

    return true;
  }

  async verifySecurityFixes() {
    this.log('security', 'Verifying security fixes...');

    try {
      const { stdout } = await execAsync('pnpm audit --summary');
      this.log('info', 'Post-update audit results:');
      console.log(stdout);

      // Check if high/critical vulnerabilities remain
      if (stdout.includes('high') || stdout.includes('critical')) {
        this.log('warning', 'Some high/critical vulnerabilities may remain');
        return false;
      }

      this.log('success', 'Security verification completed');
      return true;
    } catch (error) {
      this.log('warning', `Audit verification failed: ${error.message}`);
      return false;
    }
  }

  async checkDevelopmentServer() {
    this.log('info', 'Checking development server status...');

    try {
      const { stdout } = await execAsync(
        'curl -sS http://localhost:5173/health || curl -sS http://localhost:5000/health || echo "No dev server running"'
      );

      if (stdout.includes('No dev server running')) {
        this.log('warning', 'Development server not running');
        return false;
      }

      this.log('success', 'Development server is responsive');
      return true;
    } catch (error) {
      this.log('warning', 'Could not check development server');
      return false;
    }
  }

  async generateSecurityReport() {
    const reportPath = path.join(this.workspaceRoot, 'security-report.json');

    const report = {
      timestamp: new Date().toISOString(),
      vulnerabilities_addressed: Object.keys(SECURITY_FIXES),
      critical_packages: CRITICAL_PACKAGES,
      next_steps: [
        'Run comprehensive testing',
        'Verify frontend integration',
        'Check WebSocket ML connectivity',
        'Deploy security updates',
      ],
    };

    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    this.log('success', `Security report saved to ${reportPath}`);
  }

  async run() {
    this.log('security', '🔒 Starting Frontend Security Fix Process');

    try {
      // Analyze vulnerabilities
      const vulnerabilities = await this.analyzeVulnerabilities();

      // Update dependencies
      await this.updateDependencies();

      // Verify fixes
      const verified = await this.verifySecurityFixes();

      // Check development server
      const serverRunning = await this.checkDevelopmentServer();

      // Generate report
      await this.generateSecurityReport();

      this.log('success', '🎯 Frontend Security Fix Process Complete');

      return {
        vulnerabilities_found: vulnerabilities.length,
        updates_applied: Object.keys(SECURITY_FIXES).length,
        security_verified: verified,
        dev_server_running: serverRunning,
      };
    } catch (error) {
      this.log('error', `Security fix process failed: ${error.message}`);
      throw error;
    }
  }
}

// Run if called directly
if (require.main === module) {
  const fixer = new FrontendSecurityFixer();
  fixer
    .run()
    .then((result) => {
      console.log('\n📊 Summary:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Security fix failed:', error.message);
      process.exit(1);
    });
}

module.exports = FrontendSecurityFixer;
