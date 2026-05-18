import { formatDate } from '@/lib/utils'
import { CheckCircle, XCircle, Clock, FileText } from 'lucide-react'

type Submission = {
  id: string
  version: number
  status: string
  createdAt: Date
  notes: string | null
  feedback: string | null
  artefacts: unknown
}

const STATUS_CONFIG: Record<string, { label: string; icon: React.ElementType; className: string }> = {
  PENDING: { label: 'Pending', icon: Clock, className: 'text-ink-400' },
  UNDER_REVIEW: { label: 'Under review', icon: Clock, className: 'text-warning-500' },
  APPROVED: { label: 'Approved', icon: CheckCircle, className: 'text-success-500' },
  REJECTED: { label: 'Rejected', icon: XCircle, className: 'text-danger-500' },
  REQUEST_INFO: { label: 'Info requested', icon: Clock, className: 'text-warning-500' },
}

const DEFAULT_STATUS = { label: 'Unknown', icon: Clock, className: 'text-ink-400' }

type Props = { submissions: Submission[] }

export function SubmissionHistory({ submissions }: Props) {
  if (submissions.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-ink-400">Submission history</h3>
      <ul className="space-y-2">
        {submissions.map(sub => {
          const config = STATUS_CONFIG[sub.status] ?? DEFAULT_STATUS
          const Icon = config.icon
          const artefactCount = Array.isArray(sub.artefacts) ? sub.artefacts.length : 0
          return (
            <li key={sub.id} className="rounded-md border border-ink-200 px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-ink-500">Version {sub.version}</span>
                  <Icon className={`h-3.5 w-3.5 ${config.className}`} strokeWidth={1.5} />
                  <span className={`text-xs ${config.className}`}>{config.label}</span>
                </div>
                <span className="text-xs text-ink-400">{formatDate(sub.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-ink-400">
                <FileText className="h-3 w-3" strokeWidth={1.5} />
                <span>{artefactCount} document{artefactCount !== 1 ? 's' : ''}</span>
              </div>
              {sub.notes && (
                <p className="text-xs text-ink-500 mt-2 italic">&ldquo;{sub.notes}&rdquo;</p>
              )}
              {sub.feedback && (
                <div className="mt-2 rounded-sm bg-red-50 border border-danger-500/20 px-3 py-2">
                  <p className="text-xs text-danger-500 font-medium mb-0.5">Admin feedback</p>
                  <p className="text-xs text-ink-600">{sub.feedback}</p>
                </div>
              )}
            </li>
          )
        })}
      </ul>
    </div>
  )
}
