import { EditIncident } from '@/components/incidents/edit-incident'

export default async function EditIncidentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <EditIncident id={id} />
}
