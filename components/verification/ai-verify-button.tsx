'use client'
// components/verification/ai-verify-button.tsx
// Manages the full AI verification flow: confirm → overlay → result.

import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Zap, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { VerificationStubResult } from '@/lib/ai/verification-stubs'
import { AiVerificationOverlay } from './ai-verification-overlay'
import { VerificationResultCard } from './verification-result-card'

type ApiResponse = {
  verification: {
    id: string
    status: string
    findings: VerificationStubResult['findings']
    confidence: number
    recommendation: string | null
  }
}

type Props = {
  submissionId: string
  milestoneName: string
  milestoneId: string
}

type Phase = 'idle' | 'confirming' | 'analysing' | 'done'

export function AiVerifyButton({ submissionId, milestoneName, milestoneId }: Props) {
  const [phase, setPhase] = useState<Phase>('idle')
  const [result, setResult] = useState<ApiResponse['verification'] | null>(null)
  const queryClient = useQueryClient()

  const verify = useMutation<ApiResponse, Error>({
    mutationFn: async () => {
      const res = await fetch('/api/ai/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Verification failed')
      }
      return res.json() as Promise<ApiResponse>
    },
    onSuccess: (data) => {
      setResult(data.verification)
      setPhase('done')
      void queryClient.invalidateQueries({ queryKey: ['milestone-verifications', milestoneId] })
    },
    onError: () => {
      setPhase('idle')
    },
  })

  function handleConfirm() {
    setPhase('analysing')
    verify.mutate()
  }

  if (phase === 'done' && result) {
    return (
      <VerificationResultCard
        verification={{
          id: result.id,
          type: 'AI_AGENT',
          status: result.status as 'PASS' | 'FAIL',
          qualityRating: result.status === 'PASS' ? 'GREEN' : 'AMBER',
          findings: result.findings,
          notes: result.recommendation,
          confidence: result.confidence,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        }}
        animate
      />
    )
  }

  return (
    <>
      {phase === 'idle' && (
        <button
          onClick={() => setPhase('confirming')}
          className="flex items-center gap-2 h-8 px-3 rounded-md border border-accent-400 text-accent-600 text-xs font-medium hover:bg-accent-500/5 transition-colors"
        >
          <Zap className="h-3.5 w-3.5" strokeWidth={1.5} />
          Verify with AI
        </button>
      )}

      {phase === 'confirming' && (
        <div className="rounded-md border border-ink-200 bg-ink-25 p-4 space-y-3">
          <p className="text-sm font-medium text-ink-900">Confirm AI Verification</p>
          <p className="text-xs text-ink-500">
            The AI Verification Agent will analyse your submission against milestone requirements.
            This action cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleConfirm}
              className="h-7 px-3 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors"
            >
              Confirm — Verify now
            </button>
            <button
              onClick={() => setPhase('idle')}
              className="h-7 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {phase === 'analysing' && (
        <div className="flex items-center gap-2 text-sm text-ink-500">
          <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          Analysing submission…
        </div>
      )}

      <AnimatePresence>
        {phase === 'analysing' && (
          <AiVerificationOverlay
            milestoneName={milestoneName}
            onComplete={() => { /* handled by mutation onSuccess */ }}
          />
        )}
      </AnimatePresence>
    </>
  )
}
