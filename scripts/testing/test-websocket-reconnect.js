#!/usr/bin/env node
/**
 * VitalSense WebSocket Resilience Test
 * 1. Connect
 * 2. Close & reconnect (simulate client auto-reconnect)
 * 3. Send ping after reconnect
 * 4. Report optional live_health_update count
 * Exits non-zero on failure.
 */
import { WebSocket } from 'ws';
import { setTimeout as sleep } from 'node:timers/promises';
import crypto from 'node:crypto';

const args = Object.fromEntries(process.argv.slice(2).map(a=>{const [k,v='']=a.replace(/^--/,'').split('=');return [k,v];}));
const backend = args.backendUrl || args.backend || process.env.BACKEND_URL || 'wss://health.andernet.dev/ws';
const token = args.token || process.env.TEST_TOKEN || 'test-ios-app-token';
const maxReconnectMs = parseInt(args.maxReconnectMs || '6000',10);

let initialOpen = 0; let reconnectOpen = 0; let reconnect = false; let liveUpdates=0; let closes=0; let lastClose=0;

function makeUrl(){ const u=new URL(backend); u.searchParams.set('token',token); u.searchParams.set('r',crypto.randomBytes(4).toString('hex')); return u.toString(); }

async function connect(label){
  return new Promise((res,rej)=>{
    const ws=new WebSocket(makeUrl()); let opened=false;
    ws.on('open',()=>{opened=true;res(ws);});
    ws.on('message',raw=>{ try{ const m=JSON.parse(raw.toString()); if(m?.type==='live_health_update') liveUpdates++; }catch{}});
    ws.on('close',c=>{ lastClose=c; closes++; if(!opened) rej(new Error(label+' closed before open ('+c+')')); });
    ws.on('error',e=>rej(new Error(label+' error '+e.message)));
  });
}

async function main(){
  console.log('🧪 VitalSense WebSocket Resilience Test');
  console.log('Backend:', backend);
  let ws;
  try { ws = await connect('initial'); initialOpen=Date.now(); console.log('✅ Initial connection'); } catch(e){ console.error('❌',e.message); process.exit(1); }
  try { ws.close(); } catch{}
  await sleep(250);
  try { ws = await connect('reconnect'); reconnectOpen=Date.now(); reconnect=true; console.log('✅ Reconnect connection'); } catch(e){ console.error('❌ Reconnect failed', e.message); process.exit(1); }
  const delta = reconnectOpen - initialOpen; if(delta>maxReconnectMs){ console.error(`❌ Reconnect time ${delta}ms > ${maxReconnectMs}ms`); process.exit(1);} else { console.log(`⏱️ Reconnect time ${delta}ms (limit ${maxReconnectMs}ms)`);} 
  try { ws.send(JSON.stringify({ type:'ping', timestamp:new Date().toISOString() })); } catch(e){ console.error('❌ Ping send failed', e.message); process.exit(1); }
  await sleep(1000);
  if(lastClose && closes>1) console.warn('⚠️ Additional close observed code='+lastClose);
  console.log('ℹ️ live_health_update messages:', liveUpdates);
  if(!reconnect){ console.error('❌ Reconnect not exercised'); process.exit(1);} 
  try { ws.close(); } catch{}
  console.log('✅ Resilience test complete');
}

main().catch(e=>{ console.error('❌ Unexpected error', e); process.exit(1); });
