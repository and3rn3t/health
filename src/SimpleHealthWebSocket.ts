// Simple WebSocket Durable Object for testing
import { z } from 'zod/v3';

const wsMessageSchema = z.object({
  type: z.string().max(64),
  timestamp: z.string().optional(),
  payload: z.record(z.unknown()).optional(),
});

export class SimpleHealthWebSocket {
  private readonly sessions: Map<
    WebSocket,
    { userId: string; connectedAt: Date }
  >;

  constructor(_state: DurableObjectState) {
    this.sessions = new Map();
  }

  async fetch(request: Request): Promise<Response> {
    try {
      const url = new URL(request.url);
      const upgradeHeader = request.headers.get('Upgrade');

      if (upgradeHeader !== 'websocket') {
        return new Response(
          JSON.stringify({
            ok: true,
            message: 'WebSocket endpoint - use upgrade header',
            timestamp: new Date().toISOString(),
          }),
          {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }
        );
      }

      // Create WebSocket pair
      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair) as [WebSocket, WebSocket];

      // Get connection parameters
      const userId = url.searchParams.get('userId') || `user_${Date.now()}`;

      // Accept the connection
      server.accept();

      // Store session
      this.sessions.set(server, {
        userId,
        connectedAt: new Date(),
      });

      // Send welcome message (do not echo userId back to client)
      server.send(
        JSON.stringify({
          type: 'connection_established',
          message: 'Connected to VitalSense WebSocket',
          serverTime: new Date().toISOString(),
          sessionId: crypto.randomUUID(),
        })
      );

      // Handle messages
      server.addEventListener('message', (event) => {
        try {
          const raw = JSON.parse(event.data);
          const parsed = wsMessageSchema.safeParse(raw);
          if (!parsed.success) {
            server.send(
              JSON.stringify({
                type: 'error',
                message: 'Invalid message format',
              })
            );
            return;
          }
          const data = parsed.data;
          if (data.type === 'ping') {
            server.send(
              JSON.stringify({
                type: 'pong',
                timestamp: new Date().toISOString(),
                originalTimestamp: data.timestamp,
              })
            );
          }
        } catch (_e) {
          server.send(
            JSON.stringify({
              type: 'error',
              message: 'Invalid message format',
            })
          );
        }
      });

      server.addEventListener('close', () => {
        this.sessions.delete(server);
      });

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    } catch (error) {
      console.error('WebSocket error:', error);
      return new Response(
        JSON.stringify({
          error: 'WebSocket connection failed',
        }),
        {
          status: 500,
          headers: { 'content-type': 'application/json' },
        }
      );
    }
  }
}
