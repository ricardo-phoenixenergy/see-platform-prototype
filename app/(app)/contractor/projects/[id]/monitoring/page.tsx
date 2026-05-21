import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { getOmReadings } from '@/server/queries/client'
import { getEpcLicense } from '@/server/queries/payments'
import { PlantCharts } from '@/components/client/plant-charts'
import { SavingsView } from '@/components/client/savings-view'
import { EpcMonitoringPaywall } from '@/components/contractor/epc-monitoring-paywall'
import { calculateSavings, calculateDailySavings } from '@/lib/savings-calculator'
import type { SiteInfo } from '@/lib/site-info'
import type { TechScope } from '@/lib/tech-scope'
import { Activity } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'

type Props = {
  params: Promise<{ id: string }>
  searchParams: Promise<{ tab?: string }>
}

export default async function MonitoringPage({ params, searchParams }: Props) {
  const { id } = await params
  const { tab } = await searchParams
  const activeTab = tab === 'savings' ? 'savings' : 'overview'

  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  if (project.stage !== 'OPERATIONAL') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <Activity className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-ink-900">Monitoring unlocks at Operational stage</p>
        <p className="text-xs text-ink-500 mt-1 max-w-sm">
          O&amp;M dashboards, plant performance, and prescriptive maintenance alerts will be available once this project reaches the Operational stage.
        </p>
      </div>
    )
  }

  const [epcLicense, readings] = await Promise.all([
    getEpcLicense(id, session.user.companyId),
    getOmReadings(id),
  ])

  if (!epcLicense) {
    return (
      <EpcMonitoringPaywall
        projectId={id}
        hasClient={!!project.clientCompanyId}
      />
    )
  }

  const siteInfo = project.siteInfo as SiteInfo | null
  const scope = project.techScope as TechScope | null

  const savings = calculateSavings({
    readings: readings.map(r => ({
      productionKwh: r.productionKwh,
      consumptionKwh: r.consumptionKwh,
      gridImportKwh: r.gridImportKwh,
    })),
    tariffName: siteInfo?.tariffName,
    nmdKva: siteInfo?.nmdKva ?? 0,
    hasBess: scope?.hasBess ?? false,
  })

  const dailySavings = calculateDailySavings(
    readings.map(r => ({
      productionKwh: r.productionKwh,
      consumptionKwh: r.consumptionKwh,
      gridImportKwh: r.gridImportKwh,
      recordedAt: r.recordedAt,
    })),
    siteInfo?.tariffName
  )

  const tabs = [
    { label: 'Overview', value: 'overview' },
    { label: 'Savings', value: 'savings' },
  ]

  return (
    <div className="p-6 overflow-y-auto h-full max-w-6xl mx-auto">
      {/* Header + tabs */}
      <div className="mb-6 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold text-ink-900">O&amp;M Monitoring</h2>
          <p className="text-xs text-ink-500 mt-0.5">{project.name} · {project.systemSizeKw} kW · Last 30 days</p>
        </div>
        <div className="flex gap-1 border border-ink-200 rounded-lg p-1 bg-white">
          {tabs.map(t => (
            <Link
              key={t.value}
              href={`/contractor/projects/${id}/monitoring?tab=${t.value}`}
              className={cn(
                'px-3 py-1.5 rounded-md text-xs font-medium transition-colors',
                activeTab === t.value
                  ? 'bg-ink-900 text-white'
                  : 'text-ink-500 hover:text-ink-900'
              )}
            >
              {t.label}
            </Link>
          ))}
        </div>
      </div>

      {readings.length === 0 && (
        <p className="text-sm text-ink-500">No monitoring data available yet.</p>
      )}

      {readings.length > 0 && activeTab === 'overview' && (
        <PlantCharts
          readings={readings.map(r => ({
            recordedAt: r.recordedAt.toISOString(),
            productionKwh: r.productionKwh,
            batterySoCPercent: r.batterySoCPercent,
            consumptionKwh: r.consumptionKwh,
            irradianceWM2: r.irradianceWM2,
          }))}
          tier={epcLicense.tier}
        />
      )}

      {readings.length > 0 && activeTab === 'savings' && (
        <SavingsView
          savings={savings}
          dailySavings={dailySavings}
          nmdKva={siteInfo?.nmdKva ?? 0}
        />
      )}
    </div>
  )
}
