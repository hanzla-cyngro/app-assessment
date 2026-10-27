'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { SeverityBadge, StatusBadge } from './incident-badges'
import { AssigneeLabel } from './assignee'
import { formatRelative, shortId } from '@/lib/format'
import type { Incident } from '@/lib/types'

export function IncidentTable({
  incidents,
  loading,
  names,
  compact,
}: {
  incidents: Incident[] | undefined
  loading?: boolean
  names?: Map<string, string>
  compact?: boolean
}) {
  const router = useRouter()

  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow className="bg-card hover:bg-card">
            <TableHead className="w-[45%] pl-4">Incident</TableHead>
            <TableHead>Severity</TableHead>
            <TableHead>Status</TableHead>
            {!compact && <TableHead className="hidden md:table-cell">Assignee</TableHead>}
            <TableHead className="hidden pr-4 text-right sm:table-cell">Updated</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading && !incidents
            ? Array.from({ length: compact ? 4 : 8 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="pl-4">
                    <Skeleton className="h-4 w-64" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 rounded-full" />
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-4 w-20" />
                  </TableCell>
                  {!compact && (
                    <TableCell className="hidden md:table-cell">
                      <Skeleton className="h-4 w-24" />
                    </TableCell>
                  )}
                  <TableCell className="hidden pr-4 sm:table-cell">
                    <Skeleton className="ml-auto h-4 w-16" />
                  </TableCell>
                </TableRow>
              ))
            : incidents?.map((incident) => (
                <TableRow
                  key={incident.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/incidents/${incident.id}`)}
                >
                  <TableCell className="max-w-0 pl-4">
                    <div className="flex flex-col gap-0.5">
                      <Link
                        href={`/incidents/${incident.id}`}
                        className="truncate font-medium hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {incident.title}
                      </Link>
                      <span className="font-mono text-xs text-muted-foreground">INC-{shortId(incident.id)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <SeverityBadge severity={incident.severity} />
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={incident.status} />
                  </TableCell>
                  {!compact && (
                    <TableCell className="hidden md:table-cell">
                      <AssigneeLabel userId={incident.assignedUserId} names={names} />
                    </TableCell>
                  )}
                  <TableCell className="hidden pr-4 text-right text-sm text-muted-foreground sm:table-cell">
                    <time dateTime={incident.updatedAt}>{formatRelative(incident.updatedAt)}</time>
                  </TableCell>
                </TableRow>
              ))}
        </TableBody>
      </Table>
    </div>
  )
}
