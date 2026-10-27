import type { Metadata } from 'next'
import { PageHeader } from '@/components/common/page-header'
import { KpiGrid } from '@/components/analytics/kpi-grid'
import { SeverityChart } from '@/components/analytics/severity-chart'

export const metadata: Metadata = { title: 'Analytics' }

export default function AnalyticsPage() {
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8">
      <PageHeader title="Analytics" description="Workload and response performance for the workspace." />
      <KpiGrid />
      <SeverityChart />
    </div>
  )
}
