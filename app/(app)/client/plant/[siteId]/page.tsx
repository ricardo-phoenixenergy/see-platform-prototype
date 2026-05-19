import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { db } from '@/lib/db'
import { getOmReadings, getActiveLicense } from '@/server/queries/client'
import { PlantCharts } from '@/components/client/plant-charts'
import { PaywallGate } from '@/components/client/paywall-gate'

type Props = { params: Promise<{ siteId: string }> }

export default async function PlantDashboardPage({ params }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { siteId } = await params
  const companyId = session.user.companyId

  const project = await db.project.findFirst({
    where: { siteId, clientCompanyId: companyId },
    include: {
      site: true,
      contractorCompany: { select: { name: true } },
    },
  })
  if (!project) notFound()

  const [license, readings] = await Promise.all([
    getActiveLicense(project.id, companyId),
    project.stage === 'OPERATIONAL' ? getOmReadings(project.id) : Promise.resolve([]),
  ])

  const isActive = !!license && project.stage === 'OPERATIONAL'

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-base font-semibold text-ink-900">{project.name}</h1>
          <p className="text-xs text-ink-500 mt-0.5">
            {project.site.addressLine}, {project.site.city} · {project.systemSizeKw} kW ·
            Managed by {project.contractorCompany.name}
          </p>
        </div>
        {license && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-sm bg-success-500/10 text-success-600 flex-shrink-0">
            {license.tier} license active
          </span>
        )}
      </div>

      {!isActive && (
        <PaywallGate
          projectName={project.name}
          epcName={project.contractorCompany.name}
        />
      )}

      {isActive && readings.length > 0 && (
        <PlantCharts
          readings={readings.map((r) => ({
            recordedAt: r.recordedAt.toISOString(),
            productionKwh: r.productionKwh,
            batterySoCPercent: r.batterySoCPercent,
            consumptionKwh: r.consumptionKwh,
            irradianceWM2: r.irradianceWM2,
          }))}
          tier={license.tier}
        />
      )}

      {isActive && readings.length === 0 && (
        <div className="flex flex-col items-center py-12 text-center">
          <p className="text-sm font-medium text-ink-900">No readings yet</p>
          <p className="text-xs text-ink-500 mt-1">Monitoring data will appear once your inverter is connected.</p>
        </div>
      )}
    </div>
  )
}
