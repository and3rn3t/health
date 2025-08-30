import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useHealthDataQuery } from '@/hooks/useHealthDataQuery'
import { useCreateHealthData } from '@/hooks/useCreateHealthData'
import { toast } from 'sonner'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, format, formatDistanceToNow } from 'date-fns'
import { healthMetricSchema } from '@/schemas/health'
import { z } from 'zod'
import { useKV } from '@github/spark/hooks'

type MetricType = z.infer<typeof healthMetricSchema.shape.type>

export function RecentHealthData() {
  const [metric, setMetric] = useKV<MetricType | ''>('recent-metric', '')
  const [from, setFrom] = useKV<string>('recent-from', '')
  const [to, setTo] = useKV<string>('recent-to', '')
  const [isDev, setIsDev] = useState(false)

  const params = useMemo(() => {
    const toISO = (d: string) => (d ? new Date(d).toISOString() : undefined)
    return {
      metric: metric || undefined,
      from: toISO(from),
      to: toISO(to),
    }
  }, [metric, from, to])

  const { data, isLoading, error, isFetching, dataUpdatedAt } = useHealthDataQuery(params)
  const createMutation = useCreateHealthData()

  const addSample = () => {
    const sample = {
      type: 'steps' as const,
      value: Math.floor(5000 + Math.random() * 4000),
      processedAt: new Date().toISOString(),
      validated: true,
      fallRisk: 'low' as const,
    }
    createMutation.mutate(sample, {
      onSuccess: () => toast.success('Sample record saved'),
      onError: () => toast.error('Failed to save sample'),
    })
  }

  useEffect(() => {
    const checkEnv = async () => {
      try {
        const res = await fetch('/health')
        if (!res.ok) return
        const json = await res.json()
        setIsDev(json.environment === 'development')
      } catch {
        // ignore
      }
    }
    checkEnv()
  }, [])

  // Initialize filters from URL params on mount
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search)
      const m = sp.get('metric') as MetricType | null
      const f = sp.get('from')
      const t = sp.get('to')
      if (m) setMetric(m)
      if (f) setFrom(f)
      if (t) setTo(t)
    } catch {
      // no-op
    }
    // run once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Sync current filters back to URL params for shareable views
  const syncUrl = useCallback(() => {
    try {
      const sp = new URLSearchParams()
      if (metric) sp.set('metric', metric)
      if (from) sp.set('from', from)
      if (to) sp.set('to', to)
      const qs = sp.toString()
      const url = `${window.location.pathname}${qs ? `?${qs}` : ''}`
      window.history.replaceState(null, '', url)
    } catch {
      // ignore
    }
  }, [metric, from, to])

  useEffect(() => {
    syncUrl()
  }, [syncUrl])

  const exportJson = () => {
    try {
      const payload = data ?? []
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      const ts = new Date().toISOString().slice(0, 10)
      a.href = url
      a.download = `health-data_${metric || 'all'}_${ts}.json`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch {
      toast.error('Failed to export JSON')
    }
  }

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied')
    } catch {
      toast.error('Failed to copy link')
    }
  }

  const activeFilterCount = useMemo(
    () => (metric ? 1 : 0) + (from ? 1 : 0) + (to ? 1 : 0),
    [metric, from, to]
  )

  const resetFilters = () => {
    setMetric('')
    setFrom('')
    setTo('')
  }

  const toLocalISODate = (d: Date) => format(d, 'yyyy-MM-dd')
  const parseLocalDate = (s: string) => {
    // interpret as local date at midnight
    const [y, m, d] = s.split('-').map(Number)
    return new Date(y, (m || 1) - 1, d || 1)
  }

  const shiftDay = (delta: 1 | -1) => {
    const today = new Date()
    const baseFrom = from ? parseLocalDate(from) : (to ? parseLocalDate(to) : today)
    const baseTo = to ? parseLocalDate(to) : baseFrom

    const newFrom = addDays(baseFrom, delta)
    const newTo = addDays(baseTo, delta)

    // Clamp 'to' to today if it goes into the future
    const clampedTo = newTo > today ? today : newTo
    // If clamped changed range size, keep same diff from 'from'
    const diff = clampedTo.getTime() - newTo.getTime()
    const finalFrom = diff !== 0 ? new Date(newFrom.getTime() + diff) : newFrom

    setFrom(toLocalISODate(finalFrom))
    setTo(toLocalISODate(clampedTo))
  }

  const setToday = () => {
    const today = new Date()
    const d = toLocalISODate(today)
    setFrom(d)
    setTo(d)
  }

  const setYesterday = () => {
    const y = addDays(new Date(), -1)
    const d = toLocalISODate(y)
    setFrom(d)
    setTo(d)
  }

  const setLastNDays = (n: number) => {
    const today = new Date()
    const start = addDays(today, -(n - 1))
    setFrom(toLocalISODate(start))
    setTo(toLocalISODate(today))
  }

  const friendlyRangeLabel = useMemo(() => {
    const today = new Date()
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const yest = addDays(todayLocal, -1)

    const start = from ? parseLocalDate(from) : undefined
    const end = to ? parseLocalDate(to) : start

    const sameDay = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

    if (!start && !end) return 'All time'
    if (start && end && sameDay(start, end)) {
      if (sameDay(start, todayLocal)) return 'Today'
      if (sameDay(start, yest)) return 'Yesterday'
      return format(start, 'PP')
    }
    if (start && end) return `${format(start, 'PP')} — ${format(end, 'PP')}`
    if (start) return `Since ${format(start, 'PP')}`
    if (end) return `Up to ${format(end, 'PP')}`
    return ''
  }, [from, to])

  const disableNextDay = useMemo(() => {
    const today = new Date()
    const todayLocal = new Date(today.getFullYear(), today.getMonth(), today.getDate())
    const currentTo = to ? parseLocalDate(to) : (from ? parseLocalDate(from) : todayLocal)
    // Disable if the current 'to' is already today or later (date-wise)
    return (
      currentTo.getFullYear() === todayLocal.getFullYear() &&
      currentTo.getMonth() === todayLocal.getMonth() &&
      currentTo.getDate() === todayLocal.getDate()
    ) || currentTo > todayLocal
  }, [from, to])

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div>
              <CardTitle>Recent Health Records</CardTitle>
              <CardDescription>Latest processed entries</CardDescription>
            </div>
            {activeFilterCount > 0 && (
              <Badge variant="outline" aria-label={`Filters active: ${activeFilterCount}`}>
                Filtered ({activeFilterCount})
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground text-right">
            {dataUpdatedAt ? `Last updated ${formatDistanceToNow(dataUpdatedAt, { addSuffix: true })}` : ''}
            {isFetching && <div>Refreshing…</div>}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span className="text-xs text-muted-foreground">Presets:</span>
          <Button variant="outline" size="sm" onClick={setToday} aria-label="Today">Today</Button>
          <Button variant="outline" size="sm" onClick={setYesterday} aria-label="Yesterday">Yesterday</Button>
          <Button variant="outline" size="sm" onClick={() => setLastNDays(7)} aria-label="Last 7 days">Last 7 days</Button>
          <Button variant="outline" size="sm" onClick={() => setLastNDays(30)} aria-label="Last 30 days">Last 30 days</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-end gap-2 mb-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="metric-filter" className="text-xs text-muted-foreground">Metric</label>
            <select
              className="border rounded-md h-9 px-2 bg-background"
              value={metric}
              onChange={(e) => setMetric(e.target.value as MetricType | '')}
              aria-label="Metric filter"
              id="metric-filter"
            >
              <option value="">All</option>
              <option value="heart_rate">Heart rate</option>
              <option value="walking_steadiness">Walking steadiness</option>
              <option value="steps">Steps</option>
              <option value="oxygen_saturation">Oxygen saturation</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="from-date" className="text-xs text-muted-foreground">From</label>
            <input
              type="date"
              className="border rounded-md h-9 px-2 bg-background"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              aria-label="From date"
              id="from-date"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="to-date" className="text-xs text-muted-foreground">To</label>
            <input
              type="date"
              className="border rounded-md h-9 px-2 bg-background"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              aria-label="To date"
              id="to-date"
            />
          </div>
          <Button
            variant="ghost"
            onClick={resetFilters}
            disabled={activeFilterCount === 0}
            aria-disabled={activeFilterCount === 0}
          >
            Reset filters
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" onClick={() => shiftDay(-1)} aria-label="Previous day">
              Prev day
            </Button>
            <Button
              variant="outline"
              onClick={() => shiftDay(1)}
              aria-label="Next day"
              disabled={disableNextDay}
            >
              Next day
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2" aria-live="polite">
          <span>Range: {friendlyRangeLabel}</span>
          {(from || to) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFrom(''); setTo('') }}
              aria-label="Clear date filters"
            >
              Clear dates
            </Button>
          )}
        </div>
        {isLoading && (
          <div className="space-y-2 animate-pulse">
            <div className="h-4 bg-muted rounded" />
            <div className="h-4 bg-muted rounded w-2/3" />
          </div>
        )}
        {!isLoading && error && (
          <Alert variant="destructive">
            <AlertDescription>Failed to load records</AlertDescription>
          </Alert>
        )}
        {!isLoading && !error && (!data || data.length === 0) && (
          <p className="text-sm text-muted-foreground">No records yet.</p>
        )}
        {!isLoading && !error && data && data.length > 0 && (
          <ul className="space-y-2">
            {data.slice(0, 10).map((item) => (
              <li key={`${item.type}-${item.processedAt}-${item.value}`} className="flex items-center justify-between p-2 border rounded-md">
                <div>
                  <div className="text-sm font-medium capitalize">{item.type.replace('_', ' ')}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(item.processedAt).toLocaleString()}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold">{item.value}</div>
                  {item.fallRisk && (
                    <Badge variant={item.fallRisk === 'high' || item.fallRisk === 'critical' ? 'destructive' : 'secondary'}>
                      {item.fallRisk}
                    </Badge>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-4 flex items-center gap-2">
          {isDev ? (
            <Button onClick={addSample} disabled={createMutation.isPending}>
              {createMutation.isPending ? 'Saving…' : 'Add sample record'}
            </Button>
          ) : (
            <span className="text-xs text-muted-foreground">Sample writes available in development only</span>
          )}
          <Button variant="outline" onClick={exportJson} aria-label="Export filtered results as JSON">
            Export JSON
          </Button>
          <Button variant="ghost" onClick={copyLink} aria-label="Copy shareable link">
            Copy link
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default RecentHealthData
