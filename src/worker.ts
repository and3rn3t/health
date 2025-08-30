/**
 * Cloudflare Workers entry point for the Health App
 * This file handles the worker logic and serves the built application
 */

import { Hono } from 'hono';
import { serveStatic } from 'hono/cloudflare-workers';

const app = new Hono();

// Serve static assets
app.use('/*', serveStatic({ root: './' }));

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: c.env.ENVIRONMENT || 'unknown'
  });
});

// WebSocket endpoint for real-time health data
app.get('/ws', (c) => {
  const upgradeHeader = c.req.header('Upgrade');
  if (upgradeHeader !== 'websocket') {
    return c.text('Expected Upgrade: websocket', 426);
  }

  // WebSocket upgrade logic will be implemented here
  // This is a placeholder for the WebSocket functionality
  return new Response('WebSocket endpoint', { status: 101 });
});

// API routes for health data
app.get('/api/health-data', async (c) => {
  // Implementation for fetching health data
  return c.json({ message: 'Health data endpoint' });
});

app.post('/api/health-data', async (c) => {
  // Implementation for saving health data
  return c.json({ message: 'Health data saved' });
});

// Catch-all route to serve the React app
app.get('*', serveStatic({ path: './index.html' }));

export default app;
