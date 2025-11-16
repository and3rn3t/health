import { computeBasicStats, computeHistogram, initRunningStats, updateRunningStats, finalizeRunningStats, accumulateHistogram } from './stats'

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

export function computeNdviStatsChunked(nir: number[], red: number[], bins = 10, chunkSize = 100_000) {
	if (nir.length !== red.length) {
		throw new Error('NIR and RED arrays must have the same length')
	}
	const range = { min: -1, max: 1 }
	const counts = new Array(bins).fill(0)
	const rs = initRunningStats()
	const total = nir.length
	for (let start = 0; start < total; start += chunkSize) {
		const end = Math.min(total, start + chunkSize)
		for (let i = start; i < end; i++) {
			const n = nir[i]
			const r = red[i]
			const denom = n + r
			const v = denom === 0 ? Number.NaN : (n - r) / denom
			updateRunningStats(rs, v)
		}
		// compute histogram for this block without storing NDVI block by recomputing
		const block: number[] = []
		for (let i = start; i < end; i++) {
			const n = nir[i]
			const r = red[i]
			const denom = n + r
			block.push(denom === 0 ? Number.NaN : (n - r) / denom)
		}
		accumulateHistogram(counts, block, range)
	}
	return { stats: finalizeRunningStats(rs), histogram: { bins, counts } }
}
