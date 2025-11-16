export type BasicStats = {
	min: number
	max: number
	mean: number
	std: number
	count: number
}

export function computeBasicStats(values: number[]): BasicStats {
	const finite = values.filter(v => Number.isFinite(v))
	if (finite.length === 0) {
		return { min: NaN, max: NaN, mean: NaN, std: NaN, count: 0 }
	}
	let min = Infinity
	let max = -Infinity
	let sum = 0
	for (const v of finite) {
		if (v < min) min = v
		if (v > max) max = v
		sum += v
	}
	const mean = sum / finite.length
	let varSum = 0
	for (const v of finite) {
		const d = v - mean
		varSum += d * d
	}
	const variance = varSum / finite.length
	const std = Math.sqrt(variance)
	return { min, max, mean, std, count: finite.length }
}

export function computeHistogram(
	values: number[],
	bins: number,
	range: { min: number; max: number } = { min: -1, max: 1 }
): number[] {
	const counts = new Array(bins).fill(0)
	const width = (range.max - range.min) / bins
	for (const v of values) {
		if (!Number.isFinite(v)) continue
		if (v < range.min || v > range.max) continue
		let idx = Math.floor((v - range.min) / width)
		if (idx === bins) idx = bins - 1
		if (idx >= 0 && idx < bins) counts[idx]++
	}
	return counts
}
