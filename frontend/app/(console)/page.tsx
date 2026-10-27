import { PageHeader } from '@/components/common/page-header'
import { KpiGrid } from '@/components/analytics/kpi-grid'
import { ActiveIncidents } from '@/components/incidents/active-incidents'

export default function OverviewPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader title="Overview" description="Live operational posture across the workspace." />
      <KpiGrid />
      <ActiveIncidents />
    </div>
  )
}
