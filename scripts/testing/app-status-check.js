#!/usr/bin/env node
// Cross-platform VitalSense app status check (Node.js)
// Usage:
//   node scripts/node/health/app-status-check.js --url http://localhost:5000
//   npm run app:status:5000
//   npm run app:status:8789

import http from 'node:http';
import https from 'node:https';
import { URL } from 'node:url';

function parseArgs() {
  const args = process.argv.slice(2);
  const out = { url: 'http://localhost:5000', timeout: 8000 };
  for (let i = 0; i < args.length; i += 1) {
    const a = args[i];
    if (a === '--url' && args[i + 1]) out.url = args[i + 1];
    if (a === '--timeout' && args[i + 1]) out.timeout = parseInt(args[i + 1], 10);
  }
  return out;
}

function fetchRaw(u, timeoutMs) {
  return new Promise((resolve, reject) => {
    const url = new URL(u);
    const lib = url.protocol === 'https:' ? https : http;
    const req = lib.request(
      {
        method: 'GET',
        hostname: url.hostname,
        port: url.port || (url.protocol === 'https:' ? 443 : 80),
        path: url.pathname + url.search,
        timeout: timeoutMs,
        headers: {
          'user-agent': 'vitalsense-app-status-check/1.0',
          'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        }
      },
      (res) => {
        const chunks = [];
        res.on('data', (c) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(String(c))));
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') });
        });
      }
    );
    req.on('timeout', () => {
      req.destroy(new Error('Request timeout'));
    });
    req.on('error', reject);
    req.end();
  });
}

function contains(str, needle) {
  return typeof str === 'string' && str.toLowerCase().includes(needle.toLowerCase());
}

(async () => {
  const { url, timeout } = parseArgs();
  const start = Date.now();
  try {
    const res = await fetchRaw(url, timeout);
    const ms = Date.now() - start;
    const hasBrand = contains(res.body, 'VitalSense');
    const hasHealthScore = contains(res.body, 'Health Score');

    const summary = {
      url,
      status: res.status,
      ms,
      bytes: (res.body || '').length,
      brandDetected: hasBrand,
      healthScoreDetected: hasHealthScore
    };

    const ok = res.status >= 200 && res.status < 400;

    // Pretty, concise output for terminals
    const icon = ok ? '✅' : '❌';
    const brand = hasBrand ? '🎯 VitalSense branding detected' : '⚠️ VitalSense branding not found';
    const score = hasHealthScore ? '💓 Health Score detected' : '⚠️ Health Score not found';

    console.log(`${icon} ${url} → ${res.status} in ${ms}ms, ${summary.bytes} bytes`);
    console.log(brand);
    console.log(score);

    // Structured output for automation
    if (process.env.CI || process.env.JSON) {
      console.log(JSON.stringify(summary));
    }

    process.exit(ok ? 0 : 2);
  } catch (err) {
    const ms = Date.now() - start;
    console.error(`❌ ${url} → Error after ${ms}ms:`, err?.message || String(err));
    process.exit(1);
  }
})();
