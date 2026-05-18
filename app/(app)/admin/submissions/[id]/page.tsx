import { notFound } from 'next/navigation'
import { getSubmissionDetail } from '@/server/queries/admin'
import { SubmissionReviewPanel } from '@/components/admin/submission-review-panel'
import Link from 'next/link'

type Props = { params: Promise<{ id: string }> }

export default async function SubmissionDetailPage({ params }: Props) {
  const { id } = await params
  const submission = await getSubmissionDetail(id)
  if (!submission) notFound()

  const artefacts = submission.artefacts as Array<{ name: string; url: string; fileSize?: number }>
  const requiredArtefacts = submission.milestone.requiredArtefacts as Array<{ name: string; allowedTypes: string[] }>

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-2 text-xs text-ink-400">
        <Link href="/admin/submissions" className="hover:text-ink-700 transition-colors">Submissions</Link>
        <span>/</span>
        <span className="text-ink-600">{submission.milestone.name}</span>
      </div>

      <div>
        <h2 className="text-base font-semibold text-ink-900">Submission Review</h2>
      </div>

      <SubmissionReviewPanel
        submission={{
          id: submission.id,
          status: submission.status,
          notes: submission.notes,
          feedback: submission.feedback,
          artefacts,
          verifications: submission.verifications.map((v) => ({
            id: v.id,
            type: v.type as string,
            status: v.status as string,
            qualityRating: v.qualityRating as string | null,
          })),
          milestone: {
            id: submission.milestone.id,
            name: submission.milestone.name,
            description: submission.milestone.description ?? '',
            isHardGate: submission.milestone.isHardGate,
            requiredArtefacts,
            project: {
              id: submission.milestone.project.id,
              name: submission.milestone.project.name,
              contractorCompany: {
                id: submission.milestone.project.contractorCompany.id,
                name: submission.milestone.project.contractorCompany.name,
              },
            },
          },
        }}
      />
    </div>
  )
}
