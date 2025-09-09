#!/usr/bin/env node

const WebSocket = require('ws');

const server = new WebSocket.Server({
  port: 3001,
  host: '0.0.0.0',
});

console.log('🚀 VitalSense WebSocket Server starting on ws://localhost:3001');

// Store connected clients
const clients = new Map();

// Simulate live health data
const generateHealthData = () => {
  const metrics = [
    {
      type: 'heart_rate',
      value: 65 + Math.random() * 40, // 65-105 bpm
      unit: 'bpm',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'steps',
      value: Math.floor(Math.random() * 100), // 0-100 steps per update
      unit: 'steps',
      timestamp: new Date().toISOString(),
    },
    {
      type: 'walking_steadiness',
      value: 40 + Math.random() * 50, // 40-90%
      unit: 'percent',
      timestamp: new Date().toISOString(),
    },
  ];

  return {
    type: 'live_health_update',
    data: {
      metrics: metrics.slice(0, Math.ceil(Math.random() * 3)), // Send 1-3 metrics
      deviceId: `device-${Math.floor(Math.random() * 3) + 1}`,
      userId: 'demo-user',
    },
    timestamp: new Date().toISOString(),
  };
};

// Broadcast health data to all connected clients
const broadcastHealthData = () => {
  if (clients.size === 0) return;

  const healthData = generateHealthData();
  const message = JSON.stringify(healthData);

  clients.forEach((clientInfo, ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.send(message);
        console.log(
          `📤 Sent health data to client ${clientInfo.id}: ${healthData.data.metrics.length} metrics`
        );
      } catch (error) {
        console.error(
          `❌ Failed to send to client ${clientInfo.id}:`,
          error.message
        );
      }
    }
  });
};

// Start broadcasting health data every 2-5 seconds
let broadcastInterval;
const startBroadcasting = () => {
  if (broadcastInterval) return;

  const scheduleNext = () => {
    const delay = 2000 + Math.random() * 3000; // 2-5 seconds
    broadcastInterval = setTimeout(() => {
      broadcastHealthData();
      scheduleNext();
    }, delay);
  };

  scheduleNext();
  console.log('📡 Started broadcasting health data');
};

const stopBroadcasting = () => {
  if (broadcastInterval) {
    clearTimeout(broadcastInterval);
    broadcastInterval = null;
    console.log('⏹️  Stopped broadcasting health data');
  }
};

