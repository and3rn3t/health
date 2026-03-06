#!/usr/bin/env node

/**
 * Browser-style WebSocket test for production
 * Uses a different WebSocket approach that might work better with Cloudflare
 */

// Use the built-in WebSocket if available (Node 22+) or ws package
let WebSocket;
try {
  // Try Node.js built-in WebSocket (Node 22+)
  WebSocket = globalThis.WebSocket;
  if (!WebSocket) {
    // Fall back to ws package
    WebSocket = (await import('ws')).default;
  }
} catch (e) {
  console.log('⚠️ WebSocket not available:', e.message);
  process.exit(1);
}

const WEBSOCKET_URL =
  'wss://health.andernet.dev/ws?userId=browser-test&deviceId=browser-client';

console.log('🌐 Testing WebSocket with Browser-style Client');
console.log('===============================================');
console.log(`Target: ${WEBSOCKET_URL}\n`);

try {
  const ws = new WebSocket(WEBSOCKET_URL);

  ws.onopen = function () {
    console.log('✅ WebSocket connection opened');
    console.log('   Waiting for welcome message...');
  };

  ws.onmessage = function (event) {
    try {
      const data =
        typeof event.data === 'string' ? event.data : event.data.toString();
      const message = JSON.parse(data);
      console.log(`📩 Message received: ${message.type}`);

      if (message.type === 'connection_established') {
        console.log('✅ Connection fully established!');
        console.log(`   User ID: ${message.userId}`);
        console.log(`   Session ID: ${message.sessionId}`);

        // Send a ping
        console.log('\n🏓 Sending ping...');
        ws.send(
          JSON.stringify({
            type: 'ping',
            timestamp: new Date().toISOString(),
          })
        );
      } else if (message.type === 'pong') {
        console.log('✅ Pong received - WebSocket fully functional!');
        console.log('\n🎉 PRODUCTION WEBSOCKET: SUCCESS!');
        ws.close();
      }
    } catch (e) {
      console.log(`⚠️ Message parse error: ${e.message}`);
    }
  };

  ws.onerror = function (error) {
    console.log(`❌ WebSocket error:`, error);
    console.log(`   Error type: ${error.type || 'unknown'}`);
    console.log(`   Error message: ${error.message || 'no message'}`);
  };

  ws.onclose = function (event) {
    console.log(
      `WebSocket closed: ${event.code} ${event.reason || 'no reason'}`
    );
    if (event.code === 1000) {
      console.log('✅ WebSocket closed normally');
      process.exit(0);
    } else {
      console.log('❌ WebSocket closed with error');
      process.exit(1);
    }
  };

  // Timeout
  setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
      console.log('❌ Connection timeout');
      ws.close();
      process.exit(1);
    }
  }, 15000);
} catch (error) {
  console.log(`❌ Failed to create WebSocket: ${error.message}`);
  process.exit(1);
}
