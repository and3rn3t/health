#!/usr/bin/env node
// Purge Cloudflare cache for the production zone. Requires CLOUDFLARE_API_TOKEN and ZONE_ID.
// Optionally accepts --everything or a list of URLs via --urls url1,url2

import https from 'https';

function getArg(name, def = undefined) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return def;
}

const apiToken = process.env.CLOUDFLARE_API_TOKEN || getArg('--api-token');
const zoneId = process.env.CLOUDFLARE_ZONE_ID || getArg('--zone');
const everything = process.argv.includes('--everything');
const urlsArg = getArg('--urls');
const urls = urlsArg ? urlsArg.split(',').map((u) => u.trim()).filter(Boolean) : undefined;

if (!apiToken || !zoneId) {
  console.error('Missing CLOUDFLARE_API_TOKEN or ZONE_ID. Provide via env or --api-token/--zone');
  process.exit(1);
}

const payload = everything ? { purge_everything: true } : { files: urls };

if (!everything && (!urls || urls.length === 0)) {
  console.error('Provide --everything or --urls comma-separated list');
  process.exit(1);
}

const data = JSON.stringify(payload);

const options = {
  hostname: 'api.cloudflare.com',
  path: `/client/v4/zones/${zoneId}/purge_cache`,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(data),
    Authorization: `Bearer ${apiToken}`,
  },
};

const req = https.request(options, (res) => {
  let body = '';
  res.on('data', (chunk) => (body += chunk));
  res.on('end', () => {
    try {
      const parsed = JSON.parse(body);
      if (parsed.success) {
        console.log('✅ Cache purge request succeeded');
      } else {
        console.error('❌ Cache purge failed:', parsed.errors || body);
        process.exit(1);
      }
    } catch (e) {
      console.error('❌ Failed to parse response:', body);
      process.exit(1);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Request error:', e.message);
  process.exit(1);
});

req.write(data);
req.end();
