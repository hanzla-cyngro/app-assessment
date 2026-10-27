'use client'

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { Skeleton } from '@/components/ui/skeleton'
import { useAnalytics } from '@/hooks/use-incidents'
import { SEVERITIES } from '@/lib/types'

const chartConfig = {
  count: { label: 'Active incidents', color: 'var(--chart-1)' },
} satisfies ChartConfig

const FILL: Record<string, string> = {
  Critical: 'var(--destructive)',
  Medium: 'var(--warning)',
  Low: 'var(--muted-foreground)',
}

export function SeverityChart() {
  const { data, isLoading } = useAnalytics()

  return (
    <section aria-labelledby="severity-chart-title" className="flex flex-col gap-4 rounded-lg border bg-card p-5">
      <div className="flex flex-col gap-1">
        <h2 id="severity-chart-title" className="text-sm font-medium">
          Active incidents by severity
        </h2>
        <p className="text-xs text-muted-foreground">Open and In Progress incidents, updated in real time.</p>
      </div>
      {isLoading || !data ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <ChartContainer config={chartConfig} className="h-64 w-full">
          <BarChart
            data={[...SEVERITIES].reverse().map((s) => ({ severity: s, count: data.activeBySeverity[s], fill: FILL[s] }))}
            margin={{ left: -20, right: 8, top: 8 }}
          >
            <CartesianGrid vertical={false} strokeDasharray="3 3" />
            <XAxis dataKey="severity" tickLine={false} axisLine={false} tickMargin={8} />
            <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
            <ChartTooltip cursor={{ fill: 'var(--accent)' }} content={<ChartTooltipContent hideLabel />} />
            <Bar dataKey="count" radius={4} maxBarSize={72} />
          </BarChart>
        </ChartContainer>
      )}
    </section>
  )
}
