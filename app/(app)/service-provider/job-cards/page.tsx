import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getSpJobCards } from '@/server/queries/marketplace'
import { JobCardKanban } from '@/components/marketplace/job-card-kanban'

export default async function SpJobCardsPage() {
  const session = await auth()
  if (!session) redirect('/login')

  const jobCards = await getSpJobCards(session.user.companyId)

  const kanbanItems = jobCards.map((jc) => ({
    id: jc.id,
    title: jc.rfq.title,
    project: jc.rfq.project.name,
    amountCents: jc.amountCents,
    status: jc.status,
  }))

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Job Cards</h2>
        <p className="text-sm text-ink-500">{jobCards.length} total job{jobCards.length !== 1 ? 's' : ''}.</p>
      </div>

      {jobCards.length === 0 && (
        <div className="flex flex-col items-center py-16 text-center">
          <p className="text-sm font-medium text-ink-900">No job cards yet</p>
          <p className="text-xs text-ink-500 mt-1">Win a bid on the Opportunity Board to create your first job card.</p>
        </div>
      )}

      {jobCards.length > 0 && <JobCardKanban jobCards={kanbanItems} />}
    </div>
  )
}
