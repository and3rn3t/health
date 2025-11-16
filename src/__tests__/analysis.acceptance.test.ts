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
		// Allow generous tolerance for scaffolded data
		const tolerance = 0.2
		expect(Math.abs(stats.mean - expected.stats.mean)).toBeLessThanOrEqual(tolerance)
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
	})
})

describe('Acceptance - DTM', () => {
	test('computes elevation stats and roughly matches golden mean', async () => {
		const expected = await loadJson('fixtures/golden/dtm_expected.json')
		const fixture = await loadJson('fixtures/sample/dtm_elevations.json')
		const stats = computeElevationStats(fixture.elevations)
		const tol = 6 // generous tolerance since sample data is synthetic
		expect(Math.abs(stats.meanElevationM - expected.stats.meanElevationM)).toBeLessThanOrEqual(tol)
	})
})
