#!/usr/bin/env node

/**
 * PowerShell environment check
 * This maintains compatibility with VS Code tasks
 */

import { writeInfo, writeSuccess } from '../../core/logger.js';

writeInfo('🔍 PowerShell Environment Check');
writeInfo('Node.js version: ' + process.version);
writeInfo('Platform: ' + process.platform);
writeInfo('Architecture: ' + process.arch);
writeInfo('Working directory: ' + process.cwd());

writeSuccess('Environment check completed');
process.exit(0);