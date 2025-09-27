#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import chalk from 'chalk';

function log(msg, color='white'){ console.log(chalk[color](msg)); }

const repoRoot = path.resolve(process.cwd());
const loginPathArg = process.argv.find(a=>a.startsWith('--login='))?.split('=')[1];
const loginPath = loginPathArg || path.join(repoRoot, 'auth0-custom-login', 'login.html');

(async () => {
  log('🧪 Auth0 Custom Login Page Test', 'cyan');
  log(`File: ${loginPath}`, 'gray');
  try {
    const html = await fs.readFile(loginPath, 'utf8');
    const hasBrand = /VitalSense/i.test(html);
    const hasColors = /#2563eb|#0891b2/i.test(html);
    const hasInter = /Inter|inter-?font/i.test(html);

    if (hasBrand) log('✅ Branding: VitalSense detected', 'green');
    else log('❌ Branding missing: VitalSense not found', 'red');

    if (hasColors) log('✅ Colors: Primary/Secondary palette present', 'green');
    else log('⚠️ Colors not detected (#2563eb/#0891b2)', 'yellow');

    if (hasInter) log('✅ Typography: Inter found', 'green');
    else log('⚠️ Inter font not detected', 'yellow');

    const ok = hasBrand && (hasColors || hasInter);
    process.exitCode = ok ? 0 : 1;
  } catch (e) {
    log(`❌ Failed to read login page: ${e.message}`, 'red');
    process.exit(1);
  }
})();
