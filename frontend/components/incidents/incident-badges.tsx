import { cn } from '@/lib/utils'
import type { IncidentStatus, Severity } from '@/lib/types'

const severityStyles: Record<Severity, string> = {
  Critical: 'border-destructive/40 bg-destructive/10 text-destructive',
  Medium: 'border-warning/40 bg-warning/10 text-warning',
  Low: 'border-border bg-muted text-muted-foreground',
}

const severityDot: Record<Severity, string> = {
  Critical: 'bg-destructive',
  Medium: 'bg-warning',
  Low: 'bg-muted-foreground',
}

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-6 items-center gap-1.5 rounded-full border px-2.5 text-xs font-medium',
        severityStyles[severity],
        className,
      )}
    >
      <span className={cn('size-1.5 rounded-full', severityDot[severity])} aria-hidden="true" />
      {severity}
    </span>
  )
}

const statusStyles: Record<IncidentStatus, string> = {
  Open: 'text-foreground',
  'In Progress': 'text-info',
  Resolved: 'text-success',
}

const statusDot: Record<IncidentStatus, string> = {
  Open: 'border-foreground',
  'In Progress': 'border-info bg-info/40',
  Resolved: 'border-success bg-success',
}

export function StatusBadge({ status, className }: { status: IncidentStatus; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm font-medium', statusStyles[status], className)}>
      <span className={cn('size-2.5 rounded-full border-[1.5px]', statusDot[status])} aria-hidden="true" />
      {status}
    </span>
  )
}
