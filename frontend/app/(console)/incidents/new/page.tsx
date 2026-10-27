import type { Metadata } from 'next'
import { PageHeader } from '@/components/common/page-header'
import { NewIncident } from '@/components/incidents/new-incident'

export const metadata: Metadata = { title: 'Declare incident' }

export default function NewIncidentPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Declare incident" description="Open a new incident and notify the workspace." />
      <NewIncident />
    </div>
  )
}
