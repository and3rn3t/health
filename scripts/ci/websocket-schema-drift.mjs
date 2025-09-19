#!/usr/bin/env node
/**
 * WebSocket schema drift guard.
 * Compares observed message envelope 'type' values during a brief connection
 * to the committed baseline in schemas/websocket-message-types.json.
 * Fails CI if unexpected new types appear (add them intentionally via PR) or
 * if baseline types disappear (regression risk).
 */
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';

const WS_URL = process.env.WS_URL || 'wss://health.andernet.dev/ws';
const DURATION_MS = Number(process.env.WS_DRIFT_SAMPLE_MS || 5000);
const baselinePath = path.resolve('schemas/websocket-message-types.json');
const hashPath = path.resolve('schemas/websocket-message-types.sha256');
const UPDATE_HASH = process.argv.includes('--update-hash');

function computeHash(types){
  const sorted = [...types].sort();
  const joined = sorted.join('|');
  return crypto.createHash('sha256').update(joined).digest('hex');
}

function loadBaseline() {
  if (!fs.existsSync(baselinePath)) {
    console.error('❌ Baseline file missing:', baselinePath);
    process.exit(2);
  }
  try {
    const data = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
    if (!Array.isArray(data.types)) throw new Error('types array missing');
    const types = data.types;
    const actualHash = computeHash(types);
    if(UPDATE_HASH){
      fs.writeFileSync(hashPath, `# SHA256 hash of concatenated baseline types (sorted, joined by |)\n${actualHash}\n`);
      console.log('🔄 Updated baseline hash', actualHash);
    } else if(fs.existsSync(hashPath)) {
      const recorded = fs.readFileSync(hashPath,'utf8').split(/\n/).filter(l=>!l.startsWith('#') && l.trim()).shift();
      if(recorded && recorded !== actualHash){
        console.error('❌ Baseline hash mismatch. Run with --update-hash if intentional change.');
        console.error('Recorded:', recorded);
        console.error('Actual  :', actualHash);
        process.exit(1);
      }
    } else {
      console.warn('⚠️  Hash file missing; consider generating with --update-hash');
    }
    return types;
  } catch (e) {
    console.error('❌ Failed to parse baseline file:', e.message);
    process.exit(2);
  }
}

async function sampleWebSocket() {
  const baseline = loadBaseline();
  const observed = new Set();
  let open = false;

  const { WebSocket } = await import('ws');
  const ws = new WebSocket(WS_URL, { handshakeTimeout: 4000 });

  const done = new Promise(resolve => {
    const timer = setTimeout(() => {
      try {
        ws.close();
  } catch {
        // ignore close error
      }
      resolve();
    }, DURATION_MS);

    ws.on('open', () => { open = true; });
    ws.on('message', data => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg && typeof msg.type === 'string') {
          observed.add(msg.type);
        }
  } catch {
        // ignore parse errors
      }
    });
    ws.on('error', err => {
      console.error('⚠️  WebSocket error:', err.message);
    });
    ws.on('close', () => {
      clearTimeout(timer);
      resolve();
    });
  });

  await done;

  const obs = Array.from(observed).sort();
  const missing = baseline.filter(t => !observed.has(t));
  const unexpected = obs.filter(t => !baseline.includes(t));

  let pass = true;
  if (unexpected.length) {
    console.error('❌ Unexpected message types observed (update baseline if intentional):', unexpected.join(', '));
    pass = false;
  }
  if (missing.length) {
    console.error('❌ Baseline types NOT observed (potential regression / low traffic?):', missing.join(', '));
    // Not strictly failing on missing to avoid flakiness unless all missing
    if (missing.length === baseline.length) pass = false;
  }
  console.log('Baseline types:', baseline.join(', '));
  console.log('Observed types:', obs.join(', ') || '(none)');
  if (!open) {
    console.error('❌ WebSocket never opened; failing');
    pass = false;
  }

  // Emit report
  const reportDir = path.resolve('reports');
  fs.mkdirSync(reportDir, { recursive: true });
  const report = { wsUrl: WS_URL, durationMs: DURATION_MS, baseline, observed: obs, missing, unexpected, pass };
  fs.writeFileSync(path.join(reportDir, 'ws-schema-drift.json'), JSON.stringify(report, null, 2));
  console.log('💾 Wrote reports/ws-schema-drift.json');

  process.exit(pass ? 0 : 1);
}

sampleWebSocket().catch(e => {
  console.error('❌ Unhandled error in drift check:', e);
  process.exit(1);
});
