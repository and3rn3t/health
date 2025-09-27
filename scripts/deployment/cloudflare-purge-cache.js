#!/usr/bin/env node
// Purge Cloudflare cache for the production zone.
// Requires CLOUDFLARE_API_TOKEN and either ZONE_ID or a resolvable zone name.
// Options:
//   --everything               Purge entire cache
//   --urls url1,url2           Purge specific URLs
//   --api-token <token>        Cloudflare API token (or set CLOUDFLARE_API_TOKEN)
//   --zone <zoneId>            Cloudflare Zone ID (or set CLOUDFLARE_ZONE_ID)
//   --zone-name <zoneName>     Cloudflare Zone Name (e.g., andernet.dev)
// If zone ID is missing but zone name is provided (or found in wrangler.toml), the script will resolve the zone ID via Cloudflare API.

import https from 'https';
import fs from 'fs';
import path from 'path';

function getArg(name, def = undefined) {
  const idx = process.argv.indexOf(name);
  if (idx !== -1 && idx + 1 < process.argv.length) return process.argv[idx + 1];
  return def;
}

const apiToken = process.env.CLOUDFLARE_API_TOKEN || getArg('--api-token');
let zoneId = process.env.CLOUDFLARE_ZONE_ID || getArg('--zone');
let zoneName = getArg('--zone-name');
const everything = process.argv.includes('--everything');
const urlsArg = getArg('--urls');
const urls = urlsArg
  ? urlsArg
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)
  : undefined;

function httpRequest({ method, path, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.cloudflare.com',
        path,
        method,
        headers,
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve({ status: res.statusCode, data }));
      }
    );
    req.on('error', (e) => reject(e));
    if (body) req.write(body);
    req.end();
  });
}

function tryReadZoneNameFromWranglerToml() {
  try {
    const wranglerPath = path.resolve(process.cwd(), 'wrangler.toml');
    const content = fs.readFileSync(wranglerPath, 'utf8');
    const match = content.match(/zone_name\s*=\s*"([^"]+)"/);
    if (match && match[1]) return match[1];
  } catch (_) {
    // ignore
  }
  return undefined;
}

async function resolveZoneIdIfNeeded() {
  if (zoneId) return zoneId;

  if (!zoneName) {
    zoneName = tryReadZoneNameFromWranglerToml();
  }

  if (!zoneName) {
    console.error(
      'Missing ZONE_ID and zone name. Provide --zone or --zone-name (or configure zone_name in wrangler.toml).'
    );
    process.exit(1);
  }

  const res = await httpRequest({
    method: 'GET',
    path: `/client/v4/zones?name=${encodeURIComponent(zoneName)}`,
    headers: {
      Authorization: `Bearer ${apiToken}`,
    },
  });

  try {
    const json = JSON.parse(res.data);
    if (json.success && json.result && json.result[0]) {
      zoneId = json.result[0].id;
      console.log(`ℹ Resolved zone id for ${zoneName}: ${zoneId}`);
      return zoneId;
    }
    console.error('❌ Unable to resolve zone id from zone name:', json.errors || json);
    process.exit(1);
  } catch (e) {
    console.error('❌ Failed to parse zone lookup response:', res.data);
    process.exit(1);
  }
}

async function main() {
  if (!apiToken) {
    console.error('Missing CLOUDFLARE_API_TOKEN. Provide via env or --api-token');
    process.exit(1);
  }

  if (!everything && (!urls || urls.length === 0)) {
    console.error('Provide --everything or --urls comma-separated list');
    process.exit(1);
  }

  const resolvedZoneId = await resolveZoneIdIfNeeded();

  const payload = everything ? { purge_everything: true } : { files: urls };
  const data = JSON.stringify(payload);

  const res = await httpRequest({
    method: 'POST',
    path: `/client/v4/zones/${resolvedZoneId}/purge_cache`,
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data),
      Authorization: `Bearer ${apiToken}`,
    },
    body: data,
  });

  try {
    const parsed = JSON.parse(res.data);
    if (parsed.success) {
      console.log('✅ Cache purge request succeeded');
      process.exit(0);
    }
    console.error('❌ Cache purge failed:', parsed.errors || res.data);
    process.exit(1);
  } catch (e) {
    console.error('❌ Failed to parse response:', res.data);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error('❌ Unexpected error:', e.message);
  process.exit(1);
});
