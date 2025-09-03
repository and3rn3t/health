#!/usr/bin/env node

/**
 * VitalSense Deployment Script - Node.js version
 * Replaces scripts/deploy-vitalsense.ps1
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
import { execa } from 'execa';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

program
  .name('deploy-vitalsense')
  .description('VitalSense Platform Deployment')
  .option('--skip-verify', 'Skip branding verification')
  .option('--skip-build', 'Skip build process')
  .option('--deploy', 'Deploy to Cloudflare Workers after build')
  .option('--dev-server', 'Start development server after build')
  .option('-v, --verbose', 'Show detailed output')
  .parse();

const options = program.opts();

const brandingChecks = [
  { file: 'src/App.tsx', pattern: 'VitalSense', description: 'Web app header' },
  { file: 'index.html', pattern: 'VitalSense', description: 'HTML title' },
  {
    file: 'package.json',
    pattern: 'vitalsense-app',
    description: 'Package name',
  },
  { file: 'README.md', pattern: 'VitalSense', description: 'Documentation' },
  {
    file: 'ios/Info.plist',
    pattern: 'VitalSense Sync',
    description: 'iOS app name',
  },
  {
    file: 'vitalsense-sync-metadata.json',
    pattern: 'VitalSense Sync',
    description: 'App Store metadata',
  },
];

async function checkProjectDirectory() {
  if (!(await fs.pathExists('package.json'))) {
    writeTaskError(
      'Environment',
      'Please run this script from the project root directory'
    );
    return false;
  }
  return true;
}

async function verifyBranding() {
  writeInfo('Verifying VitalSense Branding Updates...');

  let allPassed = true;

  for (const check of brandingChecks) {
    if (await fs.pathExists(check.file)) {
      try {
        const content = await fs.readFile(check.file, 'utf8');
        if (content.includes(check.pattern)) {
          writeSuccess(`✓ ${check.description} - ${check.file}`);
        } else {
          writeWarning(`✗ ${check.description} - ${check.file}`);
          allPassed = false;
        }
      } catch {
        writeWarning(`✗ ${check.description} - ${check.file}`);
        allPassed = false;
      }
    } else {
      writeWarning(`⚠ File not found: ${check.file}`);
    }
  }

  return allPassed;
}

async function buildApplication() {
  writeInfo('Building and Testing Platform...');
  writeInfo('Building React application...');

  try {
    await execa('npm', ['run', 'build'], {
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    writeSuccess('✅ Build completed successfully!');
    return true;
  } catch (error) {
    writeTaskError('Build', 'Build failed. Please check the errors above.');
    return false;
  }
}

async function deployToCloudflare() {
  writeInfo('Deploying to Cloudflare Workers...');

  try {
    await execa('wrangler', ['deploy'], {
      stdio: options.verbose ? 'inherit' : 'pipe',
    });

    writeSuccess('✅ Deployed to Cloudflare Workers successfully!');
    return true;
  } catch (error) {
    writeTaskError('Deploy', `Deployment failed: ${error.message}`);
    return false;
  }
}

async function startDevServer() {
  writeInfo('🚀 Starting VitalSense development server...');
  writeInfo('Access your platform at: http://localhost:5173');
  writeInfo('Press Ctrl+C to stop the server when ready.');

  try {
    await execa('npm', ['run', 'dev'], {
      stdio: 'inherit',
    });
  } catch {
    // User probably pressed Ctrl+C, which is expected
    writeInfo('Development server stopped.');
  }
}

function printSuccessMessage() {
  writeTaskComplete('VitalSense Platform', 'VitalSense Platform Ready!');

  writeSuccess('✅ Branding updated to VitalSense');
  writeSuccess("✅ iOS app configured as 'VitalSense Sync'");
  writeSuccess('✅ Bundle ID: dev.andernet.vitalsense.sync');
  writeSuccess('✅ App Store metadata prepared');
  writeSuccess('✅ Platform built and ready for deployment');

  writeInfo('\n📋 Next Steps:');
  writeInfo('1. Deploy to Cloudflare Workers: wrangler deploy');
  writeInfo('2. Update iOS Xcode project if needed');
  writeInfo('3. Submit to App Store using APP_STORE_TODAY_PLAN.md');
  writeInfo('4. Review VITALSENSE_BRANDING.md for complete brand guidelines');

  writeInfo('\n🌐 Platform URL: https://health.andernet.dev');
  writeInfo('📱 Future expansion: vitalsense.app (domain secured)');

  writeInfo('\nVitalSense - Where vital data becomes actionable insights! 💙');
}

async function main() {
  writeTaskStart('VitalSense Deployment', 'VitalSense Platform Deployment');

  try {
    // Check environment
    if (!(await checkProjectDirectory())) {
      exitWithError('Environment check failed', 1);
    }

    // Verify branding
    if (!options.skipVerify) {
      const brandingOk = await verifyBranding();
      if (!brandingOk) {
        writeWarning('Some branding checks failed, but continuing...');
      }
    }

    // Build application
    if (!options.skipBuild) {
      const buildSuccess = await buildApplication();
      if (!buildSuccess) {
        exitWithError('Build failed', 1);
      }
    }

    // Deploy if requested
    if (options.deploy) {
      const deploySuccess = await deployToCloudflare();
      if (!deploySuccess) {
        exitWithError('Deployment failed', 1);
      }
    }

    // Success message
    printSuccessMessage();

    // Optional dev server
    if (options.devServer) {
      await startDevServer();
    }

    exitWithSuccess();
  } catch (error) {
    writeTaskError(
      'VitalSense Deployment',
      `Unexpected error: ${error.message}`
    );
    exitWithError('Deployment failed', 1);
  }
}

// Only run if this file is executed directly
if (process.argv[1] === __filename) {
  main().catch((error) => {
    writeTaskError('VitalSense Deploy', error.message);
    process.exit(1);
  });
}
