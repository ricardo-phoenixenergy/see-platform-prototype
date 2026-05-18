import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { MilestoneTracker } from '@/components/milestone/milestone-tracker'

type Props = { params: Promise<{ id: string }> }

export default async function MilestonesPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  const completedCount = project.milestones.filter(m =>
    ['APPROVED', 'AUTO_GOLD'].includes(m.status)
  ).length

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Milestone tracker</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {completedCount} of {project.milestones.length} milestones complete
          </p>
        </div>
      </div>
      <MilestoneTracker milestones={project.milestones} projectId={id} />
    </div>
  )
}
