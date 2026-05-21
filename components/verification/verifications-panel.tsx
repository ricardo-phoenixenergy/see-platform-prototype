'use client'
// components/verification/verifications-panel.tsx
// Loads verifications for the latest submission and renders result cards + action buttons.

import { useQuery } from '@tanstack/react-query'
import { VerificationResultCard } from './verification-result-card'
import { AiVerifyButton } from './ai-verify-button'
import { ExpertVerifyButton } from './expert-verify-button'

type VerificationRecord = {
  id: string
  type: 'AI_AGENT' | 'EXPERT' | 'AUTO_GOLD_MARKETPLACE'
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'IN_PROGRESS'
  qualityRating: 'RED' | 'AMBER' | 'GREEN' | 'GOLD' | null
  findings: Array<{ type: 'verified' | 'warning' | 'missing'; text: string }>
  notes: string | null
  confidence?: number | null
  completedAt: string | null
  createdAt: string
}

type Props = {
  milestoneId: string
  milestoneName: string
  showVerifyButtons: boolean
}

export function VerificationsPanel({ milestoneId, milestoneName, showVerifyButtons }: Props) {
  const { data, isLoading } = useQuery<{
    submissionId: string | null
    submissionVersion: number | null
    verifications: VerificationRecord[]
  }>({
    queryKey: ['milestone-verifications', milestoneId],
    queryFn: async () => {
      const res = await fetch(`/api/milestones/${milestoneId}/verifications`)
      if (!res.ok) throw new Error('Failed to load verifications')
      return res.json()
    },
  })

  if (isLoading) {
    return <div className="h-12 rounded-md bg-ink-50 animate-pulse" />
  }

  const verifications = data?.verifications ?? []
  const submissionId = data?.submissionId ?? null

  const hasAiVerification = verifications.some((v) => v.type === 'AI_AGENT')
  const hasExpertVerification = verifications.some((v) => v.type === 'EXPERT')

  if (verifications.length === 0 && !showVerifyButtons) return null

  return (
    <div className="space-y-3">
      {verifications.length > 0 && (
        <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Verification results</h3>
      )}
      {verifications.map((v) => (
        <VerificationResultCard key={v.id} verification={v} />
      ))}

      {showVerifyButtons && submissionId && (
        <div className="space-y-2">
          {verifications.length === 0 && (
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Verification</h3>
          )}
          <p className="text-xs text-ink-400">
            Optional — run AI or expert verification to strengthen your submission before admin review.
          </p>
          <div className="flex flex-wrap gap-2">
            {!hasAiVerification && (
              <AiVerifyButton
                submissionId={submissionId}
                milestoneName={milestoneName}
                milestoneId={milestoneId}
              />
            )}
            {!hasExpertVerification && (
              <ExpertVerifyButton
                submissionId={submissionId}
                milestoneId={milestoneId}
              />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
