import Link from 'next/link'
import { cn } from '@/lib/utils'
import type { ProjectWithRelations } from '@/server/queries/projects'

const STAGE_CONFIG: Record<string, { label: string; colour: string }> = {
  DEVELOPMENT: { label: 'Development', colour: '#9197A1' },
  FINANCING: { label: 'Financing', colour: '#3E5BEA' },
  CONSTRUCTION: { label: 'Construction', colour: '#C9892B' },
  COMMISSIONING: { label: 'Commissioning', colour: '#A56A3E' },
  OPERATIONAL: { label: 'Operational', colour: '#1E9D6B' },
  DECOMMISSIONED: { label: 'Decommissioned', colour: '#C9384A' },
}

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

type Props = { project: ProjectWithRelations }

export function ProjectCard({ project }: Props) {
  const stage = STAGE_CONFIG[project.stage] ?? { label: project.stage, colour: '#9197A1' }
  const approvedCount = project.milestones.filter(m => ['APPROVED', 'AUTO_GOLD'].includes(m.status)).length
  const totalCount = project.milestones.length
  const clientName = project.clientCompany?.name ?? project.externalClientName ?? 'No client assigned'

  return (
    <Link
      href={`/contractor/projects/${project.id}`}
      className={cn(
        'group flex overflow-hidden rounded-md border border-ink-200 bg-white shadow-xs',
        'hover:border-ink-300 hover:shadow-sm transition-all'
      )}
    >
      {/* Stage accent strip */}
      <div
        className="w-1 flex-shrink-0"
        style={{ backgroundColor: stage.colour }}
        aria-hidden="true"
      />

      <div className="flex-1 px-4 py-4 min-w-0">
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ink-900 truncate group-hover:text-accent-600 transition-colors">
              {project.name}
            </p>
            <p className="text-xs text-ink-500 truncate mt-0.5">{clientName}</p>
          </div>
          <span
            className="flex-shrink-0 text-[10px] font-semibold uppercase tracking-widest px-2 py-0.5 rounded-sm"
            style={{
              color: stage.colour,
              backgroundColor: `${stage.colour}18`,
              border: `1px solid ${stage.colour}30`,
            }}
          >
            {stage.label}
          </span>
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 text-xs text-ink-400">
          <span>{TECH_LABELS[project.technology] ?? project.technology}</span>
          <span className="text-ink-200">·</span>
          <span>{project.systemSizeKw >= 1000
            ? `${(project.systemSizeKw / 1000).toFixed(1)} MW`
            : `${project.systemSizeKw} kW`
          }</span>
          <span className="text-ink-200">·</span>
          <span>{DEAL_LABELS[project.dealStructure] ?? project.dealStructure}</span>
          {project.site && (
            <>
              <span className="text-ink-200">·</span>
              <span>{project.site.city}</span>
            </>
          )}
        </div>

        {/* Milestone progress */}
        {totalCount > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full rounded-full bg-ink-300 transition-all"
                style={{ width: `${Math.round((approvedCount / totalCount) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-ink-400 tabular-nums flex-shrink-0">
              {approvedCount}/{totalCount} milestones
            </span>
          </div>
        )}
      </div>
    </Link>
  )
}
