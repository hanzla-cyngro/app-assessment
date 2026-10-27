import type { Metadata } from 'next'
import { Suspense } from 'react'
import { PageHeader } from '@/components/common/page-header'
import { IncidentListView } from '@/components/incidents/incident-list-view'

export const metadata: Metadata = { title: 'Incidents' }

export default function IncidentsPage() {
  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader title="Incidents" description="Every incident in the workspace. Updates appear in real time." />
      <Suspense>
        <IncidentListView />
      </Suspense>
    </div>
  )
}
