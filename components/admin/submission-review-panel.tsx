'use client'
// components/admin/submission-review-panel.tsx

import { useState, useTransition } from 'react'
import { CheckCircle, XCircle, MessageSquare, ExternalLink, Loader2, ShieldCheck, AlertTriangle } from 'lucide-react'
import { approveSubmission, rejectSubmission, requestSubmissionInfo } from '@/server/actions/admin'
import { cn } from '@/lib/utils'

type Artefact = { name: string; url: string; fileSize?: number }
type Verification = { id: string; type: string; status: string; qualityRating: string | null }

type Submission = {
  id: string
  status: string
  notes: string | null
  feedback: string | null
  artefacts: Artefact[]
  verifications: Verification[]
  milestone: {
    id: string
    name: string
    description: string
    isHardGate: boolean
    requiredArtefacts: Array<{ name: string; allowedTypes: string[] }>
    project: {
      id: string
      name: string
      contractorCompany: { id: string; name: string }
    }
  }
}

type Props = {
  submission: Submission
  onDecision?: () => void
}

const STATUS_COLOUR: Record<string, string> = {
  PASS: 'text-success-600',
  FAIL: 'text-danger-600',
  IN_PROGRESS: 'text-ink-400',
  INCONCLUSIVE: 'text-warning-600',
}

export function SubmissionReviewPanel({ submission, onDecision }: Props) {
  const [action, setAction] = useState<'reject' | 'request' | null>(null)
  const [feedback, setFeedback] = useState('')
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  const isDecided = ['APPROVED', 'REJECTED'].includes(submission.status) || done

  function handleApprove() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('submissionId', submission.id)
      await approveSubmission(fd)
      setDone(true)
      onDecision?.()
    })
  }

  function handleSubmitWithFeedback() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('submissionId', submission.id)
      fd.set('feedback', feedback)
      if (action === 'reject') await rejectSubmission(fd)
      else await requestSubmissionInfo(fd)
      setDone(true)
      onDecision?.()
    })
  }

  return (
    <div className="space-y-6">
      {/* Context */}
      <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3 space-y-0.5">
        <p className="text-xs text-ink-500">
          <span className="font-medium text-ink-700">{submission.milestone.project.contractorCompany.name}</span>
          {' · '}{submission.milestone.project.name}
        </p>
        <p className="text-sm font-semibold text-ink-900">{submission.milestone.name}</p>
        {submission.milestone.isHardGate && (
          <span className="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-sm bg-ink-900 text-white">Hard gate</span>
        )}
        {submission.notes && (
          <p className="text-xs text-ink-500 pt-1">Note from contractor: {submission.notes}</p>
        )}
      </div>

      {/* Artefacts */}
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Submitted artefacts</p>
        {submission.artefacts.length === 0 && <p className="text-sm text-ink-400">No artefacts submitted.</p>}
        {submission.artefacts.map((a, i) => (
          <a
            key={i}
            href={a.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 text-sm text-accent-600 hover:underline"
          >
            <ExternalLink className="h-3.5 w-3.5 flex-shrink-0" strokeWidth={1.5} />
            {a.name}
            {a.fileSize && <span className="text-xs text-ink-400">({Math.round(a.fileSize / 1024)} KB)</span>}
          </a>
        ))}
      </div>

      {/* Required artefacts checklist */}
      {submission.milestone.requiredArtefacts.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Required artefacts check</p>
          <ul className="space-y-1">
            {submission.milestone.requiredArtefacts.map((req, i) => {
              const found = submission.artefacts.some((a) =>
                a.name.toLowerCase().includes(req.name.toLowerCase())
              )
              return (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {found
                    ? <CheckCircle className="h-3.5 w-3.5 text-success-500 flex-shrink-0" strokeWidth={1.5} />
                    : <AlertTriangle className="h-3.5 w-3.5 text-warning-500 flex-shrink-0" strokeWidth={1.5} />
                  }
                  <span className={found ? 'text-ink-700' : 'text-warning-700'}>{req.name}</span>
                </li>
              )
            })}
          </ul>
        </div>
      )}

      {/* Verifications */}
      {submission.verifications.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-ink-400">Verifications</p>
          {submission.verifications.map((v) => (
            <div key={v.id} className="flex items-center gap-2 text-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-ink-400 flex-shrink-0" strokeWidth={1.5} />
              <span className="text-ink-600">{v.type.replace('_', ' ')}</span>
              <span className={cn('font-medium', STATUS_COLOUR[v.status] ?? 'text-ink-600')}>{v.status}</span>
              {v.qualityRating && <span className="text-xs text-ink-400">({v.qualityRating})</span>}
            </div>
          ))}
        </div>
      )}

      {/* Admin feedback already recorded */}
      {submission.feedback && !done && (
        <div className="rounded-md bg-ink-25 border border-ink-200 px-4 py-3">
          <p className="text-xs font-medium text-ink-500 mb-1">Previous admin feedback</p>
          <p className="text-sm text-ink-700">{submission.feedback}</p>
        </div>
      )}

      {/* Actions */}
      {!isDecided && (
        <div className="space-y-3 pt-2 border-t border-ink-100">
          {action === null && (
            <div className="flex gap-2">
              <button
                onClick={handleApprove}
                disabled={isPending}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md bg-ink-900 text-white text-sm font-medium hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4" strokeWidth={1.5} />}
                Approve
              </button>
              <button
                onClick={() => setAction('request')}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-ink-200 text-ink-600 text-sm font-medium hover:bg-ink-50 transition-colors"
              >
                <MessageSquare className="h-4 w-4" strokeWidth={1.5} />
                Request info
              </button>
              <button
                onClick={() => setAction('reject')}
                className="flex-1 flex items-center justify-center gap-1.5 h-9 rounded-md border border-danger-200 text-danger-600 text-sm font-medium hover:bg-danger-50 transition-colors"
              >
                <XCircle className="h-4 w-4" strokeWidth={1.5} />
                Reject
              </button>
            </div>
          )}

          {action !== null && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-ink-900">
                {action === 'reject' ? 'Rejection feedback' : 'Request details'}
              </p>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={4}
                placeholder={
                  action === 'reject'
                    ? 'Explain what was missing or incorrect. This will be shown to the contractor.'
                    : 'Specify what additional information or artefacts are required.'
                }
                className="w-full rounded-md border border-ink-200 px-3 py-2 text-sm placeholder:text-ink-400 focus:outline-none focus:ring-2 focus:ring-accent-500/20 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSubmitWithFeedback}
                  disabled={isPending || !feedback.trim()}
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
      )}

      {isDecided && (
        <div className="rounded-md bg-success-500/5 border border-success-500/20 px-4 py-3">
          <p className="text-sm font-medium text-success-700">Decision recorded.</p>
          <p className="text-xs text-ink-500 mt-0.5">The contractor will be notified of the outcome.</p>
        </div>
      )}
    </div>
  )
}
