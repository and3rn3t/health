import { describe, test, expect } from 'vitest'
import fs from 'node:fs/promises'
import path from 'node:path'
import { computeNdvi } from '../lib/ndvi'
import { computeZonalStats } from '../lib/zonal'
import { computeElevationStats } from '../lib/dtm'

async function loadJson(relativePath: string) {
	const filePath = path.resolve(process.cwd(), relativePath)
	const raw = await fs.readFile(filePath, 'utf8')
	return JSON.parse(raw)
}

describe('Acceptance - NDVI', () => {
	test('computes NDVI and roughly matches golden mean', async () => {
		const expected = await loadJson('fixtures/golden/ndvi_expected.json')
		const fixture = await loadJson('fixtures/sample/ndvi_nir_red.json')
		const { stats } = computeNdvi(fixture.nir, fixture.red, 10)
		expect(Number.isFinite(stats.mean)).toBe(true)
		expect(stats.min).toBeGreaterThanOrEqual(-1)
		expect(stats.max).toBeLessThanOrEqual(1)
		// Per-metric tolerances for scaffolded data
		const meanTol = 0.15
		const stdTol = 0.15
		expect(Math.abs(stats.mean - expected.stats.mean)).toBeLessThanOrEqual(meanTol)
		if (typeof expected.stats.std === 'number') {
			expect(Math.abs(stats.std - expected.stats.std)).toBeLessThanOrEqual(stdTol)
		}
	})
})

describe('Acceptance - Zonal Statistics', () => {
	test('computes zonal stats and roughly matches golden means', async () => {
		const expected = await loadJson('fixtures/golden/zonal_stats_expected.json')
		const fixture = await loadJson('fixtures/sample/zonal_values_zones.json')
		const result = computeZonalStats(fixture.values, fixture.zones)
		expect(result.zones.length).toBeGreaterThan(0)
		// Compare means for known zones with generous tolerance
		const tol = 0.1
		for (const ez of expected.zones) {
			const got = result.zones.find(z => z.zoneId === ez.zoneId)
			if (!got) continue
			expect(Math.abs(got.mean - ez.mean)).toBeLessThanOrEqual(tol)
		}
		// Sanity: total count equals number of input samples
		const total = result.zones.reduce((s, z) => s + z.count, 0)
		expect(total).toBe(fixture.values.length)
	})
})

describe('Acceptance - DTM', () => {
	test('computes elevation stats and roughly matches golden mean/min/max', async () => {
		const expected = await loadJson('fixtures/golden/dtm_expected.json')
		const fixture = await loadJson('fixtures/sample/dtm_elevations.json')
		const stats = computeElevationStats(fixture.elevations)
		const meanTol = 6
		const minTol = 12
		const maxTol = 12
		expect(Math.abs(stats.meanElevationM - expected.stats.meanElevationM)).toBeLessThanOrEqual(meanTol)
		if (typeof expected.stats.minElevationM === 'number') {
			expect(Math.abs(stats.minElevationM - expected.stats.minElevationM)).toBeLessThanOrEqual(minTol)
		}
		if (typeof expected.stats.maxElevationM === 'number') {
			expect(Math.abs(stats.maxElevationM - expected.stats.maxElevationM)).toBeLessThanOrEqual(maxTol)
		}
	})
})
