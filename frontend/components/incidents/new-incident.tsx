'use client'

import { IncidentForm } from './incident-form'
import { useWorkspacePresence } from '@/components/realtime/workspace-presence'

export function NewIncident() {
  const members = useWorkspacePresence()
  return <IncidentForm members={members} />
}
