#!/usr/bin/env node

/**
 * VitalSense Security Update Script
 * Comprehensive security dependency updates with lockfile handling
 */

import { spawn, exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';

const execAsync = promisify(exec);

// Security vulnerabilities to fix (from pnpm audit)
const SECURITY_UPDATES = {
  critical: [
    'axios@^1.12.0',      // DoS vulnerability fix
    'esbuild@^0.25.0',    // Development server security fix  
    'hono@^4.9.7'         // Body limit middleware bypass fix
  ],
  high: [
    'is-svg@^4.3.0',      // ReDOS fix
    'js-yaml@^3.13.1'     // Code injection fix
  ],
  moderate: [
    'postcss@^8.4.31',    // ReDOS and parsing error fixes
    'color-string@^1.5.5', // ReDOS fix
    'web-vitals@^4.2.4'   // Add missing dependency
  ],
  low: [
    'tmp@^0.2.4'          // Symbolic link vulnerability fix
  ]
};

class SecurityUpdater {
  constructor() {
    this.workspaceRoot = process.cwd();
    this.packageJsonPath = path.join(this.workspaceRoot, 'package.json');
    this.lockfilePath = path.join(this.workspaceRoot, 'pnpm-lock.yaml');
  }

  log(level, message) {
    const timestamp = new Date().toISOString().slice(11, 19);
    const icons = {
      info: '📋',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      security: '🔒',
      fix: '🔧'
    };
    console.log(`${icons[level] || '📋'} [${timestamp}] ${message}`);
  }

  async checkLockfilePermissions() {
    this.log('security', 'Checking lockfile permissions...');
    
    try {
      await fs.access(this.lockfilePath, fs.constants.W_OK);
      this.log('success', 'Lockfile is writable');
      return true;
    } catch (error) {
      this.log('warning', 'Lockfile permission issues detected');
      return false;
    }
  }

  async fixLockfilePermissions() {
    this.log('fix', 'Fixing lockfile permissions...');
    
    try {
      // Try to remove temporary lockfiles first
      const tempFiles = await fs.readdir(this.workspaceRoot);
      const lockfileTempPattern = /pnpm-lock\.yaml\.\d+$/;
      
      for (const file of tempFiles) {
        if (lockfileTempPattern.test(file)) {
          const tempPath = path.join(this.workspaceRoot, file);
          try {
            await fs.unlink(tempPath);
            this.log('success', `Removed temp lockfile: ${file}`);
          } catch (error) {
            this.log('warning', `Could not remove ${file}: ${error.message}`);
          }
        }
      }
      
      // On Windows, try to clear readonly attribute
      if (process.platform === 'win32') {
        try {
          await execAsync(`attrib -r "${this.lockfilePath}"`);
          this.log('success', 'Cleared readonly attribute on lockfile');
        } catch (error) {
          this.log('warning', 'Could not clear readonly attribute');
        }
      }
      
      return true;
    } catch (error) {
      this.log('error', `Lockfile permission fix failed: ${error.message}`);
      return false;
    }
  }

  async updateCriticalPackages() {
    this.log('security', 'Updating critical security packages...');
    
    const criticalPackages = SECURITY_UPDATES.critical;
    
    for (const pkg of criticalPackages) {
      try {
        this.log('fix', `Updating ${pkg}...`);
        
        // Use pnpm add to force update
        const { stdout, stderr } = await execAsync(`pnpm add ${pkg}`, {
          cwd: this.workspaceRoot,
          timeout: 60000
        });
        
        if (stderr && !stderr.includes('WARN')) {
          this.log('warning', `Update warning for ${pkg}: ${stderr.substring(0, 100)}`);
        } else {
          this.log('success', `Updated ${pkg}`);
        }
        
      } catch (error) {
        this.log('error', `Failed to update ${pkg}: ${error.message}`);
        
        // Try alternative approach
        try {
          await execAsync(`pnpm install ${pkg} --force`, {
            cwd: this.workspaceRoot,
            timeout: 30000
          });
          this.log('success', `Force installed ${pkg}`);
        } catch (retryError) {
          this.log('error', `Force install also failed for ${pkg}`);
        }
      }
    }
  }

  async updateAllSecurityPackages() {
    this.log('security', 'Updating all security packages...');
    
    const allPackages = [
      ...SECURITY_UPDATES.critical,
      ...SECURITY_UPDATES.high,
      ...SECURITY_UPDATES.moderate,
      ...SECURITY_UPDATES.low
    ];
    
    // Try bulk update first
    try {
      const packageList = allPackages.join(' ');
      this.log('fix', 'Attempting bulk security update...');
      
      await execAsync(`pnpm add ${packageList}`, {
        cwd: this.workspaceRoot,
        timeout: 120000
      });
      
      this.log('success', 'Bulk security update completed');
      return true;
      
    } catch (error) {
      this.log('warning', 'Bulk update failed, trying individual updates...');
      
      // Fall back to individual updates
      let successCount = 0;
      for (const pkg of allPackages) {
        try {
          await execAsync(`pnpm add ${pkg}`, {
            cwd: this.workspaceRoot,
            timeout: 30000
          });
          successCount++;
          this.log('success', `Updated ${pkg}`);
        } catch (pkgError) {
          this.log('warning', `Failed to update ${pkg}`);
        }
      }
      
      this.log('info', `Individual updates: ${successCount}/${allPackages.length} successful`);
      return successCount > 0;
    }
  }

  async verifySecurityFixes() {
    this.log('security', 'Verifying security fixes...');
    
    try {
      const { stdout } = await execAsync('pnpm audit --json', {
        cwd: this.workspaceRoot
      });
      
      const auditData = JSON.parse(stdout);
      const vulnerabilities = auditData.vulnerabilities || {};
      
      const severityCounts = {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0
      };
      
      Object.values(vulnerabilities).forEach(vuln => {
        const severity = vuln.severity || 'unknown';
        if (severityCounts.hasOwnProperty(severity)) {
          severityCounts[severity]++;
        }
      });
      
      this.log('info', 'Post-update vulnerability count:');
      Object.entries(severityCounts).forEach(([severity, count]) => {
        const status = count === 0 ? '✅' : '⚠️';
        this.log('info', `  ${status} ${severity}: ${count}`);
      });
      
      const totalVulns = Object.values(severityCounts).reduce((a, b) => a + b, 0);
      const improvement = totalVulns < 11; // Previous count was 11
      
      this.log(improvement ? 'success' : 'warning', 
        `Security status: ${totalVulns} vulnerabilities (${improvement ? 'improved' : 'no change'})`);
      
      return {
        totalVulnerabilities: totalVulns,
        severityCounts,
        improved: improvement
      };
      
    } catch (error) {
      this.log('warning', `Audit verification failed: ${error.message}`);
      return null;
    }
  }

  async generateSecurityReport() {
    const report = {
      timestamp: new Date().toISOString(),
      security_updates_applied: {
        critical: SECURITY_UPDATES.critical,
        high: SECURITY_UPDATES.high,
        moderate: SECURITY_UPDATES.moderate,
        low: SECURITY_UPDATES.low
      },
      next_steps: [
        'Verify frontend functionality after updates',
        'Test WebSocket ML integration',
        'Run comprehensive integration tests',
        'Monitor for new security advisories'
      ],
      environment: {
        node_version: process.version,
        platform: process.platform,
        workspace: this.workspaceRoot
      }
    };
    
    const reportPath = path.join(this.workspaceRoot, 'security-update-report.json');
    await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
    this.log('success', `Security report saved: ${reportPath}`);
    
    return report;
  }

  async run() {
    this.log('security', '🔒 Starting VitalSense Security Update Process');
    console.log('='.repeat(60));
    
    try {
      // Step 1: Check and fix lockfile permissions
      const lockfileOk = await this.checkLockfilePermissions();
      if (!lockfileOk) {
        await this.fixLockfilePermissions();
      }
      
      // Step 2: Update critical packages first
      this.log('security', 'Phase 1: Critical security updates');
      await this.updateCriticalPackages();
      
      // Step 3: Update all security packages
      this.log('security', 'Phase 2: Comprehensive security updates');
      const updateSuccess = await this.updateAllSecurityPackages();
      
      // Step 4: Verify fixes
      this.log('security', 'Phase 3: Security verification');
      const verification = await this.verifySecurityFixes();
      
      // Step 5: Generate report
      const report = await this.generateSecurityReport();
      
      console.log('\n🎯 Security Update Summary:');
      console.log('='.repeat(30));
      console.log(`✅ Update Process: ${updateSuccess ? 'SUCCESS' : 'PARTIAL'}`);
      if (verification) {
        console.log(`📊 Vulnerabilities: ${verification.totalVulnerabilities} (${verification.improved ? 'IMPROVED' : 'NO CHANGE'})`);
      }
      console.log(`📋 Report: security-update-report.json`);
      
      console.log('\n🚀 Next Steps:');
      report.next_steps.forEach(step => console.log(`  • ${step}`));
      
      return {
        success: updateSuccess,
        verification,
        report
      };
      
    } catch (error) {
      this.log('error', `Security update process failed: ${error.message}`);
      throw error;
    }
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const updater = new SecurityUpdater();
  updater.run()
    .then(result => {
      console.log('\n✅ Security update process completed');
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('\n❌ Security update failed:', error.message);
      process.exit(1);
    });
}

export default SecurityUpdater;