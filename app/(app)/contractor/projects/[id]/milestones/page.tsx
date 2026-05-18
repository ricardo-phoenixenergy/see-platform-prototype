import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { MilestoneTracker } from '@/components/milestone/milestone-tracker'
import { GoldCertificateButton } from '@/components/milestone/gold-certificate-button'

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

  const allComplete = project.milestones.length > 0 &&
    project.milestones.every(m => ['APPROVED', 'AUTO_GOLD'].includes(m.status))

  return (
    <div className="p-6 max-w-3xl mx-auto overflow-y-auto h-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-ink-900">Milestone tracker</h2>
          <p className="text-xs text-ink-500 mt-0.5">
            {completedCount} of {project.milestones.length} milestones complete
          </p>
        </div>
      </div>

      {allComplete && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/30 px-5 py-4 flex items-center justify-between gap-4 mb-6">
          <div>
            <p className="text-sm font-semibold text-ink-900">All milestones complete</p>
            <p className="text-xs text-ink-500 mt-0.5">
              This project has achieved Gold Standard verification across all milestones.
            </p>
          </div>
          <GoldCertificateButton projectName={project.name} />
        </div>
      )}

      <MilestoneTracker milestones={project.milestones} projectId={id} />
    </div>
  )
}
