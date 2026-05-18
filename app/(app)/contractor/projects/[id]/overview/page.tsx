import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatDate } from '@/lib/utils'

type Props = { params: Promise<{ id: string }> }

const TECH_LABELS: Record<string, string> = {
  SOLAR_PV: 'Solar PV',
  WIND: 'Wind',
  BESS: 'BESS',
  HYBRID: 'Hybrid',
}
const DEAL_LABELS: Record<string, string> = {
  OUTRIGHT: 'Outright',
  PPA: 'PPA',
  LEASE: 'Lease',
}
const GRID_LABELS: Record<string, string> = {
  GRID_TIED: 'Grid-tied',
  OFF_GRID: 'Off-grid',
  GRID_TIED_WITH_BACKUP: 'Grid-tied with backup',
}

export default async function OverviewPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  const rows = [
    { label: 'Technology', value: TECH_LABELS[project.technology] ?? project.technology },
    {
      label: 'System size',
      value: `${project.systemSizeKw} kW${project.storageSizeKwh ? ` + ${project.storageSizeKwh} kWh storage` : ''}`,
    },
    { label: 'Deal structure', value: DEAL_LABELS[project.dealStructure] ?? project.dealStructure },
    {
      label: 'Grid connection',
      value: GRID_LABELS[project.gridConnectionStatus] ?? project.gridConnectionStatus,
    },
    {
      label: 'Site',
      value: `${project.site.addressLine}, ${project.site.city}, ${project.site.province}`,
    },
    {
      label: 'Client',
      value: project.clientCompany?.name ?? project.externalClientName ?? '—',
    },
    { label: 'Created', value: formatDate(project.createdAt) },
  ]

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto h-full">
      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-ink-100">
            {rows.map(row => (
              <div
                key={row.label}
                className="flex items-start justify-between py-3 first:pt-0 last:pb-0"
              >
                <dt className="text-xs text-ink-400 uppercase tracking-widest w-40 flex-shrink-0">
                  {row.label}
                </dt>
                <dd className="text-sm text-ink-900 text-right flex-1">{row.value}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {project.clientNeeds && (
        <Card>
          <CardHeader>
            <CardTitle>Client needs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-ink-700 leading-relaxed">{project.clientNeeds}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
