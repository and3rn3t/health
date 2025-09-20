#!/usr/bin/env node
/**
 * secret-rotation-check.mjs
 * Ensures sensitive secrets have been rotated within max age window.
 * Looks for .secrets/rotation.json structure:
 * [{ "name": "DEVICE_JWT_SECRET", "lastRotated": "2025-09-18T00:00:00.000Z" }]
 */
import fs from 'node:fs';
import process from 'node:process';
import https from 'node:https';

const args = Object.fromEntries(process.argv.slice(2).map(a=>{const [k,v='']=a.replace(/^--/,'').split('='); return [k,v]; }));
const maxAgeDays = parseInt(args['max-age-days'] || '90',10);
const warnAgeDays = parseInt(args['warn-age-days'] || '80',10);
const createIssues = 'create-issues' in args; // attempt auto GH issue
const repoSlug = process.env.GITHUB_REPOSITORY || args.repo; // owner/repo
const ghToken = process.env.GITHUB_TOKEN;
const failSoft = 'fail-soft' in args;
const file = args.file || '.secrets/rotation.json';

if(!fs.existsSync(file)){
  const msg = `rotation metadata file not found: ${file}`;
  if(failSoft){ console.warn('⚠️ '+msg); process.exit(0);} else { console.error('❌ '+msg); process.exit(2);} }

let data;
try { data = JSON.parse(fs.readFileSync(file,'utf-8')); } catch(e){ console.error('❌ failed to parse rotation file:', e.message); process.exit(2);} 
if(!Array.isArray(data)){ console.error('❌ rotation file must be an array'); process.exit(2);} 

const now = Date.now();
const MS_PER_DAY = 86400000;
let fail = false;
const nearExpiry = [];
for(const entry of data){
  const { name, lastRotated } = entry || {};
  if(!name || !lastRotated){ console.warn('⚠️ malformed entry', entry); continue; }
  const ts = Date.parse(lastRotated);
  if(Number.isNaN(ts)){ console.warn('⚠️ invalid date for', name); continue; }
  const ageDays = (now - ts)/MS_PER_DAY;
  const ageStr = ageDays.toFixed(1);
  if(ageDays > maxAgeDays){
    console.error(`❌ ${name} age ${ageStr}d exceeds ${maxAgeDays}d`);
    fail = true;
  } else if(ageDays >= warnAgeDays){
    console.warn(`⚠️  ${name} age ${ageStr}d approaching max (${maxAgeDays}d)`);
    nearExpiry.push({ name, ageDays: Number(ageStr) });
  } else {
    console.log(`✅ ${name} age ${ageStr}d (<= ${maxAgeDays}d)`);
  }
}

function createIssue(title, body){
  if(!repoSlug || !ghToken){
    console.log('ℹ️ Skipping issue creation (missing repo or token)');
    return;
  }
  const [owner, repo] = repoSlug.split('/');
  const data = JSON.stringify({ title, body });
  const opts = {
    hostname: 'api.github.com',
    path: `/repos/${owner}/${repo}/issues`,
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ghToken}`,
      'User-Agent': 'secret-rotation-check',
      'Accept': 'application/vnd.github+json',
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  };
  const req = https.request(opts, res => {
    if(res.statusCode && res.statusCode >= 400){
      console.warn('⚠️ Issue creation failed with status', res.statusCode);
    } else {
      console.log('📝 Created/attempted to create GitHub issue for secret rotation');
    }
  });
  req.on('error', e => console.warn('⚠️ Issue creation error', e.message));
  req.write(data); req.end();
}

if(createIssues && (fail || nearExpiry.length)){
  const title = fail ? 'Secret rotation violation detected' : 'Secret(s) nearing rotation threshold';
  const lines = [];
  if(fail) lines.push('One or more secrets exceed maximum age.');
  if(nearExpiry.length){
    lines.push('Secrets nearing expiry:');
    for(const s of nearExpiry){ lines.push(`- ${s.name}: ${s.ageDays}d old`); }
  }
  createIssue(title, lines.join('\n'));
}

if(fail){
  if(failSoft){ console.warn('⚠️ rotation check failed (soft)'); process.exit(0); }
  process.exit(1);
} else {
  console.log('✅ Secret rotation policy satisfied');
}
