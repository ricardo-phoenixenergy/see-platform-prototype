import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import type { TechScope } from '@/lib/tech-scope'
import {
  DESIGN_OBJECTIVE_LABELS, BESS_CHEMISTRY_LABELS,
  MOUNTING_TYPE_LABELS, WHEELING_TYPE_LABELS,
} from '@/lib/tech-scope'

type Props = { params: Promise<{ id: string }> }

const TECH_LABELS: Record<string, string> = {
  SOLAR_PV: 'Solar PV', WIND: 'Wind', BESS: 'BESS', HYBRID: 'Hybrid',
}
const DEAL_LABELS: Record<string, string> = {
  OUTRIGHT: 'Outright', PPA: 'PPA', LEASE: 'Lease', WHEELING_AGREEMENT: 'Wheeling agreement',
}
const GRID_LABELS: Record<string, string> = {
  GRID_TIED: 'Grid-tied', OFF_GRID: 'Off-grid', GRID_TIED_WITH_BACKUP: 'Grid-tied with backup',
}

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between py-3 first:pt-0 last:pb-0">
      <dt className="text-xs text-ink-400 uppercase tracking-widest w-44 flex-shrink-0">{label}</dt>
      <dd className="text-sm text-ink-900 text-right flex-1">{value}</dd>
    </div>
  )
}

export default async function OverviewPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  const scope = project.techScope as TechScope | null

  const clientName = project.clientRecord?.name
    ?? project.clientCompany?.name
    ?? project.externalClientName
    ?? '—'

  const technologies = scope
    ? [
        scope.hasPv && 'Solar PV',
        scope.hasBess && 'Battery Storage (BESS)',
        scope.hasWheeling && 'Wheeling / Energy Trading',
      ].filter(Boolean).join(', ')
    : TECH_LABELS[project.technology] ?? project.technology

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">

      {/* Main info */}
      <Card>
        <CardHeader><CardTitle>Project details</CardTitle></CardHeader>
        <CardContent>
          <dl className="divide-y divide-ink-100">
            <InfoRow label="Client" value={clientName} />
            <InfoRow label="Technologies" value={technologies} />
            <InfoRow
              label="System size"
              value={`${project.systemSizeKw} kW AC${project.storageSizeKwh ? ` + ${project.storageSizeKwh} kWh storage` : ''}`}
            />
            <InfoRow label="Deal structure" value={DEAL_LABELS[project.dealStructure] ?? project.dealStructure} />
            <InfoRow label="Grid connection" value={GRID_LABELS[project.gridConnectionStatus] ?? project.gridConnectionStatus} />
            <InfoRow label="Site" value={`${project.site.addressLine}, ${project.site.city}, ${project.site.province}`} />
            <InfoRow label="Created" value={formatDate(project.createdAt)} />
          </dl>
        </CardContent>
      </Card>

      {/* Tech scope detail cards — only shown for new projects with techScope JSON */}
      {scope && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {scope.hasPv && (
            <Card>
              <CardHeader><CardTitle>Solar PV</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  {scope.pvCapacityKwp && <InfoRow label="Capacity" value={`${scope.pvCapacityKwp} kWp`} />}
                  {scope.pvMountingType?.length ? (
                    <InfoRow
                      label="Mounting"
                      value={scope.pvMountingType.map(m => MOUNTING_TYPE_LABELS[m]).join(' + ')}
                    />
                  ) : null}
                </dl>
              </CardContent>
            </Card>
          )}

          {scope.hasBess && (
            <Card>
              <CardHeader><CardTitle>Battery Storage</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  {scope.bessCapacityKwh && <InfoRow label="Capacity" value={`${scope.bessCapacityKwh} kWh`} />}
                  {scope.bessPowerKw && <InfoRow label="Power rating" value={`${scope.bessPowerKw} kW`} />}
                  {scope.bessChemistry && <InfoRow label="Chemistry" value={BESS_CHEMISTRY_LABELS[scope.bessChemistry]} />}
                  {scope.bessAutonomyHours && <InfoRow label="Target autonomy" value={`${scope.bessAutonomyHours} hours`} />}
                </dl>
              </CardContent>
            </Card>
          )}

          {scope.hasWheeling && (
            <Card>
              <CardHeader><CardTitle>Wheeling / Trading</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  {scope.wheelingAgreementType && (
                    <InfoRow label="Agreement type" value={WHEELING_TYPE_LABELS[scope.wheelingAgreementType]} />
                  )}
                  {scope.wheelingDistanceKm && (
                    <InfoRow label="Wheeling distance" value={`${scope.wheelingDistanceKm} km`} />
                  )}
                  {scope.wheelingTradingPartner && (
                    <InfoRow label="Trading partner" value={scope.wheelingTradingPartner} />
                  )}
                </dl>
              </CardContent>
            </Card>
          )}

          {scope.designObjectives?.length > 0 && (
            <Card className="sm:col-span-2">
              <CardHeader><CardTitle>Design philosophy</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  <InfoRow
                    label="Objectives"
                    value={scope.designObjectives.map(o => DESIGN_OBJECTIVE_LABELS[o]).join(', ')}
                  />
                  {scope.targetBackupHours && (
                    <InfoRow label="Backup autonomy" value={`${scope.targetBackupHours} hours`} />
                  )}
                  <InfoRow label="Grid export" value={scope.exportToGrid ? 'Yes — bidirectional metering' : 'No'} />
                </dl>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {project.clientNeeds && (
        <Card>
          <CardHeader><CardTitle>Client needs</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm text-ink-700 leading-relaxed">{project.clientNeeds}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
