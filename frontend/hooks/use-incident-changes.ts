'use client'

import { useEffect } from 'react'
import { useSWRConfig } from 'swr'
import { getSupabase } from '@/lib/supabase/client'
import { useSession } from '@/components/providers/session-provider'

/** Trusted event published by NestJS after a successful DB write. Contains no incident data. */
export interface IncidentChangedEvent {
  incidentId: string
  type: 'incident.created' | 'incident.updated' | 'incident.status_changed' | 'attachment.added'
  at: string
}

export const INCIDENT_CHANGES_CHANNEL = 'workspace:incident-changes'

/** Revalidates incident data from the API when a trusted change notification arrives (live mode). */
export function useIncidentChanges() {
  const { mutate } = useSWRConfig()
  const { operator } = useSession()
  const userId = operator?.id

  useEffect(() => {
    const supabase = getSupabase()
    if (!supabase || !userId) return
    const channel = supabase
      .channel(INCIDENT_CHANGES_CHANNEL, { config: { private: true } })
      .on('broadcast', { event: 'incident-changed' }, ({ payload }) => {
        const event = payload as IncidentChangedEvent
        mutate((key) => Array.isArray(key) && (key[0] === 'incidents' || key[0] === 'analytics'))
        mutate(['incident', event.incidentId])
        if (event.type === 'attachment.added') mutate(['attachments', event.incidentId])
      })
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [mutate, userId])
}
