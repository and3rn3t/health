import { computeBasicStats, computeHistogram } from './stats'

export type NdviResult = {
	ndvi: number[]
	stats: ReturnType<typeof computeBasicStats>
	histogram: { bins: number; counts: number[] }
}

export function computeNdvi(nir: number[], red: number[], bins = 10): NdviResult {
	if (nir.length !== red.length) {
		throw new Error('NIR and RED arrays must have the same length')
	}
	const ndvi: number[] = new Array(nir.length)
	for (let i = 0; i < nir.length; i++) {
		const n = nir[i]
		const r = red[i]
		const denom = n + r
		ndvi[i] = denom === 0 ? Number.NaN : (n - r) / denom
	}
	const stats = computeBasicStats(ndvi)
	const counts = computeHistogram(ndvi, bins, { min: -1, max: 1 })
	return { ndvi, stats, histogram: { bins, counts } }
}
