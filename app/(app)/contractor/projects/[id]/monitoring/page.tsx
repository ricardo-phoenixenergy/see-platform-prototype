import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getProject } from '@/server/queries/projects'
import { Activity } from 'lucide-react'

type Props = { params: Promise<{ id: string }> }

export default async function MonitoringPage({ params }: Props) {
  const { id } = await params
  const session = await auth()
  if (!session) redirect('/login')

  const project = await getProject(id, session.user.companyId)
  if (!project) notFound()

  if (project.stage !== 'OPERATIONAL') {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6">
        <Activity className="h-8 w-8 text-ink-300 mb-3" strokeWidth={1.5} />
        <p className="text-sm font-medium text-ink-900">
          Monitoring unlocks at Operational stage
        </p>
        <p className="text-xs text-ink-500 mt-1 max-w-sm">
          O&M dashboards, plant performance, and prescriptive maintenance alerts will be
          available once this project reaches the Operational stage.
        </p>
      </div>
    )
  }

  return (
    <div className="p-6 overflow-y-auto h-full">
      <p className="text-sm text-ink-500">O&M monitoring coming in Phase 5 (M8).</p>
    </div>
  )
}
