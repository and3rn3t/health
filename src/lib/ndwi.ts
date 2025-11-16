import { computeBasicStats, computeHistogram } from './stats'

export type NdwiResult = {
	ndwi: number[]
	stats: ReturnType<typeof computeBasicStats>
	histogram: { bins: number; counts: number[] }
}

/**
 * Compute NDWI (Normalized Difference Water Index)
 * Formula: (Green - NIR) / (Green + NIR)
 * Range: -1 to 1, higher values indicate water
 */
export function computeNdwi(green: number[], nir: number[], bins = 10): NdwiResult {
	if (green.length !== nir.length) {
		throw new Error('Green and NIR arrays must have the same length')
	}
	const ndwi: number[] = new Array(green.length)
	for (let i = 0; i < green.length; i++) {
		const g = green[i]
		const n = nir[i]
		const denom = g + n
		ndwi[i] = denom === 0 ? Number.NaN : (g - n) / denom
	}
	const stats = computeBasicStats(ndwi)
	const counts = computeHistogram(ndwi, bins, { min: -1, max: 1 })
	return { ndwi, stats, histogram: { bins, counts } }
}
