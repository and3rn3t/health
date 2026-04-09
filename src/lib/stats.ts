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

export type RunningStats = {
	count: number
	mean: number
	M2: number
	min: number
	max: number
}

export function initRunningStats(): RunningStats {
	return { count: 0, mean: 0, M2: 0, min: Infinity, max: -Infinity }
}

export function updateRunningStats(state: RunningStats, value: number): void {
	if (!Number.isFinite(value)) return
	state.count += 1
	const delta = value - state.mean
	state.mean += delta / state.count
	const delta2 = value - state.mean
	state.M2 += delta * delta2
	if (value < state.min) state.min = value
	if (value > state.max) state.max = value
}

export function finalizeRunningStats(state: RunningStats): BasicStats {
	const variance = state.count > 0 ? state.M2 / state.count : NaN
	return {
		min: state.count > 0 ? state.min : NaN,
		max: state.count > 0 ? state.max : NaN,
		mean: state.count > 0 ? state.mean : NaN,
		std: Math.sqrt(variance),
		count: state.count,
	}
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

export function accumulateHistogram(
	targetCounts: number[],
	values: number[],
	range: { min: number; max: number }
) {
	const bins = targetCounts.length
	const width = (range.max - range.min) / bins
	for (const v of values) {
		if (!Number.isFinite(v)) continue
		if (v < range.min || v > range.max) continue
		let idx = Math.floor((v - range.min) / width)
		if (idx === bins) idx = bins - 1
		if (idx >= 0 && idx < bins) targetCounts[idx]!++;
	}
}
