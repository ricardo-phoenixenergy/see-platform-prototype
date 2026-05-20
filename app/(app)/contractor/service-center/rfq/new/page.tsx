import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { db } from '@/lib/db'
import { RfqForm } from '@/components/marketplace/rfq-form'
import { getSpProfileForContractor } from '@/server/queries/marketplace'

type Props = { searchParams: Promise<{ milestone?: string; provider?: string }> }

export default async function NewRfqPage({ searchParams }: Props) {
  const session = await auth()
  if (!session) redirect('/login')

  const { milestone: milestoneId, provider: providerCompanyId } = await searchParams
  const companyId = session.user.companyId

  const [projects, milestone, spData] = await Promise.all([
    db.project.findMany({
      where: { contractorCompanyId: companyId, deletedAt: null },
      select: { id: true, name: true },
      orderBy: { createdAt: 'desc' },
    }),
    milestoneId
      ? db.milestone.findFirst({
          where: { id: milestoneId, project: { contractorCompanyId: companyId } },
          select: { id: true, name: true, projectId: true },
        })
      : Promise.resolve(null),
    providerCompanyId ? getSpProfileForContractor(providerCompanyId) : Promise.resolve(null),
  ])

  const defaultProjectId = milestone?.projectId ?? projects[0]?.id ?? ''

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div>
        <h2 className="text-base font-semibold text-ink-900">Post RFQ</h2>
        <p className="text-sm text-ink-500">Invite verified service providers to bid on this work.</p>
      </div>

      {projects.length === 0 ? (
        <p className="text-sm text-danger-600">No projects found. Create a project before posting an RFQ.</p>
      ) : (
        <RfqForm
          projectId={defaultProjectId}
          {...(milestone ? { milestoneId: milestone.id, milestoneName: milestone.name } : {})}
          {...(spData ? {
            providerCategories: spData.profile.categories,
            providerName: spData.profile.company.name,
            providerCompanyId,
          } : {})}
        />
      )}
    </div>
  )
}
