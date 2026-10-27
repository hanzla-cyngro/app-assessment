'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { EmptyState, ErrorState } from '@/components/common/states'
import { IncidentTable } from './incident-table'
import { useIncidentList } from '@/hooks/use-incidents'

export function ActiveIncidents() {
  const critical = useIncidentList({ severity: 'Critical', status: 'Open', pageSize: 5 })
  const inProgress = useIncidentList({ status: 'In Progress', pageSize: 5 })

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <Section
        title="Open critical incidents"
        href="/incidents?severity=Critical&status=Open"
        state={critical}
        emptyText="No open critical incidents. Nice."
      />
      <Section
        title="In progress"
        href="/incidents?status=In+Progress"
        state={inProgress}
        emptyText="Nobody is actively working an incident."
      />
    </div>
  )
}

function Section({
  title,
  href,
  state,
  emptyText,
}: {
  title: string
  href: string
  state: ReturnType<typeof useIncidentList>
  emptyText: string
}) {
  return (
    <section className="flex flex-col gap-3" aria-labelledby={`${href}-title`}>
      <div className="flex items-center justify-between">
        <h2 id={`${href}-title`} className="text-sm font-medium">
          {title}
          {state.data && <span className="ml-2 font-mono text-muted-foreground">{state.data.total}</span>}
        </h2>
        <Link href={href} className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
          View all
          <ArrowRight className="size-3.5" aria-hidden="true" />
        </Link>
      </div>
      {state.error ? (
        <ErrorState error={state.error} onRetry={() => state.mutate()} />
      ) : state.data && state.data.items.length === 0 ? (
        <EmptyState title="All clear" description={emptyText} />
      ) : (
        <IncidentTable incidents={state.data?.items} loading={state.isLoading} compact />
      )}
    </section>
  )
}
