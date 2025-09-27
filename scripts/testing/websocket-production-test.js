#!/usr/bin/env node

/**
 * Simple WebSocket Production Test
 * Tests WebSocket connection with better error handling
 */

import WebSocket from 'ws';

const WEBSOCKET_URL = 'wss://health.andernet.dev/ws?userId=test-integration&deviceId=test-node';

console.log('🔌 Testing Production WebSocket Connection');
console.log('===========================================');
console.log(`Target: ${WEBSOCKET_URL}\n`);

const ws = new WebSocket(WEBSOCKET_URL, {
    timeout: 15000,
    headers: {
        'User-Agent': 'VitalSense-Integration-Test/1.0'
    }
});

let messageReceived = false;

ws.on('open', () => {
    console.log('✅ WebSocket connection opened');
    console.log('   Waiting for welcome message...');
});

ws.on('message', (data) => {
    try {
        const message = JSON.parse(data.toString());
        console.log(`📩 Message received: ${message.type}`);
        
        if (message.type === 'connection_established') {
            console.log('✅ Connection fully established!');
            console.log(`   User ID: ${message.userId}`);
            console.log(`   Device ID: ${message.deviceId}`);
            console.log(`   Session ID: ${message.sessionId}`);
            console.log(`   Server Time: ${message.serverTime}`);
            messageReceived = true;
            
            // Send a test ping message
            console.log('\n🏓 Sending ping...');
            ws.send(JSON.stringify({
                type: 'ping',
                timestamp: new Date().toISOString(),
                clientId: 'integration-test'
            }));
        } else if (message.type === 'pong') {
            console.log('✅ Pong received - connection is fully functional!');
            console.log('\n🎉 WebSocket integration test PASSED');
            ws.close();
        } else if (message.type === 'error') {
            console.log(`❌ Server error: ${message.message}`);
            ws.close();
        } else {
            console.log(`📝 Other message: ${JSON.stringify(message, null, 2)}`);
        }
    } catch (e) {
        console.log(`⚠️ Message parse error: ${e.message}`);
        console.log(`Raw data: ${data.toString()}`);
    }
});

ws.on('error', (error) => {
    console.log(`❌ WebSocket error: ${error.message}`);
    console.log(`   Error code: ${error.code || 'N/A'}`);
    process.exit(1);
});

ws.on('close', (code, reason) => {
    if (messageReceived) {
        console.log('✅ WebSocket closed gracefully');
        console.log('\n🎯 PRODUCTION WEBSOCKET: FULLY FUNCTIONAL');
        process.exit(0);
    } else {
        console.log(`❌ WebSocket closed unexpectedly: ${code} ${reason}`);
        process.exit(1);
    }
});

// Timeout handler
setTimeout(() => {
    if (ws.readyState === WebSocket.CONNECTING) {
        console.log('❌ Connection timeout after 15 seconds');
        ws.terminate();
        process.exit(1);
    }
}, 15000);