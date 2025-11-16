import { computeBasicStats } from './stats'

export type ZonalStat = {
	zoneId: string
	min: number
	max: number
	mean: number
	std: number
	count: number
}

export function computeZonalStats(values: number[], zones: Array<string | number>): { zones: ZonalStat[] } {
	if (values.length !== zones.length) {
		throw new Error('values and zones must have the same length')
	}
	const perZone = new Map<string, number[]>()
	for (let i = 0; i < values.length; i++) {
		const z = String(zones[i])
		const v = Number(values[i])
		if (!perZone.has(z)) perZone.set(z, [])
		perZone.get(z)!.push(v)
	}
	const result: ZonalStat[] = []
	for (const [zoneId, arr] of perZone.entries()) {
		const stats = computeBasicStats(arr)
		result.push({ zoneId, min: stats.min, max: stats.max, mean: stats.mean, std: stats.std, count: stats.count })
	}
	return { zones: result }
}
