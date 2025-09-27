#!/usr/bin/env node
/**
 * Debug script to test device auth endpoint like CI does
 * Node.js version of debug-device-auth.ps1
 */

const { program } = require('commander');
const axios = require('axios');

program
  .name('debug-device-auth')
  .description('Test device auth endpoint')
  .option('-u, --base-url <url>', 'Base URL for the API', 'http://127.0.0.1:8787')
  .option('-v, --verbose', 'Verbose output')
  .parse();

const options = program.opts();

async function testDeviceAuth() {
  console.log(`🔍 Testing device auth endpoint at ${options.baseUrl}`);
  
  const requestBody = {
    userId: 'ci-user',
    clientType: 'ios_app',
    ttlSec: 600
  };

  console.log('📋 Request body:');
  console.log(JSON.stringify(requestBody, null, 2));

  try {
    console.log('\n📤 Sending POST request...');
    
    const response = await axios.post(
      `${options.baseUrl}/api/device/auth`,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    console.log('✅ Success!');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (options.verbose) {
      console.log('\n📊 Response Details:');
      console.log(`Status: ${response.status}`);
      console.log(`Headers:`, response.headers);
    }
    
  } catch (error) {
    console.log('❌ Error!');
    
    if (error.response) {
      console.log(`Status: ${error.response.status}`);
      console.log(`Message: ${error.message}`);
      console.log('Response body:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.log('No response received:', error.message);
    } else {
      console.log('Request setup error:', error.message);
    }
    
    process.exit(1);
  }
}

if (require.main === module) {
  testDeviceAuth().catch(console.error);
}

module.exports = { testDeviceAuth };