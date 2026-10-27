'use client'

import useSWR, { useSWRConfig } from 'swr'
import { useCallback } from 'react'
import { useApi } from '@/components/providers/api-provider'
import type { ApiError } from '@/lib/api/errors'
import type { IncidentListQuery } from '@/lib/types'

export function useIncidentList(query: IncidentListQuery) {
  const api = useApi()
  return useSWR<Awaited<ReturnType<typeof api.listIncidents>>, ApiError>(
    ['incidents', query],
    () => api.listIncidents(query),
    { keepPreviousData: true },
  )
}

export function useIncident(id: string) {
  const api = useApi()
  return useSWR<Awaited<ReturnType<typeof api.getIncident>>, ApiError>(['incident', id], () =>
    api.getIncident(id),
  )
}

export function useAnalytics() {
  const api = useApi()
  return useSWR<Awaited<ReturnType<typeof api.getAnalytics>>, ApiError>(['analytics'], () =>
    api.getAnalytics(),
  )
}

export function useAttachments(incidentId: string) {
  const api = useApi()
  return useSWR<Awaited<ReturnType<typeof api.listAttachments>>, ApiError>(
    ['attachments', incidentId],
    () => api.listAttachments(incidentId),
  )
}

/** Revalidate everything derived from incidents after a mutation. */
export function useRevalidateIncidents() {
  const { mutate } = useSWRConfig()
  return useCallback(
    (id?: string) => {
      mutate((key) => Array.isArray(key) && (key[0] === 'incidents' || key[0] === 'analytics'))
      if (id) mutate(['incident', id])
    },
    [mutate],
  )
}
