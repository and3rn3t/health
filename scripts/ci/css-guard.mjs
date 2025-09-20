#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const verbose = args.includes('--verbose');

// Run local guard (re-uses existing logic). If it fails, exit 1 so CI gates.
const run = spawnSync('node', ['scripts/node/analysis/css/guard-main-css.js'], { stdio: 'inherit', env: process.env });
if (run.status !== 0) {
	process.exit(run.status === null ? 1 : run.status);
}

// If guard passed, surface brief summary of artifact.
try {
	const artifactPath = path.join(process.cwd(), 'reports', 'contrast-report.json');
	if (fs.existsSync(artifactPath)) {
		const data = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
		const summary = `ContrastReport: fails=${data.fails} borderline=${data.borderline} lines=${data.lines} bytes=${data.bytes}`;
		console.log(summary);
		if (verbose) {
			const near = data.pairs.filter(p => p.status !== 'FAIL').sort((a,b)=> parseFloat(a.ratio)-parseFloat(b.ratio)).slice(0,5);
			console.log('Lowest passing ratios:', near.map(p => `${p.pair}:${p.ratio}`).join(', '));
		}
	} else if (verbose) {
		console.log('No contrast-report.json artifact found.');
	}
} catch (e) {
	console.warn('Could not read contrast artifact:', e.message);
}
