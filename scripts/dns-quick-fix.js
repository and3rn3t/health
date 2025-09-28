#!/usr/bin/env node

/**
 * Quick DNS Fix for VitalSense Advanced
 * Adds the missing vitalsense-advanced.andernet.dev DNS record
 */

import axios from 'axios';

const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.argv[2];
const ZONE_NAME = 'andernet.dev';

if (!CLOUDFLARE_API_TOKEN) {
  console.error('❌ Error: CLOUDFLARE_API_TOKEN required');
  console.log('Usage: node dns-quick-fix.js <api-token>');
  process.exit(1);
}

const cloudflareConfig = {
  baseUrl: 'https://api.cloudflare.com/client/v4',
  headers: {
    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/json',
  },
};

async function getZoneId() {
  console.log(`🔍 Finding Zone ID for ${ZONE_NAME}...`);
  
  try {
    const response = await axios.get(
      `${cloudflareConfig.baseUrl}/zones?name=${ZONE_NAME}`,
      { headers: cloudflareConfig.headers }
    );

    if (response.data.result.length === 0) {
      throw new Error(`Zone ${ZONE_NAME} not found`);
    }

    const zoneId = response.data.result[0].id;
    console.log(`✅ Zone ID found: ${zoneId}`);
    return zoneId;
    
  } catch (error) {
    console.error('❌ Error finding zone:', error.response?.data || error.message);
    throw error;
  }
}

async function checkExistingRecord(zoneId, subdomain) {
  console.log(`🔍 Checking if ${subdomain}.${ZONE_NAME} already exists...`);
  
  try {
    const response = await axios.get(
      `${cloudflareConfig.baseUrl}/zones/${zoneId}/dns_records?name=${subdomain}.${ZONE_NAME}`,
      { headers: cloudflareConfig.headers }
    );

    return response.data.result.length > 0 ? response.data.result[0] : null;
    
  } catch (error) {
    console.error('❌ Error checking existing record:', error.response?.data || error.message);
    return null;
  }
}

async function createDnsRecord(zoneId, subdomain, target) {
  console.log(`🚀 Creating DNS record: ${subdomain}.${ZONE_NAME} → ${target}`);
  
  try {
    const response = await axios.post(
      `${cloudflareConfig.baseUrl}/zones/${zoneId}/dns_records`,
      {
        type: 'CNAME',
        name: subdomain,
        content: target,
        ttl: 300, // 5 minutes
        proxied: true, // Enable Cloudflare proxy
      },
      { headers: cloudflareConfig.headers }
    );

    if (response.data.success) {
      console.log(`✅ DNS record created successfully!`);
      console.log(`   Name: ${response.data.result.name}`);
      console.log(`   Content: ${response.data.result.content}`);
      console.log(`   Proxied: ${response.data.result.proxied}`);
      return response.data.result;
    } else {
      throw new Error(`Failed to create DNS record: ${JSON.stringify(response.data.errors)}`);
    }
    
  } catch (error) {
    console.error('❌ Error creating DNS record:', error.response?.data || error.message);
    throw error;
  }
}

async function updateDnsRecord(zoneId, recordId, subdomain, target) {
  console.log(`🔄 Updating DNS record: ${subdomain}.${ZONE_NAME} → ${target}`);
  
  try {
    const response = await axios.put(
      `${cloudflareConfig.baseUrl}/zones/${zoneId}/dns_records/${recordId}`,
      {
        type: 'CNAME',
        name: subdomain,
        content: target,
        ttl: 300,
        proxied: true,
      },
      { headers: cloudflareConfig.headers }
    );

    if (response.data.success) {
      console.log(`✅ DNS record updated successfully!`);
      return response.data.result;
    } else {
      throw new Error(`Failed to update DNS record: ${JSON.stringify(response.data.errors)}`);
    }
    
  } catch (error) {
    console.error('❌ Error updating DNS record:', error.response?.data || error.message);
    throw error;
  }
}

async function main() {
  console.log('🚀 VitalSense Advanced DNS Quick Fix');
  console.log('=====================================');
  
  try {
    // Step 1: Get Zone ID
    const zoneId = await getZoneId();
    
    // Step 2: Check if vitalsense-advanced record exists
    const existingRecord = await checkExistingRecord(zoneId, 'vitalsense-advanced');
    
    const target = 'vitalsense-websocket-advanced-prod.andernet.workers.dev';
    
    // Step 3: Create or update the DNS record
    if (existingRecord) {
      console.log(`📝 Record exists, updating target to: ${target}`);
      await updateDnsRecord(zoneId, existingRecord.id, 'vitalsense-advanced', target);
    } else {
      console.log(`📝 Record doesn't exist, creating new record`);
      await createDnsRecord(zoneId, 'vitalsense-advanced', target);
    }
    
    console.log('\n🎉 DNS Quick Fix Complete!');
    console.log('==========================');
    console.log(`✅ vitalsense-advanced.andernet.dev → ${target}`);
    console.log('⏳ DNS propagation may take a few minutes');
    console.log('\n🧪 Test the fix:');
    console.log('nslookup vitalsense-advanced.andernet.dev');
    console.log('curl -I https://vitalsense-advanced.andernet.dev');
    
  } catch (error) {
    console.error('\n❌ DNS Quick Fix Failed!');
    console.error('========================');
    console.error(error.message);
    process.exit(1);
  }
}

main();