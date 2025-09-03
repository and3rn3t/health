/**
 * Auth0 Setup Helper for VitalSense Health App
 * Node.js implementation replacing auth0-setup.ps1
 */

import { promises as fs } from 'node:fs';
import { join } from 'node:path';
import readline from 'node:readline';
import axios from 'axios';
import chalk from 'chalk';
import { config } from 'dotenv';

// Load environment variables
config();

class Auth0ConfigManager {
  constructor(options = {}) {
    this.verbose = options.verbose || false;
    this.useSecrets = options.useSecrets || false;
    this.updateConfig = options.updateConfig || false;
    this.test = options.test || false;
    
    this.config = {
      domain: null,
      clientId: null,
      clientSecret: null,
      audience: null,
      scope: 'openid profile email'
    };

    this.configFiles = {
      wrangler: join(process.cwd(), 'wrangler.toml'),
      env: join(process.cwd(), '.env'),
      auth0Config: join(process.cwd(), 'auth0-config.json')
    };
  }

  log(message, color = 'white') {
    console.log(chalk[color](message));
  }

  async promptUser(question, validateFn = null) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve, reject) => {
      rl.question(question, (answer) => {
        rl.close();
        
        if (validateFn && !validateFn(answer)) {
          reject(new Error('Invalid input format'));
        } else {
          resolve(answer.trim());
        }
      });
    });
  }

  validateAuth0Domain(domain) {
    // Accept both .auth0.com and regional domains like .us.auth0.com, .eu.auth0.com, etc.
    return /^[a-zA-Z0-9-]+\.(us\.|eu\.|au\.)?auth0\.com$/.test(domain);
  }

  validateAuth0ClientId(clientId) {
    // Auth0 Client IDs can be various formats - just check it's not empty and has reasonable length
    return clientId && clientId.length >= 10 && clientId.length <= 100;
  }

  async collectAuth0Credentials() {
    this.log('🔐 VitalSense Auth0 Setup Helper', 'cyan');
    this.log('================================', 'cyan');
    this.log('This will help you configure Auth0 credentials for the VitalSense Health App.\n', 'white');

    // Check for existing environment variables
    const existingDomain = process.env.AUTH0_DOMAIN;
    const existingClientId = process.env.AUTH0_CLIENT_ID;
    const existingClientSecret = process.env.AUTH0_CLIENT_SECRET;

    if (existingDomain && existingClientId) {
      this.log('✅ Found existing Auth0 configuration in environment variables:', 'green');
      this.log(`   Domain: ${existingDomain}`, 'cyan');
      this.log(`   Client ID: ${existingClientId}`, 'cyan');
      this.log(`   Client Secret: ${existingClientSecret ? '[SET]' : '[NOT SET]'}`, 'cyan');
      
      const useExisting = await this.promptUser('\n🤔 Use existing configuration? (y/n): ');
      if (useExisting.toLowerCase() === 'y' || useExisting.toLowerCase() === 'yes') {
        this.config.domain = existingDomain;
        this.config.clientId = existingClientId;
        this.config.clientSecret = existingClientSecret;
        return;
      }
    }

    // Collect Auth0 Domain
    this.log('\n📍 Auth0 Domain Configuration', 'blue');
    this.log('Enter your Auth0 domain (e.g., your-tenant.auth0.com)', 'white');
    this.log('Regional domains are supported (e.g., your-tenant.us.auth0.com)', 'gray');
    
    try {
      this.config.domain = await this.promptUser('Auth0 Domain: ', this.validateAuth0Domain);
      this.log(`✅ Valid Auth0 domain: ${this.config.domain}`, 'green');
    } catch (error) {
      throw new Error('Invalid Auth0 domain format. Expected format: your-tenant.auth0.com');
    }

    // Collect Auth0 Client ID
    this.log('\n🆔 Auth0 Client ID Configuration', 'blue');
    this.log('Enter your Auth0 Application Client ID', 'white');
    this.log('This can be found in your Auth0 Dashboard → Applications → [Your App] → Settings', 'gray');
    
    try {
      this.config.clientId = await this.promptUser('Auth0 Client ID: ', this.validateAuth0ClientId);
      this.log(`✅ Valid Auth0 Client ID: ${this.config.clientId}`, 'green');
    } catch (error) {
      throw new Error('Invalid Auth0 Client ID format');
    }

    // Collect Auth0 Client Secret (optional for SPA)
    this.log('\n🔑 Auth0 Client Secret Configuration', 'blue');
    this.log('Enter your Auth0 Application Client Secret (optional for SPAs)', 'white');
    this.log('Leave empty if using a Single Page Application', 'gray');
    
    const clientSecret = await this.promptUser('Auth0 Client Secret (optional): ');
    if (clientSecret) {
      this.config.clientSecret = clientSecret;
      this.log('✅ Client Secret configured', 'green');
    } else {
      this.log('ℹ️ No Client Secret provided (SPA mode)', 'blue');
    }

    // Optional: Audience
    this.log('\n🎯 Auth0 Audience Configuration (Optional)', 'blue');
    this.log('Enter your Auth0 API Audience if using an API', 'white');
    this.log('Leave empty if not using an Auth0 API', 'gray');
    
    const audience = await this.promptUser('Auth0 Audience (optional): ');
    if (audience) {
      this.config.audience = audience;
      this.log('✅ Audience configured', 'green');
    }
  }

  async updateWranglerConfig() {
    this.log('\n📝 Updating Wrangler Configuration', 'blue');
    
    try {
      let wranglerContent = '';
      try {
        wranglerContent = await fs.readFile(this.configFiles.wrangler, 'utf8');
      } catch {
        this.log('⚠️ wrangler.toml not found, creating basic configuration', 'yellow');
        wranglerContent = `name = "vitalsense-health-app"
compatibility_date = "2024-01-01"

[vars]
`;
      }

      // Update or add AUTH0 variables
      const auth0Vars = [
        `AUTH0_DOMAIN = "${this.config.domain}"`,
        `AUTH0_CLIENT_ID = "${this.config.clientId}"`
      ];

      if (this.config.audience) {
        auth0Vars.push(`AUTH0_AUDIENCE = "${this.config.audience}"`);
      }

      // Simple approach: add to [vars] section
      if (wranglerContent.includes('[vars]')) {
        // Replace existing AUTH0 vars or add new ones
        let updatedContent = wranglerContent;
        
        auth0Vars.forEach(varLine => {
          const varName = varLine.split(' = ')[0];
          const regex = new RegExp(`^${varName}\\s*=.*$`, 'm');
          
          if (regex.test(updatedContent)) {
            updatedContent = updatedContent.replace(regex, varLine);
          } else {
            // Add after [vars] section
            updatedContent = updatedContent.replace('[vars]', `[vars]\n${varLine}`);
          }
        });
        
        wranglerContent = updatedContent;
      } else {
        // Add [vars] section
        wranglerContent += `\n[vars]\n${auth0Vars.join('\n')}\n`;
      }

      await fs.writeFile(this.configFiles.wrangler, wranglerContent);
      this.log('✅ wrangler.toml updated successfully', 'green');
      
    } catch (error) {
      this.log(`❌ Failed to update wrangler.toml: ${error.message}`, 'red');
      throw error;
    }
  }
      this.log(`❌ Failed to update wrangler.toml: ${error.message}`, 'red');
      throw error;
    }
  }

  async updateEnvFile() {
    this.log('\n📝 Updating .env File', 'blue');
    
    try {
      let envContent = '';
      try {
        envContent = await fs.readFile(this.configFiles.env, 'utf8');
      } catch {
        this.log('⚠️ .env file not found, creating new one', 'yellow');
      }

      const envVars = [
        `AUTH0_DOMAIN=${this.config.domain}`,
        `AUTH0_CLIENT_ID=${this.config.clientId}`
      ];

      if (this.config.clientSecret) {
        envVars.push(`AUTH0_CLIENT_SECRET=${this.config.clientSecret}`);
      }

      if (this.config.audience) {
        envVars.push(`AUTH0_AUDIENCE=${this.config.audience}`);
      }

      // Update or add environment variables
      let updatedContent = envContent;
      
      envVars.forEach(envVar => {
        const varName = envVar.split('=')[0];
        const regex = new RegExp(`^${varName}=.*$`, 'm');
        
        if (regex.test(updatedContent)) {
          updatedContent = updatedContent.replace(regex, envVar);
        } else {
          updatedContent += `\n${envVar}`;
        }
      });

      await fs.writeFile(this.configFiles.env, updatedContent.trim() + '\n');
      this.log('✅ .env file updated successfully', 'green');
      
    } catch (error) {
      this.log(`❌ Failed to update .env file: ${error.message}`, 'red');
      throw error;
    }
  }

  async saveAuth0Config() {
    this.log('\n💾 Saving Auth0 Configuration', 'blue');
    
    const configData = {
      domain: this.config.domain,
      clientId: this.config.clientId,
      audience: this.config.audience,
      scope: this.config.scope,
      updatedAt: new Date().toISOString(),
      version: '1.0'
    };

    // Don't save client secret to file for security
    if (this.config.clientSecret) {
      configData.hasClientSecret = true;
    }

    try {
      await fs.writeFile(
        this.configFiles.auth0Config, 
        JSON.stringify(configData, null, 2)
      );
      this.log('✅ auth0-config.json saved successfully', 'green');
    } catch (error) {
      this.log(`❌ Failed to save config file: ${error.message}`, 'red');
      throw error;
    }
  }

  async setupWranglerSecrets() {
    if (!this.useSecrets) {
      return;
    }

    this.log('\n🔐 Setting up Wrangler Secrets', 'blue');
    
    if (!this.config.clientSecret) {
      this.log('ℹ️ No client secret to configure', 'blue');
      return;
    }

    try {
      const { execSync } = await import('node:child_process');
      
      // Set client secret as Wrangler secret
      const secretCommand = `echo "${this.config.clientSecret}" | wrangler secret put AUTH0_CLIENT_SECRET`;
      
      if (this.verbose) {
        this.log(`Executing: wrangler secret put AUTH0_CLIENT_SECRET`, 'gray');
      }
      
      execSync('echo "' + this.config.clientSecret + '" | wrangler secret put AUTH0_CLIENT_SECRET', {
        stdio: this.verbose ? 'inherit' : 'pipe'
      });
      
      this.log('✅ Auth0 Client Secret configured in Wrangler', 'green');
      
    } catch (error) {
      this.log(`❌ Failed to set Wrangler secret: ${error.message}`, 'red');
      this.log('You can manually set it later with: wrangler secret put AUTH0_CLIENT_SECRET', 'yellow');
    }
  }

  async testAuth0Connection() {
    this.log('\n🧪 Testing Auth0 Connection', 'blue');
    
    try {
      // Test Auth0 domain accessibility
      const testUrl = `https://${this.config.domain}/.well-known/openid_configuration`;
      
      if (this.verbose) {
        this.log(`Testing: ${testUrl}`, 'gray');
      }
      
      const response = await axios.get(testUrl, { timeout: 10000 });
      
      if (response.status === 200) {
        this.log('✅ Auth0 domain is accessible', 'green');
        this.log(`   Issuer: ${response.data.issuer}`, 'cyan');
        this.log(`   Authorization endpoint: ${response.data.authorization_endpoint}`, 'cyan');
        
        // Test if client ID is valid by checking if it's in the expected format
        if (this.validateAuth0ClientId(this.config.clientId)) {
          this.log('✅ Client ID format is valid', 'green');
        } else {
          this.log('⚠️ Client ID format may be invalid', 'yellow');
        }
        
        return { success: true, data: response.data };
      } else {
        throw new Error(`Unexpected response status: ${response.status}`);
      }
      
    } catch (error) {
      this.log(`❌ Auth0 connection test failed: ${error.message}`, 'red');
      this.log('Please verify your Auth0 domain and network connectivity', 'yellow');
      return { success: false, error: error.message };
    }
  }

  printSummary() {
    this.log('\n📊 Auth0 Setup Summary', 'blue');
    this.log('═'.repeat(40), 'blue');
    this.log(`🌐 Domain: ${this.config.domain}`, 'cyan');
    this.log(`🆔 Client ID: ${this.config.clientId}`, 'cyan');
    this.log(`🔑 Client Secret: ${this.config.clientSecret ? '[CONFIGURED]' : '[NOT SET]'}`, 'cyan');
    this.log(`🎯 Audience: ${this.config.audience || '[NOT SET]'}`, 'cyan');
    this.log(`📋 Scope: ${this.config.scope}`, 'cyan');
    
    this.log('\n📝 Next Steps:', 'yellow');
    this.log('1. Verify your Auth0 Application settings in the Auth0 Dashboard', 'white');
    this.log('2. Add your application URL to Allowed Callback URLs', 'white');
    this.log('3. Add your application URL to Allowed Logout URLs', 'white');
    this.log('4. Test the authentication flow in your application', 'white');
    
    this.log('\n🔗 Useful Links:', 'blue');
    this.log(`   Auth0 Dashboard: https://manage.auth0.com/dashboard/`, 'cyan');
    this.log(`   Your Tenant: https://manage.auth0.com/dashboard/us/${this.config.domain.split('.')[0]}/`, 'cyan');
  }

  async runSetup() {
    try {
      await this.collectAuth0Credentials();
      
      if (this.updateConfig) {
        await this.updateWranglerConfig();
        await this.updateEnvFile();
        await this.saveAuth0Config();
      }
      
      if (this.useSecrets) {
        await this.setupWranglerSecrets();
      }
      
      if (this.test) {
        await this.testAuth0Connection();
      }
      
      this.printSummary();
      
      return { success: true, config: this.config };
      
    } catch (error) {
      this.log(`💥 Auth0 setup failed: ${error.message}`, 'red');
      return { success: false, error: error.message };
    }
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  const options = {
    verbose: args.includes('--verbose') || args.includes('-v'),
    useSecrets: args.includes('--use-secrets'),
    updateConfig: args.includes('--update-config') || args.includes('--config'),
    test: args.includes('--test')
  };

  // Handle direct domain/clientId arguments
  const domainArg = args.find(arg => arg.startsWith('--domain='))?.split('=')[1];
  const clientIdArg = args.find(arg => arg.startsWith('--client-id='))?.split('=')[1];

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔐 VitalSense Auth0 Setup Helper

Usage: node auth0-setup.js [options]

Options:
  --verbose, -v          Verbose output
  --update-config        Update wrangler.toml and .env files
  --use-secrets          Configure secrets in Wrangler
  --test                 Test Auth0 connection
  --domain=<domain>      Set Auth0 domain directly
  --client-id=<id>       Set Auth0 client ID directly
  --help, -h             Show this help

Examples:
  node auth0-setup.js --update-config --test
  node auth0-setup.js --domain=my-tenant.auth0.com --client-id=abc123 --config
  node auth0-setup.js --use-secrets --verbose
    `);
    process.exit(0);
  }

  try {
    const manager = new Auth0ConfigManager(options);
    
    // Set direct arguments if provided
    if (domainArg) manager.config.domain = domainArg;
    if (clientIdArg) manager.config.clientId = clientIdArg;
    
    const result = await manager.runSetup();
    
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

export { Auth0ConfigManager };
