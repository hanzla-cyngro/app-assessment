'use client'

import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/states'
import { useAnalytics } from '@/hooks/use-incidents'
import { formatDuration } from '@/lib/format'
import { cn } from '@/lib/utils'

function Kpi({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string
  hint?: string
  accent?: string
}) {
  return (
    <div className="flex flex-col gap-3 bg-card p-5">
      <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {accent && <span className={cn('size-1.5 rounded-full', accent)} aria-hidden="true" />}
        {label}
      </span>
      <span className="font-mono text-3xl font-semibold tabular-nums tracking-tight">{value}</span>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  )
}

export function KpiGrid() {
  const { data, error, isLoading, mutate } = useAnalytics()

  if (error) return <ErrorState error={error} onRetry={() => mutate()} />

  if (isLoading || !data) {
    return (
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex flex-col gap-3 bg-card p-5">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-8 w-14" />
          </div>
        ))}
      </div>
    )
  }

  const { activeBySeverity, averageResolutionTimeMs, resolvedCount } = data
  const totalActive = activeBySeverity.Critical + activeBySeverity.Medium + activeBySeverity.Low

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border lg:grid-cols-5">
      <Kpi label="Active incidents" value={String(totalActive)} hint="Open + In Progress" />
      <Kpi label="Critical" value={String(activeBySeverity.Critical)} accent="bg-destructive" />
      <Kpi label="Medium" value={String(activeBySeverity.Medium)} accent="bg-warning" />
      <Kpi label="Low" value={String(activeBySeverity.Low)} accent="bg-muted-foreground" />
      <Kpi
        label="Avg. time to resolve"
        value={averageResolutionTimeMs == null ? '—' : formatDuration(averageResolutionTimeMs)}
        hint={`${resolvedCount} resolved`}
        accent="bg-success"
      />
    </div>
  )
}
