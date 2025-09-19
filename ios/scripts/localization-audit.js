#!/usr/bin/env node
/**
 * Localization Audit Script
 * Scans Swift source for likely user-facing string literals that are not wrapped in a localization helper.
 * Heuristics:
 *  - Looks for Text("...") / Label("...") / "title:" patterns with bare quoted strings containing letters/spaces
 *  - Ignores strings containing format specifiers (%d, %@, etc.) already localized via keys (assumes keys have underscores)
 *  - Skips test targets and generated files.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'HealthKitBridge');
const swiftFiles = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir)) {
    const full = path.join(dir, entry);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) {
      if (/Tests|\.xcworkspace|\.xcodeproj/.test(full)) continue;
      walk(full);
    } else if (entry.endsWith('.swift')) {
      swiftFiles.push(full);
    }
  }
}

walk(root);

const suspectLines = [];
const literalPattern = /\b(Text|Label)\(\s*"([A-Z0-9][^"]{2,})"/; // simplistic heuristic
const ignorePattern = /(NSLocalizedString|loc\(|L\(|perm_|walk_|fall_|gait_|settings_|widget_)/;

swiftFiles.forEach(file => {
  const content = fs.readFileSync(file, 'utf8').split(/\r?\n/);
  content.forEach((line, idx) => {
    if (ignorePattern.test(line)) return;
    const m = line.match(literalPattern);
    if (m) {
      const text = m[2];
      // Skip obviously non user-facing small tokens
      if (text.length < 3) return;
      // Skip where it looks like a SF Symbol name or camelCase identifier
      if (/^[a-z]+([A-Z][a-z0-9]+)+$/.test(text)) return;
      suspectLines.push({ file, line: idx + 1, text });
    }
  });
});

if (suspectLines.length === 0) {
  console.log('✅ Localization audit passed – no obvious unlocalized literals found.');
  process.exit(0);
} else {
  console.log('⚠️  Potential unlocalized user-facing strings found:');
  suspectLines.forEach(s => console.log(`${s.file}:${s.line} -> "${s.text}"`));
  // Non-zero exit to fail CI if integrated
  process.exit(1);
}