// Handle new connections
server.on('connection', (ws, request) => {
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
  const clientIP = request.socket.remoteAddress;

  console.log(`✅ New client connected: ${clientId} from ${clientIP}`);

  // Store client info
  clients.set(ws, {
    id: clientId,
    connectedAt: new Date(),
    messageCount: 0,
  });

  // Send welcome message
  const welcomeMessage = {
    type: 'connection_established',
    data: {
      clientId,
      message: 'Connected to VitalSense WebSocket server',
      serverTime: new Date().toISOString(),
    },
    timestamp: new Date().toISOString(),
  };

  try {
    ws.send(JSON.stringify(welcomeMessage));
    console.log(`📤 Sent welcome message to ${clientId}`);
  } catch (error) {
    console.error(
      `❌ Failed to send welcome message to ${clientId}:`,
      error.message
    );
  }

  // Start broadcasting if this is the first client
  if (clients.size === 1) {
    startBroadcasting();
  }

  // Handle incoming messages
  ws.on('message', (data) => {
    const clientInfo = clients.get(ws);
    if (!clientInfo) return;

    try {
      const message = JSON.parse(data.toString());
      clientInfo.messageCount++;

      console.log(`📥 Message from ${clientInfo.id}:`, message.type);

      // Handle different message types
      switch (message.type) {
        case 'ping':
          // Respond with pong
          ws.send(
            JSON.stringify({
              type: 'pong',
              data: {
                timestamp: new Date().toISOString(),
                receivedAt: message.timestamp,
              },
              timestamp: new Date().toISOString(),
            })
          );
          console.log(`🏓 Sent pong to ${clientInfo.id}`);
          break;

        case 'client_identification':
          console.log(
            `🆔 Client ${clientInfo.id} identified as:`,
            message.data
          );
          // Update client info
          clientInfo.clientType = message.data?.clientType;
          clientInfo.userId = message.data?.userId;
          break;

        case 'subscribe_health_updates':
          console.log(
            `📋 Client ${clientInfo.id} subscribed to health updates:`,
            message.data
          );
          // Send immediate health data sample
          setTimeout(() => {
            const sampleData = generateHealthData();
            ws.send(JSON.stringify(sampleData));
            console.log(`📤 Sent sample health data to ${clientInfo.id}`);
          }, 1000);
          break;

        default:
          console.log(
            `❓ Unknown message type from ${clientInfo.id}:`,
            message.type
          );
      }
    } catch (error) {
      console.error(
        `❌ Error parsing message from ${clientInfo.id}:`,
        error.message
      );

      // Send error response
      try {
        ws.send(
          JSON.stringify({
            type: 'error',
            data: {
              message: 'Invalid message format',
              receivedAt: new Date().toISOString(),
            },
            timestamp: new Date().toISOString(),
          })
        );
      } catch (sendError) {
        console.error(
          `❌ Failed to send error response to ${clientInfo.id}:`,
          sendError.message
        );
      }
    }
  });

  // Handle client disconnect
  ws.on('close', (code, reason) => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      const uptime = Date.now() - clientInfo.connectedAt.getTime();
      console.log(
        `🔌 Client ${clientInfo.id} disconnected after ${Math.round(uptime / 1000)}s (${clientInfo.messageCount} messages)`
      );
      console.log(`   Code: ${code}, Reason: ${reason || 'None'}`);
      clients.delete(ws);
    }

    // Stop broadcasting if no clients left
    if (clients.size === 0) {
      stopBroadcasting();
    }
  });

  // Handle errors
  ws.on('error', (error) => {
    const clientInfo = clients.get(ws);
    const clientId = clientInfo?.id || 'unknown';
    console.error(`❌ WebSocket error for client ${clientId}:`, error.message);
  });

  // Setup ping/pong heartbeat
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      try {
        ws.ping();
      } catch (error) {
        console.error(
          `❌ Failed to ping client ${clientInfo.id}:`,
          error.message
        );
        clearInterval(heartbeatInterval);
      }
    } else {
      clearInterval(heartbeatInterval);
    }
  }, 30000); // Every 30 seconds

  ws.on('pong', () => {
    const clientInfo = clients.get(ws);
    if (clientInfo) {
      console.log(`💓 Heartbeat from ${clientInfo.id}`);
    }
  });
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down VitalSense WebSocket server...');

  stopBroadcasting();

  // Close all client connections
  clients.forEach((clientInfo, ws) => {
    try {
      ws.close(1000, 'Server shutting down');
    } catch (error) {
      console.error(`❌ Error closing client ${clientInfo.id}:`, error.message);
    }
  });

  // Close server
  server.close(() => {
    console.log('✅ VitalSense WebSocket server closed');
    process.exit(0);
  });
});

// Simulate some emergency alerts occasionally
setInterval(() => {
  if (clients.size === 0) return;

  // 5% chance of emergency alert every 30 seconds
  if (Math.random() < 0.05) {
    const alertTypes = [
      {
        kind: 'fall_detected',
        severity: 'high',
        message: 'Possible fall detected - immediate attention recommended',
      },
      {
        kind: 'heart_rate_anomaly',
        severity: 'medium',
        message: 'Heart rate outside normal range detected',
      },
      {
        kind: 'low_walking_steadiness',
        severity: 'medium',
        message: 'Walking steadiness below recommended threshold',
      },
    ];

    const alert = alertTypes[Math.floor(Math.random() * alertTypes.length)];
    const alertMessage = {
      type: 'emergency_alert',
      data: {
        alert,
        userId: 'demo-user',
        timestamp: new Date().toISOString(),
      },
      timestamp: new Date().toISOString(),
    };

    clients.forEach((clientInfo, ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify(alertMessage));
          console.log(
            `🚨 Sent emergency alert to ${clientInfo.id}: ${alert.kind}`
          );
        } catch (error) {
          console.error(
            `❌ Failed to send alert to ${clientInfo.id}:`,
            error.message
          );
        }
      }
    });
  }
}, 30000);

console.log(
  '🎯 VitalSense WebSocket server ready and waiting for connections...'
);
console.log(
  '💡 Connect your app to ws://localhost:3001 to receive live health data!'
);
console.log('🔧 Use Ctrl+C to stop the server');
