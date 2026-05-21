'use client'
// components/verification/expert-verify-button.tsx

import { useState } from 'react'
import { Star, Loader2 } from 'lucide-react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
type Props = {
  submissionId: string
  milestoneId: string
}

export function ExpertVerifyButton({ submissionId, milestoneId }: Props) {
  const [open, setOpen] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const queryClient = useQueryClient()

  const request = useMutation<{ verificationId: string }, Error>({
    mutationFn: async () => {
      const res = await fetch('/api/ai/expert-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionId }),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        throw new Error(err.error ?? 'Failed to request expert verification')
      }
      return res.json() as Promise<{ verificationId: string }>
    },
    onSuccess: () => {
      setSubmitted(true)
      setOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['milestone-verifications', milestoneId] })
    },
  })

  if (submitted) {
    return (
      <div className="flex items-center gap-2 text-xs text-ink-500">
        <Star className="h-3.5 w-3.5 text-amber-500" strokeWidth={1.5} />
        Expert verification requested — you will be notified when the review is complete.
      </div>
    )
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs font-medium hover:bg-ink-50 transition-colors"
      >
        <Star className="h-3.5 w-3.5" strokeWidth={1.5} />
        Expert verification
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}
        >
          <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-[440px] p-6 space-y-4">
            <div>
              <p className="text-sm font-semibold text-ink-900 mb-1">Request Expert Verification</p>
              <p className="text-xs text-ink-500">
                A qualified independent expert will review your submission and provide a colour-coded quality rating
                (RED / AMBER / GREEN / GOLD). Expert reviews typically complete within 2–5 business days.
              </p>
            </div>
            <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-ink-500">Turnaround</span>
                <span className="font-semibold text-ink-900">2–5 business days</span>
              </div>
            </div>
            {request.error && (
              <p className="text-xs text-danger-500">{request.error.message}</p>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => request.mutate()}
                disabled={request.isPending}
                className="flex-1 h-8 flex items-center justify-center gap-1.5 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                {request.isPending && <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} />}
                Confirm request
              </button>
              <button
                onClick={() => setOpen(false)}
                className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
