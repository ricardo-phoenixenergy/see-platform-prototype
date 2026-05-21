import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import type { TechScope } from '@/lib/tech-scope'
import type { SiteInfo } from '@/lib/site-info'
import { EditProjectForm } from './edit-project-form'

type Props = { params: Promise<{ id: string }> }

export default async function EditProjectPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  const scope = project.techScope as TechScope | null
  const si = project.siteInfo as SiteInfo | null

  const defaultValues = {
    name: project.name,
    addressLine: project.site.addressLine,
    city: project.site.city,
    province: project.site.province,
    clientNeeds: project.clientNeeds ?? '',

    supplier: (si?.supplier ?? 'MUNICIPAL') as 'ESKOM' | 'MUNICIPAL',
    municipalityName: si?.municipalityName ?? '',
    tariffName: si?.tariffName ?? '',
    isTOU: si?.isTOU ?? false,
    nmdKva: si?.nmdKva,
    supplyVoltage: (si?.supplyVoltage ?? 'LV') as 'LV' | 'MV' | 'HV',
    transformerCapacityKva: si?.transformerCapacityKva,
    accountNumber: si?.accountNumber ?? '',

    hasPv: scope?.hasPv ?? false,
    hasBess: scope?.hasBess ?? false,
    hasWheeling: scope?.hasWheeling ?? false,
    inverterTopology: scope?.inverterTopology,
    pvInverterKw: scope?.pvInverterKw,
    pvArrayKwp: scope?.pvArrayKwp,
    bessInverterKw: scope?.bessInverterKw,
    pvMountingType: scope?.pvMountingType ?? [],
    bessCapacityKwh: scope?.bessCapacityKwh,
    bessChemistry: scope?.bessChemistry,
    wheelingAgreementType: scope?.wheelingAgreementType,
    wheelingCapacityKw: scope?.wheelingCapacityKw,
    wheelingDistanceKm: scope?.wheelingDistanceKm,
    wheelingTradingPartner: scope?.wheelingTradingPartner ?? '',
    designObjectives: (scope?.designObjectives ?? ['SELF_CONSUMPTION']) as (
      'SELF_CONSUMPTION' | 'PEAK_SHAVING' | 'BACKUP' | 'GRID_EXPORT' | 'ARBITRAGE'
    )[],
    exportToGrid: scope?.exportToGrid ?? false,

    dealStructure: project.dealStructure as 'OUTRIGHT' | 'PPA' | 'LEASE' | 'WHEELING_AGREEMENT',
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6 overflow-y-auto h-full">
      <EditProjectForm projectId={id} projectName={project.name} defaultValues={defaultValues} />
    </div>
  )
}
