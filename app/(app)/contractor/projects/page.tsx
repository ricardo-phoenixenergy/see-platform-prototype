import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getProjects } from '@/server/queries/projects'
import { ProjectCard } from '@/components/project/project-card'
import { EmptyState } from '@/components/ui/empty-state'
import { buttonVariants } from '@/components/ui/button'
import Link from 'next/link'
import { FolderOpen, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

const STAGE_FILTERS = [
  { value: 'ALL', label: 'All stages' },
  { value: 'DEVELOPMENT', label: 'Development' },
  { value: 'FINANCING', label: 'Financing' },
  { value: 'CONSTRUCTION', label: 'Construction' },
  { value: 'COMMISSIONING', label: 'Commissioning' },
  { value: 'OPERATIONAL', label: 'Operational' },
]

const TECH_FILTERS = [
  { value: 'ALL', label: 'All types' },
  { value: 'SOLAR_PV', label: 'Solar PV' },
  { value: 'WIND', label: 'Wind' },
  { value: 'BESS', label: 'BESS' },
  { value: 'HYBRID', label: 'Hybrid' },
]

type Props = {
  searchParams: Promise<{ stage?: string; technology?: string; search?: string }>
}

export default async function ProjectsPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const params = await searchParams
  const filters: { stage?: string; technology?: string; search?: string } = {}
  if (params.stage !== undefined) filters.stage = params.stage
  if (params.technology !== undefined) filters.technology = params.technology
  if (params.search !== undefined) filters.search = params.search
  const projects = await getProjects(session.user.companyId, filters)

  const activeStage = params.stage ?? 'ALL'
  const activeTech = params.technology ?? 'ALL'

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Projects</h1>
          <p className="text-sm text-ink-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/contractor/projects/new"
          className={cn(buttonVariants({ variant: 'primary', size: 'sm' }), 'inline-flex items-center gap-1.5')}
        >
          <Plus className="h-4 w-4" />
          New project
        </Link>
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap gap-2">
        {STAGE_FILTERS.map(f => (
          <Link
            key={f.value}
            href={`/contractor/projects?stage=${f.value}&technology=${activeTech}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeStage === f.value
                ? 'bg-ink-900 text-white'
                : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
        <div className="w-px bg-ink-200 mx-1" />
        {TECH_FILTERS.map(f => (
          <Link
            key={f.value}
            href={`/contractor/projects?stage=${activeStage}&technology=${f.value}`}
            className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
              activeTech === f.value
                ? 'bg-ink-900 text-white'
                : 'border border-ink-200 text-ink-600 hover:bg-ink-50'
            }`}
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Grid */}
      {projects.length === 0 ? (
        <EmptyState
          icon={FolderOpen}
          title="No projects found"
          description="Try adjusting the filters, or create your first project."
          action={{ label: 'New project', href: '/contractor/projects/new' }}
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  )
}
