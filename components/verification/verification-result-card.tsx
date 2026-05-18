'use client'
// components/verification/verification-result-card.tsx

import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertTriangle, ShieldCheck, Clock } from 'lucide-react'
import { cn } from '@/lib/utils'

type Finding = {
  type: 'verified' | 'warning' | 'missing'
  text: string
}

type VerificationRecord = {
  id: string
  type: 'AI_AGENT' | 'EXPERT' | 'AUTO_GOLD_MARKETPLACE'
  status: 'PASS' | 'FAIL' | 'INCONCLUSIVE' | 'IN_PROGRESS'
  qualityRating: 'RED' | 'AMBER' | 'GREEN' | 'GOLD' | null
  costTokens: number
  findings: Finding[]
  notes: string | null
  confidence?: number | null
  completedAt: string | null
  createdAt: string
}

type Props = {
  verification: VerificationRecord
  animate?: boolean
}

const FINDING_ICON: Record<string, React.ElementType> = {
  verified: CheckCircle,
  warning: AlertTriangle,
  missing: XCircle,
}

const FINDING_CLASS: Record<string, string> = {
  verified: 'text-success-500',
  warning: 'text-warning-500',
  missing: 'text-danger-500',
}

export function VerificationResultCard({ verification, animate = false }: Props) {
  const isPending = verification.status === 'IN_PROGRESS'
  const isPass = verification.status === 'PASS'
  const isFail = verification.status === 'FAIL'

  const typeLabel =
    verification.type === 'AI_AGENT'
      ? 'AI Verification'
      : verification.type === 'EXPERT'
      ? 'Expert Verification'
      : 'Auto-Gold (Marketplace)'

  const Wrapper = animate ? motion.div : 'div'
  const animProps = animate
    ? { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
    : {}

  return (
    <Wrapper
      {...(animProps as object)}
      className={cn(
        'rounded-lg border p-4 space-y-3',
        isPending && 'border-ink-200 bg-ink-25',
        isPass && 'border-success-500/30 bg-emerald-50/30',
        isFail && 'border-danger-500/30 bg-red-50/30',
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          {isPending ? (
            <Clock className="h-4 w-4 text-ink-400" strokeWidth={1.5} />
          ) : isPass ? (
            <ShieldCheck className="h-4 w-4 text-success-500" strokeWidth={1.5} />
          ) : (
            <XCircle className="h-4 w-4 text-danger-500" strokeWidth={1.5} />
          )}
          <span className="text-sm font-semibold text-ink-900">{typeLabel}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-ink-400">
          {verification.confidence != null && (
            <span className="font-medium text-ink-600">{Math.round(verification.confidence * 100)}% confident</span>
          )}
          <span>{verification.costTokens.toLocaleString()} tokens</span>
        </div>
      </div>

      {!isPending && (
        <div className={cn(
          'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold',
          isPass ? 'bg-success-500/10 text-success-600' : 'bg-danger-500/10 text-danger-600'
        )}>
          {isPass ? 'PASS' : 'FAIL'}
          {verification.qualityRating && (
            <span className="opacity-70">— {verification.qualityRating}</span>
          )}
        </div>
      )}

      {isPending && (
        <p className="text-sm text-ink-500">
          Expert review in progress. You will be notified when the review is complete.
        </p>
      )}

      {verification.findings.length > 0 && (
        <ul className="space-y-1.5">
          {verification.findings.map((f, i) => {
            const Icon = FINDING_ICON[f.type] ?? CheckCircle
            const cls = FINDING_CLASS[f.type] ?? 'text-ink-500'
            return (
              <li key={i} className="flex items-start gap-2 text-sm">
                <Icon className={cn('h-3.5 w-3.5 mt-0.5 flex-shrink-0', cls)} strokeWidth={1.5} />
                <span className="text-ink-700">{f.text}</span>
              </li>
            )
          })}
        </ul>
      )}

      {verification.notes && (
        <div className="rounded-sm bg-warning-50 border border-warning-200 px-3 py-2">
          <p className="text-xs font-medium text-warning-700 mb-0.5">Recommendation</p>
          <p className="text-xs text-ink-600">{verification.notes}</p>
        </div>
      )}
    </Wrapper>
  )
}
