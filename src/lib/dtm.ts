import { computeBasicStats } from './stats'

export type ElevationStats = {
	minElevationM: number
	maxElevationM: number
	meanElevationM: number
	stdElevationM: number
	count: number
}

export function computeElevationStats(elevations: number[]): ElevationStats {
	const s = computeBasicStats(elevations)
	return {
		minElevationM: s.min,
		maxElevationM: s.max,
		meanElevationM: s.mean,
		stdElevationM: s.std,
		count: s.count,
	}
}
