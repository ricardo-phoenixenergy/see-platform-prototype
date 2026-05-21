import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import type { TechScope } from '@/lib/tech-scope'
import {
  DESIGN_OBJECTIVE_LABELS, BESS_CHEMISTRY_LABELS,
  MOUNTING_TYPE_LABELS, WHEELING_TYPE_LABELS, INVERTER_TOPOLOGY_LABELS,
} from '@/lib/tech-scope'
import type { SiteInfo } from '@/lib/site-info'
import { ESKOM_TARIFFS, MUNICIPAL_TARIFFS } from '@/lib/site-info'

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

function parseSiteInfo(raw: unknown): SiteInfo | null {
  if (!raw || typeof raw !== 'object') return null
  const s = raw as Record<string, unknown>
  if (!s.supplier || s.nmdKva === undefined || !s.supplyVoltage) return null
  return raw as SiteInfo
}

function SiteSupplyCard({ s }: { s: SiteInfo }) {
  const allTariffs = [...ESKOM_TARIFFS, ...MUNICIPAL_TARIFFS]
  const tariffLabel = s.tariffName
    ? allTariffs.find(t => t.value === s.tariffName)?.label ?? s.tariffName
    : null
  const supplierLabel = s.supplier === 'ESKOM' ? 'Eskom' : (s.municipalityName ?? 'Municipal utility')
  return (
    <Card>
      <CardHeader><CardTitle>Site supply</CardTitle></CardHeader>
      <CardContent>
        <dl className="divide-y divide-ink-100">
          <InfoRow label="Supplier" value={supplierLabel} />
          {tariffLabel && (
            <InfoRow
              label="Tariff"
              value={
                <span className="flex items-center gap-2 justify-end">
                  {tariffLabel}
                  {s.isTOU && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-ink-100 text-ink-600">TOU</span>
                  )}
                </span>
              }
            />
          )}
          <InfoRow label="NMD" value={`${s.nmdKva} kVA`} />
          <InfoRow label="Supply voltage" value={s.supplyVoltage} />
          {s.transformerCapacityKva && (
            <InfoRow label="Transformer" value={`${s.transformerCapacityKva} kVA`} />
          )}
          {s.accountNumber && (
            <InfoRow label="Account ref." value={s.accountNumber} />
          )}
        </dl>
      </CardContent>
    </Card>
  )
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

  const parsedSiteInfo = parseSiteInfo(project.siteInfo)

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">

      {/* Edit action */}
      <div className="flex justify-end">
        <Link
          href={`/contractor/projects/${id}/edit`}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-ink-200 px-3 text-xs font-medium text-ink-600 hover:bg-ink-50 transition-colors"
        >
          <Pencil className="h-3.5 w-3.5" />
          Edit project
        </Link>
      </div>

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

      {/* Site supply */}
      {parsedSiteInfo && <SiteSupplyCard s={parsedSiteInfo} />}

      {/* Tech scope detail cards — only shown for new projects with techScope JSON */}
      {scope && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {scope.hasPv && (
            <Card>
              <CardHeader><CardTitle>Solar PV</CardTitle></CardHeader>
              <CardContent>
                <dl className="divide-y divide-ink-100">
                  {scope.pvInverterKw && (
                    <InfoRow
                      label={scope.inverterTopology === 'HYBRID' ? 'Hybrid inverter' : 'PV inverter'}
                      value={`${scope.pvInverterKw} kW AC`}
                    />
                  )}
                  {scope.inverterTopology && (
                    <InfoRow label="Topology" value={INVERTER_TOPOLOGY_LABELS[scope.inverterTopology].label} />
                  )}
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
                  {scope.bessInverterKw && <InfoRow label="PCS rating" value={`${scope.bessInverterKw} kW`} />}
                  {scope.bessCapacityKwh && <InfoRow label="Capacity" value={`${scope.bessCapacityKwh} kWh`} />}
                  {scope.bessChemistry && <InfoRow label="Chemistry" value={BESS_CHEMISTRY_LABELS[scope.bessChemistry]} />}
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
                  {scope.wheelingCapacityKw && (
                    <InfoRow label="Contracted capacity" value={`${scope.wheelingCapacityKw} kW`} />
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
