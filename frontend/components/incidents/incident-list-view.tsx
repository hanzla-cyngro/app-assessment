'use client'

import Link from 'next/link'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight, Search, X } from 'lucide-react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { EmptyState, ErrorState } from '@/components/common/states'
import { IncidentTable } from './incident-table'
import { useIncidentList } from '@/hooks/use-incidents'
import { useSession } from '@/components/providers/session-provider'
import { SEVERITIES, STATUSES, type IncidentListQuery, type IncidentStatus, type Severity } from '@/lib/types'

const PAGE_SIZE = 20
const ALL = 'all'

function parseQuery(params: URLSearchParams, meId: string | undefined): IncidentListQuery {
  const status = params.get('status')
  const severity = params.get('severity')
  const assignee = params.get('assignee')
  const page = Number(params.get('page') ?? '1')
  return {
    page: Number.isInteger(page) && page > 0 ? page : 1,
    pageSize: PAGE_SIZE,
    status: STATUSES.includes(status as IncidentStatus) ? (status as IncidentStatus) : undefined,
    severity: SEVERITIES.includes(severity as Severity) ? (severity as Severity) : undefined,
    assignedUserId: assignee === 'me' ? meId : assignee === 'unassigned' ? 'unassigned' : undefined,
    q: params.get('q')?.trim() || undefined,
  }
}

export function IncidentListView() {
  const params = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()
  const { operator } = useSession()
  const query = useMemo(() => parseQuery(new URLSearchParams(params.toString()), operator?.id), [params, operator?.id])
  const { data, error, isLoading, isValidating, mutate } = useIncidentList(query)
  const [search, setSearch] = useState(query.q ?? '')

  function update(next: Record<string, string | null>) {
    const sp = new URLSearchParams(params.toString())
    for (const [k, v] of Object.entries(next)) {
      if (v == null || v === '' || v === ALL) sp.delete(k)
      else sp.set(k, v)
    }
    if (!('page' in next)) sp.delete('page')
    const qs = sp.toString()
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
  }

  useEffect(() => {
    const id = setTimeout(() => {
      if ((query.q ?? '') !== search.trim()) update({ q: search.trim() || null })
    }, 300)
    return () => clearTimeout(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search])

  const hasFilters = Boolean(query.status || query.severity || params.get('assignee') || query.q)
  const assignee = params.get('assignee') ?? ALL

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search titles and descriptions"
            aria-label="Search incidents"
            className="h-9 pl-8"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterSelect
            label="Status"
            value={query.status ?? ALL}
            onChange={(v) => update({ status: v })}
            items={[{ value: ALL, label: 'All statuses' }, ...STATUSES.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="Severity"
            value={query.severity ?? ALL}
            onChange={(v) => update({ severity: v })}
            items={[{ value: ALL, label: 'All severities' }, ...SEVERITIES.map((s) => ({ value: s, label: s }))]}
          />
          <FilterSelect
            label="Assignee"
            value={assignee}
            onChange={(v) => update({ assignee: v })}
            items={[
              { value: ALL, label: 'Anyone' },
              { value: 'me', label: 'Assigned to me' },
              { value: 'unassigned', label: 'Unassigned' },
            ]}
          />
          {hasFilters && (
            <Button
              variant="ghost"
              size="lg"
              onClick={() => {
                setSearch('')
                router.replace(pathname, { scroll: false })
              }}
            >
              <X aria-hidden="true" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {error ? (
        <ErrorState error={error} onRetry={() => mutate()} />
      ) : data && data.items.length === 0 ? (
        <EmptyState
          title={hasFilters ? 'No matching incidents' : 'No incidents yet'}
          description={
            hasFilters ? 'Try adjusting or clearing the filters.' : 'When something breaks, declare an incident to start coordinating.'
          }
          action={
            hasFilters ? undefined : (
              <Link href="/incidents/new" className={buttonVariants()}>
                Declare incident
              </Link>
            )
          }
        />
      ) : (
        <div className={isValidating && data ? 'opacity-70 transition-opacity' : 'transition-opacity'}>
          <IncidentTable incidents={data?.items} loading={isLoading} />
        </div>
      )}

      {data && data.totalPages > 1 && (
        <nav aria-label="Pagination" className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page <span className="font-mono text-foreground">{data.page}</span> of{' '}
            <span className="font-mono text-foreground">{data.totalPages}</span> · {data.total} incidents
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={data.page <= 1}
              onClick={() => update({ page: String(data.page - 1) })}
            >
              <ChevronLeft aria-hidden="true" />
              Previous
            </Button>
            <Button
              variant="outline"
              disabled={data.page >= data.totalPages}
              onClick={() => update({ page: String(data.page + 1) })}
            >
              Next
              <ChevronRight aria-hidden="true" />
            </Button>
          </div>
        </nav>
      )}
    </div>
  )
}

function FilterSelect({
  label,
  value,
  onChange,
  items,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  items: { value: string; label: string }[]
}) {
  return (
    <Select items={items} value={value} onValueChange={(v) => onChange((v as string | null) ?? ALL)}>
      <SelectTrigger aria-label={label} className="h-9 min-w-36">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {items.map((item) => (
          <SelectItem key={item.value} value={item.value}>
            {item.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
