#!/usr/bin/env python3
"""
Simple WebSocket server for testing HealthKit Bridge connections
Requires: pip install websockets
"""

import asyncio
import websockets
import json
import logging
from datetime import datetime

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(message)s')
logger = logging.getLogger(__name__)

class HealthKitWebSocketServer:
    def __init__(self, host='localhost', port=3001):
        self.host = host
        self.port = port
        self.clients = set()

    async def register_client(self, websocket):
        """Register a new client"""
        self.clients.add(websocket)
        logger.info(f"✅ New client connected from {websocket.remote_address}")
        
        # Send welcome message
        welcome_msg = {
            "type": "welcome",
            "message": "Connected to HealthKit WebSocket server",
            "timestamp": datetime.now().isoformat()
        }
        await websocket.send(json.dumps(welcome_msg))

    async def unregister_client(self, websocket):
        """Unregister a client"""
        self.clients.discard(websocket)
        logger.info(f"🔌 Client {websocket.remote_address} disconnected")

    async def handle_message(self, websocket, message):
        """Handle incoming messages from clients"""
        try:
            data = json.loads(message)
            logger.info(f"📥 Received: {data}")
            
            # Handle health data
            if data.get('type') == 'health_data':
                response = {
                    "type": "health_data_ack",
                    "received": data.get('data'),
                    "timestamp": datetime.now().isoformat(),
                    "status": "success"
                }
                await websocket.send(json.dumps(response))
                logger.info("📤 Sent acknowledgment for health data")
                
            # Echo other messages
            else:
                echo_response = {
                    "type": "echo",
                    "original": data,
                    "timestamp": datetime.now().isoformat()
                }
                await websocket.send(json.dumps(echo_response))
                logger.info("📤 Sent echo response")
                
        except json.JSONDecodeError:
            logger.error("❌ Error parsing JSON message")
            error_response = {
                "type": "error",
                "message": "Invalid JSON format",
                "timestamp": datetime.now().isoformat()
            }
            await websocket.send(json.dumps(error_response))

    async def handle_client(self, websocket, path):
        """Handle a client connection"""
        await self.register_client(websocket)
        try:
            async for message in websocket:
                await self.handle_message(websocket, message)
        except websockets.exceptions.ConnectionClosed:
            logger.info("🔌 Client connection closed normally")
        except Exception as e:
            logger.error(f"❌ Error handling client: {e}")
        finally:
            await self.unregister_client(websocket)

    async def start_server(self):
        """Start the WebSocket server"""
        logger.info(f"🚀 Starting WebSocket server on {self.host}:{self.port}")
        
        try:
            server = await websockets.serve(
                self.handle_client,
                self.host,
                self.port,
                ping_interval=20,
                ping_timeout=10
            )
            logger.info(f"🎯 WebSocket server ready at ws://{self.host}:{self.port}")
            logger.info("💡 Waiting for HealthKit app connections...")
            
            # Keep the server running
            await server.wait_closed()
            
        except Exception as e:
            logger.error(f"❌ Failed to start server: {e}")
            raise

async def main():
    server = HealthKitWebSocketServer()
    await server.start_server()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logger.info("🛑 Server stopped by user")
    except Exception as e:
        logger.error(f"❌ Server error: {e}")