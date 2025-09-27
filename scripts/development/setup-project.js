#!/usr/bin/env node
/**
 * Project setup and dependency installation
 * Node.js version of setup.ps1
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { program } = require('commander');

program
  .name('setup')
  .description('VitalSense Health Monitoring Platform - Setup Script')
  .option('-v, --verbose', 'Verbose output')
  .option('--skip-server', 'Skip server dependency installation')
  .option('--skip-main', 'Skip main project dependencies')
  .option('--force', 'Force reinstall dependencies')
  .parse();

const options = program.opts();

function runCommand(command, cwd = process.cwd(), description = '') {
  if (description) {
    console.log(`📦 ${description}...`);
  }
  
  try {
    const output = execSync(command, { 
      cwd, 
      stdio: options.verbose ? 'inherit' : 'pipe',
      encoding: 'utf8'
    });
    
    if (!options.verbose && output) {
      console.log(output.trim());
    }
    
    return true;
  } catch (error) {
    console.error(`❌ Failed: ${error.message}`);
    return false;
  }
}

function checkTool(command, name, installHint = '') {
  try {
    const version = execSync(`${command} --version`, { encoding: 'utf8', stdio: 'pipe' }).trim();
    console.log(`✅ ${name} found: ${version}`);
    return true;
  } catch (error) {
    console.log(`❌ ${name} is not installed.${installHint ? ` ${installHint}` : ''}`);
    return false;
  }
}

async function setupProject() {
  console.log('🏥 VitalSense Health Monitoring Platform - Setup Script');
  console.log('====================================================');

  // Check prerequisites
  console.log('📋 Checking prerequisites...');
  
  const nodeOk = checkTool('node', 'Node.js', 'Please install Node.js from https://nodejs.org/');
  const npmOk = checkTool('npm', 'npm');
  
  if (!nodeOk || !npmOk) {
    console.error('❌ Missing required tools. Please install them and try again.');
    process.exit(1);
  }

  // Check for package managers
  const hasYarn = checkTool('yarn', 'Yarn', '(optional)');
  const hasPnpm = checkTool('pnpm', 'pnpm', '(optional)');
  
  // Determine which package manager to use
  let packageManager = 'npm';
  try {
    await fs.access('pnpm-lock.yaml');
    if (hasPnpm) {
      packageManager = 'pnpm';
      console.log('📦 Using pnpm (detected pnpm-lock.yaml)');
    }
  } catch (error) {
    try {
      await fs.access('yarn.lock');
      if (hasYarn) {
        packageManager = 'yarn';
        console.log('📦 Using Yarn (detected yarn.lock)');
      }
    } catch (error) {
      console.log('📦 Using npm (default)');
    }
  }

  // Install server dependencies
  if (!options.skipServer) {
    console.log('\\n📦 Installing WebSocket server dependencies...');
    const serverDir = path.join(process.cwd(), 'server');
    
    try {
      await fs.access(serverDir);
      const installCmd = options.force ? `${packageManager} install --force` : `${packageManager} install`;
      
      if (runCommand(installCmd, serverDir, 'Installing server dependencies')) {
        console.log('✅ Server dependencies installed');
      } else {
        console.log('❌ Failed to install server dependencies');
      }
    } catch (error) {
      console.log('⚠️  Server directory not found, skipping server dependencies');
    }
  }

  // Install main project dependencies
  if (!options.skipMain) {
    console.log('\\n📦 Installing main project dependencies...');
    const installCmd = options.force ? `${packageManager} install --force` : `${packageManager} install`;
    
    if (runCommand(installCmd, process.cwd(), 'Installing main project dependencies')) {
      console.log('✅ Main project dependencies installed');
    } else {
      console.log('❌ Failed to install main project dependencies');
      process.exit(1);
    }
  }

  // Install WebSocket client dependencies (if needed)
  console.log('\\n📦 Checking WebSocket client dependencies...');
  
  try {
    const packageJson = JSON.parse(await fs.readFile('package.json', 'utf8'));
    const missingDeps = [];
    
    // Check for common WebSocket dependencies
    const requiredDeps = ['ws', 'socket.io-client'];
    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
    
    for (const dep of requiredDeps) {
      if (!allDeps[dep]) {
        missingDeps.push(dep);
      }
    }
    
    if (missingDeps.length > 0) {
      console.log('📦 Adding missing WebSocket dependencies...');
      const addCmd = `${packageManager} ${packageManager === 'npm' ? 'install' : 'add'} ${missingDeps.join(' ')}`;
      
      if (runCommand(addCmd, process.cwd(), 'Adding WebSocket dependencies')) {
        console.log('✅ WebSocket dependencies added');
      }
    } else {
      console.log('✅ WebSocket dependencies already present');
    }
  } catch (error) {
    console.log('⚠️  Could not check WebSocket dependencies');
  }

  console.log('\\n🎉 Setup completed successfully!');
  console.log('\\n📋 Next steps:');
  console.log('  1. Run development server: npm run dev');
  console.log('  2. Start WebSocket server: npm run server:dev');
  console.log('  3. Check health: npm run probe');
  console.log('\\n📚 For more information, see README.md');
}

if (require.main === module) {
  setupProject().catch(error => {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  });
}

module.exports = { setupProject };