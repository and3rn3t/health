#!/usr/bin/env node

/**
 * Development starter script
 * This maintains compatibility with VS Code tasks
 */

import { writeTaskStart, writeInfo, writeSuccess } from '../../core/logger.js';

writeTaskStart('Development Environment');
writeInfo('Starting VitalSense development services...');
writeInfo('Available services:');
writeInfo('  - Cloudflare Worker (port 8789)');
writeInfo('  - WebSocket Server (port 3001)');
writeInfo('  - Frontend (port 5173)');
writeInfo('');
writeInfo('Use the following VS Code tasks to start services:');
writeInfo('  - wrangler-dev-8789 (Worker)');
writeInfo('  - 🔧 Enhanced Server (Dev Mode) (WebSocket)');
writeInfo('  - npx vite --port 5173 (Frontend)');

writeSuccess('Development environment ready!');
process.exit(0);