'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { toast } from 'sonner'
import { Button, buttonVariants } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/common/states'
import { ConnectionIndicator, PresenceStack } from '@/components/realtime/presence'
import { SeverityBadge, StatusBadge } from './incident-badges'
import { AssigneeLabel } from './assignee'
import { AttachmentsPanel } from './attachments-panel'
import { useApi } from '@/components/providers/api-provider'
import { useSession } from '@/components/providers/session-provider'
import { useIncident, useRevalidateIncidents } from '@/hooks/use-incidents'
import { useRealtimeRoom } from '@/hooks/use-realtime-room'
import { toApiError } from '@/lib/api/errors'
import { formatDateTime, formatDuration, formatRelative, shortId } from '@/lib/format'
import { STATUS_TRANSITIONS, type IncidentStatus } from '@/lib/types'
import { cn } from '@/lib/utils'

const TRANSITION_LABEL: Record<IncidentStatus, string> = {
  Open: 'Reopen',
  'In Progress': 'Start working',
  Resolved: 'Resolve',
}

export function IncidentDetail({ id }: { id: string }) {
  const api = useApi()
  const { operator } = useSession()
  const { data: incident, error, isLoading, mutate } = useIncident(id)
  const room = useRealtimeRoom(incident ? `incident:${id}` : null)
  const revalidate = useRevalidateIncidents()
  const [pendingStatus, setPendingStatus] = useState<IncidentStatus | null>(null)

  if (error) {
    return (
      <div className="mx-auto max-w-4xl">
        <BackLink />
        <ErrorState error={error} onRetry={() => mutate()} />
      </div>
    )
  }

  if (isLoading || !incident) {
    return (
      <div className="mx-auto flex max-w-4xl flex-col gap-4" aria-busy="true">
        <BackLink />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-4 h-40 w-full" />
      </div>
    )
  }

  async function transition(status: IncidentStatus) {
    setPendingStatus(status)
    try {
      const updated = await api.transitionStatus(id, status)
      await mutate(updated, { revalidate: false })
      revalidate()
      toast.success(`Marked as ${status}`)
    } catch (err) {
      toast.error(toApiError(err).message)
    } finally {
      setPendingStatus(null)
    }
  }

  const names = new Map(room.members.map((m) => [m.userId, m.displayName]))
  const others = room.members.filter((m) => m.userId !== operator?.id)
  const typingNames = room.typing.filter((t) => t.userId !== operator?.id).map((t) => t.displayName)

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <BackLink />

      <div className="flex flex-col gap-4 border-b pb-6">
        <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
          <span className="font-mono">INC-{shortId(incident.id)}</span>
          <span aria-hidden="true">·</span>
          <span>Declared {formatRelative(incident.createdAt)}</span>
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-balance md:text-3xl">{incident.title}</h1>
        <div className="flex flex-wrap items-center gap-3">
          <SeverityBadge severity={incident.severity} />
          <StatusBadge status={incident.status} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_TRANSITIONS[incident.status].map((next) => (
              <Button
                key={next}
                variant={next === 'Resolved' ? 'default' : 'outline'}
                onClick={() => transition(next)}
                disabled={pendingStatus !== null}
              >
                {pendingStatus === next && <Loader2 className="animate-spin" aria-hidden="true" />}
                {TRANSITION_LABEL[next]}
              </Button>
            ))}
            <Link href={`/incidents/${id}/edit`} className={cn(buttonVariants({ variant: 'ghost' }), 'gap-1.5')}>
              <Pencil aria-hidden="true" />
              Edit
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">
              {others.length === 0 ? 'Only you are viewing' : `${others.length} other${others.length === 1 ? '' : 's'} viewing`}
            </span>
            <PresenceStack members={room.members} currentUserId={operator?.id} />
            <ConnectionIndicator state={room.connection} />
          </div>
        </div>
        {typingNames.length > 0 && (
          <p role="status" className="text-xs text-info">
            {typingNames.join(', ')} {typingNames.length === 1 ? 'is' : 'are'} editing this incident…
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
        <div className="flex flex-col gap-8">
          <section aria-labelledby="desc-title" className="flex flex-col gap-2">
            <h2 id="desc-title" className="text-sm font-medium text-muted-foreground">
              Description
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed text-pretty">{incident.description}</p>
          </section>
          <AttachmentsPanel incidentId={id} />
        </div>

        <aside aria-label="Incident details" className="flex flex-col gap-px self-start overflow-hidden rounded-lg border bg-border">
          <Meta label="Assignee">
            <AssigneeLabel userId={incident.assignedUserId} names={names} />
          </Meta>
          <Meta label="Created">
            <time dateTime={incident.createdAt}>{formatDateTime(incident.createdAt)}</time>
          </Meta>
          <Meta label="Last updated">
            <time dateTime={incident.updatedAt}>{formatDateTime(incident.updatedAt)}</time>
          </Meta>
          {incident.resolvedAt && (
            <>
              <Meta label="Resolved">
                <time dateTime={incident.resolvedAt}>{formatDateTime(incident.resolvedAt)}</time>
              </Meta>
              <Meta label="Time to resolve">
                <span className="font-mono">
                  {formatDuration(new Date(incident.resolvedAt).getTime() - new Date(incident.createdAt).getTime())}
                </span>
              </Meta>
            </>
          )}
        </aside>
      </div>
    </div>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 bg-card px-4 py-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{children}</span>
    </div>
  )
}

function BackLink() {
  return (
    <Link
      href="/incidents"
      className="inline-flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
    >
      <ArrowLeft className="size-3.5" aria-hidden="true" />
      All incidents
    </Link>
  )
}
