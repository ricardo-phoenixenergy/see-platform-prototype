'use client'
// components/admin/kyc-review-panel.tsx

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, MessageSquare, ExternalLink, Loader2 } from 'lucide-react'
import { approveKyc, rejectKyc, requestKycInfo } from '@/server/actions/admin'
import { cn } from '@/lib/utils'

type KycSubmission = {
  id: string
  cipcDocUrl: string | null
  vatDocUrl: string | null
  directorIdUrl: string | null
  status: string
  rejectionReason: string | null
  company: {
    name: string
    type: string
    registrationNo: string | null
    vatNo: string | null
  }
  createdAt: Date
}

type Props = {
  submission: KycSubmission
  onClose: () => void
  onDecision: () => void
}

export function KycReviewPanel({ submission, onClose, onDecision }: Props) {
  const [action, setAction] = useState<'approve' | 'reject' | 'request' | null>(null)
  const [reason, setReason] = useState('')
  const [isPending, startTransition] = useTransition()

  function handleAction(type: 'approve' | 'reject' | 'request') {
    if (type === 'approve') {
      startTransition(async () => {
        const fd = new FormData()
        fd.set('submissionId', submission.id)
        await approveKyc(fd)
        onDecision()
        onClose()
      })
      return
    }
    setAction(type)
  }

  function handleSubmitWithReason() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('submissionId', submission.id)
      fd.set('reason', reason)
      if (action === 'reject') await rejectKyc(fd)
      else await requestKycInfo(fd)
      onDecision()
      onClose()
    })
  }

  const docs = [
    { label: 'CIPC Certificate', url: submission.cipcDocUrl },
    { label: 'VAT Certificate', url: submission.vatDocUrl },
    { label: 'Director ID', url: submission.directorIdUrl },
  ].filter((d) => d.url)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink-900/30 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white rounded-xl border border-ink-200 shadow-2xl w-[520px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="px-6 py-4 border-b border-ink-100 flex items-start justify-between">
          <div>
            <p className="text-sm font-semibold text-ink-900">{submission.company.name}</p>
            <p className="text-xs text-ink-500">
              {submission.company.type} · Reg: {submission.company.registrationNo ?? '—'} · VAT: {submission.company.vatNo ?? '—'}
            </p>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-ink-700 text-lg leading-none ml-4">×</button>
        </div>

        {/* Documents */}
        <div className="px-6 py-4 border-b border-ink-100 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400 mb-3">Documents</p>
          {docs.length === 0 && <p className="text-sm text-ink-400">No documents uploaded.</p>}
          {docs.map((d) => (
            <a
              key={d.label}
              href={d.url!}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-accent-600 hover:underline"
            >
              <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
              {d.label}
            </a>
          ))}
        </div>

        {/* Actions */}
        <div className="px-6 py-4 space-y-4">
          {action === null && (
            <div className="flex gap-2">
              <button
                onClick={() => handleAction('approve')}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md bg-ink-900 text-white text-xs font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.5} />}
                Approve
              </button>
              <button
                onClick={() => handleAction('request')}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border border-ink-200 text-ink-600 text-xs font-medium hover:bg-ink-50 transition-colors"
              >
                <MessageSquare className="h-3.5 w-3.5" strokeWidth={1.5} />
                Request info
              </button>
              <button
                onClick={() => handleAction('reject')}
                className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-md border border-danger-200 text-danger-600 text-xs font-medium hover:bg-danger-50 transition-colors"
              >
                <XCircle className="h-3.5 w-3.5" strokeWidth={1.5} />
                Reject
              </button>
            </div>
          )}

          {action !== null && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-900">
                {action === 'reject' ? 'Rejection reason' : 'Request details'}
              </p>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                placeholder={
                  action === 'reject'
                    ? 'Explain why this KYC was rejected…'
                    : 'Specify what additional information is needed…'
                }
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm text-ink-900 placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitWithReason}
                  disabled={isPending || !reason.trim()}
                  className={cn(
                    'flex-1 h-8 rounded-md text-white text-xs font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5',
                    action === 'reject' ? 'bg-danger-600 hover:bg-danger-700' : 'bg-ink-900 hover:bg-ink-800'
                  )}
                >
                  {isPending && <Loader2 className="h-3 w-3 animate-spin" />}
                  {action === 'reject' ? 'Confirm rejection' : 'Send request'}
                </button>
                <button
                  onClick={() => setAction(null)}
                  className="h-8 px-3 rounded-md border border-ink-200 text-ink-600 text-xs hover:bg-ink-50 transition-colors"
                >
                  Back
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
