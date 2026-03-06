import { computeBasicStats, computeHistogram } from './stats'

export type NdmiResult = {
	ndmi: number[]
	stats: ReturnType<typeof computeBasicStats>
	histogram: { bins: number; counts: number[] }
}

/**
 * Compute NDMI (Normalized Difference Moisture Index)
 * Formula: (NIR - SWIR) / (NIR + SWIR)
 * Range: -1 to 1, higher values indicate higher vegetation moisture
 */
export function computeNdmi(nir: number[], swir: number[], bins = 10): NdmiResult {
	if (nir.length !== swir.length) {
		throw new Error('NIR and SWIR arrays must have the same length')
	}
	const ndmi: number[] = new Array(nir.length)
	for (let i = 0; i < nir.length; i++) {
		const n = nir[i]
		const s = swir[i]
		const denom = n + s
		ndmi[i] = denom === 0 ? Number.NaN : (n - s) / denom
	}
	const stats = computeBasicStats(ndmi)
	const counts = computeHistogram(ndmi, bins, { min: -1, max: 1 })
	return { ndmi, stats, histogram: { bins, counts } }
}
