import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getClientProjects } from '@/server/queries/client'
import Link from 'next/link'
import { cn } from '@/lib/utils'

const STAGE_LABEL: Record<string, string> = {
  PLANNING: 'Planning', DESIGN: 'Design', PROCUREMENT: 'Procurement',
  CONSTRUCTION: 'Construction', COMMISSIONING: 'Commissioning',
  OPERATIONAL: 'Operational', DECOMMISSIONED: 'Decommissioned',
}

export default async function PortfolioPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const projects = await getClientProjects(session.user.companyId)

  const totalKw = projects.reduce((s, p) => s + p.systemSizeKw, 0)
  const operationalCount = projects.filter((p) => p.stage === 'OPERATIONAL').length

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-base font-semibold text-ink-900">Portfolio</h1>
        <p className="text-sm text-ink-500">
          {projects.length} site{projects.length !== 1 ? 's' : ''} · {totalKw.toLocaleString()} kW total · {operationalCount} operational
        </p>
      </div>

      {projects.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No sites yet</p>
          <p className="text-xs text-ink-500 mt-1">
            Your energy installations will appear here once your contractor creates your project.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {projects.map((project) => {
          const license = project.omLicenses[0]
          return (
            <Link
              key={project.id}
              href={`/client/plant/${project.siteId}`}
              className="flex items-start gap-4 rounded-lg border border-ink-200 bg-white px-5 py-4 hover:border-ink-300 transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-ink-900">{project.name}</p>
                <p className="text-xs text-ink-500 mt-0.5">
                  {project.site.city}, {project.site.province} · {project.systemSizeKw} kW · {project.contractorCompany.name}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                {license && (
                  <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-success-500/10 text-success-600">
                    {license.tier}
                  </span>
                )}
                <span className={cn(
                  'text-[10px] font-semibold px-1.5 py-0.5 rounded-sm',
                  project.stage === 'OPERATIONAL' ? 'bg-success-500/10 text-success-600' : 'bg-ink-100 text-ink-600'
                )}>
                  {STAGE_LABEL[project.stage] ?? project.stage}
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
