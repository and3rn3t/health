#!/usr/bin/env node

/**
 * WebSocket debug test that doesn't use console
 */

import fs from 'fs';
import WebSocket from 'ws';

const logFile = 'websocket-debug.log';

function log(message) {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] ${message}\n`;
  fs.appendFileSync(logFile, logEntry);
  console.log(message);
}

// Clear log file
fs.writeFileSync(logFile, '');

log('🧪 WebSocket Debug Test Starting');
log('=================================');

const ws = new WebSocket('ws://localhost:3001/ws');

let testPhase = 'connecting';
let messageCount = 0;

ws.on('open', () => {
  log('✅ WebSocket connection opened');
  testPhase = 'connected';

  setTimeout(() => {
    log('📤 Sending client identification');
    testPhase = 'identifying';

    ws.send(
      JSON.stringify({
        type: 'client_identification',
        userId: 'debug-test-user',
        clientType: 'debug_client',
        deviceInfo: {
          type: 'debug_device',
          version: '1.0.0',
        },
      })
    );
  }, 100);
});

ws.on('message', (data) => {
  messageCount++;
  try {
    const message = JSON.parse(data.toString());
    log(`📥 Message ${messageCount}: ${message.type}`);

    if (message.type === 'connection_established') {
      log('✅ Connection established confirmed');
    } else if (message.type === 'identification_confirmed') {
      log('✅ Identification confirmed - SUCCESS!');
      testPhase = 'complete';
      setTimeout(() => ws.close(), 100);
    } else {
      log(`📥 Other message: ${JSON.stringify(message)}`);
    }
  } catch (error) {
    log(`📥 Raw message: ${data.toString()}`);
  }
});

ws.on('error', (error) => {
  log(`❌ WebSocket error: ${error.message}`);
});

ws.on('close', (code, reason) => {
  log(`🔌 WebSocket closed: ${code} ${reason}`);

  if (testPhase === 'complete') {
    log('✅ Test completed successfully');
    process.exit(0);
  } else {
    log(
      `❌ Test failed in phase: ${testPhase}, received ${messageCount} messages`
    );
    process.exit(1);
  }
});

// Timeout after 10 seconds
setTimeout(() => {
  log(
    `⏰ Test timeout in phase: ${testPhase}, received ${messageCount} messages`
  );
  ws.close();
}, 10000);
