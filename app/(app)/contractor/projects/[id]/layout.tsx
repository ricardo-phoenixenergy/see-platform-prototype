import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import Link from 'next/link'
import { TabNav } from './tab-nav'

type Props = {
  params: Promise<{ id: string }>
  children: React.ReactNode
}

const STAGE_LABELS: Record<string, string> = {
  DEVELOPMENT: 'Development',
  FINANCING: 'Financing',
  CONSTRUCTION: 'Construction',
  COMMISSIONING: 'Commissioning',
  OPERATIONAL: 'Operational',
  DECOMMISSIONED: 'Decommissioned',
}

export default async function ProjectWorkspaceLayout({ params, children }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  const isOperational = project.stage === 'OPERATIONAL'
  const tabs = [
    { label: 'Overview', href: `/contractor/projects/${id}/overview` },
    { label: 'Milestones', href: `/contractor/projects/${id}/milestones` },
    { label: 'Monitoring', href: `/contractor/projects/${id}/monitoring`, locked: !isOperational },
    { label: 'Communications', href: `/contractor/projects/${id}/comms` },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Workspace header */}
      <div className="border-b border-ink-200 bg-white px-6 pt-6 pb-0 flex-shrink-0">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Link
                href="/contractor/projects"
                className="text-xs text-ink-400 hover:text-ink-700 transition-colors"
              >
                Projects
              </Link>
              <span className="text-xs text-ink-300">/</span>
              <span className="text-xs text-ink-600">{project.name}</span>
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-ink-900">{project.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-ink-500">
                {project.clientCompany?.name ?? project.externalClientName}
              </span>
              <span className="text-ink-200 text-xs">·</span>
              <span className="text-xs text-ink-500">
                {STAGE_LABELS[project.stage] ?? project.stage}
              </span>
              <span className="text-ink-200 text-xs">·</span>
              <span className="text-xs text-ink-500">{project.systemSizeKw} kW</span>
            </div>
          </div>
        </div>

        {/* Tab bar — client component for active state via usePathname */}
        <TabNav tabs={tabs} />
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
